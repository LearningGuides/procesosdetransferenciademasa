// src/components/P5Canvas.jsx
import { useEffect, useRef } from "react";

export default function P5Canvas({ sketch, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let instance;
    let cancelled = false;

    async function initialize() {
      const { default: p5 } = await import("p5");

      if (cancelled || !containerRef.current) return;

      instance = new p5(sketch, containerRef.current);
    }

    initialize();

    return () => {
      cancelled = true;

      if (instance) {
        instance.remove();
      }
    };
  }, [sketch]);

  return (
    <div
      ref={containerRef}
      className={`p5-container ${className}`}
    />
  );
}