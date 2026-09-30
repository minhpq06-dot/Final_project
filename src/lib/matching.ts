import type { Profile, Team, TeamRole } from "./types.ts";
const normalize = (items: string[]) => [...new Set(items.map(s => s.trim().toLocaleLowerCase()).filter(Boolean))];
export function matching(profile: Profile | undefined, team: Team, roles: TeamRole[]) {
  if (!profile) return { score: 0, skills: 0, role: 0, commitment: 0, experience: 0 };
  const needed = normalize(roles.flatMap(r => r.skills));
  const owned = normalize(profile.skills);
  const skills = needed.length ? needed.filter(s => owned.includes(s)).length / needed.length : 0;
  const role = roles.some(r => normalize(profile.desired_roles).includes(r.name.toLocaleLowerCase().trim())) ? 1 : 0;
  const level = { flexible: 0, medium: 1, high: 2 };
  const commitment = Math.max(0, 1 - Math.abs(level[profile.commitment] - level[team.commitment]) * .5);
  const experience = profile.experience.trim() ? 1 : 0;
  return { score: Math.round(skills * 50 + role * 25 + commitment * 15 + experience * 10), skills, role, commitment, experience };
}
export function profileStrength(profile?: Profile) {
  if (!profile) return 0;
  return Math.round([profile.full_name, profile.university, profile.major, profile.bio, profile.skills.length, profile.desired_roles.length, profile.experience, profile.portfolio_url].filter(Boolean).length / 8 * 100);
}
