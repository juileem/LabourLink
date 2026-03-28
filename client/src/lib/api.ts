import { apiBaseUrl } from "./constants";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }

  return response.json();
}

export const api = {
  signup: <T>(payload: unknown) =>
    request<T>("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: <T>(payload: unknown) =>
    request<T>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  sendOtp: <T>(payload: unknown) =>
    request<T>("/auth/send-otp", { method: "POST", body: JSON.stringify(payload) }),
  getJobs: <T>() => request<T>("/jobs"),
  getAvailableJobs: <T>(skill: string, workerId: number) => 
    request<T>(`/jobs/available?skill=${encodeURIComponent(skill)}&workerId=${workerId}`),
  getWorkerAcceptedJobs: <T>(workerId: number) => request<T>(`/worker/jobs/${workerId}/accepted`),
  createJob: <T>(payload: unknown) =>
    request<T>("/jobs", { method: "POST", body: JSON.stringify(payload) }),
  applyToJob: <T>(jobId: number, payload: unknown) =>
    request<T>(`/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify(payload) }),
  acceptJob: <T>(payload: unknown) =>
    request<T>("/jobs/accept", { method: "POST", body: JSON.stringify(payload) }),
  getApplicants: <T>(jobId: number) => request<T>(`/jobs/${jobId}/applicants`),
  getContractorApplications: <T>(contractorId: number) => 
    request<T>(`/contractor/jobs/${contractorId}/applications`),
  selectWorker: <T>(jobId: number, payload: unknown) =>
    request<T>(`/jobs/${jobId}/select`, { method: "POST", body: JSON.stringify(payload) }),
  completeJob: <T>(jobId: number, payload: unknown) =>
    request<T>(`/jobs/${jobId}/complete`, { method: "PUT", body: JSON.stringify(payload) }),
  submitPayment: <T>(payload: unknown) =>
    request<T>("/payments", { method: "POST", body: JSON.stringify(payload) }),
  rateContractor: <T>(payload: unknown) =>
    request<T>("/ratings/contractor", { method: "POST", body: JSON.stringify(payload) }),
  rateWorker: <T>(payload: unknown) =>
    request<T>("/ratings/worker", { method: "POST", body: JSON.stringify(payload) }),
  getWorkerHistory: <T>(workerId: number) =>
    request<T>(`/workers/${workerId}/history`)
};

