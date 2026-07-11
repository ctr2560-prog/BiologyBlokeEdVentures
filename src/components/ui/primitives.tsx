"use client";
/*
 * Small reusable primitives: Button, Badge, ProgressBar, StatCard, EmptyState,
 * Modal, FormField, SearchFilterBar. Cohesive, rounded, nature-toned.
 */
import { useEffect, type ReactNode } from "react";
import { Sprout, X, type LucideIcon } from "lucide-react";

// ---- Button ----
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all focus-visible:outline-forest-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3.5 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-forest-700 text-cream shadow-soft hover:bg-forest-800 hover:shadow-lift active:translate-y-px",
    secondary:
      "bg-cream text-forest-800 ring-1 ring-sand-dark hover:bg-cream-dark",
    ghost: "text-forest-700 hover:bg-forest-50",
    danger: "bg-clay-500 text-cream hover:bg-clay-600",
  };
  return (
    <button
      type={type}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---- Badge / Pill ----
export function Badge({
  children,
  tone = "forest",
  className = "",
}: {
  children: ReactNode;
  tone?: "forest" | "sand" | "clay" | "mist" | "gold" | "neutral";
  className?: string;
}) {
  const tones = {
    forest: "bg-forest-100 text-forest-800",
    sand: "bg-sand text-clay-600",
    clay: "bg-clay-400/20 text-clay-600",
    mist: "bg-mist-100 text-mist-600",
    gold: "bg-gold-300/40 text-clay-600",
    neutral: "bg-charcoal/8 text-charcoal-soft",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// ---- ProgressBar ----
export function ProgressBar({
  value,
  tone = "forest",
  showLabel = false,
  height = 8,
}: {
  value: number;
  tone?: "forest" | "gold" | "mist" | "clay";
  showLabel?: boolean;
  height?: number;
}) {
  const colors = {
    forest: "bg-forest-600",
    gold: "bg-gold-500",
    mist: "bg-mist-500",
    clay: "bg-clay-500",
  };
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 overflow-hidden rounded-full bg-charcoal/8"
        style={{ height }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`grow-bar h-full rounded-full ${colors[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 text-right text-xs font-semibold text-charcoal-soft">
          {clamped}%
        </span>
      )}
    </div>
  );
}

// ---- StatCard ----
export function StatCard({
  label,
  value,
  sublabel,
  icon,
  tone = "forest",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  tone?: "forest" | "gold" | "mist" | "clay";
}) {
  const accents = {
    forest: "text-forest-700 bg-forest-50",
    gold: "text-clay-600 bg-gold-300/30",
    mist: "text-mist-600 bg-mist-100",
    clay: "text-clay-600 bg-clay-400/15",
  };
  return (
    <div className="card-lift rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-charcoal-soft">{label}</p>
        {icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-2xl ${accents[tone]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="display mt-2 text-3xl font-bold text-charcoal">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-charcoal-soft">{sublabel}</p>}
    </div>
  );
}

// ---- EmptyState ----
export function EmptyState({
  Icon = Sprout,
  title,
  message,
  action,
}: {
  Icon?: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-sand-dark bg-cream/50 p-12 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest-50 text-forest-600">
        <Icon className="h-7 w-7" aria-hidden strokeWidth={1.75} />
      </div>
      <h3 className="display mt-4 text-lg font-semibold text-forest-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-charcoal-soft">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---- Modal ----
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-forest-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`rise-in relative z-10 w-full ${maxWidth} rounded-3xl bg-cream p-6 shadow-hero`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-xl font-bold text-forest-900">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full text-charcoal-soft hover:bg-charcoal/8"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---- FormField ----
export function FormField({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-forest-900">
        {label}
        {required && <span className="text-clay-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-charcoal-soft">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-sand-dark bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal-soft/60 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/30";

// ---- Section header ----
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="display text-2xl font-bold text-forest-900 md:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-charcoal-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
