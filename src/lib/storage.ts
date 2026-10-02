import { z } from "zod";
import { initialData } from "./seed.ts";
import { applyCommand } from "./domain.ts";
import { commandSchema, profileSchema, roleSchema } from "./validation.ts";
import type { LocalAccount, LocalState } from "./types.ts";

export const storageKey = "casematch-state-v1";
// Read-only compatibility keys; migration never deletes earlier saves.
export const legacyKeys = ["casematch-demo-v2", "casematch-demo-v1"];
const uuid = z.string().uuid();
const date = z.iso.datetime();
const text = z.string().max(5000);
const localStateSchema = z
  .object({
    version: z.literal(1),
    accounts: z.array(z.object({ user_id: uuid, email: z.email().max(254) })),
    session: z
      .object({ userId: uuid, email: z.email(), createdAt: date })
      .nullable(),
    data: z.object({
      profiles: z.array(profileSchema.extend({ id: uuid })),
      competitions: z.array(
        z.object({
          id: uuid,
          title: text,
          organizer: text,
          category: text,
          description: text,
          deadline: date,
          min_team_size: z.number().int().min(2),
          max_team_size: z.number().int().max(10),
          location: text,
          information_url: profileSchema.shape.portfolio_url,
          accent: text,
        }),
      ),
      teams: z.array(
        z.object({
          id: uuid,
          competition_id: uuid,
          captain_id: uuid,
          name: z.string().min(2).max(80),
          description: z.string().min(20).max(2000),
          commitment: profileSchema.shape.commitment,
          status: z.enum(["open", "recruiting", "full", "closed"]),
          created_at: date,
        }),
      ),
      team_roles: z.array(roleSchema.extend({ id: uuid, team_id: uuid })),
      applications: z.array(
        z.object({
          id: uuid,
          team_id: uuid,
          role_id: uuid,
          applicant_id: uuid,
          message: z.string().min(20).max(1500),
          status: z.enum(["pending", "accepted", "rejected", "withdrawn"]),
          created_at: date,
        }),
      ),
      team_members: z.array(
        z.object({
          id: uuid,
          team_id: uuid,
          competition_id: uuid,
          user_id: uuid,
          role_id: uuid.nullable(),
          role_name: text,
          joined_at: date,
        }),
      ),
      saved_items: z.array(
        z.object({
          id: uuid,
          user_id: uuid,
          team_id: uuid.nullable(),
          competition_id: uuid.nullable(),
        }),
      ),
    }),
  })
  .superRefine((state, ctx) => {
    const fail = () =>
      ctx.addIssue({
        code: "custom",
        message: "Bản lưu có liên kết dữ liệu không hợp lệ.",
      });
    const { data } = state;
    const profiles = new Set(data.profiles.map((p) => p.id));
    const competitions = new Set(data.competitions.map((c) => c.id));
    const teams = new Map(data.teams.map((t) => [t.id, t]));
    const roles = new Map(data.team_roles.map((r) => [r.id, r]));
    for (const rows of Object.values(data))
      if (new Set(rows.map((r) => r.id)).size !== rows.length) fail();
    const uniqueBy = <T>(rows: T[], key: (row: T) => string) =>
      new Set(rows.map(key)).size === rows.length;
    if (
      !uniqueBy(data.applications, (a) => `${a.team_id}:${a.applicant_id}`) ||
      !uniqueBy(data.team_members, (m) => `${m.competition_id}:${m.user_id}`) ||
      !uniqueBy(
        data.team_roles,
        (r) => `${r.team_id}:${r.name.toLowerCase()}`,
      ) ||
      !uniqueBy(
        data.saved_items,
        (s) => `${s.user_id}:${s.team_id ?? s.competition_id}`,
      )
    )
      fail();
    if (
      new Set(state.accounts.map((a) => a.email)).size !==
        state.accounts.length ||
      new Set(state.accounts.map((a) => a.user_id)).size !==
        state.accounts.length ||
      state.accounts.some((a) => !profiles.has(a.user_id))
    )
      fail();
    if (
      state.session &&
      !state.accounts.some(
        (a) =>
          a.user_id === state.session!.userId &&
          a.email === state.session!.email,
      )
    )
      fail();
    if (data.competitions.some((c) => c.max_team_size < c.min_team_size))
      fail();
    if (
      data.teams.some(
        (t) =>
          !competitions.has(t.competition_id) || !profiles.has(t.captain_id),
      )
    )
      fail();
    if (data.team_roles.some((r) => !teams.has(r.team_id))) fail();
    if (
      data.applications.some(
        (a) =>
          !teams.has(a.team_id) ||
          !profiles.has(a.applicant_id) ||
          roles.get(a.role_id)?.team_id !== a.team_id,
      )
    )
      fail();
    if (
      data.team_members.some(
        (m) =>
          !profiles.has(m.user_id) ||
          teams.get(m.team_id)?.competition_id !== m.competition_id ||
          (m.role_id && roles.get(m.role_id)?.team_id !== m.team_id),
      )
    )
      fail();
    if (
      data.saved_items.some(
        (s) =>
          !profiles.has(s.user_id) ||
          !!s.team_id === !!s.competition_id ||
          (s.team_id && !teams.has(s.team_id)) ||
          (s.competition_id && !competitions.has(s.competition_id)),
      )
    )
      fail();
  });

const journalSchema = z.object({
  version: z.literal(1),
  userId: uuid.nullable(),
  entries: z
    .array(
      z.object({
        userId: uuid,
        command: commandSchema,
        now: z.number().finite(),
        ids: z.array(uuid).max(20).optional(),
      }),
    )
    .max(2000),
});

function seedAccounts(data: LocalState["data"]): LocalAccount[] {
  // example.com is reserved; these addresses identify local accounts only.
  return data.profiles.map((p, i) => ({
    user_id: p.id,
    email: `${["linh", "anh", "ha", "huy"][i] ?? p.id}@example.com`,
  }));
}

export function parseState(raw: string): LocalState {
  return localStateSchema.parse(JSON.parse(raw));
}

export function readState(storage: Pick<Storage, "getItem">): LocalState {
  const raw = storage.getItem(storageKey);
  if (raw === null)
    throw new Error(
      "Không tìm thấy bản lưu. Tải lại trang trước khi tiếp tục.",
    );
  return parseState(raw);
}

export function saveState(
  storage: Pick<Storage, "setItem">,
  next: LocalState,
): LocalState {
  const validated = localStateSchema.parse(next);
  // One atomic snapshot keeps session, profile, roles and roster consistent.
  storage.setItem(storageKey, JSON.stringify(validated));
  return validated;
}

export function loadState(
  storage: Pick<Storage, "getItem" | "setItem">,
): LocalState {
  const raw = storage.getItem(storageKey);
  if (raw !== null) return parseState(raw);
  const data = initialData();
  const state: LocalState = {
    version: 1,
    data,
    accounts: seedAccounts(data),
    session: null,
  };
  for (const key of legacyKeys) {
    const old = storage.getItem(key);
    if (old === null) continue;
    const journal = journalSchema.parse(JSON.parse(old));
    for (const entry of journal.entries) {
      let cursor = 0;
      state.data = applyCommand(
        state.data,
        entry.userId,
        entry.command,
        entry.now,
        () => {
          const id = entry.ids?.[cursor++];
          if (!id)
            throw new Error(
              "Bản lưu cũ thiếu ID. Giữ nguyên dữ liệu để phục hồi, không khởi tạo lại.",
            );
          return id;
        },
      ).data;
    }
    const account = state.accounts.find((a) => a.user_id === journal.userId);
    if (journal.userId && !account)
      throw new Error("Phiên đăng nhập cũ không hợp lệ.");
    if (account)
      state.session = {
        userId: account.user_id,
        email: account.email,
        createdAt: new Date().toISOString(),
      };
    break;
  }
  return saveState(storage, state);
}

export function signIn(
  state: LocalState,
  rawEmail: string,
  fullName = "",
): LocalState {
  const email = z.email().max(254).parse(rawEmail.trim().toLowerCase());
  const next = structuredClone(state);
  let account = next.accounts.find((a) => a.email === email);
  if (!account) {
    const id = crypto.randomUUID();
    const profile = profileSchema.parse({
      full_name:
        fullName.trim() ||
        (email.split("@")[0].length >= 2
          ? email.split("@")[0]
          : "Thành viên mới"),
      university: "",
      major: "",
      bio: "",
      skills: [],
      desired_roles: [],
      commitment: "medium",
      experience: "",
      portfolio_url: "",
    });
    next.data.profiles.push({ ...profile, id });
    account = { user_id: id, email };
    next.accounts.push(account);
  }
  // ponytail: email chooses local identity, not proof of ownership; use server auth before sharing sensitive data.
  next.session = {
    userId: account.user_id,
    email,
    createdAt: new Date().toISOString(),
  };
  return next;
}
