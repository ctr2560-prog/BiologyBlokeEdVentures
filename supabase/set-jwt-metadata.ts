/**
 * Sets app_metadata and user_metadata on each teacher/admin auth user.
 *
 * app_metadata is signed into the JWT — read by RLS helper functions so they
 * don't need to query public.users (which would cause infinite recursion).
 *
 * user_metadata is also in the JWT and read by auth.ts after sign-in to build
 * the User object without any DB query.
 *
 *   npx tsx supabase/set-jwt-metadata.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const accounts = [
  {
    authId: "49f22256-8fdb-4002-97e9-efdd34f7a4fe",
    bbId: "admin-bloke",
    bbRole: "admin",
    bbName: "Cameron Rodgers",
    bbSchoolId: null,
  },
  {
    authId: "9be6bad5-435c-461c-9e48-9eb95b0becb3",
    bbId: "teacher-jones",
    bbRole: "teacher",
    bbName: "Ms Jones",
    bbSchoolId: "school-srhs",
  },
  {
    authId: "af8e661d-de2f-4762-a3a3-1c4c8bc5b4bb",
    bbId: "teacher-patel",
    bbRole: "teacher",
    bbName: "Mr Patel",
    bbSchoolId: "school-srhs",
  },
  {
    authId: "5cb28993-1c66-40e0-81b9-dfd1a5c88d33",
    bbId: "teacher-nguyen",
    bbRole: "teacher",
    bbName: "Ms Nguyen",
    bbSchoolId: "school-coastal",
  },
];

async function main() {
  for (const a of accounts) {
    const { error } = await sb.auth.admin.updateUserById(a.authId, {
      app_metadata: {
        bb_role: a.bbRole,
        bb_user_id: a.bbId,
        bb_school_id: a.bbSchoolId,
      },
      user_metadata: {
        bb_id: a.bbId,
        bb_role: a.bbRole,
        bb_name: a.bbName,
        bb_school_id: a.bbSchoolId,
      },
    });
    if (error) {
      console.error(`Failed to update ${a.bbId}:`, error.message);
    } else {
      console.log(`Updated ${a.bbId} (${a.bbRole})`);
    }
  }
  console.log("\nDone.");
}

main().catch(console.error);
