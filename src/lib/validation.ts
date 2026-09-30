import { z } from "zod";
const short = (min = 1, max = 120) => z.string().trim().min(min, `Cần ít nhất ${min} ký tự.`).max(max, `Tối đa ${max} ký tự.`);
const list = z.array(short(1, 40)).max(20).transform(items => [...new Set(items)]);
const commitment = z.enum(["high", "medium", "flexible"]);
const uuid = z.string().uuid("ID không hợp lệ.");
const safeUrl = z.string().trim().max(500).refine(value => { if (!value) return true; try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; } }, "Link phải bắt đầu bằng https:// hoặc http://.");
export const profileSchema = z.object({ full_name: short(2, 80), university: short(0, 120), major: short(0, 120), bio: short(0, 1000), skills: list, desired_roles: list, commitment, experience: short(0, 1500), portfolio_url: safeUrl });
export const roleSchema = z.object({ name: short(2, 60), skills: z.array(short(1,40)).min(1).max(20), slots: z.number().int().min(1).max(9) });
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("profile"), profile: profileSchema }),
  z.object({ type: z.literal("create-team"), competition_id: uuid, name: short(2, 80), description: short(20, 2000), commitment, roles: z.array(roleSchema).min(1).max(9) }),
  z.object({ type: z.literal("edit-team"), team_id: uuid, name: short(2, 80), description: short(20, 2000), status: z.enum(["open", "recruiting", "closed"]) }),
  z.object({ type: z.literal("apply"), team_id: uuid, role_id: uuid, message: short(20, 1500) }),
  z.object({ type: z.literal("review"), application_id: uuid, decision: z.enum(["accepted", "rejected"]) }),
  z.object({ type: z.literal("withdraw"), application_id: uuid }),
  z.object({ type: z.literal("save"), kind: z.enum(["team", "competition"]), target_id: uuid, saved: z.boolean() }),
]);
export type Command = z.infer<typeof commandSchema>;
export const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(128) });
export const splitList = (value: FormDataEntryValue | null) => String(value || "").split(",").map(x => x.trim()).filter(Boolean);
