import type { Competition, Profile, Team, TeamRole } from "@/lib/types";
export function expandTeam(data: { competitions: Competition[]; profiles: Profile[]; teams: Team[]; team_roles: TeamRole[] }, team: Team) {
  return { team, competition: data.competitions.find(c => c.id === team.competition_id)!, captain: data.profiles.find(p => p.id === team.captain_id)!, roles: data.team_roles.filter(r => r.team_id === team.id) };
}
export const formatDeadline = (iso: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
export const initials = (name: string) => name.split(" ").filter(Boolean).slice(-2).map(x => x[0]).join("").toUpperCase();
export const avatarColors = ["#ffcfbd", "#c9c3ff", "#bfdfc9", "#bcd8e8", "#f7dd9a"];
