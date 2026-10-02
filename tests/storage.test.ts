import test from "node:test";
import assert from "node:assert/strict";
import { applyCommand } from "../src/lib/domain.ts";
import { initialData, seedId } from "../src/lib/seed.ts";
import {
  loadState,
  saveState,
  signIn,
  storageKey,
  legacyKeys,
} from "../src/lib/storage.ts";
import type { LocalState } from "../src/lib/types.ts";
import type { Command } from "../src/lib/validation.ts";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const now = Date.parse("2026-10-02T00:00:00Z");
function execute(state: LocalState, command: Command) {
  const result = applyCommand(
    state.data,
    state.session?.userId ?? null,
    command,
    now,
  );
  return { state: { ...state, data: result.data }, id: result.id };
}

test("initializes once; profile and session survive reload without overwriting defaults", () => {
  const storage = memoryStorage();
  const first = loadState(storage);
  assert.equal(first.session, null);
  assert.ok(storage.getItem(storageKey));
  let state = signIn(first, " LINH@example.com ");
  assert.equal(state.session?.userId, seedId(1));
  const profile = state.data.profiles.find((p) => p.id === seedId(1))!;
  state = execute(state, {
    type: "profile",
    profile: {
      ...profile,
      full_name: "Tên đã sửa",
      skills: ["Excel", "Research"],
    },
  }).state;
  saveState(storage, state);
  const before = storage.getItem(storageKey);
  const restored = loadState(storage);
  assert.equal(
    restored.data.profiles.find((p) => p.id === seedId(1))?.full_name,
    "Tên đã sửa",
  );
  assert.deepEqual(
    restored.data.profiles.find((p) => p.id === seedId(1))?.skills,
    ["Excel", "Research"],
  );
  assert.equal(restored.session?.email, "linh@example.com");
  assert.equal(storage.getItem(storageKey), before);
});

test("team creation, application and acceptance retain IDs through repeated reloads", () => {
  const storage = memoryStorage();
  let state = signIn(loadState(storage), "linh@example.com");
  const team = execute(state, {
    type: "create-team",
    competition_id: seedId(101),
    name: "Persistent team",
    description: "An organized team working together on research and strategy.",
    commitment: "high",
    roles: [{ name: "Research", skills: ["Research"], slots: 2 }],
  });
  state = saveState(storage, team.state);
  assert.ok(state.data.teams.some((t) => t.id === team.id));
  const role = state.data.team_roles.find((r) => r.team_id === team.id)!;
  state = signIn(loadState(storage), "new-candidate@example.com", "Candidate");
  const applicant = state.session!.userId;
  state = execute(state, {
    type: "apply",
    team_id: team.id!,
    role_id: role.id,
    message:
      "I can contribute research, strategy and a clear presentation to this team.",
  }).state;
  state = saveState(storage, state);
  const application = state.data.applications.find(
    (a) => a.applicant_id === applicant,
  )!;
  assert.throws(() =>
    execute(loadState(storage), {
      type: "apply",
      team_id: team.id!,
      role_id: role.id,
      message: application.message,
    }),
  );
  state = signIn(loadState(storage), "linh@example.com");
  state = execute(state, {
    type: "review",
    application_id: application.id,
    decision: "accepted",
  }).state;
  saveState(storage, state);
  const restored = loadState(storage);
  assert.equal(
    restored.data.applications.find((a) => a.id === application.id)?.status,
    "accepted",
  );
  assert.equal(
    restored.data.team_members.find((m) => m.user_id === applicant)?.role_id,
    role.id,
  );
  assert.equal(
    restored.data.team_members.find((m) => m.user_id === applicant)?.team_id,
    team.id,
  );
});

test("logout removes session only and next login restores the same account", () => {
  const storage = memoryStorage();
  const account = signIn(
    loadState(storage),
    "person@example.com",
    "Local Person",
  );
  saveState(storage, { ...account, session: null });
  assert.equal(loadState(storage).session, null);
  const again = signIn(loadState(storage), "PERSON@example.com");
  assert.equal(again.session?.userId, account.session?.userId);
  assert.equal(again.data.profiles.length, account.data.profiles.length);
});

test("migrates existing journal including generated IDs; keeps earlier save", () => {
  const storage = memoryStorage();
  const ids = [seedId(800), seedId(801), seedId(802)];
  const command: Command = {
    type: "create-team",
    competition_id: seedId(101),
    name: "Old saved team",
    description:
      "A previously created team that should retain its identity after migration.",
    commitment: "high",
    roles: [{ name: "Research", skills: ["Research"], slots: 2 }],
  };
  const original = JSON.stringify({
    version: 1,
    userId: seedId(1),
    entries: [{ userId: seedId(1), command, now, ids }],
  });
  storage.setItem(legacyKeys[0], original);
  const migrated = loadState(storage);
  assert.equal(migrated.session?.userId, seedId(1));
  assert.equal(migrated.data.teams[0].id, ids[0]);
  assert.equal(
    migrated.data.team_roles.find((r) => r.team_id === ids[0])?.id,
    ids[1],
  );
  assert.equal(storage.getItem(legacyKeys[0]), original);
  assert.deepEqual(loadState(storage), migrated);
});

test("corrupt or unsupported snapshots and journals are never silently replaced", () => {
  for (const raw of [
    "{broken",
    JSON.stringify({ version: 999 }),
    JSON.stringify({
      version: 1,
      data: initialData(),
      accounts: [],
      session: {
        userId: seedId(999),
        email: "x@example.com",
        createdAt: new Date(now).toISOString(),
      },
    }),
  ]) {
    const storage = memoryStorage();
    storage.setItem(storageKey, raw);
    assert.throws(() => loadState(storage));
    assert.equal(storage.getItem(storageKey), raw);
  }
  const storage = memoryStorage();
  storage.setItem(legacyKeys[0], "{broken");
  assert.throws(() => loadState(storage));
  assert.equal(storage.getItem(storageKey), null);
});

test("failed writes preserve old snapshot; anonymous mutations and unsafe profile URLs fail", () => {
  const storage = memoryStorage();
  const first = loadState(storage);
  const before = storage.getItem(storageKey);
  assert.throws(() =>
    saveState(
      {
        setItem: () => {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        },
      },
      signIn(first, "linh@example.com"),
    ),
  );
  assert.equal(storage.getItem(storageKey), before);
  assert.throws(() =>
    execute(first, { type: "profile", profile: first.data.profiles[0] }),
  );
  assert.throws(() =>
    execute(signIn(first, "linh@example.com"), {
      type: "profile",
      profile: {
        ...first.data.profiles[0],
        portfolio_url: "javascript:alert(1)",
      },
    }),
  );
});
