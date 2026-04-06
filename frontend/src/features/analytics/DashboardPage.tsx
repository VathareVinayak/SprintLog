import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Calendar, TrendingUp, Zap, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { analyticsApi, reportsApi } from '../../lib/api/endpoints';
import type { DashboardData, Report, ReportType } from '../../types';
import { REPORT_TYPE_LABELS } from '../../types';
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import ConfirmModal from '../../components/ui/ConfirmModal';

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
// ── Constants ──────────────────────────────────────────────────────────────────
const REPORT_TYPES: ReportType[] = ['SCRUM', 'TRACK_CALL', 'SPRINT_CALL'];
const CARD_ICONS = [FileText, Calendar, TrendingUp, Zap];
const CARD_COLORS = ['indigo', 'cyan', 'violet', 'amber'];

interface StatCardProps {
    label: string;
    value: React.ReactNode;
    icon: React.ElementType;
    color: string;
    delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay }}
        className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#1A1A2E] p-5 shadow-lg transition-shadow hover:shadow-indigo-500/10"
    >
        <div className={`mb-4 inline-flex rounded-xl bg-${color}-500/10 p-2`}>
            <Icon size={18} className={`text-${color}-400`} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </motion.div>
);

// ── Report Row ────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<ReportType, string> = {
    SCRUM: 'bg-indigo-500/20 text-indigo-300',
    TRACK_CALL: 'bg-violet-500/20 text-violet-300',
    SPRINT_CALL: 'bg-cyan-500/20 text-cyan-300',
};

const ReportRow: React.FC<{ report: Report; onEdit: (id: number) => void; onDelete: (id: number) => void }> = ({
    report, onEdit, onDelete,
}) => (
    <div className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/5">
        <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-200">
                {report.title || REPORT_TYPE_LABELS[report.report_type]}
            </p>
            <p className="text-xs text-slate-500">{report.report_date}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[report.report_type] ?? 'bg-white/10 text-slate-300'}`}>
            {REPORT_TYPE_LABELS[report.report_type]}
        </span>
        <div className="flex items-center gap-1">
            <button
                onClick={() => onEdit(report.id)}
                className="rounded p-1.5 text-slate-500 transition-colors hover:text-indigo-400"
                title="Edit in Reports"
            >
                <Edit2 size={14} />
            </button>
            <button
                onClick={() => onDelete(report.id)}
                className="rounded p-1.5 text-slate-500 transition-colors hover:text-red-400"
                title="Delete report"
            >
                <Trash2 size={14} />
            </button>
        </div>
    </div>
);

// ── Chart colors ──────────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366F1', '#8B5CF6', '#22D3EE'];

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = () => {
        setLoading(true);
        analyticsApi.dashboard()
            .then(({ data }) => setData(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async () => {
        if (deleteTargetId === null) return;
        setDeleting(true);
        try {
            await reportsApi.delete(deleteTargetId);
            fetchData();
        } catch { /* handled silently */ } finally {
            setDeleting(false);
            setDeleteTargetId(null);
        }
    };

    const handleEdit = (id: number) => {
        navigate(`/reports?edit=${id}`);
    };

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="mt-2 h-4 w-64" />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <Skeleton className="col-span-3 h-64" />
                    <Skeleton className="col-span-2 h-64" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    const weeklyBars = [
        { day: 'Mon', count: 2 }, { day: 'Tue', count: 4 }, { day: 'Wed', count: 1 },
        { day: 'Thu', count: 3 }, { day: 'Fri', count: 5 }, { day: 'Sat', count: 0 }, { day: 'Sun', count: 2 },
    ];

    const distData = Object.entries(data?.report_type_distribution ?? {}).map(([name, value]) => ({
        name: REPORT_TYPE_LABELS[name as ReportType] ?? name,
        value
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">Welcome back! Here's your report activity at a glance.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard icon={CARD_ICONS[0]} label="Total Reports" value={data?.total_reports ?? 0} color={CARD_COLORS[0]} delay={0} />
                <StatCard icon={CARD_ICONS[1]} label="Today's Reports" value={data?.today_reports ?? 0} color={CARD_COLORS[1]} delay={0.05} />
                <StatCard icon={CARD_ICONS[2]} label="This Week" value={data?.this_week_reports ?? 0} color={CARD_COLORS[2]} delay={0.1} />
                <StatCard icon={CARD_ICONS[3]} label="Streak" value="— days" color={CARD_COLORS[3]} delay={0.15} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Weekly Activity */}
                <div className="col-span-3 rounded-2xl border border-white/5 bg-[#1A1A2E] p-5 shadow-lg">
                    <h2 className="mb-4 text-sm font-semibold text-slate-300">Weekly Activity</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyBars} barSize={24}>
                            <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#ece9f7' }}
                                cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                            />
                            <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribution */}
                <div className="col-span-2 rounded-2xl border border-white/5 bg-[#1A1A2E] p-5 shadow-lg">
                    <h2 className="mb-4 text-sm font-semibold text-slate-300">Report Distribution</h2>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={distData.length ? distData : [{ name: 'No data', value: 1 }]}
                                cx="50%" cy="50%"
                                innerRadius={50} outerRadius={70}
                                paddingAngle={3} dataKey="value"
                            >
                                {(distData.length ? distData : [{ name: 'No data', value: 1 }]).map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={distData.length ? 1 : 0.2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#1A1A2E', border: 'none', borderRadius: 8, color: '#ece9f7' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
                        {REPORT_TYPES.map((type, i) => (
                            <span key={type} className="flex items-center gap-1.5">
                                <span className="inline-block h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                {REPORT_TYPE_LABELS[type]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="rounded-2xl border border-white/5 bg-[#1A1A2E] p-5 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-300">Recent Reports</h2>
                    <a href="/reports" className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                        View all <ArrowRight size={12} />
                    </a>
                </div>
                <div className="space-y-1">
                    {data?.recent_reports?.length ? (
                        data.recent_reports.map((r) => (
                            <ReportRow
                                key={r.id}
                                report={r}
                                onEdit={handleEdit}
                                onDelete={setDeleteTargetId}
                            />
                        ))
                    ) : (
                        <div className="py-10 text-center">
                            <FileText size={36} className="mx-auto mb-3 text-slate-600" />
                            <p className="text-sm text-slate-400">No reports yet.</p>
                            <a href="/reports" className="mt-2 inline-block text-xs font-medium text-indigo-400">
                                Create your first report →
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                open={deleteTargetId !== null}
                title="Delete Report"
                description="Are you sure you want to delete this report? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteTargetId(null)}
                loading={deleting}
            />
        </div>
    );
};

export default DashboardPage;
