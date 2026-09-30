"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import type { AppData, Bootstrap } from "@/lib/types";
import { commandSchema, type Command } from "@/lib/validation";
import { applyDemo } from "@/lib/domain";
import { initialDemo, demoId } from "@/lib/demo";
import { mutate } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
const storageKey = "casematch-demo-v2";
const entrySchema = z.object({ userId: z.string().uuid(), command: commandSchema, now: z.number().finite(), ids: z.array(z.string().uuid()).max(20) });
const storedSchema = z.object({ version: z.literal(1), userId: z.string().uuid().nullable(), entries: z.array(entrySchema).max(2000) });
type Stored = z.infer<typeof storedSchema>;
type Store = Bootstrap & { ready: boolean; busy: boolean; run: (cmd: Command) => Promise<{ ok: boolean; id?: string }>; switchUser: (id: string | null) => void; logout: () => Promise<void> };
const Context = createContext<Store | null>(null);
export function AppProvider({ initial, children }: { initial: Bootstrap; children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(initial.data);
  const [userId, setUserId] = useState(initial.userId);
  const [ready, setReady] = useState(initial.mode !== "demo");
  const [busy, setBusy] = useState(false);
  const journal = useRef<Stored>({ version: 1, userId: demoId(1), entries: [] });
  const locked = useRef(false);
  const router = useRouter();
  useEffect(() => {
    if (initial.mode !== "demo") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = storedSchema.parse(JSON.parse(raw));
        let loaded = initialDemo();
        for (const entry of parsed.entries) {
          let cursor = 0;
          loaded = applyDemo(loaded, entry.userId, entry.command, entry.now, () => {
            const id = entry.ids[cursor++];
            if (!id) throw new Error("Bản lưu thiếu ID.");
            return id;
          }).data;
        }
        if (parsed.userId && !loaded.profiles.some(p => p.id === parsed.userId)) throw new Error("Tài khoản không hợp lệ");
        journal.current = parsed;
        // External localStorage snapshot is loaded only after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData(loaded); setUserId(parsed.userId);
      }
    } catch { toast.error("Không đọc được bản lưu demo. Bản gốc chưa bị ghi đè; các thay đổi mới sẽ thay thế bản lỗi."); }
    setReady(true);
  }, [initial.mode]);
  const switchUser = (id: string | null) => {
    if (initial.mode !== "demo" || !ready || busy || (id && !data.profiles.some(p => p.id === id))) return;
    try { const next = { ...journal.current, userId: id }; localStorage.setItem(storageKey, JSON.stringify(next)); journal.current = next; setUserId(id); }
    catch { toast.error("Không lưu được phiên demo. Kiểm tra quyền lưu trữ của trình duyệt."); }
  };
  const run = async (command: Command) => {
    if (locked.current || !ready) return { ok: false };
    const parsed = commandSchema.safeParse(command);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return { ok: false }; }
    if (!userId) { toast.error("Đăng nhập để tiếp tục."); router.push("/login"); return { ok: false }; }
    locked.current = true; setBusy(true);
    try {
      if (initial.mode === "demo") {
        if (journal.current.entries.length >= 2000) throw new Error("Demo đạt giới hạn 2.000 thao tác. Dùng Supabase cho dữ liệu lâu dài.");
        const now = Date.now();
        const ids: string[] = [];
        const result = applyDemo(data, userId, parsed.data, now, () => { const id = crypto.randomUUID(); ids.push(id); return id; });
        // ponytail: demo persists replayable commands in one browser; Supabase provides cross-device persistence.
        const entry = { userId, command: parsed.data, now, ids };
        const next = { ...journal.current, entries: [...journal.current.entries, entry] };
        localStorage.setItem(storageKey, JSON.stringify(next)); journal.current = next;
        setData(result.data); toast.success("Đã lưu trên trình duyệt demo."); return { ok: true, id: result.id };
      }
      const result = await mutate(parsed.data);
      if (!result.ok) { toast.error(result.error); return { ok: false }; }
      setData(result.data); toast.success("Đã lưu thay đổi."); return { ok: true, id: result.id };
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không lưu được thay đổi."); return { ok: false }; }
    finally { locked.current = false; setBusy(false); }
  };
  const logout = async () => {
    if (initial.mode === "demo") switchUser(null);
    else { const { error } = await createClient().auth.signOut(); if (error) { toast.error("Đăng xuất thất bại. Thử lại."); return; } router.replace("/login"); router.refresh(); }
  };
  return <Context.Provider value={{ mode: initial.mode, userId, data, ready, busy, run, switchUser, logout }}>{children}</Context.Provider>;
}
export function useApp() { const context = useContext(Context); if (!context) throw new Error("AppProvider missing"); return context; }
