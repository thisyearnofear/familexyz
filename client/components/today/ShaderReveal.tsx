'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const vertexShader = `
varying vec2 vUv;
uniform float uTime;
uniform float uProgress;
void main() {
  vUv = uv;
  vec3 pos = position;
  float dist = distance(uv, vec2(0.5));
  float wave = sin(dist * 40.0 - uTime * 8.0) * 0.008 * uProgress;
  wave *= smoothstep(0.8, 0.0, dist);
  pos.z += wave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform float uProgress;
uniform vec3 uColor;
uniform vec2 uCenter;
uniform float uTime;
float ring(float dist, float radius, float width) {
  return 1.0 - smoothstep(radius - width, radius + width, dist);
}
void main() {
  vec2 uv = vUv;
  float dist = distance(uv, uCenter);
  float maxDist = 1.5;
  float fadeIn = smoothstep(0.0, 0.15, uProgress);
  float fadeOut = 1.0 - smoothstep(0.6, 1.0, uProgress);
  float alpha = fadeIn * fadeOut;
  float rippleRadius = uProgress * maxDist * 0.7;
  float ripple = ring(dist, rippleRadius, 0.04);
  float ripple2 = ring(dist, rippleRadius * 0.6, 0.02) * 0.5;
  float pulse = sin(-dist * 30.0 + uTime * 6.0) * 0.5 + 0.5;
  float glow = exp(-dist * 4.0) * smoothstep(0.3, 0.0, dist);
  vec3 color = uColor;
  color += vec3(0.3) * pulse * (1.0 - dist) * 0.3;
  color = mix(color, vec3(1.0), glow * 0.3);
  color *= 0.7 + 0.3 * (1.0 - dist / maxDist);
  float finalAlpha = (ripple * 0.6 + ripple2 * 0.3 + glow * 0.4) * alpha * 0.7;
  gl_FragColor = vec4(color, finalAlpha);
}
`;

export interface ShaderRevealHandle {
  trigger: (x: number, y: number, color: string) => void;
}

export const ShaderReveal = forwardRef<ShaderRevealHandle, object>((_props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialised = useRef(false);

  const getScene = useCallback(() => {
    if (initialised.current) return;
    initialised.current = true;

    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color('#7c3aed') },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, uniforms,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let animId = 0;
    let isAnimating = false;

    function render() {
      if (!isAnimating) return;
      uniforms.uTime.value += 0.016;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    }

    const handleResize = () => renderer.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', handleResize);

    (ref as React.MutableRefObject<ShaderRevealHandle>).current = {
      trigger: (x: number, y: number, color: string) => {
        gsap.killTweensOf(uniforms.uProgress);
        uniforms.uCenter.value.set(x / window.innerWidth, 1.0 - y / window.innerHeight);
        uniforms.uColor.value.set(color);
        uniforms.uProgress.value = 0;
        uniforms.uTime.value = 0;

        if (!isAnimating) {
          isAnimating = true;
          render();
        }

        gsap.to(uniforms.uProgress, {
          value: 1, duration: 1.8, ease: 'power2.inOut',
          onComplete: () => {
            gsap.delayedCall(0.3, () => {
              isAnimating = false;
              if (animId) { cancelAnimationFrame(animId); animId = 0; }
            });
          },
        });
      },
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      isAnimating = false;
      if (animId) cancelAnimationFrame(animId);
      renderer.dispose();
      mesh.geometry.dispose();
      material.dispose();
    };
  }, [ref]);

  useEffect(() => {
    const cleanup = getScene();
    return () => cleanup?.();
  }, [getScene]);

  useImperativeHandle(ref, () => ({
    trigger: (x: number, y: number, color: string) => {
      getScene();
      const h = (ref as React.MutableRefObject<ShaderRevealHandle>).current;
      h?.trigger(x, y, color);
    },
  }), [getScene, ref]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
});

ShaderReveal.displayName = 'ShaderReveal';
