import React, { useEffect, useRef } from 'react';

/**
 * InkSpreadBackground:
 * Signature GENIUS SKILLS dark graphite environment with soft silver/gray liquid ink
 * illumination spreading across the surface. Smooth spring/lerp cursor interpolation,
 * ambient slow-moving luminous nodes, and accessible fallback for prefers-reduced-motion.
 */
export const InkSpreadBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with smooth lerp
    let mouse = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      radius: isMobile ? 180 : 320,
      active: false,
    };

      // Ambient ink nodes that slowly pulse and drift (Silver/Graphite metallic nodes)
      const nodes = [
        { x: width * 0.15, y: height * 0.2, vx: 0.12, vy: 0.05, r: 500, alpha: 0.06 },
        { x: width * 0.85, y: height * 0.35, vx: -0.08, vy: 0.07, r: 600, alpha: 0.05 },
        { x: width * 0.35, y: height * 0.75, vx: 0.05, vy: -0.06, r: 550, alpha: 0.04 },
        { x: width * 0.65, y: height * 0.85, vx: -0.06, vy: -0.04, r: 480, alpha: 0.045 },
      ];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    window.addEventListener('resize', handleResize);
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    let time = 0;

    const render = () => {
      time += 0.008;

      // Dark graphite base coat with subtle gradient
      ctx.fillStyle = '#07080a';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw subtle ambient drifting ink pools
      for (const node of nodes) {
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < width * 0.1 || node.x > width * 0.9) node.vx *= -1;
          if (node.y < height * 0.1 || node.y > height * 0.9) node.vy *= -1;
        }

        const pulse = 1 + Math.sin(time + node.x * 0.002) * 0.08;
        const radius = node.r * pulse;

        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
        grad.addColorStop(0, `rgba(255, 255, 255, ${node.alpha * 1.5})`);
        grad.addColorStop(0.3, `rgba(220, 225, 235, ${node.alpha * 0.9})`);
        grad.addColorStop(0.6, `rgba(140, 150, 170, ${node.alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(8, 9, 10, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Mouse-responsive liquid ink spread (desktop lerp interpolation)
      if (!isMobile && !prefersReducedMotion) {
        // Lerp coordinates: current += (target - current) * 0.045
        mouse.x += (mouse.targetX - mouse.x) * 0.045;
        mouse.y += (mouse.targetY - mouse.y) * 0.045;

        // Dynamic breath / liquid spread
        const dynamicRadius = mouse.radius + Math.sin(time * 2) * 15;

        const mouseGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          dynamicRadius
        );
        mouseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.075)');
        mouseGrad.addColorStop(0.35, 'rgba(230, 235, 245, 0.045)');
        mouseGrad.addColorStop(0.7, 'rgba(180, 190, 205, 0.015)');
        mouseGrad.addColorStop(1, 'rgba(7, 8, 10, 0)');

        ctx.fillStyle = mouseGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, dynamicRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Subtle vignette overlay
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.4,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, 'rgba(7, 8, 10, 0)');
      vignette.addColorStop(1, 'rgba(5, 6, 8, 0.65)');

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.95 }}
      aria-hidden="true"
    />
  );
};
