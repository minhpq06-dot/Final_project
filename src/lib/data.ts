import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData, Bootstrap } from "./types";
import { initialDemo, demoId } from "./demo";
import { isDemo } from "./supabase/config";
import { createClient } from "./supabase/server";
export async function readData(supabase: SupabaseClient): Promise<AppData> {
  // ponytail: MVP loads at most 1,000 rows/table; move filtering and pagination to SQL before larger launches.
  const tables = ["profiles", "competitions", "teams", "team_roles", "applications", "team_members", "saved_items"] as const;
  const results = await Promise.all(tables.map(table => supabase.from(table).select("*").limit(1000)));
  for (const result of results) if (result.error) throw new Error("Không tải được dữ liệu. Kiểm tra migration Supabase và kết nối mạng.");
  return Object.fromEntries(tables.map((table, i) => [table, results[i].data ?? []])) as AppData;
}
export async function bootstrap(): Promise<Bootstrap> {
  if (isDemo) return { mode: "demo", userId: demoId(1), data: initialDemo() };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { mode: "supabase", userId: data?.claims?.sub ?? null, data: await readData(supabase) };
}
