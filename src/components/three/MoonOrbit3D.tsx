'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ═══════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════ */
const DEG = Math.PI / 180;
const ORBIT_R = 5;               // Moon orbit radius (scene units)
const EARTH_R = 0.55;            // Earth sphere radius
const MOON_R = 0.22;             // Moon sphere radius
const SUN_DIST = ORBIT_R + 2;    // Sun indicator distance from center
const NODE_R = 0.1;              // Rāhu/Ketu marker sphere radius
const TILT = 5.145 * DEG;        // Moon orbital inclination to ecliptic
const ARC_R = 1.5;               // Elongation arc radius
const WEDGE_R = ORBIT_R - 0.15;  // Tithi wedge outer radius
const EPLANE_R = ORBIT_R + 1;    // Ecliptic plane disc radius
const ARC_SEGS = 64;             // Points along the elongation arc

/* ═══════════════════════════════════════════════════════════════════
   Text Sprite Factory
   Creates a canvas-rendered text label as a Three.js Sprite.
   Returns sprite + canvas/ctx for dynamic text updates.
   ═══════════════════════════════════════════════════════════════════ */
function makeLabel(
  text: string,
  color = '#fff',
  fontSize = 44,
  scale = 0.6,
  bg?: string
) {
  const c = document.createElement('canvas');
  const x = c.getContext('2d')!;
  x.font = `600 ${fontSize}px system-ui,sans-serif`;
  const w = Math.ceil(x.measureText(text).width) + 28;
  const h = Math.ceil(fontSize * 1.5) + 20;
  c.width = w;
  c.height = h;
  x.font = `600 ${fontSize}px system-ui,sans-serif`;
  if (bg) {
    x.fillStyle = bg;
    x.beginPath();
    x.roundRect(0, 0, w, h, 10);
    x.fill();
  }
  x.fillStyle = color;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    sizeAttenuation: true,
  });
  const spr = new THREE.Sprite(mat);
  spr.scale.set((w / h) * scale, scale, 1);
  return { sprite: spr, texture: tex, canvas: c, ctx: x, material: mat };
}

/* ═══════════════════════════════════════════════════════════════════
   Moon Phase Shader
   Physically accurate illumination from any viewing angle.
   The terminator is computed per-fragment based on the dot product
   between the world-space surface normal and the Sun direction.
   ═══════════════════════════════════════════════════════════════════ */
const MOON_VERT = /* glsl */ `
varying vec3 vWN;
void main() {
  vWN = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const MOON_FRAG = /* glsl */ `
uniform vec3 uSunDir;
varying vec3 vWN;
void main() {
  float d = dot(normalize(vWN), normalize(uSunDir));
  float lit = smoothstep(-0.04, 0.04, d);
  vec3 dark = vec3(0.06, 0.07, 0.10);
  vec3 bright = vec3(0.88, 0.90, 0.93);
  gl_FragColor = vec4(mix(dark, bright, lit), 1.0);
}`;

/* ═══════════════════════════════════════════════════════════════════
   Component Interface
   ═══════════════════════════════════════════════════════════════════ */
export interface MoonOrbit3DProps {
  sunLon: number;        // Sun ecliptic longitude (degrees)
  moonLon: number;       // Moon ecliptic longitude (degrees)
  nodeLon: number;       // Ascending node (Rāhu) longitude (degrees)
  elongation: number;    // Moon–Sun angular separation (degrees, 0–360)
  tithiNumber: number;   // Current tithi (1–30)
  className?: string;
}

type CameraPreset = 'perspective' | 'top' | 'side' | 'moon';

export const MoonOrbit3D: React.FC<MoonOrbit3DProps> = ({
  sunLon,
  moonLon,
  nodeLon,
  elongation,
  tithiNumber,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset>('perspective');

  /* ── Bridge React props → Three.js animation loop ── */
  const stateRef = useRef({
    sunLon: 0,
    moonLon: 0,
    nodeLon: 345,
    elongation: 0,
    tithiNumber: 1,
    prevTithi: -1,
    prevElonText: '',
    // Three.js object refs (populated in useEffect)
    orbitGroup: null as THREE.Group | null,
    moonMesh: null as THREE.Mesh | null,
    moonLblSpr: null as THREE.Sprite | null,
    moonPhaseMat: null as THREE.ShaderMaterial | null,
    sunMarker: null as THREE.Sprite | null,
    sunLblSpr: null as THREE.Sprite | null,
    sunLight: null as THREE.DirectionalLight | null,
    sunRayLine: null as THREE.Line | null,
    rahuMesh: null as THREE.Mesh | null,
    rahuLblSpr: null as THREE.Sprite | null,
    ketuMesh: null as THREE.Mesh | null,
    ketuLblSpr: null as THREE.Sprite | null,
    nodalLine: null as THREE.Line | null,
    wedgeGroup: null as THREE.Group | null,
    wedgeMats: [] as THREE.MeshBasicMaterial[],
    arcLine: null as THREE.Line | null,
    elonLbl: null as {
      sprite: THREE.Sprite;
      texture: THREE.CanvasTexture;
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
    } | null,
  });

  /* ── Camera Presets ── */
  const setCameraPreset = useCallback((preset: CameraPreset) => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    setActivePreset(preset);
    const s = stateRef.current;

    switch (preset) {
      case 'perspective':
        cam.position.set(8, 6, 8);
        ctrl.target.set(0, 0, 0);
        break;
      case 'top':
        cam.position.set(0, 16, 0.01);
        ctrl.target.set(0, 0, 0);
        break;
      case 'side':
        cam.position.set(16, 0.5, 0);
        ctrl.target.set(0, 0, 0);
        break;
      case 'moon': {
        if (s.orbitGroup && s.moonMesh) {
          const wp = new THREE.Vector3();
          s.moonMesh.getWorldPosition(wp);
          cam.position.set(wp.x * 1.4, wp.y + 2.5, wp.z * 1.4);
          ctrl.target.copy(wp);
        }
        break;
      }
    }
    ctrl.update();
  }, []);

  /* ═════════════════════════════════════════════════════════════════
     Main Three.js Scene — created once, updated via stateRef
     ═════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const s = stateRef.current;

    /* ─── Renderer ─── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x060610);
    el.appendChild(renderer.domElement);

    /* ─── Camera ─── */
    const camera = new THREE.PerspectiveCamera(
      45,
      el.clientWidth / el.clientHeight,
      0.1,
      200
    );
    camera.position.set(8, 6, 8);
    cameraRef.current = camera;

    /* ─── Controls ─── */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 40;
    controls.target.set(0, 0, 0);
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    const scene = new THREE.Scene();

    /* ═══════════════════════════════════════════════════════════
       Starfield Background
       ═══════════════════════════════════════════════════════════ */
    const starGeo = new THREE.BufferGeometry();
    const starArr = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 55 + Math.random() * 25;
      starArr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starArr[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starArr, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ═══════════════════════════════════════════════════════════
       Lighting
       ═══════════════════════════════════════════════════════════ */
    scene.add(new THREE.AmbientLight(0x334466, 0.5));
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.8);
    sunLight.position.set(10, 3, 0);
    scene.add(sunLight);
    s.sunLight = sunLight;

    /* ═══════════════════════════════════════════════════════════
       Ecliptic Plane — reference disc at Y=0
       ═══════════════════════════════════════════════════════════ */
    const ePlaneGeo = new THREE.CircleGeometry(EPLANE_R, 128);
    const ePlaneMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ePlane = new THREE.Mesh(ePlaneGeo, ePlaneMat);
    ePlane.rotation.x = -Math.PI / 2;
    scene.add(ePlane);

    // Ecliptic border ring
    const eRingGeo = new THREE.RingGeometry(EPLANE_R - 0.03, EPLANE_R, 128);
    const eRingMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const eRing = new THREE.Mesh(eRingGeo, eRingMat);
    eRing.rotation.x = -Math.PI / 2;
    scene.add(eRing);

    // Orbit projection on ecliptic (dashed reference circle)
    const projPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      projPts.push(
        new THREE.Vector3(ORBIT_R * Math.cos(a), 0.001, -ORBIT_R * Math.sin(a))
      );
    }
    const projGeo = new THREE.BufferGeometry().setFromPoints(projPts);
    const projMat = new THREE.LineDashedMaterial({
      color: 0x475569,
      dashSize: 0.3,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.25,
    });
    const projLine = new THREE.Line(projGeo, projMat);
    projLine.computeLineDistances();
    scene.add(projLine);

    /* ═══════════════════════════════════════════════════════════
       Earth — blue sphere at the origin
       ═══════════════════════════════════════════════════════════ */
    const earthGeo = new THREE.SphereGeometry(EARTH_R, 48, 24);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.6,
      metalness: 0.1,
    });
    scene.add(new THREE.Mesh(earthGeo, earthMat));

    // Atmosphere glow (backside larger sphere)
    const glowGeo = new THREE.SphereGeometry(EARTH_R * 1.25, 32, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Earth label
    const earthLbl = makeLabel('Earth (Bhū)', '#60a5fa', 36, 0.5);
    earthLbl.sprite.position.set(0, -EARTH_R - 0.45, 0);
    scene.add(earthLbl.sprite);

    /* ═══════════════════════════════════════════════════════════
       Tilted Orbit Group
       Contains the orbit ring, orbital plane fill, and Moon.
       Quaternion-rotated each frame to match the nodal axis.
       ═══════════════════════════════════════════════════════════ */
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    s.orbitGroup = orbitGroup;

    // Orbit ring line (circle in local XZ plane)
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      orbitPts.push(
        new THREE.Vector3(ORBIT_R * Math.cos(a), 0, -ORBIT_R * Math.sin(a))
      );
    }
    const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
    const orbitLineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 });
    orbitGroup.add(new THREE.Line(orbitLineGeo, orbitLineMat));

    // Orbital plane fill (semi-transparent disc to visualize tilt)
    const oFillGeo = new THREE.CircleGeometry(ORBIT_R, 96);
    const oFillMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const oFill = new THREE.Mesh(oFillGeo, oFillMat);
    oFill.rotation.x = -Math.PI / 2;
    orbitGroup.add(oFill);

    /* ═══════════════════════════════════════════════════════════
       Moon — sphere with phase shader (in orbit group)
       ═══════════════════════════════════════════════════════════ */
    const moonGeo = new THREE.SphereGeometry(MOON_R, 32, 16);
    const moonPhaseMat = new THREE.ShaderMaterial({
      uniforms: { uSunDir: { value: new THREE.Vector3(1, 0, 0) } },
      vertexShader: MOON_VERT,
      fragmentShader: MOON_FRAG,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonPhaseMat);
    orbitGroup.add(moonMesh);
    s.moonMesh = moonMesh;
    s.moonPhaseMat = moonPhaseMat;

    // Moon label
    const moonLbl = makeLabel('Chandra', '#e2e8f0', 34, 0.45);
    orbitGroup.add(moonLbl.sprite);
    s.moonLblSpr = moonLbl.sprite;

    /* ═══════════════════════════════════════════════════════════
       Sun Indicator — golden glow sprite + ray line
       ═══════════════════════════════════════════════════════════ */
    const sunC = document.createElement('canvas');
    sunC.width = sunC.height = 64;
    const sunCtx = sunC.getContext('2d')!;
    const grad = sunCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(251,191,36,1)');
    grad.addColorStop(0.35, 'rgba(251,191,36,0.7)');
    grad.addColorStop(0.7, 'rgba(251,146,0,0.25)');
    grad.addColorStop(1, 'rgba(251,146,0,0)');
    sunCtx.fillStyle = grad;
    sunCtx.fillRect(0, 0, 64, 64);
    const sunTex = new THREE.CanvasTexture(sunC);
    const sunSprMat = new THREE.SpriteMaterial({
      map: sunTex,
      transparent: true,
      depthTest: false,
    });
    const sunMarker = new THREE.Sprite(sunSprMat);
    sunMarker.scale.set(1.6, 1.6, 1);
    scene.add(sunMarker);
    s.sunMarker = sunMarker;

    // Sun label
    const sunLbl = makeLabel('Sun ☉', '#fbbf24', 36, 0.5);
    scene.add(sunLbl.sprite);
    s.sunLblSpr = sunLbl.sprite;

    // Sun ray line (Earth → Sun indicator)
    const srGeo = new THREE.BufferGeometry();
    srGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(6), 3)
    );
    const srMat = new THREE.LineBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0.6,
    });
    const srLine = new THREE.Line(srGeo, srMat);
    scene.add(srLine);
    s.sunRayLine = srLine;

    /* ═══════════════════════════════════════════════════════════
       Rāhu & Ketu — Lunar Nodes
       ═══════════════════════════════════════════════════════════ */
    const nodeGeo = new THREE.SphereGeometry(NODE_R, 16, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

    const rahuMesh = new THREE.Mesh(nodeGeo, nodeMat);
    scene.add(rahuMesh);
    s.rahuMesh = rahuMesh;
    const rahuLbl = makeLabel('Rāhu ☊', '#ef4444', 32, 0.45);
    scene.add(rahuLbl.sprite);
    s.rahuLblSpr = rahuLbl.sprite;

    const ketuMesh = new THREE.Mesh(nodeGeo.clone(), nodeMat.clone());
    scene.add(ketuMesh);
    s.ketuMesh = ketuMesh;
    const ketuLbl = makeLabel('Ketu ☋', '#ef4444', 32, 0.45);
    scene.add(ketuLbl.sprite);
    s.ketuLblSpr = ketuLbl.sprite;

    // Nodal axis line (Rāhu ↔ Ketu)
    const nlGeo = new THREE.BufferGeometry();
    nlGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(6), 3)
    );
    const nlMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
    });
    const nodalLine = new THREE.Line(nlGeo, nlMat);
    scene.add(nodalLine);
    s.nodalLine = nodalLine;

    /* ═══════════════════════════════════════════════════════════
       30 Tithi Wedge Sectors — on ecliptic plane, rotate with Sun
       ═══════════════════════════════════════════════════════════ */
    const wedgeGroup = new THREE.Group();
    const wedgeMats: THREE.MeshBasicMaterial[] = [];

    for (let i = 0; i < 30; i++) {
      const sa = i * 12 * DEG;
      const ea = (i + 1) * 12 * DEG;
      const segs = 6;
      const verts: number[] = [];
      for (let j = 0; j < segs; j++) {
        const a1 = sa + ((ea - sa) * j) / segs;
        const a2 = sa + ((ea - sa) * (j + 1)) / segs;
        verts.push(0, 0.005, 0);
        verts.push(WEDGE_R * Math.cos(a1), 0.005, -WEDGE_R * Math.sin(a1));
        verts.push(WEDGE_R * Math.cos(a2), 0.005, -WEDGE_R * Math.sin(a2));
      }
      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(verts, 3)
      );
      wGeo.computeVertexNormals();
      const wMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xd6d3d1 : 0xbfbbb6,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      wedgeGroup.add(new THREE.Mesh(wGeo, wMat));
      wedgeMats.push(wMat);
    }

    // Tithi division lines (radial tick marks)
    for (let i = 0; i < 30; i++) {
      const a = i * 12 * DEG;
      const dlGeo = new THREE.BufferGeometry();
      dlGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          [0, 0.006, 0, WEDGE_R * Math.cos(a), 0.006, -WEDGE_R * Math.sin(a)],
          3
        )
      );
      const dlMat = new THREE.LineBasicMaterial({
        color: 0x78716c,
        transparent: true,
        opacity: 0.15,
      });
      wedgeGroup.add(new THREE.Line(dlGeo, dlMat));
    }

    scene.add(wedgeGroup);
    s.wedgeGroup = wedgeGroup;
    s.wedgeMats = wedgeMats;

    /* ═══════════════════════════════════════════════════════════
       Elongation Arc — indigo arc from Sun to Moon direction
       ═══════════════════════════════════════════════════════════ */
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        new Float32Array((ARC_SEGS + 1) * 3),
        3
      )
    );
    const arcMat = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.9,
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    scene.add(arcLine);
    s.arcLine = arcLine;

    // Elongation label (dynamic text — canvas redrawn when value changes)
    const elonLbl = makeLabel('0.0°', '#818cf8', 38, 0.5);
    scene.add(elonLbl.sprite);
    s.elonLbl = {
      sprite: elonLbl.sprite,
      texture: elonLbl.texture,
      canvas: elonLbl.canvas,
      ctx: elonLbl.ctx,
    };

    /* ═══════════════════════════════════════════════════════════
       Pre-allocated Quaternion temporaries for orbit tilt
       ═══════════════════════════════════════════════════════════ */
    const _qTilt = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      TILT
    );
    const _qNode = new THREE.Quaternion();
    const _yAxis = new THREE.Vector3(0, 1, 0);

    /* ═══════════════════════════════════════════════════════════
       Animation Loop
       Reads from stateRef.current each frame and updates all
       scene objects: positions, rotations, materials, text.
       ═══════════════════════════════════════════════════════════ */
    let animId = 0;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      controls.update();

      const st = stateRef.current;
      const sunRad = st.sunLon * DEG;
      const nodeRad = st.nodeLon * DEG;

      /* ── Orbit tilt quaternion ──
         Combined rotation: first tilt 5.145° around local X-axis
         (ascending node direction), then rotate around world Y to
         place the ascending node at the correct ecliptic longitude. */
      _qNode.setFromAxisAngle(_yAxis, nodeRad);
      orbitGroup.quaternion.copy(_qNode).multiply(_qTilt);

      /* ── Moon position (local to tilted orbit group) ── */
      const mAngle = (st.moonLon - st.nodeLon) * DEG;
      moonMesh.position.set(
        ORBIT_R * Math.cos(mAngle),
        0,
        -ORBIT_R * Math.sin(mAngle)
      );
      moonLbl.sprite.position.set(
        ORBIT_R * Math.cos(mAngle),
        -MOON_R - 0.35,
        -ORBIT_R * Math.sin(mAngle)
      );

      /* ── Moon phase illumination ──
         Sun direction in world space (from Moon toward Sun).
         Because the Sun is vastly farther than the Moon orbit,
         the direction is approximately the same from any point. */
      moonPhaseMat.uniforms.uSunDir.value.set(
        Math.cos(sunRad),
        0,
        -Math.sin(sunRad)
      );

      /* ── Sun indicator + light ── */
      const sx = SUN_DIST * Math.cos(sunRad);
      const sz = -SUN_DIST * Math.sin(sunRad);
      sunMarker.position.set(sx, 0, sz);
      sunLbl.sprite.position.set(sx, 0.75, sz);
      sunLight.position.set(
        Math.cos(sunRad) * 12,
        3,
        -Math.sin(sunRad) * 12
      );

      /* ── Sun ray line ── */
      const srPos = srLine.geometry.attributes.position
        .array as Float32Array;
      srPos[0] = srPos[1] = srPos[2] = 0;
      srPos[3] = sx;
      srPos[4] = 0;
      srPos[5] = sz;
      srLine.geometry.attributes.position.needsUpdate = true;

      /* ── Rāhu & Ketu node positions ── */
      const nDist = ORBIT_R + 0.25;
      const rx = nDist * Math.cos(nodeRad);
      const rz = -nDist * Math.sin(nodeRad);
      rahuMesh.position.set(rx, 0, rz);
      rahuLbl.sprite.position.set(rx, 0.45, rz);

      const kRad = ((st.nodeLon + 180) % 360) * DEG;
      const kx = nDist * Math.cos(kRad);
      const kz = -nDist * Math.sin(kRad);
      ketuMesh.position.set(kx, 0, kz);
      ketuLbl.sprite.position.set(kx, 0.45, kz);

      /* ── Nodal axis line ── */
      const nlPos = nodalLine.geometry.attributes.position
        .array as Float32Array;
      nlPos[0] = rx;
      nlPos[1] = 0;
      nlPos[2] = rz;
      nlPos[3] = kx;
      nlPos[4] = 0;
      nlPos[5] = kz;
      nodalLine.geometry.attributes.position.needsUpdate = true;

      /* ── Wedge group rotates with Sun ── */
      wedgeGroup.rotation.y = sunRad;

      /* ── Active tithi highlight ── */
      const activeIdx = st.tithiNumber - 1;
      if (activeIdx !== st.prevTithi) {
        // Reset previous
        if (st.prevTithi >= 0 && st.prevTithi < 30) {
          const prev = wedgeMats[st.prevTithi];
          prev.color.setHex(st.prevTithi % 2 === 0 ? 0xd6d3d1 : 0xbfbbb6);
          prev.opacity = 0.12;
        }
        // Highlight current
        if (activeIdx >= 0 && activeIdx < 30) {
          wedgeMats[activeIdx].color.setHex(0xfbbf24);
          wedgeMats[activeIdx].opacity = 0.45;
        }
        st.prevTithi = activeIdx;
      }

      /* ── Elongation arc ── */
      const arcPos = arcLine.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i <= ARC_SEGS; i++) {
        const t = i / ARC_SEGS;
        const a = (st.sunLon + st.elongation * t) * DEG;
        arcPos[i * 3] = ARC_R * Math.cos(a);
        arcPos[i * 3 + 1] = 0.02;
        arcPos[i * 3 + 2] = -ARC_R * Math.sin(a);
      }
      arcLine.geometry.attributes.position.needsUpdate = true;

      /* ── Elongation label (update text only when changed) ── */
      const elonText = `${st.elongation.toFixed(1)}°`;
      if (elonText !== st.prevElonText) {
        const { ctx: ec, canvas: ecv, texture: etx } = elonLbl;
        ec.clearRect(0, 0, ecv.width, ecv.height);
        ec.fillStyle = '#818cf8';
        ec.font = '600 38px system-ui,sans-serif';
        ec.textAlign = 'center';
        ec.textBaseline = 'middle';
        ec.fillText(elonText, ecv.width / 2, ecv.height / 2);
        etx.needsUpdate = true;
        st.prevElonText = elonText;
      }
      const midA = (st.sunLon + st.elongation * 0.5) * DEG;
      elonLbl.sprite.position.set(
        (ARC_R + 0.5) * Math.cos(midA),
        0.15,
        -(ARC_R + 0.5) * Math.sin(midA)
      );

      renderer.render(scene, camera);
    };

    tick();

    /* ═══════════════════════════════════════════════════════════
       Resize Observer
       ═══════════════════════════════════════════════════════════ */
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    /* ═══════════════════════════════════════════════════════════
       Cleanup — dispose all Three.js resources
       ═══════════════════════════════════════════════════════════ */
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();

      scene.traverse((obj: THREE.Object3D) => {
        const m = obj as THREE.Mesh | THREE.Line | THREE.Points;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => {
              (mat as THREE.MeshBasicMaterial).map?.dispose();
              mat.dispose();
            });
          } else {
            const mat = m.material as THREE.MeshBasicMaterial;
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

  /* ── Prop bridge: update stateRef when React props change ── */
  useEffect(() => {
    const s = stateRef.current;
    s.sunLon = sunLon;
    s.moonLon = moonLon;
    s.nodeLon = nodeLon;
    s.elongation = elongation;
    s.tithiNumber = tithiNumber;
  }, [sunLon, moonLon, nodeLon, elongation, tithiNumber]);

  /* ── Auto-rotate control ── */
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  /* ═══════════════════════════════════════════════════════════════
     JSX — Container + Floating UI Overlays
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden rounded-2xl bg-[#060610] border border-stone-800 ${className}`}
    >
      {/* WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* ── Floating Camera Preset Toolbar ── */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm z-10 text-xs">
        {(
          [
            ['perspective', '3D Angle', '3D Perspective View'],
            ['top', 'Top View', 'Top-Down View (matches 2D diagram)'],
            ['side', 'Side View', 'Side View (see 5° orbital tilt)'],
            ['moon', '🌙 Moon', 'Moon Close-up (follow Moon)'],
          ] as const
        ).map(([key, label, title]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCameraPreset(key as CameraPreset)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activePreset === key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title={title}
          >
            {label}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-stone-300 dark:bg-stone-700 mx-0.5" />

        {/* Auto-Rotate Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
            autoRotate
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
          title="Toggle 360° Auto Rotation"
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

      {/* ── Tilt Info Card (Top Left) ── */}
      <div className="absolute top-3 left-3 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm z-10 pointer-events-none text-[11px]">
        <div className="font-semibold text-stone-800 dark:text-stone-100 mb-0.5">
          Moon Orbit — 3D
        </div>
        <div className="text-stone-500 dark:text-stone-400">
          Orbital tilt:{' '}
          <strong className="text-indigo-500">5.145°</strong> to ecliptic
        </div>
      </div>

      {/* ── Interaction Hint (Bottom Center) ── */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/40 text-white/90 text-[10px] px-3 py-1 rounded-full backdrop-blur-xs pointer-events-none tracking-wide flex items-center gap-1.5">
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
        <span>Drag to orbit 360° • Scroll to zoom</span>
      </div>
    </div>
  );
};
