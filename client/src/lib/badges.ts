type BadgeLevel = "bronze" | "silver" | "gold";

export interface BadgeConfig {
  threshold: number;
  level: BadgeLevel;
  titlePrefix: string;
  colorClasses: string;
}

export const badgeMilestones: BadgeConfig[] = [
  {
    threshold: 100,
    level: "gold",
    titlePrefix: "Master",
    colorClasses: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/30 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
  },
  {
    threshold: 50,
    level: "silver",
    titlePrefix: "Expert",
    colorClasses: "bg-stone-400/15 text-stone-300 ring-stone-400/30 border-stone-400/40"
  },
  {
    threshold: 10,
    level: "bronze",
    titlePrefix: "Great",
    colorClasses: "bg-orange-600/15 text-orange-500 ring-orange-600/30 border-orange-600/40"
  }
];

export function getBadgeForCount(count: number, skillName: string) {
  const milestone = badgeMilestones.find((m) => count >= m.threshold);
  if (!milestone) return null;

  return {
    ...milestone,
    name: `${milestone.titlePrefix} ${skillName}`,
    count,
  };
}
