import { useEffect, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { getBadgeForCount } from "../lib/badges";
import { apiBaseUrl } from "../lib/constants";

interface WorkerBadgesProps {
  workerId: number;
}

export function WorkerBadges({ workerId }: WorkerBadgesProps) {
  const [badgeCounts, setBadgeCounts] = useState<{ skill: string; completed_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/workers/${workerId}/badges`);
        if (response.ok) {
          const data = await response.json();
          setBadgeCounts(data.badges || []);
        }
      } catch (error) {
        console.error("Failed to fetch worker badges:", error);
      } finally {
        setLoading(false);
      }
    };
    void fetchBadges();
  }, [workerId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-stone-900/50 p-6 animate-pulse ring-1 ring-white/5">
        <div className="h-6 w-32 bg-stone-800 rounded mb-4" />
        <div className="flex gap-3">
          <div className="h-16 w-32 bg-stone-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // Derive all active badges
  const earnedBadges = badgeCounts
    .map((b) => getBadgeForCount(b.completed_count, b.skill))
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return (
    <div className="rounded-2xl bg-stone-900 p-6 ring-1 ring-white/10 shadow-lg relative overflow-hidden">
      {/* Decorative gradient blur based on whether badges exist */}
      <div className={`absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl opacity-20 ${
        earnedBadges.some(b => b.level === "gold") ? "bg-yellow-500" 
        : earnedBadges.some(b => b.level === "silver") ? "bg-stone-300" 
        : earnedBadges.length > 0 ? "bg-orange-500" : "bg-brand-500"
      }`} />

      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="h-5 w-5 text-brand-400" />
        <h3 className="text-xl font-bold text-white">Achievements</h3>
      </div>

      {earnedBadges.length > 0 ? (
        <div className="flex flex-wrap gap-4 relative z-10">
          {earnedBadges.map((badge, idx) => (
            <div
              key={`${badge.name}-${idx}`}
              className={`flex flex-col justify-center items-center px-4 py-3 rounded-xl ring-1 ring-inset ${badge.colorClasses}`}
            >
              <span className="text-sm font-black uppercase tracking-wider text-center leading-tight">
                {badge.name}
              </span>
              <span className="text-[10px] font-semibold opacity-70 mt-1">
                {badge.count} Jobs Completed
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center relative z-10">
          <p className="text-sm text-stone-400">Complete jobs to earn badges</p>
          <div className="mt-3 flex justify-center gap-2 opacity-40 grayscale">
            <div className="px-4 py-2 rounded-xl ring-1 ring-inset bg-orange-600/10 text-orange-500 ring-orange-600/30">
              <span className="text-xs font-bold uppercase">Great Worker</span>
            </div>
            <div className="hidden sm:block px-4 py-2 rounded-xl ring-1 ring-inset bg-stone-400/10 text-stone-300 ring-stone-400/30">
              <span className="text-xs font-bold uppercase">Expert</span>
            </div>
            <div className="hidden md:block px-4 py-2 rounded-xl ring-1 ring-inset bg-yellow-500/10 text-yellow-500 ring-yellow-500/30">
              <span className="text-xs font-bold uppercase">Master</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
