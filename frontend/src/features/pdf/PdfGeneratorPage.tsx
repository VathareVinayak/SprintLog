import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Sparkles, FileText, Download, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pdfApi } from '../../lib/api/endpoints';

const schema = z.object({
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
}).refine((d) => d.start_date <= d.end_date, {
    message: 'Start date must be before or equal to end date',
    path: ['end_date'],
});

type PdfForm = z.infer<typeof schema>;
type PdfState = 'idle' | 'generating' | 'success' | 'no_data' | 'error' | 'rate_limited';

const PdfGeneratorPage: React.FC = () => {
    const [pdfState, setPdfState] = useState<PdfState>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [retryAfter, setRetryAfter] = useState<number | null>(null);
    const longLoadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showLongLoad, setShowLongLoad] = useState(false);

    const { register, handleSubmit, getValues, formState: { errors } } = useForm<PdfForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
        },
    });

    const startGeneration = async (data: PdfForm) => {
        setPdfState('generating');
        setShowLongLoad(false);
        longLoadTimer.current = setTimeout(() => setShowLongLoad(true), 4000);

        try {
            const res = await pdfApi.generate(data.start_date, data.end_date);

            clearTimeout(longLoadTimer.current!);
            setShowLongLoad(false);

            // Trigger download
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const disposition = res.headers?.['content-disposition'] ?? '';
            const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
            a.download = filenameMatch?.[1] || `sprintlog-report-${data.start_date}-to-${data.end_date}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            setPdfState('success');
        } catch (err: unknown) {
            clearTimeout(longLoadTimer.current!);
            setShowLongLoad(false);
            const e = err as { status?: number; message?: string; isRateLimited?: boolean; retryAfter?: number };

            if (e.isRateLimited) {
                setPdfState('rate_limited');
                setRetryAfter(e.retryAfter ?? 30);
            } else if (e.status === 404) {
                setPdfState('no_data');
            } else {
                setPdfState('error');
                setErrorMsg(e.message || 'PDF generation failed.');
            }
        }
    };

    const handleRetry = () => {
        const vals = getValues();
        startGeneration(vals);
    };

    const reset = () => { setPdfState('idle'); setShowLongLoad(false); };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">PDF Generator</h1>
                <p className="mt-1 text-sm text-slate-400">Generate an AI-summarized PDF report for any date range.</p>
            </div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/5 bg-[#1A1A2E] p-6 lg:p-8"
            >
                <form onSubmit={handleSubmit(startGeneration)} className="space-y-6">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                        <FileDown size={18} className="text-indigo-400" />
                        Select Date Range
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="label-style">Start Date</label>
                            <input {...register('start_date')} type="date" className="input-style" disabled={pdfState === 'generating'} />
                            {errors.start_date && <p className="error-text">{errors.start_date.message}</p>}
                        </div>
                        <div>
                            <label className="label-style">End Date</label>
                            <input {...register('end_date')} type="date" className="input-style" disabled={pdfState === 'generating'} />
                            {errors.end_date && <p className="error-text">{errors.end_date.message}</p>}
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        Your PDF will include all reports in the selected range, with an AI-generated executive summary at the top.
                    </p>

                    {/* State feedback */}
                    <AnimatePresence mode="wait">
                        {pdfState === 'idle' && (
                            <motion.button
                                key="generate"
                                type="submit"
                                whileTap={{ scale: 0.97 }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30"
                            >
                                <Sparkles size={16} />
                                Generate &amp; Download PDF
                            </motion.button>
                        )}

                        {pdfState === 'generating' && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-3"
                            >
                                <div className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500/50 to-violet-600/50 py-3.5 text-sm font-semibold text-white/70">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Generating report...
                                </div>
                                {showLongLoad && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs italic text-slate-500">
                                        AI summarization may take a little longer...
                                    </motion.p>
                                )}
                            </motion.div>
                        )}

                        {pdfState === 'success' && (
                            <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center"
                            >
                                <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400" />
                                <p className="font-semibold text-emerald-400">PDF Ready!</p>
                                <p className="mt-1 text-xs text-slate-400">Your report has been downloaded.</p>
                                <button onClick={reset} className="mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300">
                                    Generate Another →
                                </button>
                            </motion.div>
                        )}

                        {pdfState === 'no_data' && (
                            <motion.div key="nodata" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center"
                            >
                                <AlertCircle size={28} className="mx-auto mb-2 text-amber-400" />
                                <p className="font-semibold text-amber-400">No reports found</p>
                                <p className="mt-1 text-xs text-slate-400">No reports in the selected date range. Try widening your range.</p>
                                <button onClick={reset} className="mt-3 text-xs font-medium text-indigo-400 hover:text-indigo-300">
                                    Try Different Dates →
                                </button>
                            </motion.div>
                        )}

                        {pdfState === 'error' && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center"
                            >
                                <AlertCircle size={28} className="mx-auto mb-2 text-red-400" />
                                <p className="font-semibold text-red-400">Generation Failed</p>
                                <p className="mt-1 text-xs text-slate-400">{errorMsg}</p>
                                <button onClick={handleRetry}
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                                >
                                    <RefreshCw size={12} /> Retry
                                </button>
                            </motion.div>
                        )}

                        {pdfState === 'rate_limited' && (
                            <motion.div key="ratelimit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-center"
                            >
                                <AlertCircle size={28} className="mx-auto mb-2 text-orange-400" />
                                <p className="font-semibold text-orange-400">Too Many Requests</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {retryAfter ? `Please wait ${retryAfter} seconds before trying again.` : 'Please wait 30 seconds before trying again.'}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>

            {/* Info Strip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { icon: Sparkles, label: 'AI-Powered Summary', desc: 'Executive summary generated automatically for each PDF' },
                    { icon: FileText, label: 'All Report Types', desc: 'Daily, weekly, and monthly reports all included' },
                    { icon: Download, label: 'Instant Download', desc: 'PDF downloads directly to your device on generation' },
                ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#1A1A2E] p-4">
                        <div className="rounded-lg bg-indigo-500/10 p-2">
                            <Icon size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-200">{label}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PdfGeneratorPage;
