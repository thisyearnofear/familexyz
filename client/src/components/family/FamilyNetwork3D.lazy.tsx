import React, { Suspense, lazy, useState, useRef, useEffect, useCallback } from "react";
import type { FamilyNetwork3DProps } from "./FamilyNetwork3D";
import { DEFAULT_MEMBERS, DEFAULT_CONNECTIONS, BRAND_GRADIENT } from "@/lib/theme";
import { Maximize2 } from "lucide-react";

// Lazy load Three.js component — only when user opts in
const FamilyNetwork3DComponent = lazy(() => import("./FamilyNetwork3D"));

/**
 * Lightweight Canvas2D family network visualization.
 * Renders immediately with zero heavy deps. Reuses theme constants (DRY).
 */
function FamilyNetworkCanvas2D({ healthScore = 85 }: { healthScore: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const draw = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const scale = Math.min(w, h) / 5;

        // Background
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, w, h);

        // Subtle radial glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 2.5);
        grad.addColorStop(0, `${BRAND_GRADIENT.PRIMARY}15`);
        grad.addColorStop(0.5, `${BRAND_GRADIENT.SECONDARY}08`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const members = DEFAULT_MEMBERS.map((m, i) => ({
            ...m,
            x: cx + m.position[0] * scale,
            y: cy + m.position[1] * scale + Math.sin(t * 0.8 + i) * 4,
        }));
        const memberMap = new Map(members.map(m => [m.id, m]));

        // Connections
        for (const conn of DEFAULT_CONNECTIONS) {
            const from = memberMap.get(conn.from);
            const to = memberMap.get(conn.to);
            if (!from || !to) continue;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2 - 15;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.quadraticCurveTo(midX, midY, to.x, to.y);
            ctx.strokeStyle = `${BRAND_GRADIENT.PRIMARY}${Math.round(conn.strength * 40).toString(16).padStart(2, "0")}`;
            ctx.lineWidth = conn.strength * 2;
            ctx.stroke();
        }

        // Central core pulse
        const pulse = 1 + Math.sin(t * 2) * 0.15;
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * pulse);
        coreGrad.addColorStop(0, `${BRAND_GRADIENT.PRIMARY}cc`);
        coreGrad.addColorStop(1, "transparent");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Member nodes
        for (const m of members) {
            const r = m.size * scale * 0.35;
            // Glow
            const glow = ctx.createRadialGradient(m.x, m.y, r * 0.5, m.x, m.y, r * 2.5);
            glow.addColorStop(0, `${m.color}40`);
            glow.addColorStop(1, "transparent");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(m.x, m.y, r * 2.5, 0, Math.PI * 2);
            ctx.fill();
            // Node
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
            ctx.fill();
            // Label
            ctx.fillStyle = "rgba(255,255,255,0.7)";
            ctx.font = `${Math.round(10 * (w / 400))}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(m.name, m.x, m.y + r + 14);
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio, 2);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            // Immediately draw after resize so we don't flash blank
            draw(ctx, performance.now() / 1000);
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        let running = true;
        const loop = () => {
            if (!running) return;
            const rect = canvas.getBoundingClientRect();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const dpr = Math.min(window.devicePixelRatio, 2);
            ctx.scale(dpr, dpr);
            draw(ctx, performance.now() / 1000);
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);

        return () => {
            running = false;
            cancelAnimationFrame(animRef.current);
            ro.disconnect();
        };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: "block" }}
        />
    );
}

/**
 * Primary family network visualization.
 * Renders lightweight Canvas2D by default. Three.js 3D mode loads on demand.
 */
export const FamilyNetwork3DLazy: React.FC<FamilyNetwork3DProps> = (props) => {
    const [show3D, setShow3D] = useState(false);
    const healthScore = props.healthScore ?? 85;

    return (
        <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden relative bg-black">
            {show3D ? (
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                }>
                    <FamilyNetwork3DComponent {...props} />
                </Suspense>
            ) : (
                <FamilyNetworkCanvas2D healthScore={healthScore} />
            )}

            {/* Health score overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full px-5 py-2 border border-white/10 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-medium text-sm">{healthScore}% Connected</span>
            </div>

            {/* 3D toggle */}
            {!show3D && (
                <button
                    onClick={() => setShow3D(true)}
                    className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10 text-white/60 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
                >
                    <Maximize2 className="w-3 h-3" />
                    View in 3D
                </button>
            )}
        </div>
    );
};

export default FamilyNetwork3DLazy;
