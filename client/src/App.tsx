import { useEffect, useMemo, useState } from "react";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { api } from "./lib/api";
import { clearSession, loadSession, saveSession } from "./lib/storage";
import type { Application, Job, User } from "./types";
import { AuthPanel } from "./components/AuthPanel";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { CreateJobForm } from "./components/CreateJobForm";
import { JobCard } from "./components/JobCard";
import { Navbar } from "./components/Navbar";
import { ProfileCard } from "./components/ProfileCard";

function App() {
  const [user, setUser] = useState<User | null>(() => loadSession());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobApplicants, setJobApplicants] = useState<Record<number, Application[]>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refreshJobs = async () => {
    setRefreshing(true);
    try {
      const response = await api.getJobs<{ jobs: Job[] }>();
      setJobs(response.jobs);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load jobs");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refreshJobs();
  }, []);

  const authenticated = async (runner: () => Promise<User>) => {
    setLoading(true);
    setError("");
    try {
      const nextUser = await runner();
      setUser(nextUser);
      saveSession(nextUser);
      await refreshJobs();
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const acceptedJobs = useMemo(() => {
    if (!user || user.role !== "worker") return [];
    return jobs.filter((job) => (jobApplicants[job.id] ?? []).some((application) => application.worker_id === user.id));
  }, [jobApplicants, jobs, user]);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!user) return;
      const visibleJobs =
        user.role === "contractor" ? jobs.filter((job) => job.contractor_id === user.id) : jobs;

      const entries = await Promise.all(
        visibleJobs.map(async (job) => {
          try {
            const response = await api.getApplicants<{ applicants: Application[] }>(job.id);
            return [job.id, response.applicants] as const;
          } catch {
            return [job.id, []] as const;
          }
        })
      );

      setJobApplicants(Object.fromEntries(entries));
    };

    void fetchApplicants();
  }, [jobs, user]);

  const handleApply = async (jobId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.applyToJob(jobId, { worker_id: user.id });
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not apply");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      await api.createJob(payload);
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create job");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorker = async (jobId: number, workerId: number) => {
    setLoading(true);
    try {
      await api.selectWorker(jobId, { worker_id: workerId });
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not select worker");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-hero-grid bg-[size:24px_24px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl pt-6">
          <AuthPanel
            loading={loading}
            onSignup={(payload) => authenticated(() => api.signup<{ user: User }>(payload).then((data) => data.user))}
            onLogin={(payload) => authenticated(() => api.login<{ user: User }>(payload).then((data) => data.user))}
          />
        </div>
      </main>
    );
  }

  const workerSuggestedJobs = jobs.filter((job) => job.skill === user.skill);
  const contractorJobs = jobs.filter((job) => job.contractor_id === user.id);

  return (
    <div className="min-h-screen bg-hero-grid bg-[size:24px_24px]">
      <Navbar
        user={user}
        onLogout={() => {
          clearSession();
          setUser(null);
        }}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">
              {user.role === "worker" ? "Find today’s work" : "Manage your crews"}
            </h1>
            <p className="mt-2 text-stone-400">
              {user.role === "worker"
                ? "Suggested jobs matched to your skill and location."
                : "Post jobs, review applicants, and confirm workers."}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void refreshJobs()} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-6">
            <ProfileCard user={user} />
            {user.role === "worker" ? (
              <Card>
                <p className="text-xs uppercase tracking-[0.24em] text-brand-300">Rating</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{user.rating.toFixed(1)} / 5</h3>
                <p className="mt-2 text-sm text-stone-400">
                  Based on recent contractor reviews and completed gigs.
                </p>
              </Card>
            ) : (
              <Card>
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-300">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-brand-300">Hiring Summary</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">{contractorJobs.length} Active Posts</h3>
                    <p className="mt-2 text-sm text-stone-400">
                      Review applicants and move qualified workers to selected status.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {user.role === "contractor" ? (
              <CreateJobForm contractorId={user.id} onCreate={handleCreateJob} loading={loading} />
            ) : null}

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {user.role === "worker" ? "Suggested Jobs" : "Created Jobs"}
                </h2>
                <span className="text-sm text-stone-400">
                  {user.role === "worker" ? workerSuggestedJobs.length : contractorJobs.length} results
                </span>
              </div>

              <div className="space-y-4">
                {(user.role === "worker" ? workerSuggestedJobs : contractorJobs).map((job) => {
                  const applicants = jobApplicants[job.id] ?? [];
                  const selectedApplicants = applicants.filter((applicant) => applicant.status === "selected");
                  const alreadyApplied = applicants.some((application) => application.worker_id === user.id);

                  return (
                    <JobCard
                      key={job.id}
                      job={{
                        ...job,
                        status: selectedApplicants.length >= job.workers_needed ? "Closed" : "Open"
                      }}
                      actionLabel={user.role === "worker" ? (alreadyApplied ? "Applied" : "Accept Job") : undefined}
                      onAction={user.role === "worker" ? () => void handleApply(job.id) : undefined}
                      disabled={loading || alreadyApplied}
                      footer={
                        user.role === "contractor" ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-stone-400">
                                Applicants: <span className="font-semibold text-stone-100">{applicants.length}</span>
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  selectedApplicants.length >= job.workers_needed
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-amber-500/15 text-amber-300"
                                }`}
                              >
                                {selectedApplicants.length >= job.workers_needed ? "Closed" : "Open"}
                              </span>
                            </div>
                            {selectedApplicants.length ? (
                              <div className="rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
                                <p className="text-sm font-semibold text-emerald-300">Selected Workers</p>
                                <div className="mt-3 space-y-2">
                                  {selectedApplicants.map((applicant) => (
                                    <div
                                      key={`selected-${applicant.id}`}
                                      className="flex items-center justify-between text-sm text-stone-200"
                                    >
                                      <span>{applicant.worker_name}</span>
                                      <span className="text-stone-400">{applicant.worker_skill}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {applicants.length ? (
                              <div className="space-y-3">
                                {applicants.map((applicant) => (
                                  <div
                                    key={applicant.id}
                                    className="flex flex-col gap-3 rounded-2xl bg-stone-950/70 p-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div>
                                      <p className="font-semibold text-white">{applicant.worker_name}</p>
                                      <p className="text-sm text-stone-400">
                                        {applicant.worker_skill} • {applicant.worker_location}
                                      </p>
                                    </div>
                                    <Button
                                      variant={applicant.status === "selected" ? "secondary" : "primary"}
                                      disabled={
                                        loading ||
                                        applicant.status === "selected" ||
                                        selectedApplicants.length >= job.workers_needed
                                      }
                                      onClick={() => void handleSelectWorker(job.id, applicant.worker_id)}
                                    >
                                      {applicant.status === "selected" ? "Selected" : "Select Worker"}
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-stone-500">No applicants yet.</p>
                            )}
                          </div>
                        ) : undefined
                      }
                    />
                  );
                })}
              </div>
            </section>

            {user.role === "worker" ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Accepted Jobs</h2>
                <div className="space-y-4">
                  {acceptedJobs.length ? (
                    acceptedJobs.map((job) => <JobCard key={`accepted-${job.id}`} job={job} />)
                  ) : (
                    <Card>
                      <p className="text-stone-400">Accepted jobs will appear here after you apply.</p>
                    </Card>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
