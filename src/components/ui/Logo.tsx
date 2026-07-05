import Image from "next/image";

/**
 * The Biology Bloke wordmark logo. `variant="white"` uses the transparent
 * white line-art (for dark/photographic backgrounds); default uses the
 * standard logo for light backgrounds.
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
  const src = variant === "white" ? "/logo-white.png" : "/logo.png";
  return (
    <span className="inline-flex items-center gap-3">
      <Image
        src={src}
        alt="The Biology Bloke logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      {withWordmark && (
        <span
          className={`display text-lg font-semibold leading-tight ${
            variant === "white" ? "text-cream" : "text-forest-900"
          }`}
        >
          BioBloke
          <span className="block text-[0.65rem] font-medium tracking-widest opacity-70">
            EDVENTURES
          </span>
        </span>
      )}
    </span>
  );
}
