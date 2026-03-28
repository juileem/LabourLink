import { BriefcaseIcon, PhoneIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import type { User } from "../types";
import { Button } from "./Button";

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-stone-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-500/20 p-2 text-brand-300">
            {user.role === "worker" ? (
              <WrenchScrewdriverIcon className="h-6 w-6" />
            ) : (
              <BriefcaseIcon className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-white">LabourLink</p>
            <p className="text-xs text-stone-400">
              {user.role === "worker" ? "Worker Dashboard" : "Contractor Dashboard"}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-2xl bg-stone-900 px-4 py-2 text-sm text-stone-300 ring-1 ring-white/10">
            <PhoneIcon className="mr-2 inline h-4 w-4" />
            {user.phone}
          </div>
          <Button variant="ghost" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
