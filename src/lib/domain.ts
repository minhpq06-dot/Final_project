import type { AppData, Team } from "./types.ts";
import { commandSchema, type Command } from "./validation.ts";
export function remainingSlots(data: AppData, roleId: string) {
  return Math.max(
    0,
    (data.team_roles.find((r) => r.id === roleId)?.slots ?? 0) -
      data.team_members.filter((m) => m.role_id === roleId).length,
  );
}
export function canRecruit(data: AppData, team: Team, now = Date.now()) {
  const competition = data.competitions.find(
    (c) => c.id === team.competition_id,
  );
  return (
    !!competition &&
    ["open", "recruiting"].includes(team.status) &&
    Date.parse(competition.deadline) > now &&
    data.team_members.filter((m) => m.team_id === team.id).length <
      competition.max_team_size
  );
}
export function applyCommand(
  previous: AppData,
  userId: string | null,
  raw: Command,
  now = Date.now(),
  newId: () => string = () => crypto.randomUUID(),
): { data: AppData; id?: string } {
  const cmd = commandSchema.parse(raw);
  if (!userId || !previous.profiles.some((p) => p.id === userId))
    throw new Error("Đăng nhập để tiếp tục.");
  const data = structuredClone(previous);
  const timestamp = new Date(now).toISOString();
  const id = newId;
  const teamById = (teamId: string) => {
    const t = data.teams.find((t) => t.id === teamId);
    if (!t) throw new Error("Không tìm thấy đội.");
    return t;
  };
  const ensureNoMembership = (competitionId: string, personId: string) => {
    if (
      data.team_members.some(
        (m) => m.competition_id === competitionId && m.user_id === personId,
      )
    )
      throw new Error("Đã thuộc một đội trong cuộc thi này.");
  };
  if (cmd.type === "profile")
    data.profiles = data.profiles.map((p) =>
      p.id === userId ? { ...cmd.profile, id: userId } : p,
    );
  if (cmd.type === "create-team") {
    const competition = data.competitions.find(
      (c) => c.id === cmd.competition_id,
    );
    if (!competition || Date.parse(competition.deadline) <= now)
      throw new Error("Cuộc thi đã hết hạn hoặc không tồn tại.");
    ensureNoMembership(competition.id, userId);
    const size = 1 + cmd.roles.reduce((n, r) => n + r.slots, 0);
    if (size > competition.max_team_size || size < competition.min_team_size)
      throw new Error(
        `Tổng số chỗ (gồm captain) phải từ ${competition.min_team_size} đến ${competition.max_team_size}.`,
      );
    if (
      new Set(cmd.roles.map((r) => r.name.toLowerCase())).size !==
      cmd.roles.length
    )
      throw new Error("Vai trò không được trùng nhau.");
    const teamId = id();
    data.teams.unshift({
      id: teamId,
      competition_id: competition.id,
      captain_id: userId,
      name: cmd.name,
      description: cmd.description,
      commitment: cmd.commitment,
      status: "recruiting",
      created_at: timestamp,
    });
    data.team_roles.push(
      ...cmd.roles.map((r) => ({ ...r, id: id(), team_id: teamId })),
    );
    data.team_members.push({
      id: id(),
      team_id: teamId,
      competition_id: competition.id,
      user_id: userId,
      role_id: null,
      role_name: "Captain",
      joined_at: timestamp,
    });
    return { data, id: teamId };
  }
  if (cmd.type === "edit-team") {
    const t = teamById(cmd.team_id);
    if (t.captain_id !== userId) throw new Error("Chỉ captain được sửa đội.");
    t.name = cmd.name;
    t.description = cmd.description;
    const hasSlots =
      data.team_members.filter((m) => m.team_id === t.id).length <
        data.competitions.find((c) => c.id === t.competition_id)!
          .max_team_size &&
      data.team_roles.some(
        (r) => r.team_id === t.id && remainingSlots(data, r.id) > 0,
      );
    t.status =
      cmd.status === "closed" ? "closed" : hasSlots ? cmd.status : "full";
  }
  if (cmd.type === "apply") {
    const t = teamById(cmd.team_id);
    if (!canRecruit(data, t, now)) throw new Error("Đội không còn nhận đơn.");
    ensureNoMembership(t.competition_id, userId);
    if (
      !data.team_roles.some(
        (r) => r.id === cmd.role_id && r.team_id === t.id,
      ) ||
      remainingSlots(data, cmd.role_id) < 1
    )
      throw new Error("Vai trò đã đủ người.");
    if (
      data.applications.some(
        (a) => a.team_id === t.id && a.applicant_id === userId,
      )
    )
      throw new Error("Bạn đã gửi đơn cho đội này.");
    data.applications.unshift({
      id: id(),
      team_id: t.id,
      role_id: cmd.role_id,
      applicant_id: userId,
      message: cmd.message,
      status: "pending",
      created_at: timestamp,
    });
  }
  if (cmd.type === "review" || cmd.type === "withdraw") {
    const app = data.applications.find((a) => a.id === cmd.application_id);
    if (!app || app.status !== "pending")
      throw new Error("Đơn không còn chờ xử lý.");
    const t = teamById(app.team_id);
    if (cmd.type === "withdraw") {
      if (app.applicant_id !== userId)
        throw new Error("Không có quyền rút đơn.");
      app.status = "withdrawn";
    } else {
      if (t.captain_id !== userId)
        throw new Error("Chỉ captain được duyệt đơn.");
      if (cmd.decision === "accepted") {
        if (!canRecruit(data, t, now) || remainingSlots(data, app.role_id) < 1)
          throw new Error("Đội đã đủ người hoặc hết hạn.");
        ensureNoMembership(t.competition_id, app.applicant_id);
        data.team_members.push({
          id: id(),
          team_id: t.id,
          competition_id: t.competition_id,
          user_id: app.applicant_id,
          role_id: app.role_id,
          role_name: data.team_roles.find((r) => r.id === app.role_id)!.name,
          joined_at: timestamp,
        });
        if (
          !data.team_roles.some(
            (r) => r.team_id === t.id && remainingSlots(data, r.id) > 0,
          ) ||
          data.team_members.filter((m) => m.team_id === t.id).length >=
            data.competitions.find((c) => c.id === t.competition_id)!
              .max_team_size
        )
          t.status = "full";
        data.applications.forEach((other) => {
          if (
            other.id !== app.id &&
            other.applicant_id === app.applicant_id &&
            other.status === "pending" &&
            teamById(other.team_id).competition_id === t.competition_id
          )
            other.status = "withdrawn";
        });
      }
      app.status = cmd.decision;
    }
  }
  if (cmd.type === "save") {
    const column = cmd.kind === "team" ? "team_id" : "competition_id";
    if (
      !(cmd.kind === "team" ? data.teams : data.competitions).some(
        (x) => x.id === cmd.target_id,
      )
    )
      throw new Error("Mục không tồn tại.");
    data.saved_items = data.saved_items.filter(
      (s) => !(s.user_id === userId && s[column] === cmd.target_id),
    );
    if (cmd.saved)
      data.saved_items.push({
        id: id(),
        user_id: userId,
        team_id: cmd.kind === "team" ? cmd.target_id : null,
        competition_id: cmd.kind === "competition" ? cmd.target_id : null,
      });
  }
  return { data };
}
