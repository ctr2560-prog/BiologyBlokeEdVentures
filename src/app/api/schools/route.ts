import { NextRequest, NextResponse } from "next/server";

type NominatimResult = {
  name: string;
  class: string;
  type: string;
  address: Record<string, string>;
};

type SchoolResult = { name: string; suburb: string; state: string };

// Known school-related terms — if the query already contains one, don't append "school"
const SCHOOL_TERMS = /school|college|academy|grammar|institute|high|primary|junior|senior|tafe/i;

function bestSuburb(address: Record<string, string>): string {
  return (
    address.suburb ??
    address.quarter ??
    address.neighbourhood ??
    address.city_district ??
    address.town ??
    address.village ??
    address.hamlet ??
    address.city ??
    ""
  );
}

function abbreviateState(state: string): string {
  const map: Record<string, string> = {
    "New South Wales": "NSW",
    Victoria: "VIC",
    Queensland: "QLD",
    "South Australia": "SA",
    "Western Australia": "WA",
    Tasmania: "TAS",
    "Australian Capital Territory": "ACT",
    "Northern Territory": "NT",
  };
  return map[state] ?? state;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const query = SCHOOL_TERMS.test(q) ? q : `${q} school`;

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&countrycodes=au` +
      `&format=json` +
      `&addressdetails=1` +
      `&limit=12`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "BiologyBlokeEdventures/1.0 (ctr2560@gmail.com)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const raw: NominatimResult[] = await res.json();

    // Filter to schools / education amenities and deduplicate by name+state
    const seen = new Set<string>();
    const schools: SchoolResult[] = [];

    for (const r of raw) {
      if (r.class !== "amenity" || !["school", "college", "university"].includes(r.type)) {
        continue;
      }
      if (!r.name) continue;

      const suburb = bestSuburb(r.address);
      const state = abbreviateState(r.address.state ?? "");
      const key = `${r.name.toLowerCase()}|${state}`;

      if (seen.has(key)) continue;
      seen.add(key);

      schools.push({ name: r.name, suburb, state });
    }

    return NextResponse.json(schools.slice(0, 8));
  } catch {
    return NextResponse.json([]);
  }
}
