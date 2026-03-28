import { weekDays } from "../lib/constants";

interface DaySelectorProps {
  selectedDays: string[];
  onToggle: (day: string) => void;
}

export function DaySelector({ selectedDays, onToggle }: DaySelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-300">Preferred Work Days</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {weekDays.map((day) => {
          const active = selectedDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggle(day)}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-brand-500 text-white"
                  : "bg-stone-900 text-stone-300 ring-1 ring-white/10 hover:bg-stone-800"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
