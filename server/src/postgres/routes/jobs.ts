import { Router } from "express";
import type { Request, Response } from "express";
import { pool } from "../db.js";

type JobStatus = "open" | "closed";

interface JobPayload {
  contractor_id?: number;
  skill_required?: string;
  location?: string;
  date?: string;
  salary?: number;
  workers_needed?: number;
  description?: string;
  status?: JobStatus;
}

const router = Router();

function validateCreateBody(body: JobPayload) {
  const errors: string[] = [];

  if (!body.contractor_id || body.contractor_id <= 0) {
    errors.push("contractor_id must be a positive number");
  }
  if (!body.skill_required?.trim()) {
    errors.push("skill_required is required");
  }
  if (!body.location?.trim()) {
    errors.push("location is required");
  }
  if (!body.date || Number.isNaN(Date.parse(body.date))) {
    errors.push("date must be a valid date");
  }
  if (body.salary === undefined || Number(body.salary) <= 0) {
    errors.push("salary must be a positive number");
  }
  if (!body.workers_needed || body.workers_needed <= 0) {
    errors.push("workers_needed must be a positive number");
  }

  return errors;
}

function validateStatusBody(body: JobPayload) {
  const errors: string[] = [];
  if (!body.status || !["open", "closed"].includes(body.status)) {
    errors.push("status must be either open or closed");
  }
  return errors;
}

router.post("/", async (request: Request, response: Response) => {
  try {
    const payload = request.body as JobPayload;
    const errors = validateCreateBody(payload);

    if (errors.length) {
      return response.status(400).json({ message: "Validation failed", errors });
    }

    const query = `
      INSERT INTO jobs (
        contractor_id,
        skill_required,
        location,
        date,
        salary,
        workers_needed,
        description,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'open'))
      RETURNING *
    `;

    const values = [
      payload.contractor_id,
      payload.skill_required?.trim(),
      payload.location?.trim(),
      payload.date,
      payload.salary,
      payload.workers_needed,
      payload.description?.trim() || null,
      payload.status
    ];

    const result = await pool.query(query, values);
    return response.status(201).json({
      message: "Job created successfully",
      job: result.rows[0]
    });
  } catch (error) {
    return response.status(500).json({
      message: "Failed to create job",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/", async (_request: Request, response: Response) => {
  try {
    const result = await pool.query("SELECT * FROM jobs ORDER BY date ASC, id DESC");
    return response.json({
      message: "Jobs fetched successfully",
      jobs: result.rows
    });
  } catch (error) {
    return response.status(500).json({
      message: "Failed to fetch jobs",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get("/:id", async (request: Request, response: Response) => {
  try {
    const jobId = Number(request.params.id);

    if (!jobId) {
      return response.status(400).json({ message: "Invalid job id" });
    }

    const result = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);

    if (!result.rows.length) {
      return response.status(404).json({ message: "Job not found" });
    }

    return response.json({
      message: "Job fetched successfully",
      job: result.rows[0]
    });
  } catch (error) {
    return response.status(500).json({
      message: "Failed to fetch job",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.put("/:id", async (request: Request, response: Response) => {
  try {
    const jobId = Number(request.params.id);
    const payload = request.body as JobPayload;

    if (!jobId) {
      return response.status(400).json({ message: "Invalid job id" });
    }

    const errors = validateStatusBody(payload);
    if (errors.length) {
      return response.status(400).json({ message: "Validation failed", errors });
    }

    const result = await pool.query("UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *", [
      payload.status,
      jobId
    ]);

    if (!result.rows.length) {
      return response.status(404).json({ message: "Job not found" });
    }

    return response.json({
      message: "Job status updated successfully",
      job: result.rows[0]
    });
  } catch (error) {
    return response.status(500).json({
      message: "Failed to update job",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.delete("/:id", async (request: Request, response: Response) => {
  try {
    const jobId = Number(request.params.id);

    if (!jobId) {
      return response.status(400).json({ message: "Invalid job id" });
    }

    const result = await pool.query("DELETE FROM jobs WHERE id = $1 RETURNING *", [jobId]);

    if (!result.rows.length) {
      return response.status(404).json({ message: "Job not found" });
    }

    return response.json({
      message: "Job deleted successfully",
      job: result.rows[0]
    });
  } catch (error) {
    return response.status(500).json({
      message: "Failed to delete job",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
