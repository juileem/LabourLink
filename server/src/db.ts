import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const dataDir = path.resolve(currentDir, "../data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "labourlink.db");
export const db = new Database(dbPath);

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('worker', 'contractor')),
      location TEXT NOT NULL,
      skill TEXT,
      preferred_days TEXT DEFAULT '',
      company_name TEXT,
      rating REAL DEFAULT 4.5
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      skill TEXT NOT NULL,
      location TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      salary REAL NOT NULL,
      workers_needed INTEGER NOT NULL,
      description TEXT,
      FOREIGN KEY(contractor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('applied', 'selected')) DEFAULT 'applied',
      UNIQUE(job_id, worker_id),
      FOREIGN KEY(job_id) REFERENCES jobs(id),
      FOREIGN KEY(worker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('accepted', 'pending', 'rejected')) DEFAULT 'accepted',
      accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, worker_id),
      FOREIGN KEY(job_id) REFERENCES jobs(id),
      FOREIGN KEY(worker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(job_id) REFERENCES jobs(id),
      FOREIGN KEY(contractor_id) REFERENCES users(id),
      FOREIGN KEY(worker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      rated_by TEXT NOT NULL CHECK(rated_by IN ('worker', 'contractor')),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(job_id) REFERENCES jobs(id),
      FOREIGN KEY(worker_id) REFERENCES users(id),
      FOREIGN KEY(contractor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS worker_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      skill_name TEXT NOT NULL,
      UNIQUE(worker_id, skill_name),
      FOREIGN KEY(worker_id) REFERENCES users(id)
    );
  `);

  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'open'`);
  } catch (error) {
    // Ignore error if column already exists
  }

  try { db.exec(`ALTER TABLE users ADD COLUMN location_lat REAL`); } catch (e) {}
  try { db.exec(`ALTER TABLE users ADD COLUMN location_lng REAL`); } catch (e) {}
  try { db.exec(`ALTER TABLE jobs ADD COLUMN location_lat REAL`); } catch (e) {}
  try { db.exec(`ALTER TABLE jobs ADD COLUMN location_lng REAL`); } catch (e) {}


  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (!userCount.count) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, phone, role, location, location_lat, location_lng, skill, preferred_days, company_name, rating)
      VALUES (@name, @phone, @role, @location, @location_lat, @location_lng, @skill, @preferred_days, @company_name, @rating)
    `);

    insertUser.run({
      name: "Ravi Kumar",
      phone: "9000000001",
      role: "worker",
      location: "Bengaluru",
      location_lat: 19.0760,
      location_lng: 72.8777,
      skill: "Mason",
      preferred_days: "Mon, Tue, Wed, Thu, Fri",
      company_name: null,
      rating: 4.6
    });

    insertUser.run({
      name: "Asha Devi",
      phone: "9000000002",
      role: "worker",
      location: "Bengaluru",
      location_lat: 19.0780,
      location_lng: 72.8810,
      skill: "Painter",
      preferred_days: "Mon, Wed, Fri, Sat",
      company_name: null,
      rating: 4.8
    });

    insertUser.run({
      name: "Amit Patel",
      phone: "9123456780",
      role: "worker",
      location: "Mumbai",
      location_lat: 19.0710,
      location_lng: 72.8700,
      skill: "Electrician",
      preferred_days: "Mon, Tue, Wed",
      company_name: null,
      rating: 4.4
    });

    insertUser.run({
      name: "Suresh Sharma",
      phone: "9123456781",
      role: "worker",
      location: "Mumbai",
      location_lat: 19.0850,
      location_lng: 72.8850,
      skill: "Electrician",
      preferred_days: "Thu, Fri, Sat",
      company_name: null,
      rating: 4.1
    });

    insertUser.run({
      name: "Vikram Singh",
      phone: "9123456782",
      role: "worker",
      location: "Mumbai",
      location_lat: 19.0900,
      location_lng: 72.8600,
      skill: "Painter",
      preferred_days: "Mon, Wed, Fri",
      company_name: null,
      rating: 4.5
    });

    insertUser.run({
      name: "Mahesh BuildCo",
      phone: "9000000010",
      role: "contractor",
      location: "Bengaluru",
      location_lat: 19.0760,
      location_lng: 72.8777,
      skill: null,
      preferred_days: "",
      company_name: "BuildCo Infra",
      rating: 4.4
    });
  }

  const jobCount = db.prepare("SELECT COUNT(*) as count FROM jobs").get() as { count: number };
  if (!jobCount.count) {
    db.prepare(`
      INSERT INTO jobs (contractor_id, skill, location, location_lat, location_lng, date, time, salary, workers_needed, description)
      VALUES
        (3, 'Mason', 'Whitefield, Bengaluru', 19.076, 72.877, '2025-03-29', '08:00', 950, 3, 'Residential wall and plaster finishing.'),
        (3, 'Painter', 'Electronic City, Bengaluru', 19.078, 72.881, '2025-03-29', '09:30', 850, 2, 'Interior paint touch-up for office renovation.'),
        (3, 'Electrician', 'HSR Layout, Bengaluru', 19.080, 72.870, '2025-03-30', '10:00', 1200, 1, 'Wiring support for a retail fit-out.')
    `).run();
  }

  // Migrate legacy users.skill mappings over to the new relation safely:
  db.exec(`
    INSERT INTO worker_skills (worker_id, skill_name)
    SELECT id, skill FROM users 
    WHERE role = 'worker' AND skill IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM worker_skills 
      WHERE worker_id = users.id AND skill_name = users.skill
    );
  `);

  // Ensure each seeded worker has 3 skills to demonstrate multi-skill UI
  db.exec(`
    INSERT OR IGNORE INTO worker_skills (worker_id, skill_name)
    VALUES 
      (1, 'Mason'), (1, 'Plumber'), (1, 'Painter'),
      (2, 'Painter'), (2, 'Carpenter'), (2, 'Plumber'),
      (3, 'Electrician'), (3, 'Plumber'), (3, 'Carpenter'),
      (4, 'Electrician'), (4, 'Mason'), (4, 'Painter'),
      (5, 'Painter'), (5, 'Electrician'), (5, 'Mason');
  `);

  // Mock completed jobs for worker 1 (Ravi Kumar) to showcase milestone badges safely
  const raviJobs = db.prepare("SELECT COUNT(*) as count FROM job_applications WHERE worker_id = 1").get() as { count: number };
  if (raviJobs.count < 10) {
    const insertMockJob = db.prepare(`
      INSERT INTO jobs (contractor_id, skill, location, location_lat, location_lng, date, time, salary, workers_needed, description, status)
      VALUES (?, ?, 'Bengaluru', 19.076, 72.877, '2025-01-01', '09:00', 1000, 1, 'Mock past job', 'completed')
    `);
    const insertMockApp = db.prepare(`
      INSERT INTO job_applications (job_id, worker_id, status)
      VALUES (?, 1, 'accepted')
    `);

    // We use contractor_id = 6 (Mahesh BuildCo)
    try {
      db.transaction(() => {
        // Bronze Mason (12 jobs)
        for (let i = 0; i < 12; i++) {
          const res = insertMockJob.run(6, 'Mason');
          insertMockApp.run(res.lastInsertRowid);
        }
        // Silver Painter (55 jobs)
        for (let i = 0; i < 55; i++) {
          const res = insertMockJob.run(6, 'Painter');
          insertMockApp.run(res.lastInsertRowid);
        }
        // Gold Plumber (101 jobs)
        for (let i = 0; i < 101; i++) {
          const res = insertMockJob.run(6, 'Plumber');
          insertMockApp.run(res.lastInsertRowid);
        }
      })();
    } catch (e) {
      console.error("Failed to seed mock badge data", e);
    }
  }

  // --- Map Dummy Data Injection ---
  // Expand worker and job maps securely with precisely mapped exact real-world Mumbai landmarks!
  const hasMapDummies = db.prepare("SELECT COUNT(*) as count FROM users WHERE name = 'Gateway Worker'").get() as { count: number };
  if (hasMapDummies.count === 0) {
    try {
      const insertUser = db.prepare(`
        INSERT INTO users (name, phone, role, location, location_lat, location_lng, skill, preferred_days, rating)
        VALUES (@name, @phone, 'worker', 'Mumbai', @lat, @lng, @skill, 'Mon, Wed, Fri', @rating)
      `);
      const insertWs = db.prepare("INSERT OR IGNORE INTO worker_skills (worker_id, skill_name) VALUES (?, ?)");
      const insertJob = db.prepare(`
        INSERT INTO jobs (contractor_id, skill, location, location_lat, location_lng, date, time, salary, workers_needed, description, status)
        VALUES (6, @skill, 'Mumbai', @lat, @lng, '2025-04-10', '09:00', @salary, @workers, @desc, 'open')
      `);

      db.transaction(() => {
        const dummyWorkers = [
          { name: "Gateway Worker", phone: "9800000021", lat: 18.9220, lng: 72.8347, skill: "Plumber", rating: 4.5 },
          { name: "S.G.N.P Worker", phone: "9800000022", lat: 19.2147, lng: 72.9106, skill: "Electrician", rating: 4.8 },
          { name: "Dharavi Worker", phone: "9800000023", lat: 19.0440, lng: 72.8570, skill: "Carpenter", rating: 4.2 },
          { name: "Hiranandani Worker", phone: "9800000024", lat: 19.2560, lng: 72.9680, skill: "Painter", rating: 4.6 },
          { name: "Ghodbunder Worker", phone: "9800000025", lat: 19.2600, lng: 72.9500, skill: "Mason", rating: 4.9 },
          { name: "Kopri Worker", phone: "9800000026", lat: 19.1925, lng: 72.9800, skill: "Plumber", rating: 4.1 },
          { name: "Bandra Worker", phone: "9800000027", lat: 19.0467, lng: 72.8155, skill: "Helper", rating: 4.7 },
          { name: "Juhu Worker", phone: "9800000028", lat: 19.0974, lng: 72.8255, skill: "Electrician", rating: 4.4 },
          { name: "Andheri Worker", phone: "9800000029", lat: 19.1197, lng: 72.8464, skill: "Carpenter", rating: 4.3 },
          { name: "Powai Worker", phone: "9800000030", lat: 19.1272, lng: 72.9051, skill: "Mason", rating: 4.8 }
        ];

        for (const w of dummyWorkers) {
          const res = insertUser.run(w);
          insertWs.run(res.lastInsertRowid, w.skill);
        }

        const dummyJobs = [
          { skill: "Plumber", lat: 18.9430, lng: 72.8238, salary: 900, workers: 2, desc: "Marine Drive Renovation" },
          { skill: "Electrician", lat: 18.9398, lng: 72.8355, salary: 1100, workers: 1, desc: "CST Station Lighting" },
          { skill: "Carpenter", lat: 18.9256, lng: 72.8232, salary: 1000, workers: 3, desc: "Nariman Point Office Fitout" },
          { skill: "Painter", lat: 19.0896, lng: 72.8656, salary: 850, workers: 4, desc: "Mumbai Airport T2 Touchup" },
          { skill: "Mason", lat: 19.2070, lng: 72.9720, salary: 950, workers: 5, desc: "Viviana Mall Plastering" },
          { skill: "Plumber", lat: 19.2294, lng: 72.8593, salary: 950, workers: 1, desc: "Borivali Gate Piping" },
          { skill: "Helper", lat: 19.0654, lng: 72.8656, salary: 600, workers: 10, desc: "BKC Core Hauling" },
          { skill: "Electrician", lat: 19.0163, lng: 72.8166, salary: 1200, workers: 2, desc: "Worli Sea Face Cabling" },
          { skill: "Carpenter", lat: 18.9224, lng: 72.8286, salary: 1050, workers: 2, desc: "Colaba Pathway Prep" },
          { skill: "Mason", lat: 19.1726, lng: 72.8340, salary: 1000, workers: 4, desc: "Malad Inorbit Brickwork" }
        ];

        for (const j of dummyJobs) {
          insertJob.run(j);
        }

      })();
    } catch (e) {
      console.error("Failed to inject standalone map exact landmark mock data", e);
    }
  }
}
