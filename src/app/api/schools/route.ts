import { NextRequest, NextResponse } from "next/server";

type SchoolResult = { name: string; suburb: string; state: string };

// data.gov.au CKAN API — ACARA school profiles dataset
// resource_id can be verified at: https://data.gov.au/dataset/acara-school-profile
const RESOURCE_ID = "34b1553e-4d7f-469f-b4c9-6d90b3e0bf7a";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  try {
    const url =
      `https://data.gov.au/api/3/action/datastore_search` +
      `?resource_id=${RESOURCE_ID}` +
      `&q=${encodeURIComponent(q)}` +
      `&limit=8`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`data.gov.au ${res.status}`);

    const body = await res.json();
    if (!body.success) throw new Error("CKAN returned success:false");

    const records: Record<string, string>[] = body.result?.records ?? [];

    const schools: SchoolResult[] = records
      .map((r) => ({
        name: r["School Name"] ?? r["school_name"] ?? r["name"] ?? "",
        suburb: r["Suburb"] ?? r["suburb"] ?? r["town_suburb"] ?? "",
        state: r["State"] ?? r["state"] ?? "",
      }))
      .filter((s) => s.name);

    return NextResponse.json(schools);
  } catch {
    // Gracefully return empty — the "Add school" fallback handles this
    return NextResponse.json([]);
  }
}
