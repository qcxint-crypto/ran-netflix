'use client'

import { useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree, invalidate } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Animated aurora built from three drifting colour blobs and a dark vignette.
 * Deliberately no post-processing: an extra render pass over the full viewport
 * costs more than the effect is worth on a backdrop.
 */
const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Value noise + two octaves. Enough to break up the blobs into something that
  // reads as atmosphere rather than three flat circles.
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    return noise(p) * 0.62 + noise(p * 2.13) * 0.26;
  }

  void main() {
    // Keep the pattern isotropic so it does not stretch on wide screens.
    vec2 uv = vUv;
    uv.x *= uResolution.x / max(uResolution.y, 1.0);

    vec2 drift = vec2(uv.x * 1.5, uv.y * 1.9 + uTime * 0.9);
    float grain = fbm(drift * 1.7) * 0.5;
    float t = uTime * 0.06;

    // Blob centres: violet top-left, teal top-right, gold low-centre.
    float violet = smoothstep(0.72, 0.0, distance(uv, vec2(0.22, 1.35)) + grain * 0.34 - t * 0.16);
    float teal   = smoothstep(0.60, 0.0, distance(uv, vec2(1.62, 1.62)) + grain * 0.30 + t * 0.12);
    float gold   = smoothstep(0.66, 0.0, distance(uv, vec2(0.95, -0.28)) + grain * 0.26 - t * 0.09);

    vec3 color = vec3(0.0);
    color += vec3(0.486, 0.361, 1.0) * violet * 0.55;
    color += vec3(0.310, 0.820, 0.773) * teal * 0.28;
    color += vec3(0.910, 0.690, 0.294) * gold * 0.22;

    // Fade the blobs toward the edges so text contrast is preserved.
    float vignette = smoothstep(1.25, 0.25, distance(vUv, vec2(0.5)));
    color *= vignette * uIntensity;

    // Transparent canvas: the static CSS gradient underneath stays visible, so
    // the swap-in is seamless and the section backgrounds keep their own tone.
    float alpha = clamp(max(max(violet, teal), gold) * vignette * uIntensity, 0.0, 0.92);

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`

function AuroraPlane({ intensity }: { intensity: number }) {
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uIntensity: { value: intensity },
    }),
    // Intensity only ever changes if the caller re-renders with a new value.
    [intensity],
  )

  useEffect(() => {
    uniforms.uResolution.value.set(viewport.width, viewport.height)
    invalidate()
  }, [uniforms, viewport.width, viewport.height])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Drives `invalidate()` at ~30fps. The canvas runs with `frameloop="demand"`,
 * so it renders only when told to — a soft, blurred backdrop gains nothing from
 * 60fps, and this halves the GPU wake-ups.
 */
function Ticker({ fps }: { fps: number }) {
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.hidden) return
      invalidate()
    }, 1000 / fps)
    return () => window.clearInterval(interval)
  }, [fps])

  return null
}

export default function AuroraCanvas({ intensity = 1, fps = 30 }: { intensity?: number; fps?: number }) {
  return (
    <Canvas
      // A blurred gradient needs no extra pixels — 1x is indistinguishable.
      dpr={[1, 1]}
      frameloop="demand"
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      style={{ pointerEvents: 'none' }}
    >
      <AuroraPlane intensity={intensity} />
      <Ticker fps={fps} />
    </Canvas>
  )
}
