import { BuildingOffice2Icon, IdentificationIcon, SparklesIcon, UserIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import { mockOtp, skills } from "../lib/constants";
import type { Role, User } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";
import { DaySelector } from "./DaySelector";
import { Input } from "./Input";
import { Select } from "./Select";

import { api } from "../lib/api";

interface AuthPanelProps {
  onSignup: (payload: Record<string, unknown>) => Promise<User>;
  onLogin: (payload: Record<string, unknown>) => Promise<User>;
  loading: boolean;
}

export function AuthPanel({ onSignup, onLogin, loading }: AuthPanelProps) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<Role>("worker");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed"]);
  const [error, setError] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: "",
    phone: "",
    company_name: "",
    location: "",
    skill: [skills[0]]
  });

  const panelTitle = useMemo(
    () => (mode === "signup" ? "Create your LabourLink account" : "Sign in with phone"),
    [mode]
  );

  const toggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day]
    );
  };

  const submitSignup = async () => {
    setError("");
    try {
      await onSignup({
        ...signupForm,
        role,
        preferred_days: role === "worker" ? selectedDays.join(", ") : ""
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Signup failed");
    }
  };

  const submitLogin = async () => {
    setError("");
    try {
      await onLogin({ phone: loginPhone, otp: loginOtp });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Login failed");
    }
  };

  const handleSendOtp = async () => {
    if (!loginPhone) {
      setError("Please enter a phone number first");
      return;
    }
    setError("");
    try {
      const result = await api.sendOtp<{ otp: string }>({ phone: loginPhone });
      setOtpSent(true);
      // For demo purposes, we will auto-fill the OTP so the user doesn't have to check console
      // Alternatively we can just alert them, but auto-fill is easiest for demo
      setLoginOtp(result.otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr]">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-2 text-sm text-brand-200">
          <SparklesIcon className="h-4 w-4" />
          Demo-ready hiring for daily wage work
        </div>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Connect skilled construction workers with contractors in minutes.
          </h1>
          <p className="max-w-xl text-base text-stone-300 sm:text-lg">
            Fast phone-based onboarding, job matching, worker selection, and role-based dashboards
            designed for mobile-first field operations.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <IdentificationIcon className="h-8 w-8 text-brand-300" />
            <p className="mt-4 text-lg font-semibold text-white">Simple onboarding</p>
            <p className="mt-2 text-sm text-stone-400">Password login keeps the demo flow quick.</p>
          </Card>
          <Card>
            <UserIcon className="h-8 w-8 text-brand-300" />
            <p className="mt-4 text-lg font-semibold text-white">Worker-first design</p>
            <p className="mt-2 text-sm text-stone-400">Availability, ratings, and job acceptance in one flow.</p>
          </Card>
          <Card>
            <BuildingOffice2Icon className="h-8 w-8 text-brand-300" />
            <p className="mt-4 text-lg font-semibold text-white">Contractor control</p>
            <p className="mt-2 text-sm text-stone-400">Post jobs and select workers from applicants.</p>
          </Card>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex rounded-2xl bg-stone-950/80 p-1 ring-1 ring-white/10">
          <button
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              mode === "signup" ? "bg-brand-500 text-white" : "text-stone-400"
            }`}
            onClick={() => setMode("signup")}
          >
            Signup
          </button>
          <button
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              mode === "login" ? "bg-brand-500 text-white" : "text-stone-400"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-300">{mode}</p>
            <h2 className="mt-2 text-2xl font-bold text-white">{panelTitle}</h2>
            <p className="mt-2 text-sm text-stone-400">Use password `1234` for all demo logins.</p>
          </div>

          {mode === "signup" ? (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-stone-950/80 p-1 ring-1 ring-white/10">
                {(["worker", "contractor"] as Role[]).map((nextRole) => (
                  <button
                    key={nextRole}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold capitalize transition ${
                      role === nextRole ? "bg-brand-500 text-white" : "text-stone-400"
                    }`}
                    onClick={() => setRole(nextRole)}
                  >
                    {nextRole}
                  </button>
                ))}
              </div>
              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={signupForm.name}
                onChange={(event) => setSignupForm((current) => ({ ...current, name: event.target.value }))}
              />
              <Input
                label="Phone Number"
                placeholder="9876543210"
                value={signupForm.phone}
                onChange={(event) => setSignupForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <Input
                label="Location"
                placeholder="City or neighborhood"
                value={signupForm.location}
                onChange={(event) =>
                  setSignupForm((current) => ({ ...current, location: event.target.value }))
                }
              />
              {role === "worker" ? (
                <>
                  <Select
                    label="Primary Skills"
                    multiple
                    value={signupForm.skill}
                    onChange={(event) => {
                      const options = Array.from(event.target.selectedOptions);
                      const values = options.map((option) => option.value);
                      setSignupForm((current) => ({ ...current, skill: values }));
                    }}
                    className="h-32"
                  >
                    {skills.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-stone-500 mt-1 mb-3">Hold Cmd/Ctrl to select multiple.</p>
                  <DaySelector selectedDays={selectedDays} onToggle={toggleDay} />
                </>
              ) : (
                <Input
                  label="Company Name"
                  placeholder="Optional company name"
                  value={signupForm.company_name}
                  onChange={(event) =>
                    setSignupForm((current) => ({ ...current, company_name: event.target.value }))
                  }
                />
              )}
              <Button block disabled={loading} onClick={submitSignup}>
                {loading ? "Creating account..." : `Create ${role} account`}
              </Button>
            </>
          ) : (
            <>
              <Input
                label="Phone Number"
                placeholder="Enter registered phone"
                value={loginPhone}
                onChange={(event) => {
                  setLoginPhone(event.target.value);
                  setOtpSent(false); // Reset OTP state if phone changes
                }}
              />
              {!otpSent ? (
                <Button block disabled={loading || !loginPhone} onClick={() => void handleSendOtp()}>
                  {loading ? "Loading..." : "Enter Password"}
                </Button>
              ) : (
                <>
                  <Input
                    label="Password"
                    placeholder="Enter the password (or 1234)"
                    value={loginOtp}
                    onChange={(event) => setLoginOtp(event.target.value)}
                  />
                  <Button block disabled={loading} onClick={submitLogin}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </>
              )}
            </>
          )}

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </div>
      </Card>
    </div>
  );
}
