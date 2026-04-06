import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Award, CalendarCheck, Activity, AlertCircle } from 'lucide-react';
import { analyticsApi } from '../../lib/api/endpoints';
import type { StreakData, WeeklyData, HeatmapDay } from '../../types';
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { REPORT_TYPE_LABELS } from '../../types';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
);

// ── Heatmap ───────────────────────────────────────────────────────────────────
const HEATMAP_COLORS = ['#1A1A2E', '#312e81', '#4338ca', '#6366F1', '#a5b4fc'];
const getHeatmapColor = (count: number) => {
    if (count === 0) return HEATMAP_COLORS[0];
    if (count === 1) return HEATMAP_COLORS[1];
    if (count === 2) return HEATMAP_COLORS[2];
    if (count <= 4) return HEATMAP_COLORS[3];
    return HEATMAP_COLORS[4];
};

const Heatmap: React.FC<{ data: HeatmapDay[] }> = ({ data }) => {
    if (!data.length) {
        return (
            <div className="flex h-24 items-center justify-center text-sm text-slate-500">
                No heatmap data available.
            </div>
        );
    }

    // group into weeks of 7 days
    const weeks: HeatmapDay[][] = [];
    const sorted = [...data].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    let week: HeatmapDay[] = [];
    sorted.forEach((day, i) => {
        week.push(day);
        if (week.length === 7 || i === sorted.length - 1) {
            weeks.push(week);
            week = [];
        }
    });

    return (
        <div className="overflow-x-auto">
            <div className="flex gap-1">
                {weeks.map((w, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                        {w.map((d, di) => (
                            <div
                                key={di}
                                title={`${d.date}: ${d.count} report${d.count !== 1 ? 's' : ''}`}
                                className="h-3 w-3 rounded-sm transition-opacity hover:opacity-80"
                                style={{ background: getHeatmapColor(d.count) }}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span>Less</span>
                {HEATMAP_COLORS.map((c) => (
                    <div key={c} className="h-3 w-3 rounded-sm" style={{ background: c }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
};

const PIE_COLORS = ['#6366F1', '#8B5CF6', '#22D3EE'];

// ── Distribution item shape as returned by backend ────────────────────────────
interface DistributionItem {
    report_type: string;
    count: number;
}

const AnalyticsPage: React.FC = () => {
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [weekly, setWeekly] = useState<WeeklyData | null>(null);
    const [distribution, setDistribution] = useState<{ total_reports: number; distribution: DistributionItem[] } | null>(null);
    const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch individually so one failure doesn't kill everything
                const [streakRes, weeklyRes, distRes, heatmapRes] = await Promise.allSettled([
                    analyticsApi.streak(),
                    analyticsApi.weekly(),
                    analyticsApi.distribution(),
                    analyticsApi.heatmap(),
                ]);

                if (streakRes.status === 'fulfilled') setStreak(streakRes.value.data);
                if (weeklyRes.status === 'fulfilled') setWeekly(weeklyRes.value.data);
                if (distRes.status === 'fulfilled') setDistribution(distRes.value.data);
                if (heatmapRes.status === 'fulfilled') {
                    // Backend returns { start_date, end_date, heatmap: [...] }
                    const hd = heatmapRes.value.data;
                    setHeatmap(Array.isArray(hd) ? hd : (hd as { heatmap: HeatmapDay[] }).heatmap ?? []);
                }
            } catch (err: unknown) {
                const e = err as { message?: string };
                setError(e?.message || 'Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="mt-2 h-4 w-64" />
                </div>
                <Skeleton className="h-28" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <Skeleton className="col-span-3 h-64" />
                    <Skeleton className="col-span-2 h-64" />
                </div>
                <Skeleton className="h-40" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
                <AlertCircle size={36} className="text-red-400" />
                <p className="text-sm font-medium text-slate-300">Failed to load analytics</p>
                <p className="text-xs text-slate-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30"
                >
                    Retry
                </button>
            </div>
        );
    }

    const weeklyBars = weekly?.days.map((d) => ({
        day: String(d.date).slice(5), // MM-DD
        count: d.count,
    })) ?? [];

    const distData = distribution?.distribution.map((d) => ({
        name: REPORT_TYPE_LABELS[d.report_type as keyof typeof REPORT_TYPE_LABELS] ?? d.report_type,
        value: d.count,
    })) ?? [];

    // compute percentages client-side since backend doesn't return them
    const distTotal = distData.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <p className="mt-1 text-sm text-slate-400">Visualize your reporting patterns and streaks.</p>
            </div>

            {/* Streak Strip */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4 rounded-2xl border border-white/5 bg-[#1A1A2E] p-6 sm:grid-cols-4"
            >
                {[
                    {
                        label: 'Current Streak',
                        value: `${streak?.current_streak ?? 0} days`,
                        icon: Flame,
                        accent: 'text-orange-400',
                    },
                    {
                        label: 'Longest Streak',
                        value: `${streak?.longest_streak ?? 0} days`,
                        icon: Award,
                        accent: 'text-yellow-400',
                    },
                    {
                        label: 'Last Report',
                        value: streak?.last_report_date ? String(streak.last_report_date) : '—',
                        icon: CalendarCheck,
                        accent: 'text-cyan-400',
                    },
                    {
                        label: 'Active Today',
                        value: streak?.active_today ? '✓ Yes' : '✗ No',
                        icon: Activity,
                        accent: streak?.active_today ? 'text-emerald-400' : 'text-slate-500',
                    },
                ].map(({ label, value, icon: Icon, accent }, i) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500`}>
                            <Icon size={13} className={accent} /> {label}
                        </p>
                        <p className={`text-xl font-bold ${accent}`}>{value}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Weekly Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-3 rounded-2xl border border-white/5 bg-[#1A1A2E] p-5"
                >
                    <h2 className="mb-1 text-sm font-semibold text-slate-300">Weekly Activity</h2>
                    {weekly && (
                        <p className="mb-4 text-xs text-slate-500">
                            {String(weekly.start_date)} → {String(weekly.end_date)}
                        </p>
                    )}
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                            data={weeklyBars.length ? weeklyBars : [{ day: 'No data', count: 0 }]}
                            barSize={22}
                        >
                            <defs>
                                <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="day"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1A1A2E',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: '#ece9f7',
                                }}
                                cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                            />
                            <Bar dataKey="count" fill="url(#barGrad2)" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="col-span-2 rounded-2xl border border-white/5 bg-[#1A1A2E] p-5"
                >
                    <h2 className="mb-1 text-sm font-semibold text-slate-300">Report Distribution</h2>
                    <p className="mb-3 text-xs text-slate-500">
                        {distribution?.total_reports ?? 0} total reports
                    </p>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={distData.length ? distData : [{ name: 'none', value: 1 }]}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {(distData.length ? distData : [{ name: 'none', value: 1 }]).map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={PIE_COLORS[i % 3]}
                                        opacity={distData.length ? 1 : 0.15}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: '#1A1A2E',
                                    border: 'none',
                                    borderRadius: 8,
                                    color: '#ece9f7',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-1 space-y-1.5">
                        {distribution?.distribution.map((d, i) => {
                            const pct = distTotal > 0 ? ((d.count / distTotal) * 100).toFixed(0) : '0';
                            const label = REPORT_TYPE_LABELS[d.report_type as keyof typeof REPORT_TYPE_LABELS] ?? d.report_type;
                            return (
                                <div key={d.report_type} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ background: PIE_COLORS[i % 3] }}
                                        />
                                        <span className="text-slate-400">{label}</span>
                                    </div>
                                    <span className="font-medium text-slate-300">
                                        {d.count} ({pct}%)
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Heatmap */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/5 bg-[#1A1A2E] p-5"
            >
                <h2 className="mb-1 text-sm font-semibold text-slate-300">Activity Heatmap</h2>
                <p className="mb-4 text-xs text-slate-500">Last 90 days of daily report activity</p>
                <Heatmap data={heatmap} />
            </motion.div>
        </div>
    );
};

export default AnalyticsPage;
