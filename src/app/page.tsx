"use client";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { FadeIn, Pill, Button } from "@/components/ui";
import { Icon } from "@/components/icon";
import { formatDeadline, initials, avatarColors } from "@/lib/presentation";
import { matching, profileStrength } from "@/lib/matching";
import { useApp } from "@/components/provider";
import { canRecruit } from "@/lib/domain";
export default function HomePage() {
  const { data, userId } = useApp();
  const profile = data.profiles.find((p) => p.id === userId);
  const matches = data.teams
    .filter(
      (team) =>
        canRecruit(data, team) &&
        !data.team_members.some(
          (m) => m.team_id === team.id && m.user_id === userId,
        ),
    )
    .map((team) => ({
      team,
      comp: data.competitions.find((c) => c.id === team.competition_id)!,
      roles: data.team_roles.filter((r) => r.team_id === team.id),
      captain: data.profiles.find((p) => p.id === team.captain_id)!,
    }))
    .map((x) => ({ ...x, score: matching(profile, x.team, x.roles).score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const top = data.competitions[0];
  const strength = profileStrength(profile);
  const date = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  if (!top)
    return (
      <Shell>
        <p>Chưa có cuộc thi.</p>
      </Shell>
    );
  return (
    <Shell>
      <FadeIn>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-[#7557ff]">
              {date}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-.06em]">
              Chào {profile?.full_name.split(" ").at(-1) ?? "bạn"}
              <span className="text-[#7557ff]">.</span>
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Tìm đúng người. Xây điều đáng tự hào.
            </p>
          </div>
          <Button href="/teams/new">
            <Icon name="plus" size={16} />
            Tạo đội
          </Button>
        </div>
        <div className="mt-9 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="relative min-h-[290px] overflow-hidden rounded-[24px] bg-[#191719] p-7 text-white sm:p-10">
            <div className="relative z-10 max-w-[370px]">
              <Pill tone="orange">NỔI BẬT TUẦN NÀY</Pill>
              <h2 className="mt-5 text-3xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-4xl">
                {top.title}
              </h2>
              <p className="mt-4 max-w-[300px] text-xs leading-5 text-stone-400">
                {top.description}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Button href={`/competitions/${top.id}`} variant="secondary">
                  Xem thử thách <Icon name="arrowUpRight" size={14} />
                </Button>
                <span className="text-[11px] text-stone-500">
                  Hạn {formatDeadline(top.deadline)}
                </span>
              </div>
            </div>
            <div className="noise absolute -right-20 -top-24 h-[340px] w-[340px] rounded-full border border-white/10 bg-[#ff9a78] opacity-90" />
            <div className="absolute -bottom-28 -right-10 h-[250px] w-[390px] rotate-[-23deg] rounded-[50%] border-[28px] border-[#7557ff] opacity-80" />
            <span className="absolute right-7 top-7 text-[10px] font-bold uppercase tracking-[.2em] text-white/40">
              CM / 01
            </span>
          </div>
          <div className="rounded-[24px] border border-stone-200 bg-white p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-stone-400">
                  Động lực của bạn
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-.04em]">
                  Tiếp tục tiến lên
                </h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeebff] text-[#7557ff]">
                <Icon name="sparkles" />
              </div>
            </div>
            <div className="mt-7 space-y-5">
              <div className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e7f5eb] text-[#39704a]">
                  <Icon name="check" size={12} />
                </span>
                <div>
                  <p className="text-xs font-semibold">Hoàn thiện hồ sơ</p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Để các đội hiểu điểm mạnh của bạn.
                  </p>
                </div>
                <span className="ml-auto text-[11px] font-semibold text-[#39704a]">
                  {strength === 100 ? "Xong" : "Đang hoàn thiện"}
                </span>
              </div>
              <div className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#fff1e8] text-[#b65d2d]">
                  <Icon name="users" size={12} />
                </span>
                <div>
                  <p className="text-xs font-semibold">
                    {matches.length} đội phù hợp
                  </p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Đội đang tìm kỹ năng của bạn.
                  </p>
                </div>
                <Link
                  href="/teams"
                  className="ml-auto text-[11px] font-semibold text-[#7557ff]"
                >
                  Xem
                </Link>
              </div>
            </div>
            <div className="mt-7 border-t border-stone-100 pt-5">
              <div className="flex items-end justify-between">
                <p className="text-[11px] text-stone-400">
                  Độ hoàn thiện hồ sơ
                </p>
                <p className="text-sm font-semibold">{strength}%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[#7557ff]"
                  style={{ width: `${strength}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-stone-400">
              Dành cho bạn
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-.04em]">
              Đội đang tìm bạn
            </h2>
          </div>
          <Link
            href="/teams"
            className="flex items-center gap-1 text-xs font-semibold text-[#7557ff]"
          >
            Xem tất cả <Icon name="arrowUpRight" size={14} />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {matches.map(({ team, comp, score, captain }, i) => (
            <Link
              href={`/teams/${team.id}`}
              key={team.id}
              className="group rounded-2xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#c7bfff] hover:shadow-[0_12px_32px_rgba(117,87,255,.08)]"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold"
                  style={{ background: avatarColors[i] }}
                >
                  {initials(captain.full_name)}
                </div>
                <span className="text-stone-300">
                  <Icon name="bookmark" size={17} />
                </span>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.15em] text-stone-400">
                {comp.title}
              </p>
              <h3 className="mt-1 text-base font-semibold tracking-[-.03em]">
                {team.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
                {team.description}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
                <span className="text-[10px] text-stone-400">
                  Captain · {captain.full_name}
                </span>
                <span className="text-xs font-bold text-[#7557ff]">
                  {score}% match
                </span>
              </div>
            </Link>
          ))}
        </div>
      </FadeIn>
      <FadeIn delay={0.2} className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-stone-400">
              Khám phá
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-.04em]">
              Cuộc thi sắp tới
            </h2>
          </div>
          <Link
            href="/teams"
            className="text-xs font-semibold text-stone-400 hover:text-stone-900"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {data.competitions.slice(0, 3).map((competition) => (
            <Link
              href={`/competitions/${competition.id}`}
              key={competition.id}
              className="group flex min-h-[156px] flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`h-2 w-2 rounded-full ${competition.accent === "peach" ? "bg-[#ff9a78]" : competition.accent === "sage" ? "bg-[#78b88a]" : "bg-[#7557ff]"}`}
                />
                <span className="text-[10px] text-stone-400">
                  {formatDeadline(competition.deadline)}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-[-.02em] group-hover:text-[#7557ff]">
                  {competition.title}
                </h3>
                <p className="mt-1 text-[11px] text-stone-400">
                  {competition.organizer} · {competition.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </FadeIn>
    </Shell>
  );
}
