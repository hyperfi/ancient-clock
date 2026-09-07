'use client';

import React, { useEffect, useRef, useState, useId } from 'react';

export interface ArmillarySphereProps {
  size?: number | string;
  className?: string;
  speed?: number; // Speed multiplier (default 1)
  interactive?: boolean; // Subtle mouse tilt
  showDhruvaStar?: boolean;
  showTicks?: boolean;
}

// Astronomical constants from Sūrya Siddhānta Ch. 13 (Gola-yantra)
const R_SPHERE = 38;
const R_MERIDIAN = 42;
const CX = 50;
const CY = 50;
const OBLIQUITY = (23.44 * Math.PI) / 180; // Krānti (ecliptic tilt)
const POLAR_TILT = (-23.44 * Math.PI) / 180; // Tilt North Pole toward top-right
const VIEW_ELEVATION = (16 * Math.PI) / 180; // Look down into sphere for 3D depth

// Pre-computed orientation matrix constants
const cosZ = Math.cos(POLAR_TILT);
const sinZ = Math.sin(POLAR_TILT);
const cosX = Math.cos(VIEW_ELEVATION);
const sinX = Math.sin(VIEW_ELEVATION);

/**
 * Projects a 3D celestial coordinate point into 2D SVG canvas coordinates
 * rotating around the true celestial polar axis (Y-axis).
 */
function projectPoint(
  x: number,
  y: number,
  z: number,
  theta: number,
  tiltExtraX = 0,
  tiltExtraY = 0
) {
  // 1. Diurnal rotation around the celestial polar axis (Y) by angle theta
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const x1 = x * cosT + z * sinT;
  const y1 = y;
  const z1 = -x * sinT + z * cosT;

  // 2. Polar axis inclination (Dhruva tilt around Z)
  const x2 = x1 * cosZ - y1 * sinZ;
  const y2 = x1 * sinZ + y1 * cosZ;
  const z2 = z1;

  // 3. Observer elevation angle around X (plus optional interactive tilt)
  const cX = Math.cos(VIEW_ELEVATION + tiltExtraX);
  const sX = Math.sin(VIEW_ELEVATION + tiltExtraX);
  const cY = Math.cos(tiltExtraY);
  const sY = Math.sin(tiltExtraY);

  const X = x2 * cY + z2 * sY;
  const Y = y2 * cX - (z2 * cY - x2 * sY) * sX;
  const Z = y2 * sX + (z2 * cY - x2 * sY) * cX;

  return {
    sx: CX + X,
    sy: CY - Y, // SVG Y is downward
    z: Z, // Depth: Z > 0 in front of center, Z < 0 behind center
  };
}

/**
 * Generates SVG path strings for full ring and the front arc (Z >= 0)
 */
function buildRingPath(
  getPoint: (phi: number) => { x: number; y: number; z: number },
  theta: number,
  tiltExtraX = 0,
  tiltExtraY = 0,
  samples = 48
) {
  const points: { sx: number; sy: number; z: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const phi = (i / samples) * 2 * Math.PI;
    const pt = getPoint(phi);
    points.push(projectPoint(pt.x, pt.y, pt.z, theta, tiltExtraX, tiltExtraY));
  }

  // Full continuous ring path
  const fullPath =
    points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.sx.toFixed(2)} ${p.sy.toFixed(2)}`)
      .join(' ') + ' Z';

  // Front arc where z >= 0
  const extended = [...points.slice(0, -1), ...points];
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < extended.length; i++) {
    if (extended[i].z >= 0) {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen && curLen <= samples) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  let frontPath = '';
  if (bestStart !== -1 && bestLen > 0) {
    const frontPts = extended.slice(bestStart, bestStart + bestLen);
    frontPath = frontPts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.sx.toFixed(2)} ${p.sy.toFixed(2)}`)
      .join(' ');
  }

  return { fullPath, frontPath };
}

export function ArmillarySphere({
  size = 120,
  className = '',
  speed = 1,
  interactive = true,
  showDhruvaStar = true,
  showTicks = true,
}: ArmillarySphereProps) {
  const id = useId();
  const earthGradId = `armillary-earth-${id}`;
  const dhruvaGlowId = `dhruva-glow-${id}`;

  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef<SVGSVGElement>(null);

  // SVG Path refs for direct, zero-re-render 60fps animation
  const eqBackRef = useRef<SVGPathElement>(null);
  const eqFrontRef = useRef<SVGPathElement>(null);
  const eclBackRef = useRef<SVGPathElement>(null);
  const eclFrontRef = useRef<SVGPathElement>(null);
  const col1BackRef = useRef<SVGPathElement>(null);
  const col1FrontRef = useRef<SVGPathElement>(null);
  const col2BackRef = useRef<SVGPathElement>(null);
  const col2FrontRef = useRef<SVGPathElement>(null);
  const sunBeadRef = useRef<SVGCircleElement>(null);

  // Static initial canonical geometry (theta = 0.5 rad) to ensure 100% hydration match
  const initialPaths = useRef(() => {
    const theta0 = 0.5;
    return {
      eq: buildRingPath((phi) => ({ x: R_SPHERE * Math.cos(phi), y: 0, z: R_SPHERE * Math.sin(phi) }), theta0),
      ecl: buildRingPath(
        (phi) => ({
          x: R_SPHERE * Math.cos(phi),
          y: R_SPHERE * Math.sin(phi) * Math.sin(OBLIQUITY),
          z: R_SPHERE * Math.sin(phi) * Math.cos(OBLIQUITY),
        }),
        theta0
      ),
      col1: buildRingPath((phi) => ({ x: R_SPHERE * Math.cos(phi), y: R_SPHERE * Math.sin(phi), z: 0 }), theta0),
      col2: buildRingPath((phi) => ({ x: 0, y: R_SPHERE * Math.sin(phi), z: R_SPHERE * Math.cos(phi) }), theta0),
    };
  }).current();

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animId: number;
    let angle = 0.5;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Diurnal rotation rate: ~1 rotation every 18 seconds at speed 1
      angle = (angle + dt * 0.35 * speed) % (Math.PI * 2);

      const tiltX = mouseTilt.x;
      const tiltY = mouseTilt.y;

      // 1. Nāḍīvalaya (Celestial Equator)
      const eq = buildRingPath(
        (phi) => ({ x: R_SPHERE * Math.cos(phi), y: 0, z: R_SPHERE * Math.sin(phi) }),
        angle,
        tiltX,
        tiltY
      );
      if (eqBackRef.current) eqBackRef.current.setAttribute('d', eq.fullPath);
      if (eqFrontRef.current) eqFrontRef.current.setAttribute('d', eq.frontPath);

      // 2. Krāntivṛtta (Ecliptic Ring)
      const ecl = buildRingPath(
        (phi) => ({
          x: R_SPHERE * Math.cos(phi),
          y: R_SPHERE * Math.sin(phi) * Math.sin(OBLIQUITY),
          z: R_SPHERE * Math.sin(phi) * Math.cos(OBLIQUITY),
        }),
        angle,
        tiltX,
        tiltY
      );
      if (eclBackRef.current) eclBackRef.current.setAttribute('d', ecl.fullPath);
      if (eclFrontRef.current) eclFrontRef.current.setAttribute('d', ecl.frontPath);

      // 3. Viṣuva-vṛtta (Equinoctial Colure)
      const col1 = buildRingPath(
        (phi) => ({ x: R_SPHERE * Math.cos(phi), y: R_SPHERE * Math.sin(phi), z: 0 }),
        angle,
        tiltX,
        tiltY
      );
      if (col1BackRef.current) col1BackRef.current.setAttribute('d', col1.fullPath);
      if (col1FrontRef.current) col1FrontRef.current.setAttribute('d', col1.frontPath);

      // 4. Ayanānta-vṛtta (Solstitial Colure)
      const col2 = buildRingPath(
        (phi) => ({ x: 0, y: R_SPHERE * Math.sin(phi), z: R_SPHERE * Math.cos(phi) }),
        angle,
        tiltX,
        tiltY
      );
      if (col2BackRef.current) col2BackRef.current.setAttribute('d', col2.fullPath);
      if (col2FrontRef.current) col2FrontRef.current.setAttribute('d', col2.frontPath);

      // 5. Sun position on the Ecliptic (Sūrya-bimba bead)
      const sunProj = projectPoint(
        R_SPHERE * Math.cos(angle * 0.8),
        R_SPHERE * Math.sin(angle * 0.8) * Math.sin(OBLIQUITY),
        R_SPHERE * Math.sin(angle * 0.8) * Math.cos(OBLIQUITY),
        angle,
        tiltX,
        tiltY
      );
      if (sunBeadRef.current) {
        sunBeadRef.current.setAttribute('cx', sunProj.sx.toFixed(2));
        sunBeadRef.current.setAttribute('cy', sunProj.sy.toFixed(2));
        sunBeadRef.current.setAttribute('opacity', sunProj.z >= 0 ? '1' : '0.25');
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [speed, mouseTilt]);

  // Handle subtle interactive mouse tilt
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: -ny * 0.15, y: nx * 0.15 });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // Fixed polar axis endpoints (Dhruva-yaṣṭi)
  const poleLen = 46;
  const northPole = projectPoint(0, poleLen, 0, 0);
  const southPole = projectPoint(0, -poleLen, 0, 0);

  // Meridian ring graduation ticks (every 30 degrees)
  const ticks = [];
  if (showTicks) {
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const x1 = CX + (R_MERIDIAN - 1.8) * Math.cos(rad);
      const y1 = CY + (R_MERIDIAN - 1.8) * Math.sin(rad);
      const x2 = CX + (R_MERIDIAN + 0.5) * Math.cos(rad);
      const y2 = CY + (R_MERIDIAN + 0.5) * Math.sin(rad);
      ticks.push({ deg, x1, y1, x2, y2 });
    }
  }

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`select-none overflow-visible ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label="Armillary Sphere (Gola-yantra) — Sūrya Siddhānta Chapter 13"
    >
      <defs>
        {/* Central Earth Radial Gradient */}
        <radialGradient id={earthGradId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </radialGradient>

        {/* North Star Dhruva Glow */}
        <filter id={dhruvaGlowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── LAYER 1: OUTER FIXED MERIDIAN RING (Khagola / Base Frame) ── */}
      <circle
        cx={CX}
        cy={CY}
        r={R_MERIDIAN}
        fill="none"
        stroke="#B87333"
        strokeWidth="1.6"
        className="dark:stroke-amber-600/90"
      />
      <circle
        cx={CX}
        cy={CY}
        r={R_MERIDIAN - 2.5}
        fill="none"
        stroke="#B87333"
        strokeWidth="0.6"
        opacity="0.4"
        className="dark:stroke-amber-600/40"
      />

      {/* Meridian Ticks */}
      {ticks.map((t) => (
        <line
          key={t.deg}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="#B87333"
          strokeWidth={t.deg % 90 === 0 ? '1.2' : '0.6'}
          className="dark:stroke-amber-500/80"
        />
      ))}

      {/* ── LAYER 2: POLAR SPINDLE (Dhruva-yaṣṭi) — BACK HALF ── */}
      <line
        x1={southPole.sx}
        y1={southPole.sy}
        x2={CX}
        y2={CY}
        stroke="#78716C"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="dark:stroke-stone-500"
      />

      {/* ── LAYER 3: ROTATING RINGS (BACK ARCS — BEHIND EARTH) ── */}
      {/* 1. Nāḍīvalaya (Equator) — Subtle Back Arc */}
      <path
        ref={eqBackRef}
        d={initialPaths.eq.fullPath}
        fill="none"
        stroke="#D97706"
        strokeWidth="1.0"
        strokeDasharray="2 2"
        opacity="0.3"
        className="dark:stroke-amber-400"
      />

      {/* 2. Krāntivṛtta (Ecliptic) — Subtle Back Arc */}
      <path
        ref={eclBackRef}
        d={initialPaths.ecl.fullPath}
        fill="none"
        stroke="#4338CA"
        strokeWidth="1.0"
        strokeDasharray="2 2"
        opacity="0.3"
        className="dark:stroke-indigo-400"
      />

      {/* 3. Colures — Subtle Back Arcs */}
      <path
        ref={col1BackRef}
        d={initialPaths.col1.fullPath}
        fill="none"
        stroke="#78716C"
        strokeWidth="0.8"
        strokeDasharray="1.5 2.5"
        opacity="0.25"
        className="dark:stroke-stone-500"
      />
      <path
        ref={col2BackRef}
        d={initialPaths.col2.fullPath}
        fill="none"
        stroke="#059669"
        strokeWidth="0.8"
        strokeDasharray="1.5 2.5"
        opacity="0.25"
        className="dark:stroke-emerald-400"
      />

      {/* ── LAYER 4: CENTRAL EARTH (Bhū-gola) ── */}
      <circle
        cx={CX}
        cy={CY}
        r="5.5"
        fill={`url(#${earthGradId})`}
        stroke="#93C5FD"
        strokeWidth="0.8"
        className="dark:stroke-sky-300"
      />
      {/* Earth Equator highlight */}
      <ellipse cx={CX} cy={CY} rx="5.4" ry="1.8" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />

      {/* ── LAYER 5: POLAR SPINDLE (FRONT HALF) ── */}
      <line
        x1={CX}
        y1={CY}
        x2={northPole.sx}
        y2={northPole.sy}
        stroke="#78716C"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="dark:stroke-stone-300"
      />

      {/* ── LAYER 6: ROTATING RINGS (FRONT ARCS — IN FRONT OF EARTH) ── */}
      {/* 1. Viṣuva-vṛtta (Equinoctial Colure) — Front Arc */}
      <path
        ref={col1FrontRef}
        d={initialPaths.col1.frontPath}
        fill="none"
        stroke="#78716C"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.75"
        className="dark:stroke-stone-400"
      />

      {/* 2. Ayanānta-vṛtta (Solstitial Colure) — Front Arc */}
      <path
        ref={col2FrontRef}
        d={initialPaths.col2.frontPath}
        fill="none"
        stroke="#059669"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.8"
        className="dark:stroke-emerald-400"
      />

      {/* 3. Nāḍīvalaya (Celestial Equator) — Solid Radiant Front Arc */}
      <path
        ref={eqFrontRef}
        d={initialPaths.eq.frontPath}
        fill="none"
        stroke="#D97706"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.95"
        className="dark:stroke-amber-400"
      />

      {/* 4. Krāntivṛtta (Ecliptic Ring) — Solid Royal Front Arc */}
      <path
        ref={eclFrontRef}
        d={initialPaths.ecl.frontPath}
        fill="none"
        stroke="#4338CA"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.95"
        className="dark:stroke-indigo-400"
      />

      {/* ── LAYER 7: SŪRYA-BIMBA (Sun bead on the Ecliptic) ── */}
      <circle
        ref={sunBeadRef}
        cx={CX}
        cy={CY}
        r="2.2"
        fill="#F59E0B"
        stroke="#FFFFFF"
        strokeWidth="0.6"
        className="drop-shadow-xs"
      />

      {/* ── LAYER 8: PIVOT FINIALS & DHRUVA (North Star) ── */}
      {/* South Pole Finial Pivot */}
      <circle cx={southPole.sx} cy={southPole.sy} r="1.8" fill="#B87333" className="dark:fill-amber-600" />

      {/* North Pole Finial Pivot */}
      <circle cx={northPole.sx} cy={northPole.sy} r="2.0" fill="#B87333" className="dark:fill-amber-500" />

      {/* Dhruva Tāra (North Star) Beacon */}
      {showDhruvaStar && (
        <g transform={`translate(${northPole.sx}, ${northPole.sy - 3.5})`} filter={`url(#${dhruvaGlowId})`}>
          <polygon
            points="0,-3.5 0.9,-0.9 3.5,0 0.9,0.9 0,3.5 -0.9,0.9 -3.5,0 -0.9,-0.9"
            fill="#F59E0B"
            className="dark:fill-amber-300"
          />
          <circle cx="0" cy="0" r="1.0" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
}
