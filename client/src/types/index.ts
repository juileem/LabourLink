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
  location_lat?: number;
  location_lng?: number;
}

export interface Job {
  id: number;
  contractor_id: number;
  contractor_name: string;
  skill: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
  date: string;
  time: string;
  salary: number;
  workers_needed: number;
  description: string | null;
  applicant_count?: number;
  selected_count?: number;
  status?: "open" | "closed" | "completed";
  application_status?: string;
  is_rated?: boolean | number;
}

export interface Application {
  id: number;
  job_id: number;
  worker_id: number;
  status: "applied" | "selected";
  worker_name?: string;
  worker_skill?: string | null;
  worker_location?: string;
  worker_rating?: number;
  rating?: number;
  is_rated?: boolean | number;
}

export interface JobHistory {
  job_id: number;
  skill: string;
  contractor_name: string;
  date: string;
  rating?: number;
  review?: string;
  payment_amount?: number;
  payment_status?: string;
}
