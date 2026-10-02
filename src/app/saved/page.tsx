"use client";
import Link from "next/link";
import { useApp } from "@/components/provider";
import { Shell } from "@/components/shell";
import { FadeIn } from "@/components/ui";
import { Icon } from "@/components/icon";
export default function SavedPage() {
  const { data, userId } = useApp();
  const savedTeams = data.saved_items
    .filter((s) => s.user_id === userId && s.team_id)
    .map((s) => data.teams.find((t) => t.id === s.team_id))
    .filter(Boolean);
  const savedComps = data.saved_items
    .filter((s) => s.user_id === userId && s.competition_id)
    .map((s) => data.competitions.find((c) => c.id === s.competition_id))
    .filter(Boolean);
  return (
    <Shell>
      <FadeIn>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-[#7557ff]">
          Bộ sưu tập
        </p>
        <h1 className="text-3xl font-semibold tracking-[-.06em]">Đã lưu</h1>
        <p className="mt-2 text-sm text-stone-500">
          Giữ lại những đội và cuộc thi đáng xem.
        </p>
        <h2 className="mt-10 text-lg font-semibold">Đội đã lưu</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {savedTeams.map((t) => (
            <Link
              key={t!.id}
              href={`/teams/${t!.id}`}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-5"
            >
              <div>
                <p className="text-sm font-semibold">{t!.name}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {
                    data.competitions.find((c) => c.id === t!.competition_id)
                      ?.title
                  }
                </p>
              </div>
              <Icon name="arrowUpRight" size={16} />
            </Link>
          ))}
          {!savedTeams.length && (
            <p className="text-xs text-stone-400">Chưa lưu đội nào.</p>
          )}
        </div>
        <h2 className="mt-10 text-lg font-semibold">Cuộc thi đã lưu</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {savedComps.map((c) => (
            <Link
              key={c!.id}
              href={`/competitions/${c!.id}`}
              className="rounded-2xl border border-stone-200 bg-white p-5"
            >
              <p className="text-sm font-semibold">{c!.title}</p>
              <p className="mt-1 text-xs text-stone-400">{c!.category}</p>
            </Link>
          ))}
          {!savedComps.length && (
            <p className="text-xs text-stone-400">Chưa lưu cuộc thi nào.</p>
          )}
        </div>
      </FadeIn>
    </Shell>
  );
}
