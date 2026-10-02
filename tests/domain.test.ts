import test from "node:test";
import assert from "node:assert/strict";
import { initialData, seedId } from "../src/lib/seed.ts";
import { applyCommand, canRecruit, remainingSlots } from "../src/lib/domain.ts";
import { matching } from "../src/lib/matching.ts";
const user = seedId(1);
const clock = Date.parse("2026-10-01T00:00:00Z");
test("matching explains score and stays bounded", () => {
  const data = initialData();
  const team = data.teams[1];
  const result = matching(
    data.profiles[0],
    team,
    data.team_roles.filter((r) => r.team_id === team.id),
  );
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.skills >= 0);
  assert.equal(typeof result.role, "number");
});
test("application rejects duplicate and accepts into roster", () => {
  let data = initialData();
  const team = data.teams[0];
  const role = data.team_roles.find((r) => r.team_id === team.id)!;
  assert.equal(canRecruit(data, team, clock), true);
  assert.equal(remainingSlots(data, role.id), 2);
  const created = applyCommand(
    data,
    user,
    {
      type: "apply",
      team_id: team.id,
      role_id: role.id,
      message:
        "Mình muốn góp sức bằng phân tích dữ liệu và mô hình tài chính cho phần này.",
    },
    clock,
  );
  data = created.data;
  const application = data.applications.find(
    (a) => a.team_id === team.id && a.applicant_id === user,
  )!;
  assert.throws(() =>
    applyCommand(
      data,
      user,
      {
        type: "apply",
        team_id: team.id,
        role_id: role.id,
        message:
          "Mình muốn góp sức bằng phân tích dữ liệu và mô hình tài chính cho phần này.",
      },
      clock,
    ),
  );
  const accepted = applyCommand(
    data,
    team.captain_id,
    { type: "review", application_id: application.id, decision: "accepted" },
    clock,
  ).data;
  assert.equal(
    accepted.applications.find((a) => a.id === application.id)?.status,
    "accepted",
  );
  assert.equal(
    accepted.team_members.some(
      (m) => m.user_id === user && m.team_id === team.id,
    ),
    true,
  );
});
test("team creation enforces competition size", () => {
  const data = initialData();
  assert.throws(() =>
    applyCommand(
      data,
      user,
      {
        type: "create-team",
        competition_id: data.competitions[0].id,
        name: "Too large",
        description:
          "This description is long enough for validation and team creation.",
        commitment: "high",
        roles: [{ name: "Strategy", skills: ["Research"], slots: 9 }],
      },
      clock,
    ),
  );
});
