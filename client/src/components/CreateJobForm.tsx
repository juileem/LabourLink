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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const formatAMPM = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const handleCreate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.skill) newErrors.skill = "Skill is required";
    if (!form.location) newErrors.location = "Location is required";
    if (!form.date) newErrors.date = "Please select a date";
    if (!form.time) newErrors.time = "Please select a time";
    if (!form.salary) newErrors.salary = "Salary cannot be empty";
    if (!form.workers_needed) newErrors.workers_needed = "Number of workers required";

    if (form.date) {
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "Job date cannot be in the past";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onCreate({
      ...form,
      contractor_id: contractorId,
      time: formatAMPM(form.time),
      salary: Number(form.salary),
      workers_needed: Number(form.workers_needed)
    });
  };

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
          error={errors.skill}
          onChange={(event) => updateField("skill", event.target.value)}
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
          error={errors.location}
          onChange={(event) => updateField("location", event.target.value)}
        />
        <Input
          label="Date"
          type="date"
          value={form.date}
          error={errors.date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(event) => updateField("date", event.target.value)}
        />
        <Input
          label="Time"
          type="time"
          value={form.time}
          error={errors.time}
          onChange={(event) => updateField("time", event.target.value)}
        />
        <Input
          label="Salary"
          type="number"
          value={form.salary}
          error={errors.salary}
          onChange={(event) => updateField("salary", event.target.value)}
        />
        <Input
          label="Workers Needed"
          type="number"
          value={form.workers_needed}
          error={errors.workers_needed}
          onChange={(event) => updateField("workers_needed", event.target.value)}
        />
        <div className="md:col-span-2">
          <Input
            label="Description"
            value={form.description}
            error={errors.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </div>
      </div>
      <Button
        className="mt-5"
        disabled={loading}
        onClick={handleCreate}
      >
        {loading ? "Posting..." : "Create Job Post"}
      </Button>
    </Card>
  );
}
