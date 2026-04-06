import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, Edit2, Trash2, Plus, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { reportsApi } from '../../lib/api/endpoints';
import type { Report, ReportType, CreateReportPayload, PaginatedResponse, UpdateReportPayload } from '../../types';
import { REPORT_TYPE_LABELS } from '../../types';
import ConfirmModal from '../../components/ui/ConfirmModal';

const REPORT_TYPES: ReportType[] = ['SCRUM', 'TRACK_CALL', 'SPRINT_CALL'];

// ── Form Schema ───────────────────────────────────────────────────────────────
const reportSchema = z.object({
    report_type: z.enum(['SCRUM', 'TRACK_CALL', 'SPRINT_CALL']),
    title: z.string().max(500).optional().or(z.literal('')),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    report_date: z.string().min(1, 'Date is required'),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const toDateString = (d: Date) => d.toISOString().split('T')[0];

const TYPE_BADGE: Record<ReportType, string> = {
    SCRUM: 'bg-indigo-500/20 text-indigo-300',
    TRACK_CALL: 'bg-violet-500/20 text-violet-300',
    SPRINT_CALL: 'bg-cyan-500/20 text-cyan-300',
};

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
);

// ── Create/Edit Form ───────────────────────────────────────────────────────────────
interface CreateReportFormProps {
    onSuccess: () => void;
    editingReport: Report | null;
    onCancelEdit: () => void;
}

const CreateReportForm: React.FC<CreateReportFormProps> = ({ onSuccess, editingReport, onCancelEdit }) => {
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: { report_type: 'SCRUM', report_date: toDateString(new Date()), title: '', content: '' },
    });

    // Reset form when editingReport changes
    useEffect(() => {
        if (editingReport) {
            reset({
                report_type: editingReport.report_type,
                report_date: editingReport.report_date,
                title: editingReport.title || '',
                content: editingReport.content,
            });
        } else {
            reset({ report_type: 'SCRUM', report_date: toDateString(new Date()), title: '', content: '' });
        }
    }, [editingReport, reset]);

    const onSubmit = async (data: ReportFormValues) => {
        setServerError(null);
        setSuccess(false);
        try {
            if (editingReport) {
                await reportsApi.update(editingReport.id, data as UpdateReportPayload);
                setSuccess(true);
                onSuccess();
                onCancelEdit();
            } else {
                await reportsApi.create(data as CreateReportPayload);
                setSuccess(true);
                reset({ report_type: 'SCRUM', report_date: toDateString(new Date()), title: '', content: '' });
                onSuccess();
            }
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const e = err as { message?: string; fieldErrors?: Record<string, string[]> };
            if (e.fieldErrors?.non_field_errors?.[0]) {
                setServerError(e.fieldErrors.non_field_errors[0]);
            } else {
                setServerError(e.message || 'Failed to save report.');
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/5 bg-[#1A1A2E] p-6 shadow-xl"
        >
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {editingReport ? (
                        <Edit2 size={18} className="text-violet-400" />
                    ) : (
                        <Plus size={18} className="text-indigo-400" />
                    )}
                    <h2 className="text-base font-semibold text-white">
                        {editingReport ? 'Edit Report' : 'New Report'}
                    </h2>
                </div>
                {editingReport && (
                    <button
                        onClick={onCancelEdit}
                        className="flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-white"
                    >
                        <X size={14} /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Type */}
                    <div>
                        <label className="label-style">Report Type</label>
                        <select {...register('report_type')} className="input-style">
                            {REPORT_TYPES.map((t) => (
                                <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>
                            ))}
                        </select>
                        {errors.report_type && <p className="error-text">{errors.report_type.message}</p>}
                    </div>
                    {/* Date */}
                    <div>
                        <label className="label-style">Report Date</label>
                        <input {...register('report_date')} type="date" className="input-style" />
                        {errors.report_date && <p className="error-text">{errors.report_date.message}</p>}
                    </div>
                    {/* Title */}
                    <div>
                        <label className="label-style">Title <span className="text-slate-600">(optional)</span></label>
                        <input {...register('title')} type="text" className="input-style" placeholder="e.g. Sprint 14 Review" />
                    </div>
                </div>

                {/* Content */}
                <div>
                    <label className="label-style">Content</label>
                    <textarea
                        {...register('content')}
                        rows={5}
                        className="input-style resize-none"
                        placeholder="What did you accomplish today? Be specific..."
                    />
                    {errors.content && <p className="error-text">{errors.content.message}</p>}
                </div>

                {serverError && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {serverError}
                    </div>
                )}

                {success && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                        ✓ Report {editingReport ? 'updated' : 'submitted'} successfully!
                    </div>
                )}

                <div className="flex gap-3">
                    {editingReport && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10"
                        >
                            Cancel
                        </button>
                    )}
                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileTap={{ scale: 0.97 }}
                        className={`flex-[2] rounded-xl bg-gradient-to-r ${editingReport ? 'from-violet-500 to-indigo-600' : 'from-indigo-500 to-violet-600'} py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30 disabled:opacity-60`}
                    >
                        {isSubmitting ? (editingReport ? 'Updating...' : 'Submitting...') : (editingReport ? 'Update Report' : 'Submit Report')}
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
};

// ── Report History ────────────────────────────────────────────────────────────
const ReportsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<ReportType | ''>('');
    const [result, setResult] = useState<PaginatedResponse<Report> | null>(null);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(0);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editingReport, setEditingReport] = useState<Report | null>(null);

    const formRef = useRef<HTMLDivElement>(null);

    // Initial check for edit param
    useEffect(() => {
        const editId = searchParams.get('edit');
        if (editId) {
            reportsApi.get(Number(editId))
                .then(({ data }) => {
                    setEditingReport(data);
                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                })
                .catch(() => {
                    setSearchParams({}); // Clear invalid param
                });
        }
    }, [searchParams, setSearchParams]);

    const fetchReports = useCallback(() => {
        setLoading(true);
        reportsApi.list({ page, search, report_type: typeFilter || undefined })
            .then(({ data }) => setResult(data))
            .finally(() => setLoading(false));
    }, [page, search, typeFilter, refresh]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    // Debounce search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const handleDelete = async () => {
        if (deleteTargetId === null) return;
        setDeleting(true);
        try {
            await reportsApi.delete(deleteTargetId);
            setRefresh((r) => r + 1);
            if (editingReport?.id === deleteTargetId) {
                setEditingReport(null);
                setSearchParams({});
            }
        } catch { /* handled silently */ } finally {
            setDeleting(false);
            setDeleteTargetId(null);
        }
    };

    const handleEdit = (report: Report) => {
        setEditingReport(report);
        setSearchParams({ edit: String(report.id) });
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleCancelEdit = () => {
        setEditingReport(null);
        setSearchParams({});
    };

    const totalPages = result ? Math.ceil(result.count / 10) : 1;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Reports</h1>
                <p className="mt-1 text-sm text-slate-400">Create and manage your work reports.</p>
            </div>

            <div ref={formRef}>
                <CreateReportForm
                    onSuccess={() => setRefresh((r) => r + 1)}
                    editingReport={editingReport}
                    onCancelEdit={handleCancelEdit}
                />
            </div>

            {/* History */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/5 bg-[#1A1A2E] p-6 shadow-xl"
            >
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-white">Report History</h2>
                        {result && (
                            <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                                {result.count}
                            </span>
                        )}
                    </div>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="rounded-lg bg-[#252532] py-2 pl-8 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/50"
                                placeholder="Search reports..."
                            />
                        </div>
                        {/* All + type filter chips */}
                        <button
                            onClick={() => { setTypeFilter(''); setPage(1); }}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${typeFilter === '' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            All
                        </button>
                        {REPORT_TYPES.map((t) => (
                            <button
                                key={t}
                                onClick={() => { setTypeFilter(t); setPage(1); }}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${typeFilter === t ? 'bg-indigo-500/30 text-indigo-300' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {REPORT_TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14" />)}
                    </div>
                ) : result?.results.length === 0 ? (
                    <div className="py-16 text-center">
                        <FileText size={40} className="mx-auto mb-3 text-slate-600" />
                        <p className="text-sm text-slate-400">No reports found.</p>
                        <p className="mt-1 text-xs text-slate-600">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {result?.results.map((r: Report) => (
                                        <tr key={r.id} className="group transition-colors hover:bg-white/[0.02]">
                                            <td className="py-3 pr-4 font-medium text-slate-200">
                                                {r.title || REPORT_TYPE_LABELS[r.report_type] || r.report_type}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_BADGE[r.report_type] ?? 'bg-white/10 text-slate-300'}`}>
                                                    {REPORT_TYPE_LABELS[r.report_type] ?? r.report_type}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 text-slate-400">{r.report_date}</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(r)}
                                                        className="rounded p-1.5 text-slate-500 transition-colors hover:text-indigo-400"
                                                        title="Edit report"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTargetId(r.id)}
                                                        className="rounded p-1.5 text-slate-500 transition-colors hover:text-red-400"
                                                        title="Delete report"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                            <span>
                                Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, result?.count ?? 0)} of {result?.count ?? 0}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => p - 1)}
                                    disabled={page === 1}
                                    className="rounded-lg p-1.5 transition-colors hover:bg-white/10 disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="font-medium text-slate-300">{page} / {totalPages}</span>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= totalPages}
                                    className="rounded-lg p-1.5 transition-colors hover:bg-white/10 disabled:opacity-40"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>

            <ConfirmModal
                open={deleteTargetId !== null}
                title="Delete Report"
                description="This report will be permanently deleted. This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTargetId(null)}
            />
        </div>
    );
};

export default ReportsPage;
