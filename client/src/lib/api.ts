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
  getJobs: <T>() => request<T>("/jobs"),
  createJob: <T>(payload: unknown) =>
    request<T>("/jobs", { method: "POST", body: JSON.stringify(payload) }),
  applyToJob: <T>(jobId: number, payload: unknown) =>
    request<T>(`/jobs/${jobId}/apply`, { method: "POST", body: JSON.stringify(payload) }),
  getApplicants: <T>(jobId: number) => request<T>(`/jobs/${jobId}/applicants`),
  selectWorker: <T>(jobId: number, payload: unknown) =>
    request<T>(`/jobs/${jobId}/select`, { method: "POST", body: JSON.stringify(payload) })
};
