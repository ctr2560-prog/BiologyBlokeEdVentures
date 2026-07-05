"use client";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

/** Clean, responsive table with a card-like frame. */
export function DataTable<T>({
  columns,
  rows,
  keyOf,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-black/5">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-charcoal-soft ${
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyOf(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-sand/60 last:border-0 transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-forest-50/60" : ""
                }`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-5 py-3.5 text-charcoal ${
                      c.align === "right"
                        ? "text-right"
                        : c.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${c.className ?? ""}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
