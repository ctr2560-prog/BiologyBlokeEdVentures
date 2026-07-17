import Image from "next/image";

/**
 * Edventra brand mark.
 *
 * variant="white"   — full horizontal wordmark PNG (white on transparent) for
 *                     dark surfaces: sidebar, mobile drawer, dark login panels.
 * variant="default" — text-only wordmark for light surfaces (mobile top bar)
 *                     until a dark-coloured PNG is available.
 */
export function Logo({
  size = 44,
  variant = "default",
  withWordmark = false,
}: {
  size?: number;
  variant?: "default" | "white";
  withWordmark?: boolean;
}) {
  if (variant === "white") {
    // Full horizontal wordmark — tight-cropped transparent PNG, ≈4.12:1 ratio.
    // size is the rendered height; width scales proportionally.
    const h = size;
    const w = Math.round(h * 4.12);
    return (
      <Image
        src="/edventra-white-v2.png"
        alt="Edventra"
        width={w}
        height={h}
        className="object-contain"
        priority
        style={{ height: h, width: "auto" }}
      />
    );
  }

  // Light-surface fallback: styled text wordmark
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Edventra"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      {withWordmark && (
        <span className="display text-base font-bold leading-none tracking-tight text-forest-900">
          Edventra
          <span className="block text-[0.6rem] font-semibold tracking-[0.18em] uppercase text-forest-500">
            by The Biology Bloke
          </span>
        </span>
      )}
    </span>
  );
}
