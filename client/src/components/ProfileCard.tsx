import { useEffect, useState } from "react";
import { MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { User } from "../types";
import { Card } from "./Card";
import { skills as allSkills, apiBaseUrl } from "../lib/constants";

export function ProfileCard({ user, refreshTrigger }: { user: User; refreshTrigger?: boolean }) {
  const [ratingData, setRatingData] = useState<{ average_rating: number | null; total_ratings: number }>({
    average_rating: user.rating || null,
    total_ratings: 0
  });
  
  const [workerSkills, setWorkerSkills] = useState<string[]>(user.skill ? [user.skill] : []);
  const [selectedNewSkill, setSelectedNewSkill] = useState("");

  useEffect(() => {
    const fetchRatingAndSkills = async () => {
      try {
        const ratingEndpoint = user.role === "worker" ? `/workers/${user.id}/rating` : `/contractors/${user.id}/rating`;
        const ratingRes = await fetch(`${apiBaseUrl}${ratingEndpoint}`);
        if (ratingRes.ok) {
          const ratingJson = await ratingRes.json();
          setRatingData(ratingJson);
        }

        if (user.role === "worker") {
          const skillsRes = await fetch(`${apiBaseUrl}/workers/${user.id}/skills`);
          if (skillsRes.ok) {
            const skillsJson = await skillsRes.json();
            if (skillsJson.skills && skillsJson.skills.length > 0) {
              setWorkerSkills(skillsJson.skills);
            }
          }
        }
      } catch (error) {
        console.error("Failed to sync profile data", error);
      }
    };
    void fetchRatingAndSkills();
  }, [user.id, user.role, refreshTrigger]);

  const handleAddSkill = async () => {
    if (!selectedNewSkill || workerSkills.includes(selectedNewSkill)) return;
    try {
      const response = await fetch(`${apiBaseUrl}/workers/add-skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: user.id, skill: selectedNewSkill })
      });
      if (response.ok) {
        setWorkerSkills(prev => [...prev, selectedNewSkill]);
        setSelectedNewSkill("");
      }
    } catch (err) {
      console.error("Failed to add skill", err);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/workers/remove-skill`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId: user.id, skill: skillToRemove })
      });
      if (response.ok) {
        setWorkerSkills(prev => prev.filter(s => s !== skillToRemove));
      }
    } catch (err) {
      console.error("Failed to remove skill", err);
    }
  };

  const displayRating = ratingData.average_rating ?? 0;
  
  const availableToAdd = allSkills.filter(s => !workerSkills.includes(s));

  return (
    <Card className="relative overflow-visible">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-brand-500/20 blur-3xl" />
      <p className="text-xs uppercase tracking-[0.24em] text-brand-300">Profile</p>
      <div className="mt-3 flex flex-col sm:flex-row items-start justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-stone-400">
            <MapPinIcon className="h-4 w-4" />
            {user.location}
          </div>
          {user.role === "worker" ? (
            <>
              <p className="mt-5 text-sm text-stone-400 mb-2">My Skills</p>
              <div className="flex flex-wrap gap-2 items-center">
                {workerSkills.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-3 py-1 text-sm font-medium text-brand-300 ring-1 ring-inset ring-brand-500/30">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="ml-1 rounded-full p-0.5 hover:bg-brand-500/30 transition-colors">
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="mt-3 flex items-center gap-2 max-w-xs">
                <select
                  className="flex-1 block w-full rounded-xl border-0 bg-stone-900 px-3 py-2 text-sm text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-brand-500"
                  value={selectedNewSkill}
                  onChange={(e) => setSelectedNewSkill(e.target.value)}
                >
                  <option value="" disabled>Add a skill...</option>
                  {availableToAdd.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  disabled={!selectedNewSkill}
                  onClick={handleAddSkill}
                  className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Add
                </button>
              </div>

              <p className="mt-5 text-sm text-stone-400">Preferred days</p>
              <p className="text-sm text-stone-200 mt-1">{user.preferred_days || "Flexible"}</p>
            </>
          ) : (
            <>
              <p className="mt-5 text-sm text-stone-400">Company</p>
              <p className="text-lg font-semibold text-stone-100 mt-1">
                {user.company_name || "Independent Contractor"}
              </p>
            </>
          )}
        </div>
        
        <div className="rounded-2xl bg-stone-950/80 px-4 py-3 ring-1 ring-white/10 sm:min-w-[140px]">
          <p className="text-xs text-stone-400 mb-1">Avg Rating</p>
          <div className="flex flex-col gap-1">
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
