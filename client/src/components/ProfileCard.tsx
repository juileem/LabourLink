import { useEffect, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import type { User } from "../types";
import { Card } from "./Card";

export function ProfileCard({ user, refreshTrigger }: { user: User; refreshTrigger?: boolean }) {
  const [ratingData, setRatingData] = useState<{ average_rating: number | null; total_ratings: number }>({
    average_rating: user.rating || null,
    total_ratings: 0
  });

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const endpoint = user.role === "worker" ? `/workers/${user.id}/rating` : `/contractors/${user.id}/rating`;
        const response = await fetch(`http://localhost:4000${endpoint}`);
        if (!response.ok) return;
        const data = await response.json();
        setRatingData(data);
      } catch (error) {
        console.error("Failed to sync rating", error);
      }
    };
    void fetchRating();
  }, [user.id, user.role, refreshTrigger]);

  const displayRating = ratingData.average_rating ?? 0;
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-brand-500/20 blur-3xl" />
      <p className="text-xs uppercase tracking-[0.24em] text-brand-300">Profile</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-stone-400">
            <MapPinIcon className="h-4 w-4" />
            {user.location}
          </div>
          {user.role === "worker" ? (
            <>
              <p className="mt-4 text-sm text-stone-400">Primary skill</p>
              <p className="text-lg font-semibold text-stone-100">{user.skill}</p>
              <p className="mt-4 text-sm text-stone-400">Preferred days</p>
              <p className="text-sm text-stone-200">{user.preferred_days || "Flexible"}</p>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-stone-400">Company</p>
              <p className="text-lg font-semibold text-stone-100">
                {user.company_name || "Independent Contractor"}
              </p>
            </>
          )}
        </div>
        <div className="rounded-2xl bg-stone-950/80 px-4 py-3 ring-1 ring-white/10">
          <p className="text-xs text-stone-400 mb-1">Avg Rating</p>
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${
                    i < Math.round(displayRating) ? "text-yellow-400" : "text-stone-600"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            {ratingData.average_rating !== null ? (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-white">{displayRating.toFixed(1)}</span>
                <span className="text-xs text-stone-500">({ratingData.total_ratings} reviews)</span>
              </div>
            ) : (
              <span className="text-xs text-stone-500">No ratings yet</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
