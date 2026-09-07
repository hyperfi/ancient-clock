'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ═══════════════════════════════════════════════════════════════════
   Constants & Geometry Parameters
   ═══════════════════════════════════════════════════════════════════ */
const DEG = Math.PI / 180;
const EARTH_R = 1.0;
const MOON_R = 0.32;
const ORBIT_R = 6.0;
const SUN_DIST = 16.0;
const SUN_R = 2.4;
const UMBRA_APEX = 13.5;
const TILT_ANGLE = 5.145 * DEG;

/* ═══════════════════════════════════════════════════════════════════
   Text Sprite Factory
   ═══════════════════════════════════════════════════════════════════ */
function makeLabel(
  text: string,
  color = '#ffffff',
  fontSize = 40,
  scale = 0.5,
  bg?: string
) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const textWidth = Math.ceil(ctx.measureText(text).width) + 24;
  const textHeight = Math.ceil(fontSize * 1.4) + 16;
  canvas.width = textWidth;
  canvas.height = textHeight;
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;

  if (bg) {
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, textWidth, textHeight, 8);
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, textWidth / 2, textHeight / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set((textWidth / textHeight) * scale, scale, 1);
  return { sprite, texture, canvas, ctx };
}

/* ═══════════════════════════════════════════════════════════════════
   Component Interface
   ═══════════════════════════════════════════════════════════════════ */
export interface Eclipse3DProps {
  eclipseType: 'lunar' | 'solar';
  progress: number; // 0.0 to 1.0 (0.5 = greatest eclipse)
  magnitude: number;
  obscuration: number;
  kind?: 'total' | 'partial' | 'annular' | 'penumbral' | 'none';
  moonLatitudeDeg?: number;
  isEclipse?: boolean;
  className?: string;
}

type CameraPreset = 'cosmic' | 'shadow' | 'side' | 'earth';

export const Eclipse3D: React.FC<Eclipse3DProps> = ({
  eclipseType,
  progress,
  magnitude,
  obscuration,
  kind = 'total',
  moonLatitudeDeg = 0,
  isEclipse = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('cosmic');

  /* ── State Bridge Ref for Animation Loop ── */
  const stateRef = useRef({
    eclipseType,
    progress,
    magnitude,
    obscuration,
    kind,
    moonLatitudeDeg,
    isEclipse,
    // Three.js object references
    moonMesh: null as THREE.Mesh | null,
    moonGlowMesh: null as THREE.Mesh | null,
    moonLabel: null as THREE.Sprite | null,
    orbitGroup: null as THREE.Group | null,
    umbraCone: null as THREE.Mesh | null,
    penumbraCone: null as THREE.Mesh | null,
    solarMoonCone: null as THREE.Mesh | null,
    solarEarthSpot: null as THREE.Mesh | null,
    sunLight: null as THREE.DirectionalLight | null,
    sunMesh: null as THREE.Mesh | null,
    sunLabel: null as THREE.Sprite | null,
  });

  /* ── Camera Presets Handler ── */
  const setCameraPreset = useCallback((preset: CameraPreset) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    setActivePreset(preset);

    switch (preset) {
      case 'cosmic':
        cam.position.set(11, 7, 13);
        ctrl.target.set(1.5, 0, 0);
        break;
      case 'shadow':
        cam.position.set(5.5, 3.2, 5.5);
        ctrl.target.set(ORBIT_R * 0.8, 0, 0);
        break;
      case 'side':
        cam.position.set(1.5, 0.4, 15);
        ctrl.target.set(1.5, 0, 0);
        break;
      case 'earth':
        cam.position.set(1.8, 0.6, 1.2);
        ctrl.target.set(ORBIT_R, 0, 0);
        break;
    }
    ctrl.update();
  }, []);

  /* ═════════════════════════════════════════════════════════════════
     Main Three.js Scene Setup (Mount Once)
     ═════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const s = stateRef.current;

    /* ── 1. Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x04040a);
    el.appendChild(renderer.domElement);

    /* ── 2. Camera ── */
    const camera = new THREE.PerspectiveCamera(
      45,
      el.clientWidth / el.clientHeight,
      0.1,
      200
    );
    camera.position.set(11, 7, 13);
    cameraRef.current = camera;

    /* ── 3. Controls ── */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.5;
    controls.maxDistance = 45;
    controls.target.set(1.5, 0, 0);
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    const scene = new THREE.Scene();

    /* ── 4. Starfield Background ── */
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 55 + Math.random() * 30;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ── 5. Ambient & Directional Sun Lighting ── */
    const ambLight = new THREE.AmbientLight(0x22263a, 0.6);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sunLight.position.set(-SUN_DIST, 0, 0);
    sunLight.target.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.add(sunLight.target);
    s.sunLight = sunLight;

    /* ── 6. Ecliptic Reference Plane Disc & Grid ── */
    const eclipticGeo = new THREE.RingGeometry(0.2, ORBIT_R + 3.0, 96);
    const eclipticMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const eclipticPlane = new THREE.Mesh(eclipticGeo, eclipticMat);
    eclipticPlane.rotation.x = -Math.PI / 2;
    scene.add(eclipticPlane);

    // Ecliptic Outer Ring
    const eRingGeo = new THREE.RingGeometry(ORBIT_R + 2.95, ORBIT_R + 3.0, 96);
    const eRingMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const eRing = new THREE.Mesh(eRingGeo, eRingMat);
    eRing.rotation.x = -Math.PI / 2;
    scene.add(eRing);

    // Ecliptic Axis Line (Sun-Earth Axis)
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SUN_DIST, 0, 0),
      new THREE.Vector3(UMBRA_APEX + 1, 0, 0),
    ]);
    const axisMat = new THREE.LineDashedMaterial({
      color: 0x475569,
      dashSize: 0.3,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.35,
    });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    axisLine.computeLineDistances();
    scene.add(axisLine);

    /* ── 7. The Sun (Glowing Sphere at -SUN_DIST) ── */
    const sunGeo = new THREE.SphereGeometry(SUN_R, 36, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(-SUN_DIST, 0, 0);
    scene.add(sunMesh);
    s.sunMesh = sunMesh;

    // Sun Corona Glow (translucent larger sphere)
    const coronaGeo = new THREE.SphereGeometry(SUN_R * 1.35, 32, 16);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunMesh.add(coronaMesh);

    // Sun Label
    const sunLbl = makeLabel('Sūrya (Sun)', '#fbbf24', 36, 0.6);
    sunLbl.sprite.position.set(-SUN_DIST, SUN_R + 0.8, 0);
    scene.add(sunLbl.sprite);
    s.sunLabel = sunLbl.sprite;

    /* ── 8. Earth (At Center (0,0,0)) ── */
    const earthGeo = new THREE.SphereGeometry(EARTH_R, 48, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.55,
      metalness: 0.15,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(0, 0, 0);
    scene.add(earthMesh);

    // Earth Atmosphere Glow
    const atmosGeo = new THREE.SphereGeometry(EARTH_R * 1.18, 32, 24);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    earthMesh.add(atmosMesh);

    // Earth Label
    const earthLbl = makeLabel('Earth (Bhū)', '#60a5fa', 34, 0.5);
    earthLbl.sprite.position.set(0, -EARTH_R - 0.5, 0);
    scene.add(earthLbl.sprite);

    /* ── 9. Earth's Conical Shadow (Lunar Eclipse) ──
       Umbra: Cone tapering from Earth (radius 1.0) to apex at UMBRA_APEX (~13.5).
       Penumbra: Frustum diverging from Earth to space. */
    const umbraHeight = UMBRA_APEX;
    const umbraConeGeo = new THREE.ConeGeometry(EARTH_R, umbraHeight, 48, 1, true);
    // Orient cone along +X axis (base at X=0, apex at X=UMBRA_APEX)
    umbraConeGeo.rotateZ(-Math.PI / 2);
    umbraConeGeo.translate(umbraHeight / 2, 0, 0);

    const umbraConeMat = new THREE.MeshBasicMaterial({
      color: 0x1c0606,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const umbraCone = new THREE.Mesh(umbraConeGeo, umbraConeMat);
    scene.add(umbraCone);
    s.umbraCone = umbraCone;

    // Umbra Outline Wireframe Rings (at intervals to show conical geometry)
    const umbraWireGroup = new THREE.Group();
    [2, 4, ORBIT_R, 8, 10, 12].forEach((xPos) => {
      const radiusAtX = EARTH_R * (1 - xPos / UMBRA_APEX);
      if (radiusAtX > 0.05) {
        const ringGeo = new THREE.RingGeometry(radiusAtX - 0.015, radiusAtX, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xdc2626,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(xPos, 0, 0);
        umbraWireGroup.add(ring);
      }
    });
    scene.add(umbraWireGroup);

    // Penumbra Cone (diverging frustum)
    const penumbraGeo = new THREE.CylinderGeometry(
      EARTH_R * 2.2, // radius at apex end
      EARTH_R * 1.1, // radius at Earth
      UMBRA_APEX,
      48,
      1,
      true
    );
    penumbraGeo.rotateZ(-Math.PI / 2);
    penumbraGeo.translate(UMBRA_APEX / 2, 0, 0);

    const penumbraMat = new THREE.MeshBasicMaterial({
      color: 0x312e81,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const penumbraCone = new THREE.Mesh(penumbraGeo, penumbraMat);
    scene.add(penumbraCone);
    s.penumbraCone = penumbraCone;

    // Umbra Label in Space
    const umbraLbl = makeLabel('Bhūcchāyā (Umbra Cone)', '#ef4444', 32, 0.45);
    umbraLbl.sprite.position.set(4.2, 1.4, 0);
    scene.add(umbraLbl.sprite);

    // Optical Ray Lines from Sun Tangent to Earth Limbs
    const rayMat = new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 0.4,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.3,
    });
    const rayLines = [
      [new THREE.Vector3(-SUN_DIST, SUN_R, 0), new THREE.Vector3(0, EARTH_R, 0), new THREE.Vector3(UMBRA_APEX, 0, 0)],
      [new THREE.Vector3(-SUN_DIST, -SUN_R, 0), new THREE.Vector3(0, -EARTH_R, 0), new THREE.Vector3(UMBRA_APEX, 0, 0)],
      [new THREE.Vector3(-SUN_DIST, 0, SUN_R), new THREE.Vector3(0, 0, EARTH_R), new THREE.Vector3(UMBRA_APEX, 0, 0)],
      [new THREE.Vector3(-SUN_DIST, 0, -SUN_R), new THREE.Vector3(0, 0, -EARTH_R), new THREE.Vector3(UMBRA_APEX, 0, 0)],
    ];
    rayLines.forEach((pts) => {
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const l = new THREE.Line(g, rayMat);
      l.computeLineDistances();
      scene.add(l);
    });

    /* ── 10. Solar Eclipse Geometry (Moon Shadow onto Earth) ── */
    // Shadow cone extending from Moon at ORBIT_R to Earth at distance ~ORBIT_R
    const smConeHeight = ORBIT_R - EARTH_R + 0.3;
    const smConeGeo = new THREE.ConeGeometry(MOON_R * 0.9, smConeHeight, 32, 1, true);
    // Base at Moon (0,0,0), Apex pointing forward at (0,0,smConeHeight)
    smConeGeo.rotateX(Math.PI / 2);
    smConeGeo.translate(0, 0, smConeHeight / 2);
    const smConeMat = new THREE.MeshBasicMaterial({
      color: 0x050512,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const solarMoonCone = new THREE.Mesh(smConeGeo, smConeMat);
    scene.add(solarMoonCone);
    s.solarMoonCone = solarMoonCone;

    // Umbra shadow spot on Earth surface during solar eclipse
    const spotGeo = new THREE.CircleGeometry(0.18, 24);
    const spotMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a0a,
      side: THREE.DoubleSide,
    });
    const solarEarthSpot = new THREE.Mesh(spotGeo, spotMat);
    solarEarthSpot.position.set(-EARTH_R - 0.01, 0, 0);
    scene.add(solarEarthSpot);
    s.solarEarthSpot = solarEarthSpot;

    /* ── 11. Tilted Lunar Orbit Group (5.145° inclination) ── */
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    s.orbitGroup = orbitGroup;

    // Orbit Ring Track (Line loop in local plane)
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 192; i++) {
      const a = (i / 192) * Math.PI * 2;
      orbitPts.push(
        new THREE.Vector3(ORBIT_R * Math.cos(a), 0, -ORBIT_R * Math.sin(a))
      );
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.5,
    });
    orbitGroup.add(new THREE.Line(orbitGeo, orbitMat));

    // Semi-transparent orbital plane disc
    const orbitDiscGeo = new THREE.CircleGeometry(ORBIT_R, 64);
    const orbitDiscMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.03,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const orbitDisc = new THREE.Mesh(orbitDiscGeo, orbitDiscMat);
    orbitDisc.rotation.x = -Math.PI / 2;
    orbitGroup.add(orbitDisc);

    /* ── 12. Nodes: Rāhu (Ascending) & Ketu (Descending) ── */
    const nodeGeo = new THREE.SphereGeometry(0.12, 16, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

    // Rāhu at ascending intersection
    const rahuMesh = new THREE.Mesh(nodeGeo, nodeMat);
    rahuMesh.position.set(ORBIT_R, 0, 0);
    orbitGroup.add(rahuMesh);
    const rahuLbl = makeLabel('Rāhu ☊ (Node)', '#ef4444', 30, 0.4);
    rahuLbl.sprite.position.set(ORBIT_R + 0.6, 0.45, 0);
    orbitGroup.add(rahuLbl.sprite);

    // Ketu at descending intersection
    const ketuMesh = new THREE.Mesh(nodeGeo.clone(), nodeMat.clone());
    ketuMesh.position.set(-ORBIT_R, 0, 0);
    orbitGroup.add(ketuMesh);
    const ketuLbl = makeLabel('Ketu ☋ (Node)', '#ef4444', 30, 0.4);
    ketuLbl.sprite.position.set(-ORBIT_R - 0.6, 0.45, 0);
    orbitGroup.add(ketuLbl.sprite);

    // Line of Nodes
    const nLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-ORBIT_R, 0, 0),
      new THREE.Vector3(ORBIT_R, 0, 0),
    ]);
    const nLineMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
    });
    orbitGroup.add(new THREE.Line(nLineGeo, nLineMat));

    /* ── 13. Moon Sphere (Traverses Tilted Orbit) ── */
    const moonGeo = new THREE.SphereGeometry(MOON_R, 36, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.65,
      metalness: 0.1,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    orbitGroup.add(moonMesh);
    s.moonMesh = moonMesh;

    // Blood Moon Red Glow during Totality
    const moonGlowGeo = new THREE.SphereGeometry(MOON_R * 1.3, 24, 16);
    const moonGlowMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.0,
      side: THREE.BackSide,
    });
    const moonGlowMesh = new THREE.Mesh(moonGlowGeo, moonGlowMat);
    moonMesh.add(moonGlowMesh);
    s.moonGlowMesh = moonGlowMesh;

    // Moon Label
    const moonLbl = makeLabel('Chandra', '#e2e8f0', 32, 0.42);
    moonLbl.sprite.position.set(0, MOON_R + 0.4, 0);
    moonMesh.add(moonLbl.sprite);
    s.moonLabel = moonLbl.sprite;

    /* ── 14. Animation Loop ── */
    let animId = 0;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      controls.update();

      const st = stateRef.current;
      const isLunar = st.eclipseType === 'lunar';

      // Visibility toggles between Lunar and Solar modes
      umbraCone.visible = isLunar;
      penumbraCone.visible = isLunar;
      umbraWireGroup.visible = isLunar;
      solarMoonCone.visible = !isLunar;
      solarEarthSpot.visible = !isLunar;

      // Orbit tilt around nodal axis (X-axis)
      // Line of nodes is along the X-axis (Rāhu at +X, Ketu at -X)
      orbitGroup.rotation.z = 0;
      orbitGroup.rotation.x = TILT_ANGLE;

      // Progress mapped to Moon position
      // Progress 0.0 to 1.0, with 0.5 being greatest eclipse (opposition/conjunction)
      // Progress spans ~40 degrees of lunar orbital motion (-20° to +20°)
      const deltaAngleDeg = (st.progress - 0.5) * 38;
      const deltaAngleRad = deltaAngleDeg * DEG;

      if (isLunar) {
        // Lunar eclipse occurs at opposition (Moon around +X axis, opposite Sun at -X)
        // Base opposition angle = 0 in local orbit coords (+X)
        const currentAngle = deltaAngleRad;
        const mx = ORBIT_R * Math.cos(currentAngle);
        const mz = -ORBIT_R * Math.sin(currentAngle);

        // Apply slight vertical offset from moonLatitudeDeg
        const latOffset = (st.moonLatitudeDeg || 0) * 0.15;
        moonMesh.position.set(mx, latOffset, mz);

        // Calculate distance to umbra cone center at X=mx
        // The umbra cone radius at distance mx = EARTH_R * (1 - mx / UMBRA_APEX)
        const umbraRadiusAtMoon = Math.max(
          0,
          EARTH_R * (1 - mx / UMBRA_APEX)
        );
        // Distance from Moon center to shadow axis (X-axis)
        const distFromAxis = Math.hypot(moonMesh.position.y, mz);
        const overlap = umbraRadiusAtMoon + MOON_R - distFromAxis;
        const inUmbraFraction = Math.min(
          1,
          Math.max(0, overlap / (2 * MOON_R))
        );

        // Blood Moon Reddening effect
        if (inUmbraFraction > 0.05) {
          const redFactor = inUmbraFraction;
          (moonMesh.material as THREE.MeshStandardMaterial).color.setRGB(
            0.88 + 0.12 * redFactor,
            0.9 - 0.72 * redFactor,
            0.92 - 0.78 * redFactor
          );
          (moonGlowMesh.material as THREE.MeshBasicMaterial).opacity =
            redFactor * 0.55;
        } else {
          (moonMesh.material as THREE.MeshStandardMaterial).color.setHex(0xe2e8f0);
          (moonGlowMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      } else {
        // Solar eclipse occurs at conjunction (Moon between Sun at -X and Earth at 0)
        // Moon strictly follows the orbit ring (ORBIT_R = 6.0)
        const currentAngle = Math.PI + deltaAngleRad;
        const mx = ORBIT_R * Math.cos(currentAngle);
        const mz = -ORBIT_R * Math.sin(currentAngle);
        const latOffset = (st.moonLatitudeDeg || 0) * 0.15;

        moonMesh.position.set(mx, latOffset, mz);
        (moonMesh.material as THREE.MeshStandardMaterial).color.setHex(0x334155);
        (moonGlowMesh.material as THREE.MeshBasicMaterial).opacity = 0;

        // Position shadow cone with base at Moon, pointing apex directly at Earth
        solarMoonCone.position.set(mx, latOffset, mz);
        solarMoonCone.lookAt(0, 0, 0);

        // Position shadow spot on Earth surface directly under the Moon's vector
        const spotDir = new THREE.Vector3(mx, latOffset * 0.5, mz).normalize();
        solarEarthSpot.position.copy(spotDir.clone().multiplyScalar(EARTH_R + 0.01));
        solarEarthSpot.lookAt(spotDir.clone().multiplyScalar(EARTH_R * 2));
      }

      renderer.render(scene, camera);
    };

    tick();

    /* ── 15. Resize Handler ── */
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    /* ── 16. Cleanup on Unmount ── */
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();

      scene.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh | THREE.Line | THREE.Points;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              (m as THREE.MeshBasicMaterial).map?.dispose();
              m.dispose();
            });
          } else {
            const mat = mesh.material as THREE.MeshBasicMaterial;
            mat.map?.dispose();
            mat.dispose();
          }
        }
      });

      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  /* ── Bridge Props to StateRef ── */
  useEffect(() => {
    const s = stateRef.current;
    s.eclipseType = eclipseType;
    s.progress = progress;
    s.magnitude = magnitude;
    s.obscuration = obscuration;
    s.kind = kind;
    s.moonLatitudeDeg = moonLatitudeDeg;
    s.isEclipse = isEclipse;
  }, [
    eclipseType,
    progress,
    magnitude,
    obscuration,
    kind,
    moonLatitudeDeg,
    isEclipse,
  ]);

  /* ── Auto-Rotate State ── */
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  /* ═══════════════════════════════════════════════════════════════
     JSX UI Container & Floating HUD Overlays
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden rounded-2xl bg-[#04040a] border border-stone-800 ${className}`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Camera Preset Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-800 shadow-md z-10 text-xs">
        {(
          [
            ['cosmic', 'Cosmic View', 'Wide perspective of Sun, Earth and shadow cone'],
            ['shadow', 'Shadow Cone', 'Close-up on Earth shadow cone entry'],
            ['side', '5° Tilt (Side)', 'Edge-on view showing 5.145° orbital inclination'],
            ['earth', 'From Earth', 'Observer perspective from Earth towards Moon'],
          ] as const
        ).map(([key, label, title]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCameraPreset(key as CameraPreset)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activePreset === key
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
            }`}
            title={title}
          >
            {label}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-stone-700 mx-0.5" />

        {/* 360° Auto-Rotate Spin Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
            autoRotate
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
          }`}
          title="Toggle 360° celestial turntable rotation"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={autoRotate ? 'animate-spin' : ''}
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Spin</span>
        </button>
      </div>

      {/* Cosmic Alignment Title Card (Top Left) */}
      <div className="absolute top-3 left-3 bg-stone-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-stone-800 shadow-md z-10 pointer-events-none text-xs">
        <div className="font-semibold text-stone-100 flex items-center gap-2">
          <span>{eclipseType === 'lunar' ? '🌕 Chandra Grahaṇa' : '☀️ Sūrya Grahaṇa'}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
            3D Cosmic Geometry
          </span>
        </div>
        <div className="text-[11px] text-stone-400 mt-0.5">
          Orbital Tilt: <strong className="text-amber-400">5.145°</strong> • Nodal Axis:{' '}
          <strong className="text-red-400">Rāhu ☊ / Ketu ☋</strong>
        </div>
      </div>

      {/* Floating Telemetry Badge (Bottom Left) */}
      <div className="absolute bottom-3 left-3 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800 text-[11px] font-mono text-stone-300 flex items-center gap-2.5 z-10 pointer-events-none">
        <span>
          Grāsa (Mag): <strong className="text-amber-400">{magnitude.toFixed(2)}</strong>
        </span>
        <span className="text-stone-600">|</span>
        <span>
          Vikṣepa (Lat):{' '}
          <strong className="text-indigo-400">
            {(moonLatitudeDeg || 0).toFixed(2)}°
          </strong>
        </span>
        <span className="text-stone-600">|</span>
        <span className="capitalize">
          Type: <strong className="text-emerald-400">{kind}</strong>
        </span>
      </div>

      {/* Interaction Hint (Bottom Center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white/80 text-[10px] px-3 py-1 rounded-full backdrop-blur-xs pointer-events-none tracking-wide flex items-center gap-1.5">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m10 8 4 4-4 4" />
        </svg>
        <span>Drag to rotate 3D view • Scroll to zoom • Toggle presets above</span>
      </div>
    </div>
  );
};
