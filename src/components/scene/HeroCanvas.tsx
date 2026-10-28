'use client'

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useIsDesktop, usePointer, useVisibilityFrameloop } from '@/lib/motion'

type PointerRef = MutableRefObject<{ x: number; y: number }>

// --- Module constants (outside component to avoid per-render alloc) ---------

const FOG_ARGS: [string, number, number] = ['#07070c', 9, 30]

const LIGHTS = {
  ambientIntensity: 0.7,
  directional: { position: [5, 6, 4] as [number, number, number], intensity: 1.6 },
  gold: {
    position: [-7, 2, 3] as [number, number, number],
    intensity: 38,
    distance: 26,
    color: '#e8b04b',
  },
  violet: {
    position: [8, -1.5, 2] as [number, number, number],
    intensity: 30,
    distance: 24,
    color: '#7c5cff',
  },
} as const

// Zero-alloc look target reused every frame inside Rig — no new Vector3 in useFrame.
const TARGET_LOOK = new THREE.Vector3(0, 0, -4)

// --- Poster textures -------------------------------------------------------

/**
 * Loads poster images as WebGL textures, tolerating individual failures: a
 * poster that 404s or blocks CORS keeps its placeholder instead of taking the
 * whole scene down. Errors are swallowed deliberately — a missing image is not
 * worth an error boundary for a decorative background.
 */
function usePosterTextures(urls: string[]): Array<THREE.Texture | null> {
  const [textures, setTextures] = useState<Array<THREE.Texture | null>>(() =>
    urls.map(() => null),
  )
  const key = urls.join('|')

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    const loaded: THREE.Texture[] = []

    urls.forEach((url, index) => {
      if (!url) return
      // AniList blocks cross-origin reads of its CDN, which taints the texture
      // and renders the poster black. Same-origin proxy keeps the pixels
      // readable; anything already local is loaded directly.
      const src = url.startsWith('/') ? url : `/api/image-proxy?url=${encodeURIComponent(url)}`
      loader.load(
        src,
        (texture) => {
          if (cancelled) {
            texture.dispose()
            return
          }
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = 4
          loaded.push(texture)
          setTextures((prev) => {
            const next = prev.slice()
            next[index] = texture
            return next
          })
        },
        undefined,
        () => {
          // Keep the placeholder for this slot.
        },
      )
    })

    return () => {
      cancelled = true
      loaded.forEach((texture) => texture.dispose())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return textures
}

/** Flat tinted gradient used for slots whose poster has not loaded (or failed). */
function usePlaceholderTexture(): THREE.Texture {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 96
    canvas.height = 134
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 96, 134)
      gradient.addColorStop(0, '#1b1b2c')
      gradient.addColorStop(0.55, '#13131f')
      gradient.addColorStop(1, '#0b0b12')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 96, 134)
      // Corner accent so placeholder planes still read as "poster".
      ctx.fillStyle = 'rgba(232, 176, 75, 0.16)'
      ctx.fillRect(0, 0, 96, 3)
    }
    const created = new THREE.CanvasTexture(canvas)
    created.colorSpace = THREE.SRGBColorSpace
    return created
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  return texture
}

// --- Scene pieces ---------------------------------------------------------

function Starfield({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)

  // Memoized once — avoids reallocating Float32Array on every render.
  // BufferGeometry is auto-disposed by R3F when the component unmounts.
  const positions = useMemo(() => {
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 48
      array[i * 3 + 1] = (Math.random() - 0.5) * 26
      // Pushed back behind the poster wall so particles read as depth, not noise.
      array[i * 3 + 2] = -Math.random() * 26 - 1
    }
    return array
  }, [count])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#c8ccff"
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function Poster({
  texture,
  placeholder,
  position,
  rotation,
  phase,
  depth,
  pointer,
  sharedGeometry,
}: {
  texture: THREE.Texture | null
  placeholder: THREE.Texture
  position: [number, number, number]
  rotation: [number, number, number]
  phase: number
  depth: number
  pointer: PointerRef
  sharedGeometry: THREE.PlaneGeometry
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    // Slow vertical drift plus a tighter yaw response for nearer planes —
    // parallax is what sells the depth, not the drift alone.
    mesh.position.y = position[1] + Math.sin(t * 0.22 + phase) * 0.3
    mesh.rotation.z = rotation[2] + Math.sin(t * 0.17 + phase) * 0.028
    mesh.rotation.y = rotation[1] + pointer.current.x * 0.1 * depth
  })

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <primitive object={sharedGeometry} attach="geometry" />
      <meshStandardMaterial
        map={texture ?? placeholder}
        roughness={0.62}
        metalness={0.14}
        // Slight self-illumination keeps the wall readable on the darkest bg
        // without washing out the poster art.
        emissive="#0a0a14"
        emissiveIntensity={0.6}
      />
    </mesh>
  )
}

function PosterWall({ urls, pointer }: { urls: string[]; pointer: PointerRef }) {
  const textures = usePosterTextures(urls)
  const placeholder = usePlaceholderTexture()
  const count = urls.length

  // Shared single PlaneGeometry — 7 posters reuse one GPU allocation.
  const sharedGeometry = useMemo(() => new THREE.PlaneGeometry(1.55, 2.16), [])

  useEffect(() => {
    return () => {
      sharedGeometry.dispose()
    }
  }, [sharedGeometry])

  const posters = useMemo(
    () =>
      urls.map((_, i) => {
        const offset = i - (count - 1) / 2
        return {
          position: [
            offset * 2.35,
            0.4 * Math.sin(offset * 0.9),
            -3.4 - Math.abs(offset) * 0.6,
          ] as [number, number, number],
          rotation: [0, -offset * 0.17, offset * 0.022] as [number, number, number],
          phase: i * 1.7,
          depth: 1 - Math.abs(offset) / (count || 1),
        }
      }),
    [count, urls],
  )

  return (
    <group position={[0.9, 0, 0]}>
      {posters.map((poster, i) => (
        <Poster
          key={i}
          texture={textures[i] ?? null}
          placeholder={placeholder}
          position={poster.position}
          rotation={poster.rotation}
          phase={poster.phase}
          depth={poster.depth}
          pointer={pointer}
          sharedGeometry={sharedGeometry}
        />
      ))}
    </group>
  )
}

/**
 * Eases the whole wall and the camera toward the pointer. The lerp factor is
 * derived from delta so the motion feels identical at 60 and 144 Hz.
 * Zero alloc per frame: reuses TARGET_LOOK for lookAt and does arithmetic
 * lerp inline instead of creating new Vector3.
 */
function Rig({ pointer, children }: { pointer: PointerRef; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const { camera, gl } = useThree()

  useFrame((_, delta) => {
    const k = 1 - Math.pow(0.0015, Math.min(delta, 0.1))
    const group = ref.current
    if (group) {
      group.rotation.y += (pointer.current.x * 0.14 - group.rotation.y) * k
      group.rotation.x += (pointer.current.y * 0.07 - group.rotation.x) * k
      group.position.x += (0.9 - pointer.current.x * 0.55 - group.position.x) * k
    }
    camera.position.x += (pointer.current.x * 0.85 - camera.position.x) * k * 0.7
    camera.position.y += (-pointer.current.y * 0.5 - camera.position.y) * k * 0.7
    camera.lookAt(TARGET_LOOK)

    // Manually reset info because autoReset is disabled in onCreated.
    // Keeps the gl.info counters from growing unbounded and mirrors
    // three.js best practice when autoReset is off.
    gl.info.reset()
  })

  return <group ref={ref}>{children}</group>
}

// --- Entry point ----------------------------------------------------------

export default function HeroCanvas({ posters }: { posters: string[] }) {
  const pointer = usePointer()
  const frameloop = useVisibilityFrameloop()
  const isDesktop = useIsDesktop()
  const urls = useMemo(() => posters.filter(Boolean).slice(0, 7), [posters])

  return (
    <Canvas
      // Capped DPR: past 1.5 the extra pixels cost more than they show on a
      // decorative backdrop.
      dpr={[1, 1.5]}
      frameloop={frameloop}
      camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 60 }}
      // SSB: scene settings bridge — explicitly configure renderer flags that
      // affect the shared WebGL context. No shadows needed for a backdrop,
      // stencil is unused, preserveDrawingBuffer off to allow buffer reuse.
      gl={{
        alpha: true,
        antialias: true,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ pointerEvents: 'none' }}
      onCreated={(state) => {
        state.gl.info.autoReset = false
        state.gl.shadowMap.enabled = false
        state.gl.outputColorSpace = THREE.SRGBColorSpace
        state.gl.toneMapping = THREE.NoToneMapping
        try {
          // Warm compile — synchronous best-effort, then async in background.
          // Prevents first-frame hitch by uploading shaders before first render.
          ;(state.gl as any).compile?.(state.scene, state.camera)
          ;(state.gl as any).compileAsync?.(state.scene, state.camera)
            .then(() => {})
            .catch(() => {})
        } catch {
          // compile may throw if scene not fully ready; safe to ignore.
        }
      }}
    >
      <fog attach="fog" args={FOG_ARGS} />
      <ambientLight intensity={LIGHTS.ambientIntensity} />
      <directionalLight
        position={LIGHTS.directional.position}
        intensity={LIGHTS.directional.intensity}
      />
      {/* Gold key light and violet rim light — the two accents of the palette. */}
      <pointLight
        position={LIGHTS.gold.position}
        intensity={LIGHTS.gold.intensity}
        distance={LIGHTS.gold.distance}
        color={LIGHTS.gold.color}
      />
      <pointLight
        position={LIGHTS.violet.position}
        intensity={LIGHTS.violet.intensity}
        distance={LIGHTS.violet.distance}
        color={LIGHTS.violet.color}
      />
      <Rig pointer={pointer}>
        <Starfield count={isDesktop ? 1400 : 500} />
        <PosterWall urls={urls} pointer={pointer} />
      </Rig>
    </Canvas>
  )
}
