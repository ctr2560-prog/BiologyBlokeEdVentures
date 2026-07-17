/**
 * Edventra loading indicator — the brand symbol animated as if the path is
 * being drawn on. The symbol is tinted with the current text colour, so set a
 * `text-*` class (or `tone`) to suit the surface: forest on light, cream on dark.
 */
export function BrandLoader({
  size = 72,
  tone = "forest",
  label,
  className = "",
}: {
  size?: number;
  tone?: "forest" | "cream";
  label?: string;
  className?: string;
}) {
  const toneClass = tone === "cream" ? "text-cream" : "text-forest-600";
  return (
    <div className={`flex flex-col items-center gap-4 ${toneClass} ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Faint full-symbol track it draws onto */}
        <span className="brand-symbol absolute inset-0 opacity-15" aria-hidden />
        {/* The stroke being drawn */}
        <span className="brand-symbol brand-symbol--draw absolute inset-0" aria-hidden />
      </div>
      {label && <p className="text-sm font-medium opacity-80">{label}</p>}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Full-screen branded loading screen — large symbol centred on brand green. */
export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "linear-gradient(160deg, #204535 0%, #2c5844 55%, #163329 100%)" }}
    >
      <BrandLoader tone="cream" size={150} label={label} />
    </div>
  );
}
