"use server";
import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/supabase/config";
import { commandSchema } from "@/lib/validation";
import { readData } from "@/lib/data";
import type { AppData } from "@/lib/types";
export async function mutate(raw: unknown): Promise<{ ok: true; data: AppData; id?: string } | { ok: false; error: string }> {
  if (isDemo) return { ok: false, error: "Demo không ghi dữ liệu lên máy chủ." };
  const parsed = commandSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try {
    const db = await createClient();
    const { data: auth, error: authError } = await db.auth.getClaims();
    const userId = auth?.claims?.sub;
    if (authError || !userId) return { ok: false, error: "Phiên đăng nhập hết hạn. Đăng nhập lại để tiếp tục." };
    const cmd = parsed.data;
    let result;
    if (cmd.type === "profile") result = await db.from("profiles").update(cmd.profile).eq("id", userId);
    if (cmd.type === "create-team") result = await db.rpc("create_team", { p_competition: cmd.competition_id, p_name: cmd.name, p_description: cmd.description, p_commitment: cmd.commitment, p_roles: cmd.roles });
    if (cmd.type === "edit-team") result = await db.rpc("edit_team", { p_team: cmd.team_id, p_name: cmd.name, p_description: cmd.description, p_status: cmd.status });
    if (cmd.type === "apply") result = await db.rpc("apply_to_team", { p_team: cmd.team_id, p_role: cmd.role_id, p_message: cmd.message });
    if (cmd.type === "review") result = await db.rpc("review_application", { p_application: cmd.application_id, p_decision: cmd.decision });
    if (cmd.type === "withdraw") result = await db.rpc("withdraw_application", { p_application: cmd.application_id });
    if (cmd.type === "save") {
      const column = cmd.kind === "team" ? "team_id" : "competition_id";
      result = cmd.saved ? await db.from("saved_items").upsert({ user_id: userId, [column]: cmd.target_id }, { onConflict: `user_id,${column}`, ignoreDuplicates: true }) : await db.from("saved_items").delete().eq("user_id", userId).eq(column, cmd.target_id);
    }
    if (result?.error) {
      const message = result.error.code === "P0001" ? result.error.message : result.error.code === "23505" ? "Bạn đã gửi đơn hoặc đã thuộc đội trong cuộc thi này." : "Không lưu được thay đổi. Kiểm tra dữ liệu và quyền truy cập.";
      return { ok: false, error: message };
    }
    return { ok: true, data: await readData(db), id: cmd.type === "create-team" ? result?.data as string : undefined };
  } catch { return { ok: false, error: "Kết nối thất bại. Tải lại trang trước khi thử lại để kiểm tra thay đổi đã lưu." }; }
}
