'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Three.js LatheGeometry duplicates vertices at angle 0 and 2*PI to support discontinuous UV coordinates.
 * When computeVertexNormals() is called on LatheGeometry, face normals are only accumulated
 * from one side of the seam, resulting in a normal divergence of ~5.6 degrees between column 0 and
 * column segments. This creates an unsightly vertical seam line down the model.
 *
 * This function welds the normals across column 0 and column segments so lighting is
 * 100% continuous and seam-free all around 360 degrees. It also averages pole normals
 * along the central Y-axis (points with x near 0) to eliminate radial pinch artifacts.
 */
function fixLatheSeamNormals(
  geometry: THREE.BufferGeometry,
  pointsLength: number,
  segments: number,
  points?: THREE.Vector2[]
) {
  const norm = geometry.attributes.normal;
  if (!norm) return;
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  // 1. Weld seam vertices between i = 0 (phi = 0) and i = segments (phi = 2*PI)
  for (let j = 0; j < pointsLength; j++) {
    const idx0 = j;
    const idxEnd = segments * pointsLength + j;
    v1.fromBufferAttribute(norm, idx0);
    v2.fromBufferAttribute(norm, idxEnd);
    v1.add(v2).normalize();
    norm.setXYZ(idx0, v1.x, v1.y, v1.z);
    norm.setXYZ(idxEnd, v1.x, v1.y, v1.z);
  }

  // 2. Average pole vertices (where points[j].x === 0) across all segment slices
  if (points) {
    for (let j = 0; j < pointsLength; j++) {
      if (Math.abs(points[j].x) < 1e-4) {
        v1.set(0, 0, 0);
        for (let i = 0; i <= segments; i++) {
          const idx = i * pointsLength + j;
          v2.fromBufferAttribute(norm, idx);
          v1.add(v2);
        }
        v1.normalize();
        for (let i = 0; i <= segments; i++) {
          const idx = i * pointsLength + j;
          norm.setXYZ(idx, v1.x, v1.y, v1.z);
        }
      }
    }
  }

  norm.needsUpdate = true;
}

/**
 * Procedural organic normal map for smooth, liquid water ripples without any checkerboard or lattice artifacts.
 * Uses trilinear mipmap filtering (LinearMipmapLinearFilter) to guarantee zero pixelated grid steps.
 */
function createWaterNormalTexture(): THREE.DataTexture {
  const width = 512;
  const height = 512;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x / width) * Math.PI * 2;
      const v = (y / height) * Math.PI * 2;

      // Gentle, non-orthogonal wave superposition with prime frequency ratios to avoid grid interference
      const dhdx =
        (2 * Math.cos(2 * u + 1 * v + 0.4) +
         3 * 0.6 * Math.cos(3 * u - 2 * v + 1.2) +
         1 * 0.35 * Math.cos(1 * u + 4 * v + 2.1) +
         4 * 0.2 * Math.cos(4 * u + 3 * v - 0.8)) * 0.28;

      const dhdy =
        (1 * Math.cos(2 * u + 1 * v + 0.4) -
         2 * 0.6 * Math.cos(3 * u - 2 * v + 1.2) +
         4 * 0.35 * Math.cos(1 * u + 4 * v + 2.1) +
         3 * 0.2 * Math.cos(4 * u + 3 * v - 0.8)) * 0.28;

      const scale = 0.030; // Silky smooth micro-ripple depth
      const nx = -dhdx * scale;
      const ny = -dhdy * scale;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);

      const idx = (y * width + x) * 4;
      data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.0, 2.0);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export interface WaterBowl3DProps {
  fillLevel: number;        // 0.0 to 1.0 (internal water fill)
  submersionDepthCm?: number; // actual depth in cm (e.g. 2.5cm to 10.6cm)
  freeboardCm?: number;       // rim height above water in cm
  isSinking?: boolean;      // true if bowl freeboard is zero and it is sinking
  flowActive?: boolean;     // true if water is flowing through bottom orifice
  className?: string;
  viewMode?: '3d' | '2d';
  onToggleViewMode?: (mode: '3d' | '2d') => void;
}

export const WaterBowl3D: React.FC<WaterBowl3DProps> = ({
  fillLevel = 0,
  submersionDepthCm,
  freeboardCm,
  isSinking = false,
  flowActive = false,
  className = '',
  viewMode = '3d',
  onToggleViewMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // UI controls state
  const [autoRotate, setAutoRotate] = useState(false);
  const [activePreset, setActivePreset] = useState<'perspective' | 'top' | 'side'>('perspective');

  // References to dynamic 3D meshes and state
  const sceneStateRef = useRef<{
    bowlGroup: THREE.Group | null;
    innerWaterMesh: THREE.Mesh | null;
    innerWaterGeo: THREE.CircleGeometry | null;
    waterJetGroup: THREE.Group | null;
    basinWaterMesh: THREE.Mesh | null;
    basinWaterGeo: THREE.CircleGeometry | null;
    bubbles: THREE.Mesh[];
    currentFill: number;
    currentSubmersion: number;
    isSinking: boolean;
    flowActive: boolean;
    sinkProgress: number; // 0 to 1 for smooth sinking animation
  }>({
    bowlGroup: null,
    innerWaterMesh: null,
    innerWaterGeo: null,
    waterJetGroup: null,
    basinWaterMesh: null,
    basinWaterGeo: null,
    bubbles: [],
    currentFill: 0,
    currentSubmersion: 0.22,
    isSinking: false,
    flowActive: false,
    sinkProgress: 0,
  });

  // Keep ref updated with latest props without re-initializing Three scene
  useEffect(() => {
    sceneStateRef.current.currentFill = Math.max(0, Math.min(1, fillLevel));
    sceneStateRef.current.isSinking = isSinking;
    sceneStateRef.current.flowActive = flowActive;
    if (submersionDepthCm !== undefined) {
      // Nominal bowl height is ~10.6cm
      sceneStateRef.current.currentSubmersion = Math.max(0.1, submersionDepthCm / 10.6);
    } else {
      sceneStateRef.current.currentSubmersion = 0.22 + sceneStateRef.current.currentFill * 0.78;
    }
  }, [fillLevel, submersionDepthCm, isSinking, flowActive]);

  // Handle camera view presets
  const setCameraPreset = useCallback((preset: 'perspective' | 'top' | 'side') => {
    setActivePreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.autoRotate = false;
    setAutoRotate(false);

    if (preset === 'perspective') {
      camera.position.set(2.4, 2.0, 2.6);
      controls.target.set(0, 0, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 4.0, 0.05);
      controls.target.set(0, 0, 0);
    } else if (preset === 'side') {
      camera.position.set(0, 0.35, 3.2);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  }, []);

  // Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(2.4, 2.0, 2.6);
    cameraRef.current = camera;

    // 3. Renderer with High-Fidelity Tone Mapping & PCF Shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Photorealistic Environment Map for Physical Refractions & Metallic Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvironment = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 1.05;

    // Procedural Seamless Harmonic Water Normal Map for Realtime Refractive Ripples
    const waterNormalMap = createWaterNormalTexture();

    // 5. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.minDistance = 1.2;
    controls.maxDistance = 6.5;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 6. High-Fidelity Lighting (Observatory Ambiance)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.95);
    scene.add(ambientLight);

    // Main Sunlight Key Light
    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.4);
    sunLight.position.set(3.5, 6, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 15;
    sunLight.shadow.camera.left = -2.5;
    sunLight.shadow.camera.right = 2.5;
    sunLight.shadow.camera.top = 2.5;
    sunLight.shadow.camera.bottom = -2.5;
    sunLight.shadow.bias = -0.0008;
    scene.add(sunLight);

    // Blue water reflection bounce light
    const waterBounce = new THREE.DirectionalLight(0x38bdf8, 1.0);
    waterBounce.position.set(-3, -1, -2);
    scene.add(waterBounce);

    // Warm specular rim light on copper rim
    const rimLight = new THREE.DirectionalLight(0xf97316, 1.2);
    rimLight.position.set(-2, 3, -3);
    scene.add(rimLight);

    // Water surface caustics point light (shimmering highlight over water)
    const waterPointLight = new THREE.PointLight(0xbae6fd, 1.4, 4);
    waterPointLight.position.set(0, 0.4, 0);
    scene.add(waterPointLight);

    // 7. Procedural Seamless Multi-Octave Hammered Texture for Copper
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 512, 512);

      const drawSeamlessSpot = (cx: number, cy: number, r: number, c0: string, c1: string, c2: string) => {
        for (const ox of [-512, 0, 512]) {
          for (const oy of [-512, 0, 512]) {
            const x = cx + ox;
            const y = cy + oy;
            if (x + r < 0 || x - r > 512 || y + r < 0 || y - r > 512) continue;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, c0);
            grad.addColorStop(0.5, c1);
            grad.addColorStop(1, c2);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };

      // Fine micro-hammer facets
      for (let i = 0; i < 1400; i++) {
        drawSeamlessSpot(Math.random() * 512, Math.random() * 512, 2.5 + Math.random() * 5.5, '#a3a3a3', '#737373', '#808080');
      }

      // Broader planishing anvil marks
      for (let i = 0; i < 120; i++) {
        drawSeamlessSpot(Math.random() * 512, Math.random() * 512, 12 + Math.random() * 16, '#8f8f8f', '#787878', '#808080');
      }
    }
    const hammeredBumpMap = new THREE.CanvasTexture(canvas);
    hammeredBumpMap.wrapS = THREE.RepeatWrapping;
    hammeredBumpMap.wrapT = THREE.RepeatWrapping;
    hammeredBumpMap.repeat.set(6, 3);

    // 8. OUTER BASIN CONTAINER (Kuṇḍikā) - Glazed Stoneware / Terracotta
    const basinRadius = 1.75;
    const basinDepth = 1.35;
    const rawBasinPoints: THREE.Vector2[] = [
      new THREE.Vector2(0, -basinDepth),
      new THREE.Vector2(0.95, -basinDepth),
      new THREE.Vector2(1.15, -basinDepth + 0.15),
      new THREE.Vector2(1.65, -0.4),
      new THREE.Vector2(basinRadius, 0.08),
      new THREE.Vector2(basinRadius + 0.08, 0.14), // lip
      new THREE.Vector2(basinRadius - 0.02, 0.14),
      new THREE.Vector2(basinRadius - 0.06, 0.05),
      new THREE.Vector2(1.58, -0.4),
      new THREE.Vector2(1.08, -basinDepth + 0.2),
      new THREE.Vector2(0, -basinDepth + 0.08),
    ];
    // Smooth spline interpolation for ultra-high vertical curvature definition
    const basinCurve = new THREE.SplineCurve(rawBasinPoints);
    const basinPoints = basinCurve.getPoints(72);

    // 192 radial lathe segments for razor-sharp circular silhouette
    const basinSegments = 192;
    const basinGeo = new THREE.LatheGeometry(basinPoints, basinSegments);
    basinGeo.computeVertexNormals();
    fixLatheSeamNormals(basinGeo, basinPoints.length, basinSegments, basinPoints);

    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x6e4e37, // Glazed terracotta / fired clay
      roughness: 0.60,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });
    const basinMesh = new THREE.Mesh(basinGeo, basinMat);
    basinMesh.receiveShadow = true;
    scene.add(basinMesh);

    // Decorative brass rim banding on basin (high circular resolution)
    const basinBandingGeo = new THREE.TorusGeometry(basinRadius + 0.05, 0.015, 32, 192);
    const basinBandingMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.90,
      roughness: 0.22,
    });
    const basinBandingMesh = new THREE.Mesh(basinBandingGeo, basinBandingMat);
    basinBandingMesh.rotation.x = Math.PI / 2;
    basinBandingMesh.position.y = 0.13;
    scene.add(basinBandingMesh);

    // High-Fidelity Basin Water with Physical Transmission, Refraction & Fresnel Reflections
    // Planar circular disc with 192 segments ensures 100% smooth, uniform surface normals (no grid faceting)
    const basinWaterGeo = new THREE.CircleGeometry(basinRadius - 0.04, 192);
    const basinWaterMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe, // Light crystalline pool tint
      transmission: 0.96, // Realistic physical light transmission
      ior: 1.333, // Real water optical refractive index
      thickness: 0.85, // True volumetric light path through water depth
      attenuationColor: new THREE.Color(0x0284c7), // Natural blue light absorption at depth
      attenuationDistance: 1.1,
      roughness: 0.01, // Glassy, liquid surface
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.015,
      reflectivity: 0.95, // Sharp Fresnel reflection at oblique viewing angles
      dispersion: 0.012, // Subtle chromatic aberration on ripples
      normalMap: waterNormalMap,
      normalScale: new THREE.Vector2(0.04, 0.04), // Gentle, silky ripples (no harsh grids!)
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    const basinWaterMesh = new THREE.Mesh(basinWaterGeo, basinWaterMat);
    basinWaterMesh.rotation.x = -Math.PI / 2;
    basinWaterMesh.position.y = 0; // Reference waterline
    scene.add(basinWaterMesh);
    sceneStateRef.current.basinWaterMesh = basinWaterMesh;
    sceneStateRef.current.basinWaterGeo = basinWaterGeo;

    // 9. THE SINKING COPPER BOWL (Ghaṭī / Nimīlikā)
    const bowlGroup = new THREE.Group();
    scene.add(bowlGroup);
    sceneStateRef.current.bowlGroup = bowlGroup;

    const bowlRadius = 0.85;
    const wallThick = 0.035;
    const holeRadius = 0.045; // Calibrated needle aperture (chidra)

    const bowlPoints: THREE.Vector2[] = [];
    const segments = 96; // 96 vertical profile points for outer hemisphere
    for (let i = 0; i <= segments; i++) {
      const phi = Math.asin(holeRadius / bowlRadius) + (i / segments) * (Math.PI / 2 - Math.asin(holeRadius / bowlRadius));
      const x = bowlRadius * Math.sin(phi);
      const y = -bowlRadius * Math.cos(phi);
      bowlPoints.push(new THREE.Vector2(x, y));
    }
    // Rounded flared rim lip (smooth transition)
    bowlPoints.push(new THREE.Vector2(bowlRadius + 0.018, 0.005));
    bowlPoints.push(new THREE.Vector2(bowlRadius + 0.012, 0.015));
    bowlPoints.push(new THREE.Vector2(bowlRadius - wallThick * 0.3, 0.020));
    bowlPoints.push(new THREE.Vector2(bowlRadius - wallThick * 0.7, 0.015));
    
    // Inner hemisphere down to bottom orifice (96 points)
    const innerRadius = bowlRadius - wallThick;
    for (let i = segments; i >= 0; i--) {
      const phi = Math.asin(holeRadius / innerRadius) + (i / segments) * (Math.PI / 2 - Math.asin(holeRadius / innerRadius));
      const x = innerRadius * Math.sin(phi);
      const y = -innerRadius * Math.cos(phi);
      bowlPoints.push(new THREE.Vector2(x, y));
    }
    bowlPoints.push(new THREE.Vector2(holeRadius, -bowlRadius));

    // 192 radial lathe segments for perfectly smooth circular curvature
    const bowlSegments = 192;
    const bowlGeo = new THREE.LatheGeometry(bowlPoints, bowlSegments);
    bowlGeo.computeVertexNormals();
    fixLatheSeamNormals(bowlGeo, bowlPoints.length, bowlSegments, bowlPoints);

    // High-Fidelity Hammered Copper Physical Material
    const bowlMat = new THREE.MeshPhysicalMaterial({
      color: 0xc85a28, // Classical Indian polished copper
      metalness: 0.95,
      roughness: 0.20,
      clearcoat: 0.50,
      clearcoatRoughness: 0.10,
      reflectivity: 0.96,
      bumpMap: hammeredBumpMap,
      bumpScale: 0.0035,
      side: THREE.DoubleSide,
    });
    const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    bowlGroup.add(bowlMesh);

    // Golden Needle Collar Ring (suvarṇa-śalākā orifice)
    const goldRingGeo = new THREE.TorusGeometry(holeRadius, 0.012, 24, 96);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.96,
      roughness: 0.14,
    });
    const goldRingMesh = new THREE.Mesh(goldRingGeo, goldRingMat);
    goldRingMesh.rotation.x = Math.PI / 2;
    goldRingMesh.position.y = -bowlRadius;
    bowlGroup.add(goldRingMesh);

    // Engraved Vināḍī Calibration Rings inside copper bowl (at 15, 30, and 45 vināḍīs)
    for (let q = 1; q <= 3; q++) {
      const ringDepthFraction = q * 0.25;
      const ringY = -innerRadius + ringDepthFraction * innerRadius;
      const dy = innerRadius - ringDepthFraction * innerRadius;
      const ringR = Math.sqrt(Math.max(0.01, innerRadius * innerRadius - dy * dy));

      const calibRingGeo = new THREE.TorusGeometry(ringR - 0.002, 0.003, 16, 96);
      const calibRingMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.3,
      });
      const calibRingMesh = new THREE.Mesh(calibRingGeo, calibRingMat);
      calibRingMesh.rotation.x = Math.PI / 2;
      calibRingMesh.position.y = ringY;
      bowlGroup.add(calibRingMesh);
    }

    // 10. HIGH-FIDELITY INTERNAL WATER (With optical transmission & refraction)
    const innerWaterGeo = new THREE.CircleGeometry(1, 192);
    const innerWaterMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0f9ff, // Pure crystalline spring water
      transmission: 0.96,
      ior: 1.333,
      thickness: 0.50,
      attenuationColor: new THREE.Color(0x38bdf8),
      attenuationDistance: 0.85,
      roughness: 0.01,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.015,
      reflectivity: 0.95,
      dispersion: 0.015,
      normalMap: waterNormalMap,
      normalScale: new THREE.Vector2(0.05, 0.05), // Silky liquid ripples
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });
    const innerWaterMesh = new THREE.Mesh(innerWaterGeo, innerWaterMat);
    innerWaterMesh.rotation.x = -Math.PI / 2;
    innerWaterMesh.visible = false;
    bowlGroup.add(innerWaterMesh);
    sceneStateRef.current.innerWaterMesh = innerWaterMesh;
    sceneStateRef.current.innerWaterGeo = innerWaterGeo;

    // 11. INFLOW WATER JET & MULTI-PHASE BUBBLES
    const waterJetGroup = new THREE.Group();
    bowlGroup.add(waterJetGroup);
    sceneStateRef.current.waterJetGroup = waterJetGroup;

    // Tapered Translucent Torricelli Water Column
    const jetGeo = new THREE.CylinderGeometry(0.010, 0.026, 0.45, 24);
    jetGeo.translate(0, 0.225, 0);
    const jetMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transmission: 0.88,
      ior: 1.333,
      transparent: true,
      opacity: 0.82,
      roughness: 0.06,
      clearcoat: 0.9,
    });
    const jetMesh = new THREE.Mesh(jetGeo, jetMat);
    jetMesh.position.y = -bowlRadius;
    waterJetGroup.add(jetMesh);

    // Splash ring meniscus where the jet breaks surface
    const splashMeniscusGeo = new THREE.TorusGeometry(0.06, 0.01, 12, 32);
    const splashMeniscusMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.9,
      ior: 1.333,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
    });
    const splashMeniscusMesh = new THREE.Mesh(splashMeniscusGeo, splashMeniscusMat);
    splashMeniscusMesh.rotation.x = Math.PI / 2;
    waterJetGroup.add(splashMeniscusMesh);

    // Rising Cavitation Bubbles
    const bubbleGeo = new THREE.SphereGeometry(0.012, 12, 12);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      ior: 1.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.9,
    });
    const bubbles: THREE.Mesh[] = [];
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(bubbleGeo, bubbleMat);
      b.position.set(
        (Math.random() - 0.5) * 0.05,
        -bowlRadius + Math.random() * 0.45,
        (Math.random() - 0.5) * 0.05
      );
      waterJetGroup.add(b);
      bubbles.push(b);
    }
    sceneStateRef.current.bubbles = bubbles;

    // 11. Soft Floor Shadow Plane
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -basinDepth - 0.01;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 12. Animation Loop with Dynamic Water Wave Computations
    let animId: number;
    const startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = (performance.now() - startTime) * 0.001;
      const st = sceneStateRef.current;

      // Handle Smooth Sinking Transition
      if (st.isSinking || st.currentFill >= 0.999) {
        st.sinkProgress = Math.min(1, st.sinkProgress + 0.025);
      } else {
        st.sinkProgress = Math.max(0, st.sinkProgress - 0.04);
      }

      // Physics: Submersion depth calculation
      const effectiveSubmersion = 0.22 + st.currentFill * 0.78;
      const targetBaseY = -effectiveSubmersion * bowlRadius + bowlRadius;

      // Gentle buoyant bobbing & tilting harmonic oscillation
      const bobbing = Math.sin(elapsed * 2.4) * 0.012 * (1 - st.currentFill * 0.5);
      const swayX = Math.sin(elapsed * 1.7) * 0.008;
      const swayZ = Math.cos(elapsed * 1.9) * 0.008;

      if (bowlGroup) {
        if (st.sinkProgress > 0) {
          const sinkDepth = THREE.MathUtils.lerp(targetBaseY, -basinDepth + bowlRadius * 0.45, st.sinkProgress);
          bowlGroup.position.y = sinkDepth + bobbing * (1 - st.sinkProgress);
          bowlGroup.rotation.x = THREE.MathUtils.lerp(swayX, 0.35, st.sinkProgress);
          bowlGroup.rotation.z = THREE.MathUtils.lerp(swayZ, 0.25, st.sinkProgress);
        } else {
          bowlGroup.position.y = targetBaseY + bobbing;
          bowlGroup.rotation.x = swayX;
          bowlGroup.rotation.z = swayZ;
        }
      }

      // Dynamic Internal Water Height & Caustic Ripple Displacements
      if (innerWaterMesh && innerWaterGeo) {
        if (st.currentFill > 0.005) {
          innerWaterMesh.visible = true;
          const innerR = bowlRadius - wallThick;
          const waterHeight = st.currentFill * innerR;
          const yPos = -innerR + waterHeight;
          innerWaterMesh.position.y = yPos;

          const dy = Math.max(0, innerR - waterHeight);
          const currentRadius = Math.sqrt(Math.max(0.01, innerR * innerR - dy * dy));
          innerWaterMesh.scale.set(currentRadius, currentRadius, 1);

          // Position splash meniscus at the water surface
          splashMeniscusMesh.position.y = yPos;
          splashMeniscusMesh.scale.setScalar(1 + Math.sin(elapsed * 12) * 0.15);
        } else {
          innerWaterMesh.visible = false;
        }
      }

      // Water Jet Dynamics (Torricelli inflow head)
      if (waterJetGroup) {
        const isFlowing = st.flowActive && !st.isSinking && st.currentFill < 0.99;
        waterJetGroup.visible = isFlowing;

        if (isFlowing) {
          const headRatio = Math.max(0.2, 1 - st.currentFill);
          jetMesh.scale.set(1, headRatio, 1);

          // Animate rising bubbles inside jet column
          st.bubbles.forEach((b, idx) => {
            b.position.y += 0.018 + (idx % 4) * 0.006;
            b.position.x += (Math.random() - 0.5) * 0.005;
            b.position.z += (Math.random() - 0.5) * 0.005;

            const maxBubbleY = -bowlRadius + (innerWaterMesh?.position.y ?? -bowlRadius) + bowlRadius;
            if (b.position.y > -bowlRadius + 0.42 * headRatio || b.position.y > maxBubbleY) {
              b.position.y = -bowlRadius + 0.02;
              b.position.x = (Math.random() - 0.5) * 0.04;
              b.position.z = (Math.random() - 0.5) * 0.04;
            }
          });
        }
      }

      // Shimmering caustic light highlight
      waterPointLight.position.x = Math.sin(elapsed * 0.8) * 0.4;
      waterPointLight.position.z = Math.cos(elapsed * 0.7) * 0.4;

      // Continuous refractive micro-ripple drift on water surfaces
      waterNormalMap.offset.x = (elapsed * 0.016) % 1;
      waterNormalMap.offset.y = (elapsed * 0.010) % 1;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 13. Handle Resize with ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // 14. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      pmremGenerator.dispose();
      envTexture.dispose();
      waterNormalMap.dispose();
      basinGeo.dispose();
      basinMat.dispose();
      basinWaterGeo.dispose();
      basinWaterMat.dispose();
      bowlGeo.dispose();
      bowlMat.dispose();
      goldRingGeo.dispose();
      goldRingMat.dispose();
      innerWaterGeo.dispose();
      innerWaterMat.dispose();
      jetGeo.dispose();
      jetMat.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      hammeredBumpMap.dispose();
    };
  }, []);

  // Update autoRotate when state toggles
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 1.5;
    }
  }, [autoRotate]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden rounded-2xl bg-gradient-to-b from-stone-100/60 to-stone-200/40 dark:from-stone-900/60 dark:to-[#0c0a09]/80 border border-stone-200/80 dark:border-stone-800 ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Status Badge (Top Left) */}
      <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-stone-800 shadow-xs z-10 pointer-events-none flex items-center gap-1.5 text-[11px]">
        <span className={`w-2 h-2 rounded-full ${isSinking ? 'bg-rose-500 animate-ping' : flowActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
        <span className="font-semibold text-stone-800 dark:text-stone-100">
          {isSinking ? 'Vessel Sunk (Nimagna)' : flowActive ? 'Inflow Active' : 'Simulation Paused'}
        </span>
        <span className="text-stone-400 dark:text-stone-500 font-mono text-[10px]">
          ({Math.round(fillLevel * 100)}%)
        </span>
      </div>

      {/* View Mode Toggle: 3D / 2D (Top Right) */}
      {onToggleViewMode && (
        <div className="absolute top-2.5 right-2.5 z-10 flex rounded-lg overflow-hidden bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-0.5 border border-stone-200/80 dark:border-stone-800 shadow-xs text-xs">
          <button
            type="button"
            onClick={() => onToggleViewMode('3d')}
            className={`px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1 ${
              viewMode === '3d' || !viewMode
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
            title="3D Interactive Simulation Active"
          >
            <span>🌐</span>
            <span className="font-semibold">3D</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('2d')}
            className={`px-2 py-0.5 rounded font-medium transition-all flex items-center gap-1 ${
              viewMode === '2d'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
            title="Switch to 2D Technical CAD Diagram"
          >
            <span>📐</span>
            <span className="font-semibold">2D</span>
          </button>
        </div>
      )}

      {/* Camera Presets & Orbit Controls (Bottom Right) */}
      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs z-10 text-[11px]">
        <button
          type="button"
          onClick={() => setCameraPreset('perspective')}
          className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
            activePreset === 'perspective'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title="Perspective 3D View"
        >
          Angle
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset('top')}
          className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
            activePreset === 'top'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title="Top-Down Kumbha View"
        >
          Top
        </button>

        <button
          type="button"
          onClick={() => setCameraPreset('side')}
          className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
            activePreset === 'side'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title="Side View aligned with Waterline"
        >
          Side
        </button>

        <div className="w-[1px] h-3.5 bg-stone-300 dark:bg-stone-700 mx-0.5" />

        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
            autoRotate
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title="Toggle 360° Auto Rotation"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={autoRotate ? 'animate-spin' : ''}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Spin</span>
        </button>
      </div>

      {/* Touch / Mouse Interaction Hint (Bottom Left, visible on wider containers) */}
      <div className="hidden md:flex absolute bottom-2.5 left-2.5 bg-black/40 text-white/90 text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs pointer-events-none tracking-wide items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m10 8 4 4-4 4" />
        </svg>
        <span>Drag to orbit • Scroll to zoom</span>
      </div>
    </div>
  );
};
