"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { ZodError } from "zod";
import type { AppData, LocalState } from "@/lib/types";
import type { Command } from "@/lib/validation";
import { applyCommand } from "@/lib/domain";
import {
  loadState,
  readState,
  saveState,
  signIn,
  storageKey,
} from "@/lib/storage";

type Result = { ok: boolean; id?: string; error?: string };
type Store = {
  data: AppData;
  userId: string | null;
  busy: boolean;
  run: (cmd: Command) => Promise<Result>;
  login: (email: string, name?: string) => Promise<Result>;
  logout: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
function errorMessage(error: unknown) {
  if (error instanceof ZodError) return error.issues[0].message;
  if (error instanceof DOMException)
    return "Không lưu được dữ liệu. Kiểm tra quyền lưu trữ và dung lượng trình duyệt.";
  return error instanceof Error ? error.message : "Không lưu được thay đổi.";
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocalState | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const load = () => {
      try {
        setState(loadState(localStorage));
      } catch {
        setStorageError(
          "Không đọc được bản lưu. Dữ liệu hiện có được giữ nguyên. Kiểm tra quyền lưu trữ hoặc phục hồi bản lưu trước khi tải lại.",
        );
      }
    };
    // Hydrate browser storage after the server/client loading placeholder matches.
    load();
    const sync = (event: StorageEvent) => {
      if (
        event.storageArea !== localStorage ||
        (event.key !== storageKey && event.key !== null)
      )
        return;
      try {
        setState(readState(localStorage));
        setStorageError(null);
      } catch {
        setStorageError(
          "Bản lưu đã bị xóa hoặc thay đổi không hợp lệ ở tab khác. Tải lại sau khi kiểm tra dữ liệu.",
        );
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (state && !state.session && path !== "/login") router.replace("/login");
    if (state?.session && path === "/login") router.replace("/");
  }, [state, path, router]);

  const update = async (
    change: (current: LocalState) => { state: LocalState; id?: string },
  ): Promise<Result> => {
    if (!state || storageError || locked.current) return { ok: false };
    locked.current = true;
    setBusy(true);
    try {
      const commit = () => {
        const result = change(readState(localStorage));
        const saved = saveState(localStorage, result.state);
        setState(saved);
        return { ok: true, id: result.id };
      };
      // ponytail: LocalStorage is scoped to one origin/device; server storage is needed for shared accounts.
      return navigator.locks
        ? await navigator.locks.request(storageKey, commit)
        : commit();
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      return { ok: false, error: message };
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const run = async (command: Command) => {
    const result = await update((current) => {
      if (!current.session || current.session.userId !== state?.session?.userId)
        throw new Error(
          "Phiên đăng nhập đã đổi. Tải lại trang trước khi tiếp tục.",
        );
      const changed = applyCommand(
        current.data,
        current.session.userId,
        command,
      );
      return { state: { ...current, data: changed.data }, id: changed.id };
    });
    if (result.ok) toast.success("Đã lưu thay đổi.");
    return result;
  };
  const login = (email: string, name?: string) =>
    update((current) => ({ state: signIn(current, email, name) }));
  const logout = async () => {
    const result = await update((current) => ({
      state: { ...current, session: null },
    }));
    if (result.ok) router.replace("/login");
  };

  if (storageError)
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div role="alert" className="max-w-md space-y-4">
          <h1 className="text-xl font-semibold">Không thể mở dữ liệu</h1>
          <p>{storageError}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-stone-900 px-4 py-2 text-white"
          >
            Tải lại
          </button>
        </div>
      </main>
    );
  if (!state || (!state.session && path !== "/login"))
    return (
      <main
        className="flex min-h-screen items-center justify-center gap-3"
        role="status"
      >
        <LoaderCircle
          aria-hidden="true"
          className="size-5 animate-spin text-[#7557ff]"
        />
        <span className="text-sm text-stone-600">Đang mở CaseMatch...</span>
      </main>
    );
  return (
    <Context.Provider
      value={{
        data: state.data,
        userId: state.session?.userId ?? null,
        busy,
        run,
        login,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("AppProvider missing");
  return context;
}
