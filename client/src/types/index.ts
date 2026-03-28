export type Role = "worker" | "contractor";

export interface User {
  id: number;
  name: string;
  phone: string;
  role: Role;
  location: string;
  skill: string | null;
  preferred_days: string;
  rating: number;
  company_name?: string | null;
}

export interface Job {
  id: number;
  contractor_id: number;
  contractor_name: string;
  skill: string;
  location: string;
  date: string;
  time: string;
  salary: number;
  workers_needed: number;
  description: string | null;
  applicant_count?: number;
  selected_count?: number;
  status?: "open" | "closed" | "completed";
  application_status?: string;
}

export interface Application {
  id: number;
  job_id: number;
  worker_id: number;
  status: "applied" | "selected";
  worker_name?: string;
  worker_skill?: string | null;
  worker_location?: string;
}

export interface JobHistory {
  job_id: number;
  skill: string;
  contractor_name: string;
  date: string;
  rating: number;
  review: string;
}
