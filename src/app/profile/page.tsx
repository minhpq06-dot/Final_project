"use client";
import { useState } from "react";
import { useApp } from "@/components/provider";
import { Shell } from "@/components/shell";
import { Button, FadeIn, Field, inputClass } from "@/components/ui";
import { Icon } from "@/components/icon";
import { initials, avatarColors } from "@/lib/presentation";
import { profileStrength } from "@/lib/matching";
import type { Commitment, Profile } from "@/lib/types";
export default function ProfilePage() {
  const { data, userId } = useApp();
  const profile = data.profiles.find((p) => p.id === userId);
  return profile ? (
    <ProfileEditor key={JSON.stringify(profile)} profile={profile} />
  ) : (
    <Shell>
      <p>Chưa có hồ sơ.</p>
    </Shell>
  );
}
function ProfileEditor({ profile }: { profile: Profile }) {
  const { run, busy } = useApp();
  const [form, setForm] = useState(profile);
  const [skills, setSkills] = useState(profile.skills.join(", "));
  const [roles, setRoles] = useState(profile.desired_roles.join(", "));
  const strength = profileStrength(profile);
  const set = (key: keyof typeof form, value: string | string[]) =>
    setForm({ ...form, [key]: value });
  const split = (value: string) =>
    value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  const save = () =>
    run({
      type: "profile",
      profile: { ...form, skills: split(skills), desired_roles: split(roles) },
    });
  return (
    <Shell>
      <FadeIn>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-[#7557ff]">
              Hồ sơ cá nhân
            </p>
            <h1 className="text-3xl font-semibold tracking-[-.06em]">
              Nói cho họ biết bạn là ai
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Hồ sơ rõ ràng giúp tìm đúng teammate nhanh hơn.
            </p>
          </div>
          <Button onClick={save} disabled={busy}>
            Lưu thay đổi
          </Button>
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[250px_1fr]">
          <aside className="rounded-2xl border border-stone-200 bg-white p-6">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-3xl text-2xl font-bold"
              style={{ background: avatarColors[0] }}
            >
              {initials(form.full_name)}
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-[-.04em]">
              {form.full_name}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {form.university || "Chưa cập nhật trường"}
            </p>
            <div className="mt-6 border-t border-stone-100 pt-5">
              <p className="text-[10px] uppercase tracking-[.15em] text-stone-400">
                Độ hoàn thiện
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {strength}
                <span className="text-sm text-stone-400">%</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-[#7557ff]"
                  style={{ width: `${strength}%` }}
                />
              </div>
            </div>
          </aside>
          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold tracking-[-.04em]">
              Thông tin cơ bản
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Họ và tên">
                <input
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Trường">
                <input
                  value={form.university}
                  onChange={(e) => set("university", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Chuyên ngành">
                <input
                  value={form.major}
                  onChange={(e) => set("major", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Mức cam kết">
                <select
                  value={form.commitment}
                  onChange={(e) =>
                    set("commitment", e.target.value as Commitment)
                  }
                  className={inputClass}
                >
                  <option value="high">Chinh phục giải</option>
                  <option value="medium">Nghiêm túc học hỏi</option>
                  <option value="flexible">Linh hoạt</option>
                </select>
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Giới thiệu ngắn">
                <textarea
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={4}
                  className={inputClass}
                />
              </Field>
            </div>
            <h2 className="mt-9 text-lg font-semibold tracking-[-.04em]">
              Kỹ năng và vai trò
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Kỹ năng">
                <input
                  aria-label="Kỹ năng"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-2 text-[10px] text-stone-400">
                  Ngăn cách bằng dấu phẩy
                </p>
              </Field>
              <Field label="Vai trò mong muốn">
                <input
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Kinh nghiệm">
                <textarea
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </Field>
              <Field label="Portfolio URL">
                <input
                  type="url"
                  value={form.portfolio_url}
                  onChange={(e) => set("portfolio_url", e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={save} disabled={busy}>
                <Icon name="check" size={15} />
                Lưu hồ sơ
              </Button>
            </div>
          </section>
        </div>
      </FadeIn>
    </Shell>
  );
}
