"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/provider";
import { Shell } from "@/components/shell";
import { Button, FadeIn, Field, inputClass, Pill } from "@/components/ui";
import { Icon } from "@/components/icon";
import { expandTeam, initials } from "@/lib/presentation";
import { matching } from "@/lib/matching";
import { canRecruit, remainingSlots } from "@/lib/domain";
import { statusLabels } from "@/lib/types";
export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const { data, userId, run, busy } = useApp();
  const found = data.teams.find((x) => x.id === id);
  const [message, setMessage] = useState("");
  const [roleId, setRoleId] = useState("");
  const item = found ? expandTeam(data, found) : null;
  const match = item
    ? matching(
        data.profiles.find((p) => p.id === userId),
        item.team,
        item.roles,
      )
    : null;
  const roles = item?.roles ?? [];
  const openRoles = roles.filter(r => remainingSlots(data, r.id) > 0);
  const selectedRole = openRoles.some(r => r.id === roleId) ? roleId : openRoles[0]?.id ?? "";
  const application = data.applications.find(
    (a) => a.team_id === id && a.applicant_id === userId,
  );
  if (!item)
    return (
      <Shell>
        <div className="py-20 text-center">
          <p className="font-semibold">Không tìm thấy đội</p>
          <Link
            href="/teams"
            className="mt-3 inline-block text-xs text-[#7557ff]"
          >
            Quay lại danh sách
          </Link>
        </div>
      </Shell>
    );
  const apply = async () => {
    const result = await run({
      type: "apply",
      team_id: item.team.id,
      role_id: selectedRole,
      message,
    });
    if (result.ok) setMessage("");
  };
  return (
    <Shell>
      <FadeIn>
        <Link
          href="/teams"
          className="flex items-center gap-1 text-xs font-semibold text-stone-400 hover:text-stone-900"
        >
          ← Về danh sách đội
        </Link>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
          <section>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffcfbd] text-sm font-bold">
                  {initials(item.captain.full_name)}
                </div>
                <div>
                  <Pill tone="green">
                  {statusLabels[item.team.status]}
                  </Pill>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-.06em]">
                    {item.team.name}
                  </h1>
                  <p className="mt-1 text-xs text-stone-500">
                    Cho {item.competition.title} · Captain{" "}
                    {item.captain.full_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[.15em] text-stone-400">
                  Tương thích
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-.06em] text-[#7557ff]">
                  {match?.score ?? 0}%
                </p>
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
              <p className="text-sm leading-6 text-stone-600">
                {item.team.description}
              </p>
              <div className="mt-7 grid gap-5 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[.14em] text-stone-400">
                    Cam kết
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {item.team.commitment === "high"
                      ? "Chinh phục giải"
                      : item.team.commitment === "medium"
                        ? "Nghiêm túc học hỏi"
                        : "Linh hoạt"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[.14em] text-stone-400">
                    Quy mô
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {data.team_members.filter((m) => m.team_id === id).length} /{" "}
                    {item.competition.max_team_size} người
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[.14em] text-stone-400">
                    Lĩnh vực
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {item.competition.category}
                  </p>
                </div>
              </div>
            </div>
            <h2 className="mt-8 text-lg font-semibold tracking-[-.04em]">
              Đang tìm
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {roles.map((role, i) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eeebff] text-[#7557ff]">
                      <Icon name={i ? "sparkles" : "briefcase"} size={15} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{role.name}</p>
                      <p className="mt-1 text-[10px] text-stone-400">
                        {role.skills.join(" · ")} · {remainingSlots(data, role.id)} chỗ còn trống
                      </p>
                    </div>
                  </div>
                  <Pill tone="violet">{remainingSlots(data, role.id) > 0 ? "Mở" : "Đủ người"}</Pill>
                </div>
              ))}
            </div>
            <h2 className="mt-8 text-lg font-semibold tracking-[-.04em]">
              Đội hình
            </h2>
            <div className="mt-4 space-y-2 rounded-2xl border border-stone-200 bg-white p-5">
              {data.team_members
                .filter((m) => m.team_id === id)
                .map((member) => {
                  const person = data.profiles.find(
                    (p) => p.id === member.user_id,
                  );
                  return (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffcfbd] text-xs font-bold">
                        {person ? initials(person.full_name) : "?"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">
                          {person?.full_name ?? "Thành viên"}
                        </p>
                        <p className="mt-1 text-[10px] text-stone-400">
                          {member.role_name}
                        </p>
                      </div>
                      {member.user_id === item.team.captain_id && (
                        <Pill tone="orange">Captain</Pill>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
          <aside>
            <div className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-stone-400">
                Phân tích tương thích
              </p>
              <div className="mt-6 space-y-4">
                {[
                  ["Kỹ năng", "50%", match?.skills ?? 0],
                  ["Vai trò", "25%", match?.role ?? 0],
                  ["Cam kết", "15%", match?.commitment ?? 0],
                  ["Kinh nghiệm", "10%", match?.experience ?? 0],
                ].map(([label, weight, value]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">
                        {label}{" "}
                        <span className="text-stone-300">({weight})</span>
                      </span>
                      <strong>{Math.round(Number(value) * 100)}%</strong>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-[#7557ff]"
                        style={{ width: `${Number(value) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[10px] leading-4 text-stone-400">
                Điểm tương thích theo luật cố định, dựa trên hồ sơ của bạn.
                Không phải dự đoán AI.
              </p>
              {application ? (
                <div className="mt-6 rounded-xl bg-[#e7f5eb] p-3 text-center text-xs font-semibold text-[#39704a]">
                  {application?.status === "accepted"
                    ? "Bạn đã được nhận vào đội"
                    : application?.status === "rejected"
                      ? "Đơn đã bị từ chối"
                    : application.status === "withdrawn" ? "Bạn đã rút đơn ứng tuyển" : "Đã gửi đơn ứng tuyển"}
                </div>
              ) : data.team_members.some(m => m.team_id === id && m.user_id === userId) ? (
                <div className="mt-6 text-xs font-semibold text-[#39704a]">Bạn đang là thành viên đội này.</div>
              ) : !canRecruit(data, item.team) || !openRoles.length ? (
                <div className="mt-6 text-xs text-stone-500">Đội không còn nhận đơn.</div>
              ) : (
                <div className="mt-6 space-y-3">
                  <Field label="Vai trò muốn ứng tuyển">
                    <select
                      value={selectedRole}
                      onChange={(e) => setRoleId(e.target.value)}
                      className={inputClass}
                    >
                      {openRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Lời giới thiệu">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Bạn mang gì đến cho đội? (ít nhất 20 ký tự)"
                      rows={5}
                      className={inputClass}
                    />
                  </Field>
                  <Button
                    onClick={apply}
                    disabled={
                      busy || message.trim().length < 20 || !selectedRole
                    }
                  >
                    <Icon name="file" size={15} />
                    Ứng tuyển vào đội
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </FadeIn>
    </Shell>
  );
}
