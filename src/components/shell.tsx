"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
import { useApp } from "./provider";
import { initials } from "@/lib/presentation";
const nav = [
  { href: "/", label: "Khám phá", icon: "compass" },
  { href: "/teams", label: "Tìm đội", icon: "users" },
  { href: "/applications", label: "Đơn ứng tuyển", icon: "file" },
  { href: "/saved", label: "Đã lưu", icon: "bookmark" },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { data, userId, busy, logout } = useApp();
  const profile = data.profiles.find((p) => p.id === userId);
  const pending = data.applications.filter(
    (a) =>
      a.status === "pending" &&
      (a.applicant_id === userId ||
        data.teams.find((t) => t.id === a.team_id)?.captain_id === userId),
  ).length;
  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#171717]">
      <aside className="fixed inset-y-0 left-0 hidden w-[236px] border-r border-stone-200 bg-[#fdfdfc] px-5 py-6 lg:block">
        <Link href="/" className="mb-12 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#7557ff] text-[15px] font-bold text-white">
            C
          </span>
          <span className="text-[17px] font-semibold tracking-[-.04em]">
            casematch
          </span>
        </Link>
        <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-stone-400">
          Workspace
        </p>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${path === item.href ? "bg-[#eeebff] font-semibold text-[#5d45d6]" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"}`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
              {item.href === "/applications" && pending > 0 && (
                <span className="ml-auto rounded-full bg-[#7557ff] px-1.5 py-0.5 text-[10px] text-white">
                  {pending}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <p className="mb-3 mt-10 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-stone-400">
          Tài khoản
        </p>
        <Link
          href="/profile"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] ${path === "/profile" ? "bg-[#eeebff] font-semibold text-[#5d45d6]" : "text-stone-500 hover:bg-stone-100"}`}
        >
          <Icon name="user" size={17} />
          Hồ sơ của tôi
        </Link>
        <div className="absolute bottom-6 left-5 right-5">
          <div className="mb-3 rounded-xl border border-stone-200 bg-white p-3">
            <p className="break-words text-xs font-semibold">
              {profile?.full_name ?? "Thành viên"}
            </p>
            <p className="mt-1 text-[10px] text-stone-400">
              {profile?.university || "CaseMatch"}
            </p>
          </div>
          <button
            onClick={logout}
            disabled={busy}
            className="flex w-full items-center gap-3 px-3 text-xs text-stone-400 hover:text-stone-900"
          >
            <Icon name="logout" size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-[#fafaf9]/90 px-5 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7557ff] text-xs font-bold text-white">
            C
          </span>
          casematch
        </Link>
        <Link
          href="/profile"
          aria-label="Hồ sơ"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffcfbd] text-[10px] font-bold"
        >
          {profile ? initials(profile.full_name) : "?"}
        </Link>
      </header>
      <nav
        aria-label="Điều hướng"
        className="flex flex-wrap gap-2 border-b border-stone-200 px-5 py-3 lg:hidden"
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={path === item.href ? "page" : undefined}
            className={`flex items-center gap-1.5 px-2 py-1.5 text-xs ${path === item.href ? "text-[#7557ff]" : "text-stone-600"}`}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </Link>
        ))}
        <button
          disabled={busy}
          onClick={logout}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-stone-600"
        >
          <Icon name="logout" size={16} />
          Đăng xuất
        </button>
      </nav>
      <div className="lg:pl-[236px]">
        <header className="hidden h-16 items-center justify-end border-b border-stone-200 px-10 lg:flex">
          <div className="flex items-center gap-5">
            <Link
              href="/applications"
              className="relative text-stone-400"
              aria-label="Đơn ứng tuyển"
            >
              <Icon name="bell" size={18} />
              {pending > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#7557ff]" />
              )}
            </Link>
            <div className="h-5 w-px bg-stone-200" />
            <Link
              href="/profile"
              className="flex items-center gap-2 text-xs font-medium"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffcfbd] text-[10px] font-bold">
                {profile ? initials(profile.full_name) : "?"}
              </span>
              {profile?.full_name ?? "Đăng nhập"}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
