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
  `);

  try {
    db.exec(`ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'open'`);
  } catch (error) {
    // Ignore error if column already exists
  }


  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (!userCount.count) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, phone, role, location, skill, preferred_days, company_name, rating)
      VALUES (@name, @phone, @role, @location, @skill, @preferred_days, @company_name, @rating)
    `);

    insertUser.run({
      name: "Ravi Kumar",
      phone: "9000000001",
      role: "worker",
      location: "Bengaluru",
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
      skill: "Painter",
      preferred_days: "Mon, Wed, Fri, Sat",
      company_name: null,
      rating: 4.8
    });

    insertUser.run({
      name: "Mahesh BuildCo",
      phone: "9000000010",
      role: "contractor",
      location: "Bengaluru",
      skill: null,
      preferred_days: "",
      company_name: "BuildCo Infra",
      rating: 4.4
    });
  }

  const jobCount = db.prepare("SELECT COUNT(*) as count FROM jobs").get() as { count: number };
  if (!jobCount.count) {
    db.prepare(`
      INSERT INTO jobs (contractor_id, skill, location, date, time, salary, workers_needed, description)
      VALUES
        (3, 'Mason', 'Whitefield, Bengaluru', '2025-03-29', '08:00', 950, 3, 'Residential wall and plaster finishing.'),
        (3, 'Painter', 'Electronic City, Bengaluru', '2025-03-29', '09:30', 850, 2, 'Interior paint touch-up for office renovation.'),
        (3, 'Electrician', 'HSR Layout, Bengaluru', '2025-03-30', '10:00', 1200, 1, 'Wiring support for a retail fit-out.')
    `).run();
  }
}
