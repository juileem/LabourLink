import cors from "cors";
import express from "express";
import { db, initializeDatabase } from "./db.js";

initializeDatabase();

const app = express();
app.use(cors());
app.use(express.json());

const mockOtp = "1234";

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/auth/signup", (request, response) => {
  const { name, phone, role, location, skill, preferred_days, company_name } = request.body as Record<
    string,
    string
  >;

  if (!name || !phone || !role || !location) {
    return response.status(400).json({ message: "Missing required fields" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
  if (existing) {
    return response.status(409).json({ message: "Phone number already registered" });
  }

  const rating = role === "worker" ? 4.7 : 4.4;
  const result = db
    .prepare(
      `
        INSERT INTO users (name, phone, role, location, skill, preferred_days, company_name, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(name, phone, role, location, skill ?? null, preferred_days ?? "", company_name ?? null, rating);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  return response.status(201).json({ user });
});

app.post("/auth/login", (request, response) => {
  const { phone, otp } = request.body as { phone?: string; otp?: string };

  if (!phone || !otp) {
    return response.status(400).json({ message: "Phone and OTP are required" });
  }

  if (otp !== mockOtp) {
    return response.status(401).json({ message: "Invalid OTP. Use 1234 for demo." });
  }

  const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
  if (!user) {
    return response.status(404).json({ message: "No account found for this phone number" });
  }

  return response.json({ user });
});

app.get("/jobs", (_request, response) => {
  const jobs = db
    .prepare(
      `
        SELECT
          jobs.*,
          users.name AS contractor_name
        FROM jobs
        JOIN users ON users.id = jobs.contractor_id
        ORDER BY date ASC, time ASC
      `
    )
    .all();

  return response.json({ jobs });
});

app.post("/jobs", (request, response) => {
  const { contractor_id, skill, location, date, time, salary, workers_needed, description } = request.body as {
    contractor_id?: number;
    skill?: string;
    location?: string;
    date?: string;
    time?: string;
    salary?: number;
    workers_needed?: number;
    description?: string;
  };

  if (!contractor_id || !skill || !location || !date || !time || !salary || !workers_needed) {
    return response.status(400).json({ message: "Missing required job fields" });
  }

  const contractor = db
    .prepare("SELECT id FROM users WHERE id = ? AND role = 'contractor'")
    .get(contractor_id);
  if (!contractor) {
    return response.status(404).json({ message: "Contractor not found" });
  }

  const result = db
    .prepare(
      `
        INSERT INTO jobs (contractor_id, skill, location, date, time, salary, workers_needed, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(contractor_id, skill, location, date, time, salary, workers_needed, description ?? null);

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid);
  return response.status(201).json({ job });
});

app.post("/jobs/:id/apply", (request, response) => {
  const jobId = Number(request.params.id);
  const { worker_id } = request.body as { worker_id?: number };

  if (!jobId || !worker_id) {
    return response.status(400).json({ message: "Job and worker are required" });
  }

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as { id?: number } | undefined;
  if (!job) {
    return response.status(404).json({ message: "Job not found" });
  }

  const worker = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'worker'").get(worker_id);
  if (!worker) {
    return response.status(404).json({ message: "Worker not found" });
  }

  const existing = db
    .prepare("SELECT id FROM applications WHERE job_id = ? AND worker_id = ?")
    .get(jobId, worker_id);
  if (existing) {
    return response.status(409).json({ message: "Worker already applied to this job" });
  }

  const result = db
    .prepare("INSERT INTO applications (job_id, worker_id, status) VALUES (?, ?, 'applied')")
    .run(jobId, worker_id);

  const application = db.prepare("SELECT * FROM applications WHERE id = ?").get(result.lastInsertRowid);
  return response.status(201).json({ application });
});

app.get("/jobs/:id/applicants", (request, response) => {
  const jobId = Number(request.params.id);
  const applicants = db
    .prepare(
      `
        SELECT
          applications.*,
          users.name AS worker_name,
          users.skill AS worker_skill,
          users.location AS worker_location
        FROM applications
        JOIN users ON users.id = applications.worker_id
        WHERE applications.job_id = ?
        ORDER BY applications.id DESC
      `
    )
    .all(jobId);

  return response.json({ applicants });
});

app.post("/jobs/:id/select", (request, response) => {
  const jobId = Number(request.params.id);
  const { worker_id } = request.body as { worker_id?: number };

  if (!jobId || !worker_id) {
    return response.status(400).json({ message: "Job and worker are required" });
  }

  const job = db
    .prepare("SELECT workers_needed FROM jobs WHERE id = ?")
    .get(jobId) as { workers_needed?: number } | undefined;
  if (!job) {
    return response.status(404).json({ message: "Job not found" });
  }

  const selectedCount = db
    .prepare("SELECT COUNT(*) as count FROM applications WHERE job_id = ? AND status = 'selected'")
    .get(jobId) as { count: number };
  if (selectedCount.count >= job.workers_needed) {
    return response.status(400).json({ message: "Required workers already selected" });
  }

  const result = db
    .prepare(
      `
        UPDATE applications
        SET status = 'selected'
        WHERE job_id = ? AND worker_id = ?
      `
    )
    .run(jobId, worker_id);

  if (!result.changes) {
    return response.status(404).json({ message: "Application not found" });
  }

  const application = db
    .prepare("SELECT * FROM applications WHERE job_id = ? AND worker_id = ?")
    .get(jobId, worker_id);
  return response.json({ application });
});

const port = 4000;
app.listen(port, () => {
  console.log(`LabourLink API listening on http://localhost:${port}`);
});
