"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, Calculator, Gauge, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Scenario = "Bull Market" | "Bear Market" | "High Volatility" | "Stable Market";

const scenarioProfiles: Record<Scenario, { drift: number; volatility: number; crash: number }> = {
  "Bull Market": { drift: 1.15, volatility: 0.7, crash: 0.04 },
  "Bear Market": { drift: 0.55, volatility: 1.15, crash: 0.22 },
  "High Volatility": { drift: 0.9, volatility: 1.8, crash: 0.16 },
  "Stable Market": { drift: 0.85, volatility: 0.35, crash: 0.03 }
};

function formatRupee(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function buildSimulation(
  monthlySip: number,
  years: number,
  expectedReturn: number,
  volatilityLevel: number,
  scenario: Scenario
) {
  const months = Math.max(1, years * 12);
  const profile = scenarioProfiles[scenario];
  let value = 0;
  const rows = [];
  const monthlyReturn = (expectedReturn / 100 / 12) * profile.drift;
  const crashStart = Math.floor(months * 0.34);
  const crashEnd = Math.min(months - 1, crashStart + Math.max(2, Math.floor(months * 0.08)));

  for (let month = 1; month <= months; month += 1) {
    const wave =
      Math.sin(month / 2.8) * (volatilityLevel / 100) * profile.volatility +
      Math.cos(month / 7) * (volatilityLevel / 180);
    const crashDrag = month >= crashStart && month <= crashEnd ? -profile.crash / 3 : 0;
    const recovery = month > crashEnd ? Math.min(0.018, (month - crashEnd) / months / 7) : 0;
    value = Math.max(0, value * (1 + monthlyReturn + wave + crashDrag + recovery) + monthlySip);
    rows.push({
      month,
      year: Math.max(1, Math.ceil(month / 12)),
      invested: monthlySip * month,
      value: Math.round(value),
      crash: month >= crashStart && month <= crashEnd ? Math.round(value) : null
    });
  }

  return rows;
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#53618f]">{label}</span>
        <span className="rounded-full bg-[#eef3ff] px-3 py-1 text-sm font-black text-[#4058ff]">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-[#4058ff]"
      />
      <div className="flex justify-between text-xs font-semibold text-[#8993b5]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </label>
  );
}

export function SipSimulator() {
  const [monthlySip, setMonthlySip] = useState(10000);
  const [years, setYears] = useState(10);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [volatilityLevel, setVolatilityLevel] = useState(18);
  const [scenario, setScenario] = useState<Scenario>("High Volatility");

  const data = useMemo(
    () => buildSimulation(monthlySip, years, expectedReturn, volatilityLevel, scenario),
    [monthlySip, years, expectedReturn, volatilityLevel, scenario]
  );
  const final = data[data.length - 1];
  const gain = Math.max(0, (final?.value ?? 0) - (final?.invested ?? 0));

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-[#eef3ff] text-[#4058ff]">
              <Calculator size={19} />
            </div>
            <div>
              <p className="text-sm font-bold uppercase text-[#4058ff]">Interactive SIP Tool</p>
              <CardTitle className="mt-1">Adjust the growth assumptions</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ControlSlider
            label="Monthly SIP Amount"
            value={monthlySip}
            min={1000}
            max={100000}
            step={1000}
            display={formatRupee(monthlySip)}
            onChange={setMonthlySip}
          />
          <ControlSlider
            label="Investment Duration"
            value={years}
            min={1}
            max={30}
            display={`${years} years`}
            onChange={setYears}
          />
          <ControlSlider
            label="Expected Annual Return"
            value={expectedReturn}
            min={4}
            max={22}
            display={`${expectedReturn}%`}
            onChange={setExpectedReturn}
          />
          <ControlSlider
            label="Volatility Level"
            value={volatilityLevel}
            min={1}
            max={35}
            display={`${volatilityLevel}%`}
            onChange={setVolatilityLevel}
          />

          <div>
            <p className="mb-2 text-sm font-bold text-[#53618f]">Market Scenario</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(scenarioProfiles) as Scenario[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={scenario === item ? "default" : "secondary"}
                  onClick={() => setScenario(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-[#4058ff]">Compounding and Volatility</p>
              <CardTitle className="mt-2 text-2xl">Projected SIP journey under {scenario}</CardTitle>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md bg-[#eef3ff] p-3">
                <p className="font-semibold text-[#53618f]">Invested</p>
                <p className="text-lg font-black text-[#17215a]">{formatRupee(final?.invested ?? 0)}</p>
              </div>
              <div className="rounded-md bg-[#eafcff] p-3">
                <p className="font-semibold text-[#53618f]">Projected</p>
                <p className="text-lg font-black text-[#17215a]">{formatRupee(final?.value ?? 0)}</p>
              </div>
              <div className="rounded-md bg-[#f4f0ff] p-3">
                <p className="font-semibold text-[#53618f]">Potential Gain</p>
                <p className="text-lg font-black text-[#17215a]">{formatRupee(gain)}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[420px]">
            <ResponsiveContainer>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="portfolio" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#4058ff" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#4058ff" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                <XAxis dataKey="year" stroke="#69749e" tickFormatter={(value) => `Y${value}`} />
                <YAxis stroke="#69749e" tickFormatter={(value) => `${Math.round(Number(value) / 100000)}L`} />
                <Tooltip
                  formatter={(value: number | string, name: string) => [
                    formatRupee(Number(value)),
                    name
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.month ? `Month ${payload[0].payload.month}` : "Projected month"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Projected value"
                  stroke="#4058ff"
                  fill="url(#portfolio)"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Invested amount"
                  stroke="#18a9c8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="crash"
                  name="Volatility phase"
                  stroke="#ff6fa3"
                  strokeWidth={4}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-[#f6f9ff] p-4">
              <Gauge className="mb-2 text-[#4058ff]" size={20} />
              <p className="font-bold text-[#17215a]">Volatility impact</p>
              <p className="mt-1 text-sm leading-6 text-[#53618f]">
                Short-term dips can appear inside a longer compounding path.
              </p>
            </div>
            <div className="rounded-lg bg-[#f6f9ff] p-4">
              <TrendingUp className="mb-2 text-[#18a9c8]" size={20} />
              <p className="font-bold text-[#17215a]">Compounding view</p>
              <p className="mt-1 text-sm leading-6 text-[#53618f]">
                The invested line shows contribution discipline over time.
              </p>
            </div>
            <div className="rounded-lg bg-[#f6f9ff] p-4">
              <Activity className="mb-2 text-[#8c6dff]" size={20} />
              <p className="font-bold text-[#17215a]">Behaviour lesson</p>
              <p className="mt-1 text-sm leading-6 text-[#53618f]">
                The tool is educational and does not predict guaranteed returns.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
