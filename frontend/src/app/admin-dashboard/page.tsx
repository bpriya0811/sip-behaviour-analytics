"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Loader2,
  LockKeyhole,
  LogOut,
  ShieldCheck
} from "lucide-react";

import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { QuestionManager } from "@/components/dashboard/QuestionManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCESS_KEY = "sip-researcher-access";

const tabs = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "questions", label: "Questions", icon: ClipboardList }
] as const;

type Tab = (typeof tabs)[number]["id"];
type AccessState = "checking" | "locked" | "granted";

function ResearcherAccessScreen({ onGranted }: { onGranted: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/researcher-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail ?? "Researcher access could not be verified.");
      }

      sessionStorage.setItem(ACCESS_KEY, "granted");
      onGranted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid researcher passcode.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-mesh-light px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4058ff]">
          <ArrowLeft size={16} /> Home
        </Link>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-lg border border-white/80 bg-white/82 p-7 shadow-fintech backdrop-blur-xl"
        >
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-md bg-[#eef3ff] text-[#4058ff]">
            <LockKeyhole size={25} />
          </div>
          <p className="text-sm font-bold uppercase text-[#4058ff]">Researcher Access</p>
          <h1 className="mt-3 text-3xl font-black text-[#17215a]">
            Protected research workspace
          </h1>
          <p className="mt-3 leading-7 text-[#53618f]">
            Enter the researcher passcode to manage analytics, survey questions,
            behaviour engine settings, and response outputs.
          </p>

          <label className="mt-6 block space-y-2">
            <span className="text-sm font-bold text-[#53618f]">Researcher passcode</span>
            <Input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Enter passcode"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="mt-4 rounded-md border border-[#ffd6e2] bg-[#fff3f7] px-4 py-3 text-sm font-semibold text-[#b32255]">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting || !passcode.trim()} className="mt-6 w-full">
            {submitting ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
            Unlock Dashboard
          </Button>
        </motion.form>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  const [active, setActive] = useState<Tab>("analytics");
  const [access, setAccess] = useState<AccessState>("checking");

  useEffect(() => {
    setAccess(sessionStorage.getItem(ACCESS_KEY) === "granted" ? "granted" : "locked");
  }, []);

  if (access === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-mesh-light px-4 text-[#53618f]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 animate-spin text-[#4058ff]" />
          Checking researcher access...
        </div>
      </main>
    );
  }

  if (access === "locked") {
    return <ResearcherAccessScreen onGranted={() => setAccess("granted")} />;
  }

  return (
    <main className="min-h-screen bg-mesh-light px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-6 flex flex-col gap-4 rounded-lg border border-white/70 bg-white/76 p-4 shadow-glass backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4058ff]">
              <ArrowLeft size={16} /> Home
            </Link>
            <h1 className="mt-3 text-3xl font-black text-[#17215a] sm:text-4xl">
              Research Analytics Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-[#53618f]">
              Protected researcher workspace for SIP behaviour analytics, question management,
              behaviour scoring, response management, and export-ready research outputs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/survey">Open Public Survey</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                sessionStorage.removeItem(ACCESS_KEY);
                setAccess("locked");
              }}
            >
              <LogOut size={16} /> Lock
            </Button>
          </div>
        </nav>

        <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-white/70 bg-white/76 p-2 shadow-glass backdrop-blur-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-bold transition",
                active === tab.id
                  ? "bg-[#4058ff] text-white shadow-fintech"
                  : "text-[#53618f] hover:bg-[#eef3ff] hover:text-[#4058ff]"
              )}
            >
              <tab.icon size={17} />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={active}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {active === "analytics" && <AnalyticsDashboard />}
          {active === "questions" && <QuestionManager />}
        </motion.div>
      </div>
    </main>
  );
}
