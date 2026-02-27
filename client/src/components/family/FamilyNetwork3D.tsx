import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    BRAND_GRADIENT,
    PARTICLE_PALETTE,
    DEFAULT_MEMBERS,
    DEFAULT_CONNECTIONS
} from "@/lib/theme";

interface FamilyMember {
    id: string;
    name: string;
    color: string;
    position: [number, number, number];
    size: number;
}

interface Connection {
    from: string;
    to: string;
    strength: number;
}

export interface FamilyNetwork3DProps {
    members?: FamilyMember[];
    connections?: Connection[];
    healthScore?: number;
}

// Animated gradient background with shader
function GradientBackground() {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(BRAND_GRADIENT.PRIMARY) },
            uColor2: { value: new THREE.Color(BRAND_GRADIENT.SECONDARY) },
            uColor3: { value: new THREE.Color(BRAND_GRADIENT.TERTIARY) },
        }),
        []
    );

    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            float time = uTime * 0.15;

            float n1 = sin(uv.x * 3.0 + time) * cos(uv.y * 3.0 + time * 0.5) * 0.5 + 0.5;
            float n2 = sin(uv.x * 2.0 - time * 0.8) * sin(uv.y * 4.0 + time) * 0.5 + 0.5;

            vec3 color = mix(uColor1, uColor2, n1);
            color = mix(color, uColor3, n2 * 0.5);

            float vignette = 1.0 - length(uv - 0.5) * 0.5;
            color *= vignette;
            color *= 0.12;

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <mesh scale={[2, 2, 1]}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                depthWrite={false}
            />
        </mesh>
    );
}

// Connection line between family members
function ConnectionLine({ start, end, strength }: { start: THREE.Vector3; end: THREE.Vector3; strength: number }) {
    const lineRef = useRef<THREE.Line>(null);

    const geometry = useMemo(() => {
        const curve = new THREE.QuadraticBezierCurve3(
            start,
            new THREE.Vector3(
                (start.x + end.x) / 2,
                (start.y + end.y) / 2 + 0.3,
                (start.z + end.z) / 2
            ),
            end
        );
        const points = curve.getPoints(30);
        const positions = new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, [start, end]);

    useFrame((state) => {
        if (lineRef.current) {
            const material = lineRef.current.material as THREE.LineBasicMaterial;
            material.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 2 + start.x) * 0.1 * strength;
        }
    });

    return (
        <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: BRAND_GRADIENT.PRIMARY, transparent: true, opacity: 0.3 * strength }))} ref={lineRef} />
    );
}

// Individual family member node
function FamilyNode({
    member,
    isHovered,
    onHover,
}: {
    member: FamilyMember;
    isHovered: boolean;
    onHover: (id: string | null) => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            const floatY = Math.sin(state.clock.elapsedTime * 0.8 + member.id.charCodeAt(0)) * 0.08;
            meshRef.current.position.y = floatY;

            const targetScale = isHovered ? 1.4 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
        }

        if (glowRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
            glowRef.current.scale.setScalar(pulse);
            const material = glowRef.current.material as THREE.MeshBasicMaterial;
            material.opacity = isHovered ? 0.2 : 0.08;
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
            <group position={member.position}>
                <mesh
                    ref={meshRef}
                    onPointerOver={() => {
                        onHover(member.id);
                        document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                        onHover(null);
                        document.body.style.cursor = "default";
                    }}
                >
                    <sphereGeometry args={[member.size, 64, 64]} />
                    <MeshDistortMaterial
                        color={member.color}
                        roughness={0.2}
                        metalness={0.6}
                        distort={isHovered ? 0.5 : 0.25}
                        speed={3}
                    />
                </mesh>

                <mesh ref={glowRef}>
                    <sphereGeometry args={[member.size * 1.8, 32, 32]} />
                    <meshBasicMaterial
                        color={member.color}
                        transparent
                        opacity={0.08}
                    />
                </mesh>
            </group>
        </Float>
    );
}

// Particle system
function AmbientParticles({ count = 200 }: { count?: number }) {
    const pointsRef = useRef<THREE.Points>(null);

    const geometry = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const colorPalette = PARTICLE_PALETTE.map(c => new THREE.Color(c));

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 12;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geo;
    }, [count]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
            pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
        }
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial
                size={0.06}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
            />
        </points>
    );
}

// Central glowing core
function CentralCore({ healthScore }: { healthScore: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
        }
        if (lightRef.current) {
            lightRef.current.intensity = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
        }
    });

    const intensity = healthScore / 100;

    return (
        <group>
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[0.3, 1]} />
                <meshStandardMaterial
                    color="#FFFFFF"
                    emissive={BRAND_GRADIENT.PRIMARY}
                    emissiveIntensity={intensity * 2}
                    roughness={0.1}
                    metalness={0.9}
                />
            </mesh>
            <pointLight
                ref={lightRef}
                color={BRAND_GRADIENT.PRIMARY}
                intensity={intensity * 2}
                distance={5}
                decay={2}
            />
        </group>
    );
}

// Main scene
function Scene({ members, connections, healthScore, onHover, isMobile }: {
    members: FamilyMember[];
    connections: Connection[];
    healthScore: number;
    onHover: (name: string | null) => void;
    isMobile: boolean;
}) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const memberPositions = useMemo(() => {
        const map = new Map<string, THREE.Vector3>();
        members.forEach((m) => map.set(m.id, new THREE.Vector3(...m.position)));
        return map;
    }, [members]);

    const handleHover = (id: string | null) => {
        setHoveredId(id);
        const name = id ? members.find(m => m.id === id)?.name || null : null;
        onHover(name);
    };

    // Reduce effects on mobile
    const particleCount = isMobile ? 50 : 200;
    const starCount = isMobile ? 500 : 3000;

    return (
        <>
            <GradientBackground />
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={0.5} />

            <AmbientParticles count={particleCount} />
            <CentralCore healthScore={healthScore} />
            <Stars radius={100} depth={50} count={starCount} factor={4} saturation={0} fade speed={1} />

            {connections.map((conn, i) => {
                const start = memberPositions.get(conn.from);
                const end = memberPositions.get(conn.to);
                if (!start || !end) return null;
                return <ConnectionLine key={i} start={start} end={end} strength={conn.strength} />;
            })}

            {members.map((member) => (
                <FamilyNode
                    key={member.id}
                    member={member}
                    isHovered={hoveredId === member.id}
                    onHover={handleHover}
                />
            ))}

            <OrbitControls
                enablePan={false}
                enableZoom={true}
                enableRotate={true}
                minDistance={3}
                maxDistance={10}
                autoRotate
                autoRotateSpeed={isMobile ? 0.1 : 0.3}
                enableDamping={!isMobile} // Disable damping on mobile for better performance
            />
        </>
    );
}

// Default data - re-export from theme for backwards compatibility
const defaultMembers: FamilyMember[] = DEFAULT_MEMBERS.map(m => ({ ...m }));
const defaultConnections: Connection[] = DEFAULT_CONNECTIONS.map(c => ({ ...c }));

// Hook to detect performance level
function usePerformanceLevel() {
    const isMobile = useIsMobile();
    const [isLowPower, setIsLowPower] = useState(false);

    useState(() => {
        // Check for low-power mode or reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
        const isTouchDevice = 'ontouchstart' in window;
        setIsLowPower(isMobile || prefersReducedMotion || isLowEndDevice || isTouchDevice);
    });

    return { isMobile: !!isMobile, isLowPower };
}

// Simplified 2D fallback for mobile/low-power
function FamilyNetworkFallback({ healthScore }: { healthScore: number }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20">
            <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">👨‍👩‍👧‍👦</div>
                <div className="text-2xl font-bold text-white mb-2">{healthScore}%</div>
                <div className="text-white/60">Family Connection</div>
                <div className="mt-4 flex justify-center gap-2">
                    {['🧠', '💖', '🧘', '👵👦', '🌱'].map((emoji, i) => (
                        <span key={i} className="text-2xl" style={{ animationDelay: `${i * 0.2}s` }}>{emoji}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Main component
export const FamilyNetwork3D: React.FC<FamilyNetwork3DProps> = ({
    members = defaultMembers,
    connections = defaultConnections,
    healthScore = 85,
}) => {
    const [hoveredName, setHoveredName] = useState<string | null>(null);
    const { isMobile, isLowPower } = usePerformanceLevel();

    // Use fallback for low-power devices
    if (isLowPower) {
        return (
            <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden">
                <FamilyNetworkFallback healthScore={healthScore} />
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden relative bg-black">
            <Canvas
                camera={{ position: [0, 0, 5.5], fov: 50 }}
                dpr={isMobile ? 1 : [1, 2]} // Limit DPR on mobile
                gl={{
                    antialias: !isMobile, // Disable AA on mobile
                    alpha: false,
                    powerPreference: isMobile ? "low-power" : "high-performance"
                }}
                frameloop={isMobile ? "demand" : "always"} // Only render on demand for mobile
            >
                <Scene
                    members={members}
                    connections={connections}
                    healthScore={healthScore}
                    onHover={setHoveredName}
                    isMobile={isMobile}
                />
            </Canvas>

            {/* Hover tooltip */}
            {hoveredName && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-2 border border-white/20 text-white font-medium text-lg animate-in fade-in zoom-in duration-200">
                        {hoveredName}
                    </div>
                </div>
            )}

            {/* Health score overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full px-5 py-2 border border-white/10 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-medium text-sm">{healthScore}% Connected</span>
            </div>

            {/* Interaction hint */}
            <div className="absolute top-4 right-4 text-white/40 text-xs bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/5">
                Drag to rotate • Scroll to zoom
            </div>
        </div>
    );
};

export default FamilyNetwork3D;
