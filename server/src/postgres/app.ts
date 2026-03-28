import cors from "cors";
import express from "express";
import jobsRouter from "./routes/jobs.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, database: "postgres" });
});

app.use("/jobs", jobsRouter);

const port = Number(process.env.PORT ?? 5000);

app.listen(port, () => {
  console.log(`PostgreSQL API listening on http://localhost:${port}`);
});
