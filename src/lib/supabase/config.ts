export const isDemo = process.env.NEXT_PUBLIC_DATA_MODE !== "supabase";
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Thiếu cấu hình Supabase. Kiểm tra .env.local.");
  if (!/^https?:\/\//.test(url)) throw new Error("Supabase URL không hợp lệ.");
  return { url, key };
}
