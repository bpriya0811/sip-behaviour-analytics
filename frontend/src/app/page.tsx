"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LineChart,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const awarenessTopics = [
  {
    icon: PiggyBank,
    title: "What SIP Investing Means",
    copy: "A Systematic Investment Plan helps investors put a fixed amount into mutual funds at regular intervals instead of trying to time the market."
  },
  {
    icon: TrendingUp,
    title: "Inflation and Wealth Creation",
    copy: "Long-term investing is often used to pursue growth that can stay ahead of rising living costs and future financial goals."
  },
  {
    icon: LineChart,
    title: "Power of Compounding",
    copy: "SIP outcomes can improve when investments remain active long enough for returns to participate in future growth."
  },
  {
    icon: CheckCircle2,
    title: "Disciplined Investing",
    copy: "A regular plan can reduce impulsive decisions and turn investing into a stable habit across different market phases."
  },
  {
    icon: Activity,
    title: "Market Volatility",
    copy: "Temporary declines, sharp rallies, and uncertainty can affect confidence, continuation decisions, and risk perception."
  },
  {
    icon: BrainCircuit,
    title: "Investor Psychology",
    copy: "Fear, patience, overconfidence, and loss reactions can influence whether investors continue, pause, or exit their SIPs."
  }
];

const researchReasons = [
  "Behavioural finance helps explain why investors with similar financial plans may make different decisions during uncertainty.",
  "SIP results depend not only on return expectations, but also on patience, consistency, and reactions to losses.",
  "Market volatility creates useful research signals because it reveals how people respond when confidence is tested.",
  "The collected data supports academic understanding of SIP decision patterns and investor psychology."
];

const participationHelp = [
  "Your responses support PhD research in behavioural finance.",
  "You contribute to a better understanding of SIP investor decision-making.",
  "Your behaviour profile helps connect investment discipline with market volatility response."
];

const flow = [
  {
    icon: ClipboardList,
    title: "Participate in Survey",
    copy: "Complete the public research questionnaire."
  },
  {
    icon: BrainCircuit,
    title: "Share Investment Behaviour",
    copy: "Describe SIP habits, risk comfort, and volatility reactions."
  },
  {
    icon: ShieldCheck,
    title: "Receive Investor Profile",
    copy: "View your behaviour score and investor type after submission."
  },
  {
    icon: GraduationCap,
    title: "Support Research",
    copy: "Help strengthen behavioural finance analysis for academic study."
  }
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f8fbff] text-[#17215a]">
      <section className="animated-gradient relative min-h-[88vh] px-4 py-6 sm:px-6 lg:px-8">
        <div className="finance-grid pointer-events-none absolute inset-0 opacity-80" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-lg border border-white/70 bg-white/68 px-4 py-3 shadow-glass backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[#4058ff] text-white">
              <LineChart size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#17215a]">SIP Behaviour</p>
              <p className="text-xs text-[#5f6b96]">PhD Research Platform</p>
            </div>
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium text-[#5f6b96] md:flex">
            <a href="#sip-awareness">SIP Awareness</a>
            <a href="#research-matters">Research</a>
            
            <Link href="/survey" className="font-bold text-[#4058ff]">
              Survey
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 pb-14 pt-14 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dbe3ff] bg-white/76 px-4 py-2 text-sm font-semibold text-[#4058ff] shadow-sm backdrop-blur">
              <Sparkles size={16} />
              PhD study on SIP behaviour and market volatility
            </div>
            <h1 className="text-4xl font-black leading-[1.04] text-[#121b4d] sm:text-5xl lg:text-7xl">
              Share your SIP behaviour for meaningful research.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#53618f] sm:text-xl">
              This platform studies how investor psychology, market volatility,
              and long-term SIP discipline shape investment decisions. Your
              participation helps build academic insight into behavioural finance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-14 px-7 text-base shadow-fintech">
                <Link href="/survey">
                  Participate in Research Survey <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-14 px-6">
                <a href="#research-matters">Why this research matters</a>
              </Button>
            </div>
            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["No login required", "Research focused", "Profile after submission"].map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-white/80 bg-white/70 px-4 py-3 text-sm font-bold text-[#53618f] shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-lg border border-white/76 bg-white/74 p-5 shadow-fintech backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase text-[#4058ff]">Research Participation</p>
                  <h2 className="mt-2 text-2xl font-black text-[#17215a]">
                    Your responses become behavioural finance data.
                  </h2>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#eef3ff] text-[#4058ff]">
                  <Users size={22} />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  ["SIP Discipline", "Do investors continue, reduce, or stop SIPs during volatile markets?"],
                  ["Risk Psychology", "How do fear, patience, and confidence shape investment action?"],
                  ["Investor Profile", "What behaviour type emerges from the respondent's decision pattern?"]
                ].map(([label, copy], index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.08 }}
                    className="rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-black text-[#17215a]">{label}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#4058ff]">
                        Step {index + 1}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-[#53618f]">{copy}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e4eaff]">
                      <motion.div
                        initial={{ width: "18%" }}
                        animate={{ width: `${58 + index * 16}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#4058ff] to-[#6edfff]"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="sip-awareness" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-[#4058ff]">SIP Awareness</p>
            <h2 className="mt-3 text-3xl font-black text-[#17215a] sm:text-4xl">
              SIP is a financial method, but continuing it is a behavioural decision.
            </h2>
            <p className="mt-4 leading-8 text-[#53618f]">
              These concepts help respondents connect everyday investment choices
              with the research themes of discipline, compounding, volatility, and
              investor psychology.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {awarenessTopics.map((item) => (
              <Card key={item.title} className="transition hover:-translate-y-1 hover:shadow-fintech">
                <CardHeader>
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-[#eef3ff] text-[#4058ff]">
                    <item.icon size={21} />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-[#5f6b96]">{item.copy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="research-matters" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#4058ff]">Why This Research Matters</p>
            <h2 className="mt-3 text-3xl font-black text-[#17215a] sm:text-4xl">
              Market volatility makes investor behaviour visible.
            </h2>
            <p className="mt-5 leading-8 text-[#53618f]">
              The study examines predictive analysis of SIP investment towards
              market volatility and investor behaviour. It focuses on how people
              decide, react, and stay disciplined when markets become uncertain.
            </p>
          </div>
          <div className="grid gap-4">
            {researchReasons.map((reason, index) => (
              <div key={reason} className="flex gap-4 rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#eef3ff] text-sm font-black text-[#4058ff]">
                  {index + 1}
                </div>
                <p className="leading-7 text-[#53618f]">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="rounded-lg border border-white/80 bg-white/76 p-6 shadow-glass backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-[#4058ff]">How Your Participation Helps</p>
                <h2 className="mt-2 text-3xl font-black text-[#17215a]">
                  Every completed survey strengthens the research sample.
                </h2>
              </div>
              <BookOpen className="hidden text-[#4058ff] sm:block" size={34} />
            </div>
            <div className="space-y-3">
              {participationHelp.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-md bg-[#f6f9ff] p-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[#4058ff]" size={19} />
                  <p className="text-sm font-semibold leading-6 text-[#53618f]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-[#4058ff] px-6 py-10 text-white shadow-fintech">
            <p className="text-sm font-bold uppercase text-[#dce6ff]">Primary Research Action</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Participate now and receive your investor behaviour profile.
            </h2>
            <p className="mt-4 leading-7 text-[#edf2ff]">
              The questionnaire is designed for research data collection and gives
              respondents a behaviour score, investor type, and insight summary
              immediately after submission.
            </p>
            <Button asChild className="mt-7 bg-white text-[#4058ff] hover:bg-[#eef3ff]" size="lg">
              <Link href="/survey">
                Participate in Research Survey <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-[#4058ff]">Participation Flow</p>
            <h2 className="mt-3 text-3xl font-black text-[#17215a] sm:text-4xl">
              A simple path from response to research contribution.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {flow.map((item, index) => (
              <div
                key={item.title}
                className="relative rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-5 shadow-sm"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-white text-[#4058ff] shadow-sm">
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-black text-[#9aa7c4]">0{index + 1}</span>
                </div>
                <h3 className="font-black text-[#17215a]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5f6b96]">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    

      <section id="researcher" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[#4058ff]">About Researcher</p>
            <h2 className="mt-2 text-3xl font-black text-[#17215a]">
              Priyanka Ramesh Bamane
            </h2>
            <p className="mt-2 text-[#53618f]">PhD Research Scholar | Business Analytics</p>
          </div>
          <Button asChild variant="secondary">
            <a
              href="https://portfolio-seven-nu-z0ofui1del.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Researcher Portfolio <ArrowRight size={16} />
            </a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#dfe6ff] bg-[#f8fbff] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#5f6b96] sm:flex-row sm:items-center sm:justify-between">
          <p>SIP Behaviour Analytics Platform</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/survey">Survey</Link>
            <a href="#sip-awareness">SIP Awareness</a>
            <Link href="/admin-dashboard" className="text-[#7b86aa]">
              Researcher Access
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
