import cors from "cors";
import express from "express";
import { db, initializeDatabase } from "./db.js";

initializeDatabase();

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const app = express();
app.use(cors());
app.use(express.json());

const mockOtp = "1234";
const otps = new Map<string, string>();
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
  const location_lat = 19.0760;
  const location_lng = 72.8777;

  const skillsArray = Array.isArray(skill) ? skill : (skill ? [skill] : []);
  const primarySkill = skillsArray.length > 0 ? skillsArray[0] : null;

  const result = db
    .prepare(
      `
        INSERT INTO users (name, phone, role, location, location_lat, location_lng, skill, preferred_days, company_name, rating)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(name, phone, role, location, location_lat, location_lng, primarySkill, preferred_days ?? "", company_name ?? null, rating);

  const newUserId = result.lastInsertRowid;

  if (role === "worker" && skillsArray.length > 0) {
    const insertSkill = db.prepare("INSERT INTO worker_skills (worker_id, skill_name) VALUES (?, ?)");
    for (const s of skillsArray) {
      try {
        insertSkill.run(newUserId, s);
      } catch (e) {
        // ignoring duplicates
      }
    }
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(newUserId);
  return response.status(201).json({ user });
});

app.post("/auth/login", (request, response) => {
  const { phone, otp } = request.body as { phone?: string; otp?: string };

  if (!phone || !otp) {
    return response.status(400).json({ message: "Phone and OTP are required" });
  }

  if (otp !== mockOtp && otp !== otps.get(phone)) {
    return response.status(401).json({ message: "Invalid OTP. Use 1234 or request a new one for demo." });
  }

  // Clear OTP after successful use
  otps.delete(phone);

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

app.post("/auth/send-otp", (request, response) => {
  const { phone } = request.body as { phone?: string };

  if (!phone) {
    return response.status(400).json({ message: "Phone is required" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
  if (!existing) {
    return response.status(404).json({ message: "No account found for this phone number" });
  }

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otps.set(phone, generatedOtp);

  // For testing/demo purposes, we return the OTP directly
  return response.json({ otp: generatedOtp });
});

app.get("/jobs/available", (request, response) => {
  const workerSkill = request.query.skill as string | undefined;
  const workerId = request.query.workerId ? Number(request.query.workerId) : undefined;

  let query = `
    SELECT
      jobs.*,
      users.name AS contractor_name
    FROM jobs
    JOIN users ON users.id = jobs.contractor_id
    WHERE jobs.status = 'open'
  `;
  const params: (string | number)[] = [];

  if (workerId) {
    query += ` AND jobs.skill IN (SELECT skill_name FROM worker_skills WHERE worker_id = ?)`;
    params.push(workerId);
    
    query += ` AND jobs.id NOT IN (SELECT job_id FROM job_applications WHERE worker_id = ?)`;
    params.push(workerId);
  } else if (workerSkill) {
    query += ` AND jobs.skill = ?`;
    params.push(workerSkill);
  }

  query += ` ORDER BY date ASC, time ASC`;

  const jobs = db.prepare(query).all(...params);

  return response.json({ jobs });
});

app.get("/jobs/nearby/:workerId", (request, response) => {
  const workerId = Number(request.params.workerId);
  const worker = db.prepare("SELECT location_lat, location_lng FROM users WHERE id = ?").get(workerId) as any;
  if (!worker || worker.location_lat == null) {
    return response.json([]);
  }

  const jobs = db.prepare(`
    SELECT jobs.*, jobs.skill AS skill_required, users.name AS contractor_name
    FROM jobs
    JOIN users ON users.id = jobs.contractor_id
    WHERE jobs.status = 'open' AND jobs.skill IN (SELECT skill_name FROM worker_skills WHERE worker_id = ?)
  `).all(workerId) as any[];

  const nearby = jobs
    .filter(job => job.location_lat != null)
    .map(job => {
      const distance = getDistance(worker.location_lat, worker.location_lng, job.location_lat, job.location_lng);
      return { ...job, distance };
    })
    .filter(job => job.distance <= 20)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20);

  return response.json(nearby);
});

app.get("/workers/nearby/:contractorId", (request, response) => {
  const contractorId = Number(request.params.contractorId);
  const contractor = db.prepare("SELECT location_lat, location_lng FROM users WHERE id = ?").get(contractorId) as any;
  if (!contractor || contractor.location_lat == null) {
    return response.json([]);
  }

  const workers = db.prepare(`
    SELECT id, name, skill, rating, phone, location_lat, location_lng
    FROM users
    WHERE role = 'worker'
  `).all() as any[];

  const nearby = workers
    .filter(w => w.location_lat != null)
    .map(w => {
      const distance = getDistance(contractor.location_lat, contractor.location_lng, w.location_lat, w.location_lng);
      return { ...w, distance };
    })
    .filter(w => w.distance <= 20)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20);

  return response.json(nearby);
});

app.get("/workers/:id/skills", (request, response) => {
  const workerId = Number(request.params.id);
  const skills = db.prepare("SELECT skill_name FROM worker_skills WHERE worker_id = ?").all(workerId) as { skill_name: string }[];
  return response.json({ skills: skills.map(s => s.skill_name) });
});

app.post("/workers/add-skill", (request, response) => {
  const { workerId, skill } = request.body as { workerId: number, skill: string };
  if (!workerId || !skill) return response.status(400).json({ message: "Worker ID and Skill are required" });

  const existing = db.prepare("SELECT * FROM worker_skills WHERE worker_id = ? AND skill_name = ?").get(workerId, skill);
  if (existing) {
    return response.status(400).json({ message: "Skill already added" });
  }

  db.prepare("INSERT INTO worker_skills (worker_id, skill_name) VALUES (?, ?)").run(workerId, skill);
  return response.status(201).json({ message: "Skill successfully added" });
});

app.delete("/workers/remove-skill", (request, response) => {
  const { workerId, skill } = request.body as { workerId: number, skill: string };
  if (!workerId || !skill) return response.status(400).json({ message: "Worker ID and Skill are required" });

  db.prepare("DELETE FROM worker_skills WHERE worker_id = ? AND skill_name = ?").run(workerId, skill);
  return response.json({ message: "Skill successfully removed" });
});

app.post("/jobs/accept", (request, response) => {
  const { jobId, workerId } = request.body as { jobId?: number; workerId?: number };

  if (!jobId || !workerId) {
    return response.status(400).json({ message: "jobId and workerId are required" });
  }

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as { id?: number } | undefined;
  if (!job) {
    return response.status(404).json({ message: "Job not found" });
  }

  const worker = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'worker'").get(workerId);
  if (!worker) {
    return response.status(404).json({ message: "Worker not found" });
  }

  const existing = db
    .prepare("SELECT id FROM job_applications WHERE job_id = ? AND worker_id = ?")
    .get(jobId, workerId);

  if (existing) {
    return response.status(409).json({ message: "Worker already accepted this job" });
  }

  const result = db
    .prepare("INSERT INTO job_applications (job_id, worker_id, status) VALUES (?, ?, 'accepted')")
    .run(jobId, workerId);

  const application = db.prepare("SELECT * FROM job_applications WHERE id = ?").get(result.lastInsertRowid);
  return response.status(201).json({ application });
});

app.get("/contractor/jobs/:id/applications", (request, response) => {
  const contractorId = Number(request.params.id);

  const applications = db
    .prepare(
      `
        SELECT
          job_applications.job_id,
          job_applications.worker_id,
          users.name AS worker_name,
          users.skill AS skill,
          users.rating AS rating,
          job_applications.status AS status,
          EXISTS(SELECT 1 FROM job_ratings WHERE job_id = job_applications.job_id AND worker_id = job_applications.worker_id AND rated_by = 'contractor') AS is_rated
        FROM job_applications
        JOIN users ON users.id = job_applications.worker_id
        JOIN jobs ON jobs.id = job_applications.job_id
        WHERE jobs.contractor_id = ? AND job_applications.status = 'accepted'
        ORDER BY job_applications.accepted_at DESC
      `
    )
    .all(contractorId);

  return response.json({ applications });
});

app.get("/worker/jobs/:id/accepted", (request, response) => {
  const workerId = Number(request.params.id);

  const jobs = db
    .prepare(
      `
        SELECT
          jobs.*,
          users.name AS contractor_name,
          job_applications.status AS application_status,
          EXISTS(SELECT 1 FROM job_ratings WHERE job_id = jobs.id AND worker_id = ? AND rated_by = 'worker') AS is_rated
        FROM jobs
        JOIN job_applications ON job_applications.job_id = jobs.id
        JOIN users ON users.id = jobs.contractor_id
        WHERE job_applications.worker_id = ?
        ORDER BY job_applications.accepted_at DESC
      `
    )
    .all(workerId, workerId);

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

  const missingFields = [];
  if (!contractor_id) missingFields.push("contractor_id");
  if (!skill) missingFields.push("skill");
  if (!location) missingFields.push("location");
  if (!date) missingFields.push("date");
  if (!time) missingFields.push("time");
  if (!salary) missingFields.push("salary");
  if (!workers_needed) missingFields.push("workers_needed");

  if (missingFields.length > 0) {
    console.log("Failed to create job due to missing fields:", missingFields, "Body:", request.body);
    return response.status(400).json({ message: `Missing required job fields: ${missingFields.join(", ")}` });
  }

  const contractor = db
    .prepare("SELECT id FROM users WHERE id = ? AND role = 'contractor'")
    .get(contractor_id);
  if (!contractor) {
    return response.status(404).json({ message: "Contractor not found" });
  }

  const location_lat = 19.0760;
  const location_lng = 72.8777;

  const result = db
    .prepare(
      `
        INSERT INTO jobs (contractor_id, skill, location, location_lat, location_lng, date, time, salary, workers_needed, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(contractor_id, skill, location, location_lat, location_lng, date, time, salary, workers_needed, description ?? null);

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
          users.location AS worker_location,
          users.rating AS worker_rating
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
  if (!job || job.workers_needed === undefined) {
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

app.put("/jobs/:id/complete", (request, response) => {
  const jobId = Number(request.params.id);
  const { contractorId } = request.body as { contractorId: number };

  if (!contractorId) {
    return response.status(400).json({ message: "Contractor ID required" });
  }

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId) as any;
  if (!job) {
    return response.status(404).json({ message: "Job not found" });
  }

  if (job.contractor_id !== contractorId) {
    return response.status(403).json({ message: "Only the creator contractor can complete this job" });
  }

  db.prepare("UPDATE jobs SET status = 'completed' WHERE id = ?").run(jobId);

  return response.json({ message: "Job marked as completed" });
});

app.post("/ratings/contractor", (request, response) => {
  const { jobId, workerId, contractorId, rating, review } = request.body as {
    jobId: number;
    workerId: number;
    contractorId: number;
    rating: number;
    review: string;
  };

  if (!jobId || !workerId || !contractorId || !rating || !review) {
    return response.status(400).json({ message: "Missing required rating fields" });
  }

  const existing = db.prepare("SELECT * FROM job_ratings WHERE job_id = ? AND worker_id = ? AND rated_by = 'worker'").get(jobId, workerId);
  if (existing) {
    return response.status(400).json({ message: "You have already rated this contractor for this job." });
  }

  db.prepare(`
    INSERT INTO job_ratings (job_id, worker_id, contractor_id, rated_by, rating, review)
    VALUES (?, ?, ?, 'worker', ?, ?)
  `).run(jobId, workerId, contractorId, rating, review);

  const avg = db.prepare("SELECT AVG(rating) as avg FROM job_ratings WHERE contractor_id = ? AND rated_by = 'worker'").get(contractorId) as { avg: number };
  if (avg && avg.avg) {
    db.prepare("UPDATE users SET rating = ? WHERE id = ?").run(avg.avg, contractorId);
  }

  return response.json({ message: "Rating submitted successfully" });
});

app.post("/ratings/worker", (request, response) => {
  const { jobId, workerId, contractorId, rating, review } = request.body as {
    jobId: number;
    workerId: number;
    contractorId: number;
    rating: number;
    review: string;
  };

  if (!jobId || !workerId || !contractorId || !rating || !review) {
    return response.status(400).json({ message: "Missing required rating fields" });
  }

  const existing = db.prepare("SELECT * FROM job_ratings WHERE job_id = ? AND worker_id = ? AND rated_by = 'contractor'").get(jobId, workerId);
  if (existing) {
    return response.status(400).json({ message: "You have already rated this worker for this job." });
  }

  db.prepare(`
    INSERT INTO job_ratings (job_id, worker_id, contractor_id, rated_by, rating, review)
    VALUES (?, ?, ?, 'contractor', ?, ?)
  `).run(jobId, workerId, contractorId, rating, review);

  const avg = db.prepare("SELECT AVG(rating) as avg FROM job_ratings WHERE worker_id = ? AND rated_by = 'contractor'").get(workerId) as { avg: number };
  if (avg && avg.avg) {
    db.prepare("UPDATE users SET rating = ? WHERE id = ?").run(avg.avg, workerId);
  }

  return response.json({ message: "Rating submitted successfully" });
});

app.get("/workers/:id/history", (request, response) => {
  const workerId = Number(request.params.id);

  const history = db.prepare(`
    SELECT
      jobs.id AS job_id,
      jobs.skill AS skill,
      users.name AS contractor_name,
      jobs.date AS date,
      job_ratings.rating AS rating,
      job_ratings.review AS review
    FROM jobs
    JOIN job_applications ON job_applications.job_id = jobs.id
    JOIN users ON users.id = jobs.contractor_id
    LEFT JOIN job_ratings ON job_ratings.job_id = jobs.id AND job_ratings.worker_id = ? AND job_ratings.rated_by = 'contractor'
    WHERE job_applications.worker_id = ? AND jobs.status = 'completed' AND job_applications.status = 'accepted'
    ORDER BY jobs.date DESC
  `).all(workerId, workerId);

  return response.json({ history });
});

app.get("/workers/:id/rating", (request, response) => {
  const workerId = Number(request.params.id);
  const result = db.prepare(`
    SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings
    FROM job_ratings
    WHERE worker_id = ? AND rated_by = 'contractor'
  `).get(workerId) as { average_rating: number | null, total_ratings: number } | undefined;

  return response.json({
    average_rating: result?.average_rating ?? null,
    total_ratings: result?.total_ratings ?? 0
  });
});

app.get("/contractors/:id/rating", (request, response) => {
  const contractorId = Number(request.params.id);
  const result = db.prepare(`
    SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings
    FROM job_ratings
    WHERE contractor_id = ? AND rated_by = 'worker'
  `).get(contractorId) as { average_rating: number | null, total_ratings: number } | undefined;

  return response.json({
    average_rating: result?.average_rating ?? null,
    total_ratings: result?.total_ratings ?? 0
  });
});

app.post("/ai/parse-job-request", (request, response) => {
  const { message } = request.body as { message: string };
  if (!message) return response.status(400).json({ error: "No message" });

  const msg = message.toLowerCase();
  
  let skill_required = "labourer";
  if (msg.includes("electrician")) skill_required = "Electrician";
  else if (msg.includes("painter")) skill_required = "Painter";
  else if (msg.includes("mason")) skill_required = "Mason";
  else if (msg.includes("plumber")) skill_required = "Plumber";
  else if (msg.includes("carpenter")) skill_required = "Carpenter";

  const numMatch = msg.match(/\\d+/);
  const workers_needed = numMatch ? parseInt(numMatch[0], 10) : 1;

  let date = new Date().toISOString().split("T")[0];
  if (msg.includes("tomorrow")) {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    date = tmrw.toISOString().split("T")[0];
  }

  let location = "Mumbai";
  if (msg.includes("bengaluru") || msg.includes("bangalore")) location = "Bengaluru";
  else if (msg.includes("delhi")) location = "Delhi";
  else if (msg.includes("mumbai")) location = "Mumbai";

  return response.json({ skill_required, workers_needed, date, location });
});

app.post("/ai/suggest-workers", (request, response) => {
  const { skill, location, contractorId } = request.body as { skill: string; location: string; contractorId?: number };

  let contractorLat = 19.0760;
  let contractorLng = 72.8777;

  if (contractorId) {
    const c = db.prepare("SELECT location_lat, location_lng FROM users WHERE id = ?").get(contractorId) as any;
    if (c?.location_lat != null) {
      contractorLat = c.location_lat;
      contractorLng = c.location_lng;
    }
  }

  const workers = db.prepare(`
    SELECT id, name, phone, skill, rating, location_lat, location_lng
    FROM users
    WHERE role = 'worker' AND LOWER(skill) = LOWER(?)
  `).all(skill) as any[];

  const scoredWorkers = workers.map(w => {
    let distance = 20;
    if (w.location_lat != null) {
      distance = getDistance(contractorLat, contractorLng, w.location_lat, w.location_lng);
    }
    
    // Closer distance = higher score. Max 20km for score calculation.
    let distanceScore = 0;
    if (distance <= 20) {
       distanceScore = ((20 - distance) / 20) * 100;
    }

    // Rating normalized to 100
    const ratingScore = (w.rating / 5) * 100;

    const score = (ratingScore * 0.7) + (distanceScore * 0.3);
    return { ...w, match_score: Math.round(score) + "%", distance };
  }).sort((a, b) => {
    const scoreA = parseInt(a.match_score);
    const scoreB = parseInt(b.match_score);
    return scoreB - scoreA;
  }).slice(0, 5);

  return response.json(scoredWorkers);
});

app.post("/jobs/create-from-ai", (request, response) => {
  const { contractor_id, skill_required, workers_needed, date, location, description } = request.body as any;

  if (!contractor_id || !skill_required || !workers_needed || !date) {
    return response.status(400).json({ error: "Missing required fields" });
  }

  const location_lat = 19.0760;
  const location_lng = 72.8777;

  const result = db
    .prepare(
      `
        INSERT INTO jobs (contractor_id, skill, location, location_lat, location_lng, date, time, salary, workers_needed, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(contractor_id, skill_required, location || "Mumbai", location_lat, location_lng, date, "09:00", 1000, workers_needed, description || "Auto-created by AI Assistant");

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid);
  return response.status(201).json({ job });
});

const port = 4000;
app.listen(port, () => {
  console.log(`LabourLink API listening on http://localhost:${port}`);
});
