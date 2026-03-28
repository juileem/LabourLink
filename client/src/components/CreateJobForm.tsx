import { useState } from "react";
import { skills } from "../lib/constants";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";
import { Select } from "./Select";

interface CreateJobFormProps {
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  contractorId: number;
  loading: boolean;
}

export function CreateJobForm({ onCreate, contractorId, loading }: CreateJobFormProps) {
  const [form, setForm] = useState({
    contractor_id: contractorId,
    skill: skills[0],
    location: "",
    date: "",
    time: "",
    salary: "",
    workers_needed: "1",
    description: ""
  });

  return (
    <Card>
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.24em] text-brand-300">Create Job</p>
        <h3 className="mt-2 text-2xl font-bold text-white">Post a new requirement</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Skill Required"
          value={form.skill}
          onChange={(event) => setForm((current) => ({ ...current, skill: event.target.value }))}
        >
          {skills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </Select>
        <Input
          label="Location"
          value={form.location}
          onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
        />
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
        />
        <Input
          label="Time"
          type="time"
          value={form.time}
          onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
        />
        <Input
          label="Salary"
          type="number"
          value={form.salary}
          onChange={(event) => setForm((current) => ({ ...current, salary: event.target.value }))}
        />
        <Input
          label="Workers Needed"
          type="number"
          value={form.workers_needed}
          onChange={(event) =>
            setForm((current) => ({ ...current, workers_needed: event.target.value }))
          }
        />
        <div className="md:col-span-2">
          <Input
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </div>
      </div>
      <Button
        className="mt-5"
        disabled={loading}
        onClick={() =>
          onCreate({
            ...form,
            contractor_id: contractorId,
            salary: Number(form.salary),
            workers_needed: Number(form.workers_needed)
          })
        }
      >
        {loading ? "Posting..." : "Create Job Post"}
      </Button>
    </Card>
  );
}
