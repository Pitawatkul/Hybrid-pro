import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Real per-request auth check (not just the cookie-based optimistic check in
// src/proxy.ts). getUser() contacts the Supabase Auth server, so this is safe
// to use for authorization decisions. cache() dedupes it within one render pass.
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email ?? null };
});
