/**
 * Creates Supabase auth accounts for admin and demo teachers, then links them
 * to the existing public.users rows via auth_id.
 *
 * Run once after you've executed schema.sql + rls.sql + seed.sql:
 *
 *   npx tsx supabase/seed-auth.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Map: public.users.id → email + temp password
// CHANGE THESE PASSWORDS before sharing with anyone.
const authAccounts = [
  { publicId: "admin-bloke",    email: "thebiologybloke@gmail.com",        password: "BioBloke2024!" },
  { publicId: "teacher-jones",  email: "jones@srhs.nsw.edu.au",            password: "Teacher2024!" },
  { publicId: "teacher-patel",  email: "patel@srhs.nsw.edu.au",            password: "Teacher2024!" },
  { publicId: "teacher-nguyen", email: "nguyen@coastalridge.nsw.edu.au",   password: "Teacher2024!" },
];

async function main() {
  for (const account of authAccounts) {
    // Create or look up the auth user.
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });

    if (error && !error.message.includes("already been registered")) {
      console.error(`Failed to create auth user for ${account.email}:`, error.message);
      continue;
    }

    const authId = data?.user?.id;
    if (!authId) {
      // User already exists — find them.
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === account.email);
      if (!existing) {
        console.error(`Could not resolve auth user for ${account.email}`);
        continue;
      }

      // Link to public.users.
      await supabase
        .from("users")
        .update({ auth_id: existing.id })
        .eq("id", account.publicId);

      console.log(`Linked existing auth user ${account.email} → ${account.publicId}`);
    } else {
      await supabase
        .from("users")
        .update({ auth_id: authId })
        .eq("id", account.publicId);

      console.log(`Created auth user ${account.email} → ${account.publicId} (${authId})`);
    }
  }

  console.log("\nDone. You can now sign in with the above credentials.");
}

main().catch(console.error);
