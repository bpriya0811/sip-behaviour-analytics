"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  BarChart3,
  Download,
  FileDown,
  ImageDown,
  IndianRupee,
  Layers,
  Loader2,
  Map,
  MapPin,
  Search,
  Shield,
  Trophy,
  TrendingUp,
  Users,
  type LucideIcon
} from "lucide-react";

import { exportUrl, fetchAnalytics } from "@/lib/api";
import { DISTRICTS, talukasForDistrict } from "@/lib/geography";
import type { AnalyticsSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const colors = ["#4058ff", "#8c8cff", "#54d9f6", "#71e2b7", "#ff7fb1", "#6b7cff"];

type TalukaSort = "rank" | "name" | "district" | "value";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function MiniCard({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="transition hover:-translate-y-1 hover:shadow-fintech">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-sm font-semibold text-[#5f6b96]">{title}</p>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-[#eef3ff] text-[#4058ff]">
          <Icon size={19} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="break-words text-2xl font-black text-[#17215a] sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-64 place-items-center rounded-lg border border-dashed border-[#cfd8ff] bg-[#f7faff] text-sm font-semibold text-[#69749e]">
      No responses yet
    </div>
  );
}

function ChartCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">{children}</div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");
  const [talukaSort, setTalukaSort] = useState<TalukaSort>("rank");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics({ district: districtFilter, taluka: talukaFilter })
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [districtFilter, talukaFilter]);

  const talukaOptions = useMemo(
    () => talukasForDistrict(districtFilter),
    [districtFilter]
  );

  useEffect(() => {
    if (talukaFilter && !talukaOptions.includes(talukaFilter)) {
      setTalukaFilter("");
    }
  }, [talukaFilter, talukaOptions]);

  const filteredCharts = useMemo(() => {
    if (!summary || !search.trim()) return summary?.charts;
    const q = search.toLowerCase();
    const filterByName = <T extends { name: string }>(items: T[]) =>
      items.filter((item) => item.name.toLowerCase().includes(q));
    return {
      ...summary.charts,
      riskDistribution: filterByName(summary.charts.riskDistribution),
      mostMentionedStocks: filterByName(summary.charts.mostMentionedStocks),
      marketCrashReaction: filterByName(summary.charts.marketCrashReaction),
      sipContinuation: filterByName(summary.charts.sipContinuation),
      investmentGoals: filterByName(summary.charts.investmentGoals),
      behaviourCategories: filterByName(summary.charts.behaviourCategories)
    };
  }, [search, summary]);

  const visibleTalukas = useMemo(() => {
    const rows = summary?.geography.talukaDistribution ?? [];
    const q = search.trim().toLowerCase();
    const searched = q
      ? rows.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            String(item.district ?? "").toLowerCase().includes(q)
        )
      : rows;
    return [...searched].sort((a, b) => {
      if (talukaSort === "rank") return (a.rank ?? 0) - (b.rank ?? 0);
      if (talukaSort === "value") return b.value - a.value || a.name.localeCompare(b.name);
      return String(a[talukaSort] ?? "").localeCompare(String(b[talukaSort] ?? ""));
    });
  }, [search, summary, talukaSort]);

  const downloadChartImage = async () => {
    const node = document.getElementById("analytics-board");
    if (!node) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(node, {
      backgroundColor: "#f8fbff",
      scale: 2
    });
    const link = document.createElement("a");
    link.download = "sip-behaviour-analytics-dashboard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) {
    return (
      <div className="grid min-h-96 place-items-center text-[#53618f]">
        <Loader2 className="mb-3 animate-spin" />
        Loading analytics dashboard...
      </div>
    );
  }

  if (!summary || !filteredCharts) {
    return (
      <div className="rounded-lg border border-[#ffd6e2] bg-[#fff3f7] p-4 text-sm font-semibold text-[#b32255]">
        Analytics could not be loaded. Please make sure the backend API is running.
      </div>
    );
  }

  const { overview } = summary;
  const { geography } = summary;
  const currentFilters = { district: districtFilter, taluka: talukaFilter };

  return (
    <div id="analytics-board" className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniCard title="Total Respondents" value={`${overview.totalRespondents}`} icon={Users} />
        <MiniCard
          title="Average SIP Amount"
          value={`Rs. ${money(overview.averageSipAmount)}`}
          icon={IndianRupee}
        />
        <MiniCard title="Most Mentioned Large-Cap Stock" value={overview.mostMentionedStock} icon={TrendingUp} />
        <MiniCard title="Average Risk Score" value={`${overview.averageRiskScore}/10`} icon={Shield} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MiniCard
          title="Kolhapur Responses"
          value={`${geography.summary.kolhapurResponses}`}
          icon={MapPin}
        />
        <MiniCard
          title="Sangli Responses"
          value={`${geography.summary.sangliResponses}`}
          icon={Map}
        />
        <MiniCard
          title="Most Represented Taluka"
          value={geography.summary.mostRepresentedTaluka}
          icon={Trophy}
        />
        <MiniCard
          title="Least Represented Taluka"
          value={geography.summary.leastRepresentedTaluka}
          icon={Layers}
        />
        <MiniCard
          title="Taluka Coverage"
          value={`${geography.summary.talukasCovered} / ${geography.summary.talukasTotal}`}
          icon={BarChart3}
        />
        <MiniCard
          title="Filtered Responses"
          value={`${geography.summary.totalResponses}`}
          icon={Users}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 lg:max-w-4xl lg:grid-cols-[1.3fr_0.8fr_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a84aa]" size={17} />
              <Input
                className="pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chart labels, stocks, goals, talukas..."
              />
            </div>
            <select
              value={districtFilter}
              onChange={(event) => {
                setDistrictFilter(event.target.value);
                setTalukaFilter("");
              }}
              className="h-11 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 text-sm font-semibold text-[#17215a] outline-none transition focus:border-[#7d8dff] focus:ring-4 focus:ring-[#dfe5ff]"
              aria-label="District filter"
            >
              <option value="">All Districts</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <select
              value={talukaFilter}
              onChange={(event) => setTalukaFilter(event.target.value)}
              className="h-11 w-full rounded-md border border-[#d8defe] bg-white/90 px-3 text-sm font-semibold text-[#17215a] outline-none transition focus:border-[#7d8dff] focus:ring-4 focus:ring-[#dfe5ff]"
              aria-label="Taluka filter"
            >
              <option value="">All Talukas</option>
              {talukaOptions.map((taluka) => (
                <option key={taluka} value={taluka}>
                  {taluka}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={exportUrl("csv", currentFilters)}>
                <Download size={16} /> CSV
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={exportUrl("excel", currentFilters)}>
                <FileDown size={16} /> Excel
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={exportUrl("pdf", currentFilters)}>
                <FileDown size={16} /> PDF Summary
              </a>
            </Button>
            <Button type="button" variant="soft" size="sm" onClick={downloadChartImage}>
              <ImageDown size={16} /> Chart Image
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold uppercase text-[#4058ff]">Geographic Analytics</p>
          <h2 className="mt-1 text-2xl font-black text-[#17215a]">District and Taluka Sampling</h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="District Distribution">
            {geography.districtDistribution.some((item) => item.value > 0) ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={geography.districtDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {geography.districtDistribution.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">District Response Share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="h-52">
                {geography.districtDistribution.some((item) => item.value > 0) ? (
                  <ResponsiveContainer>
                    <BarChart data={geography.districtDistribution}>
                      <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                      <XAxis dataKey="name" stroke="#69749e" />
                      <YAxis stroke="#69749e" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#4058ff" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {geography.districtDistribution.map((item) => (
                  <div key={item.name} className="rounded-lg border border-[#dfe6ff] bg-[#f8fbff] p-4">
                    <p className="text-sm font-bold text-[#53618f]">{item.name}</p>
                    <p className="mt-1 text-2xl font-black text-[#17215a]">
                      {item.value} <span className="text-base text-[#69749e]">({percent(item.percentage)})</span>
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ChartCard title="Taluka Response Distribution">
            {visibleTalukas.length ? (
              <ResponsiveContainer>
                <BarChart data={visibleTalukas.slice(0, 12)}>
                  <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                  <XAxis dataKey="name" stroke="#69749e" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#69749e" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8c8cff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Taluka Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {visibleTalukas.length ? (
                <div className="max-h-72 overflow-auto rounded-lg border border-[#dfe6ff]">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-[#eef3ff] text-[#4058ff]">
                      <tr>
                        {[
                          ["rank", "Rank"],
                          ["name", "Taluka"],
                          ["district", "District"],
                          ["value", "Responses"]
                        ].map(([key, label]) => (
                          <th key={key} className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setTalukaSort(key as TalukaSort)}
                              className="font-black"
                            >
                              {label}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e9ff] bg-white/80 text-[#26336e]">
                      {visibleTalukas.map((item) => (
                        <tr key={`${item.district}-${item.name}`}>
                          <td className="px-4 py-3 font-bold">{item.rank}</td>
                          <td className="px-4 py-3 font-semibold">{item.name}</td>
                          <td className="px-4 py-3">{item.district}</td>
                          <td className="px-4 py-3 font-black text-[#4058ff]">{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyChart />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Age vs SIP Amount">
          {filteredCharts.ageVsSip.length ? (
            <ResponsiveContainer>
              <LineChart data={filteredCharts.ageVsSip}>
                <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                <XAxis dataKey="age" stroke="#69749e" />
                <YAxis stroke="#69749e" />
                <Tooltip />
                <Line type="monotone" dataKey="sip" stroke="#4058ff" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Risk Appetite Distribution">
          {filteredCharts.riskDistribution.some((item) => item.value > 0) ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={filteredCharts.riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {filteredCharts.riskDistribution.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Most Mentioned Stocks">
          {filteredCharts.mostMentionedStocks.length ? (
            <ResponsiveContainer>
              <BarChart data={filteredCharts.mostMentionedStocks}>
                <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#69749e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#69749e" />
                <Tooltip />
                <Bar dataKey="value" fill="#4058ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Market Crash Reaction Analysis">
          {filteredCharts.marketCrashReaction.length ? (
            <ResponsiveContainer>
              <BarChart data={filteredCharts.marketCrashReaction}>
                <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#69749e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#69749e" />
                <Tooltip />
                <Bar dataKey="value" fill="#8c8cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="SIP Continuation Trends">
          {filteredCharts.sipContinuation.length ? (
            <ResponsiveContainer>
              <AreaChart data={filteredCharts.sipContinuation}>
                <defs>
                  <linearGradient id="sipTrend" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#54d9f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#54d9f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#69749e" />
                <YAxis stroke="#69749e" />
                <Tooltip />
                <Area dataKey="value" stroke="#18a9c8" fill="url(#sipTrend)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Investment Goal Distribution">
          {filteredCharts.investmentGoals.length ? (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={filteredCharts.investmentGoals} dataKey="value" nameKey="name" outerRadius={105}>
                  {filteredCharts.investmentGoals.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Behaviour Category Analysis">
          {filteredCharts.behaviourCategories.length ? (
            <ResponsiveContainer>
              <BarChart data={filteredCharts.behaviourCategories}>
                <CartesianGrid stroke="#e1e7ff" strokeDasharray="4 4" />
                <XAxis dataKey="name" stroke="#69749e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#69749e" />
                <Tooltip />
                <Bar dataKey="value" fill="#71e2b7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="text-[#4058ff]" />
              <CardTitle className="text-xl">Research Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="leading-7 text-[#53618f]">
              Dashboard outputs are generated from stored survey responses and calculated
              behaviour scores. Use exports for statistical analysis, thesis appendices,
              or external modelling workflows.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
