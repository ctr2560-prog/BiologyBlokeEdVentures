"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Trash2 } from "lucide-react";

const COLOURS = [
  { hex: "#1a1a1a", label: "Black" },
  { hex: "#2d6a4f", label: "Forest" },
  { hex: "#c44b30", label: "Clay" },
  { hex: "#d4a84b", label: "Gold" },
  { hex: "#4b8fd4", label: "Sky" },
];

const SIZES = [
  { label: "S", px: 2 },
  { label: "M", px: 5 },
  { label: "L", px: 12 },
];

export function DrawingCanvas({
  value,
  backgroundImageUrl,
  onChange,
  disabled,
  prompt,
}: {
  value?: string;
  backgroundImageUrl?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
  prompt?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const composite = useRef<string>(value ?? "");

  const [colour, setColour] = useState(COLOURS[0].hex);
  const [sizeIdx, setSizeIdx] = useState(1);
  const [eraser, setEraser] = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const applyTool = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = eraser ? "#ffffff" : colour;
      ctx.lineWidth = eraser ? 20 : SIZES[sizeIdx].px;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    },
    [colour, sizeIdx, eraser]
  );

  // Draw an image (bg or saved state) onto the canvas
  const drawImage = useCallback((src: string, ctx: CanvasRenderingContext2D) => {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
    img.src = src;
  }, []);

  // Initialise canvas once sized
  const initCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (backgroundImageUrl) drawImage(backgroundImageUrl, ctx);
      if (composite.current) drawImage(composite.current, ctx);
    },
    [backgroundImageUrl, drawImage]
  );

  // ResizeObserver — keep canvas pixel dims in sync with layout dims
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      initCanvas(canvas);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [initCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = getCtx();
    if (!ctx) return;
    applyTool(ctx);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const dataUrl = canvasRef.current?.toDataURL() ?? "";
    composite.current = dataUrl;
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (backgroundImageUrl) drawImage(backgroundImageUrl, ctx);
    composite.current = canvas.toDataURL();
    onChange(composite.current);
  };

  return (
    <div className="space-y-3">
      {prompt && <p className="font-semibold text-forest-900">{prompt}</p>}

      {!disabled && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream px-4 py-2.5 ring-1 ring-sand-dark">
          {/* Colour swatches */}
          <div className="flex items-center gap-1.5">
            {COLOURS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                onClick={() => { setEraser(false); setColour(c.hex); }}
                className={`h-6 w-6 rounded-full transition ${
                  colour === c.hex && !eraser
                    ? "ring-2 ring-offset-1 ring-charcoal"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-sand-dark" />

          {/* Brush size */}
          <div className="flex items-center gap-1">
            {SIZES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => { setEraser(false); setSizeIdx(i); }}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                  sizeIdx === i && !eraser
                    ? "bg-charcoal text-cream"
                    : "text-charcoal-soft hover:bg-sand"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-sand-dark" />

          {/* Eraser */}
          <button
            type="button"
            onClick={() => setEraser((e) => !e)}
            title="Eraser"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              eraser
                ? "bg-charcoal text-cream"
                : "text-charcoal-soft hover:bg-sand"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" /> Eraser
          </button>

          <div className="h-4 w-px bg-sand-dark" />

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            title="Clear canvas"
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-charcoal-soft transition hover:bg-clay-50 hover:text-clay-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl ring-2 ring-sand-dark"
        style={{ cursor: disabled ? "default" : "crosshair", height: 360 }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full touch-none"
          style={{ height: "100%" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {disabled && value && (
        <p className="text-center text-xs text-charcoal-soft">Drawing submitted</p>
      )}
    </div>
  );
}
