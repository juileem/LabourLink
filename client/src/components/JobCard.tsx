import type { ReactNode } from "react";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import type { Job } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";

interface JobCardProps {
  job: Job;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  footer?: ReactNode;
}

export function JobCard({ job, actionLabel, onAction, disabled, footer }: JobCardProps) {
  return (
    <Card className="transition duration-200 hover:-translate-y-1 hover:border-brand-400/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-300">
            {job.skill}
          </div>
          <h3 className="text-xl font-semibold text-white">{job.skill} Job</h3>
          <div className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-brand-300" />
              {job.location}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 text-brand-300" />
              {job.date}
            </p>
            <p className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-brand-300" />
              {job.time}
            </p>
            <p className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-4 w-4 text-brand-300" />
              ${job.salary}
            </p>
            <p className="flex items-center gap-2 sm:col-span-2">
              <UserCircleIcon className="h-4 w-4 text-brand-300" />
              {job.contractor_name}
            </p>
          </div>
          {job.description ? <p className="mt-4 text-sm text-stone-400">{job.description}</p> : null}
        </div>
        {actionLabel && onAction ? (
          <Button onClick={onAction} disabled={disabled} className="shrink-0">
            {actionLabel}
          </Button>
        ) : null}
      </div>
      {footer ? <div className="mt-5 border-t border-white/10 pt-4">{footer}</div> : null}
    </Card>
  );
}
