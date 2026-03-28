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
import { RatingModal } from "./components/RatingModal";

function App() {
  const [user, setUser] = useState<User | null>(() => loadSession());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobApplicants, setJobApplicants] = useState<Record<number, Application[]>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [acceptedWorkerJobs, setAcceptedWorkerJobs] = useState<Job[]>([]);
  const [contractorAcceptedWorkers, setContractorAcceptedWorkers] = useState<Record<number, any[]>>({});
  const [workerHistory, setWorkerHistory] = useState<import("./types").JobHistory[]>([]);
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    jobId: number;
    targetId: number;
    title: string;
    type: "worker" | "contractor";
  }>({ isOpen: false, jobId: 0, targetId: 0, title: "", type: "worker" });

  const refreshJobs = async () => {
    setRefreshing(true);
    try {
      if (user?.role === "worker") {
        const availableResponse = await api.getAvailableJobs<{ jobs: Job[] }>(user.skill || "", user.id);
        setJobs(availableResponse.jobs);
        const acceptedResponse = await api.getWorkerAcceptedJobs<{ jobs: Job[] }>(user.id);
        setAcceptedWorkerJobs(acceptedResponse.jobs);
        const historyResponse = await api.getWorkerHistory<{ history: import("./types").JobHistory[] }>(user.id);
        setWorkerHistory(historyResponse.history);
      } else {
        const response = await api.getJobs<{ jobs: Job[] }>();
        setJobs(response.jobs);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load jobs");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) void refreshJobs();
    else {
      // Fetch all to show to unauthenticated users if needed, though they don't see the dashboard
      void api.getJobs<{ jobs: Job[] }>().then(r => setJobs(r.jobs)).catch(() => {});
    }
  }, [user?.id]);

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

  // We now fetch accepted jobs separately, so we don't need this useMemo
  // const acceptedJobs = useMemo(() => ...);

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!user) return;

      if (user.role === "contractor") {
        try {
          const acceptedResponse = await api.getContractorApplications<{ applications: any[] }>(user.id);
          const grouped: Record<number, any[]> = {};
          for (const app of acceptedResponse.applications) {
            if (!grouped[app.job_id]) grouped[app.job_id] = [];
            grouped[app.job_id].push(app);
          }
          setContractorAcceptedWorkers(grouped);
        } catch {}

        const entries = await Promise.all(
          jobs.filter((job) => job.contractor_id === user.id).map(async (job) => {
            try {
              const response = await api.getApplicants<{ applicants: Application[] }>(job.id);
              return [job.id, response.applicants] as const;
            } catch {
              return [job.id, []] as const;
            }
          })
        );
        setJobApplicants(Object.fromEntries(entries));
      } else {
        // Worker flow doesn't fetch applicants for all jobs anymore
        setJobApplicants({});
      }
    };

    void fetchApplicants();
  }, [jobs, user]);

  const handleApply = async (jobId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.acceptJob({ jobId, workerId: user.id });
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not accept job");
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

  const handleCompleteJob = async (jobId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      await api.completeJob(jobId, { contractorId: user.id });
      await refreshJobs();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not complete job");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (payload: { rating: number; review: string }) => {
    if (!user) return;
    if (ratingModal.type === "worker") {
      await api.rateWorker({
        jobId: ratingModal.jobId,
        workerId: ratingModal.targetId,
        contractorId: user.id,
        rating: payload.rating,
        review: payload.review
      });
    } else {
      await api.rateContractor({
        jobId: ratingModal.jobId,
        workerId: user.id,
        contractorId: ratingModal.targetId,
        rating: payload.rating,
        review: payload.review
      });
    }
    await refreshJobs();
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
                        status: selectedApplicants.length >= job.workers_needed ? "closed" : "open"
                      }}
                      actionLabel={user.role === "worker" ? (alreadyApplied ? "Applied" : "Accept Job") : (job.status === "open" ? "Mark as Completed" : undefined)}
                      onAction={user.role === "worker" ? () => void handleApply(job.id) : (job.status === "open" ? () => void handleCompleteJob(job.id) : undefined)}
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
                                <p className="text-sm font-semibold text-emerald-300">Selected Workers (Legacy)</p>
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
                            {contractorAcceptedWorkers[job.id]?.length ? (
                              <div className="rounded-2xl bg-brand-500/10 p-4 ring-1 ring-brand-500/20">
                                <p className="text-sm font-semibold text-brand-300">Fast-Accepted Workers</p>
                                <div className="mt-3 space-y-2">
                                  {contractorAcceptedWorkers[job.id].map((worker, idx) => (
                                    <div
                                      key={`fast-accepted-${idx}`}
                                      className="flex items-center justify-between text-sm text-stone-200"
                                    >
                                      <div>
                                        <span>{worker.worker_name}</span>
                                        <span className="ml-2 rounded bg-brand-500/20 px-1.5 py-0.5 text-xs text-brand-300">
                                          ★ {worker.rating.toFixed(1)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-stone-400">{worker.skill}</span>
                                        {job.status === "completed" && (
                                          <Button 
                                            variant="secondary" 
                                            className="px-2 py-1 text-xs"
                                            onClick={() => setRatingModal({
                                              isOpen: true,
                                              jobId: job.id,
                                              targetId: worker.worker_id,
                                              title: `Rate ${worker.worker_name}`,
                                              type: "worker"
                                            })}
                                          >
                                            Rate Worker
                                          </Button>
                                        )}
                                      </div>
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
              <>
                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Accepted Jobs</h2>
                  <div className="space-y-4">
                    {acceptedWorkerJobs.length ? (
                      acceptedWorkerJobs.map((job) => (
                        <JobCard 
                          key={`accepted-${job.id}`} 
                          job={job} 
                          actionLabel={job.status === "completed" ? "Rate Contractor" : undefined}
                          onAction={job.status === "completed" ? () => setRatingModal({
                            isOpen: true,
                            jobId: job.id,
                            targetId: job.contractor_id,
                            title: `Rate ${job.contractor_name}`,
                            type: "contractor"
                          }) : undefined}
                        />
                      ))
                    ) : (
                      <Card>
                        <p className="text-stone-400">Accepted jobs will appear here after you apply.</p>
                      </Card>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Completed Jobs</h2>
                  <div className="space-y-4">
                    {workerHistory.length ? (
                      workerHistory.map((historyItem) => (
                        <Card key={`history-${historyItem.job_id}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-white">{historyItem.skill} Job</h3>
                              <p className="text-sm text-stone-400 mt-1">Contractor: {historyItem.contractor_name}</p>
                              <p className="text-sm text-stone-400">Completed: {historyItem.date}</p>
                            </div>
                            {historyItem.rating ? (
                              <div className="text-right">
                                <span className="inline-flex rounded-full bg-yellow-500/15 text-yellow-500 px-3 py-1 font-bold">
                                  ★ {historyItem.rating}
                                </span>
                              </div>
                            ) : null}
                          </div>
                          {historyItem.review ? (
                            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-stone-300 italic text-sm">
                              "{historyItem.review}"
                            </div>
                          ) : null}
                        </Card>
                      ))
                    ) : (
                      <Card><p className="text-stone-400">No completed jobs yet.</p></Card>
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>
      </main>
      <RatingModal
        isOpen={ratingModal.isOpen}
        title={ratingModal.title}
        onSubmit={handleSubmitRating}
        onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
      />
    </div>
  );
}

export default App;
