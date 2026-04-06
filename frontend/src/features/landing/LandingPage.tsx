import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, FileText, BarChart3, Sparkles, FileDown, ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => (
    <div className="min-h-screen bg-[#0B0B14] font-sans text-white">
        {/* Background glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="absolute right-0 top-1/2 h-64 w-64 rounded-full bg-violet-600/5 blur-[80px]" />
        </div>

        {/* Navbar */}
        <nav className="relative flex items-center justify-between border-b border-white/5 bg-[#0d0d16]/80 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                    <Zap size={16} className="text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                    SprintLog
                </span>
            </div>
            <div className="flex items-center gap-3">
                <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white">
                    Login
                </Link>
                <Link
                    to="/login"
                    className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30"
                >
                    Get Started
                </Link>
            </div>
        </nav>

        {/* Hero */}
        <section className="relative mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                    Track Your Work.{' '}
                    <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                        Generate AI Reports.
                    </span>{' '}
                    Never Miss a Day.
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
                    SprintLog is your AI-powered daily report tracker. Log work entries, visualize streaks, and generate beautiful PDF summaries — automatically.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                        to="/login"
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                    >
                        Get Started Free <ArrowRight size={16} />
                    </Link>
                    <Link
                        to="/login"
                        className="rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-base font-semibold text-slate-300 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
                    >
                        Login
                    </Link>
                </div>
                <p className="mt-4 text-xs text-slate-600">Trusted by developers who ship daily</p>
            </motion.div>

            {/* Hero visual — mini dashboard card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A2E] p-5 shadow-2xl shadow-black/50"
            >
                <div className="flex items-center gap-2 mb-5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                    <span className="ml-2 text-xs text-slate-600">Dashboard — SprintLog</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-5">
                    {['247 Total', '3 Today', '18 This Week', '12 Day Streak'].map((v) => (
                        <div key={v} className="rounded-xl bg-[#252532] p-3">
                            <p className="text-xs text-slate-500 mb-1">Reports</p>
                            <p className="text-base font-bold text-white">{v}</p>
                        </div>
                    ))}
                </div>
                <div className="h-24 rounded-xl bg-[#252532] flex items-end px-4 pb-3 gap-2">
                    {[3, 5, 2, 7, 4, 6, 3].map((h, i) => (
                        <div key={i} className="flex-1 rounded bg-gradient-to-t from-indigo-600 to-violet-500 opacity-80" style={{ height: `${h * 10}px` }} />
                    ))}
                </div>
            </motion.div>
        </section>

        {/* Features */}
        <section className="relative mx-auto max-w-5xl px-6 py-20">
            <h2 className="mb-2 text-center text-3xl font-bold text-white">Everything you need to stay consistent</h2>
            <p className="mb-12 text-center text-slate-400">Built for daily reporting discipline.</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {[
                    { icon: FileText, title: 'Daily Report Tracking', desc: 'Log your daily, weekly, and monthly work entries in seconds. Never lose track of what you shipped.', color: 'indigo' },
                    { icon: BarChart3, title: 'Smart Analytics', desc: 'Visualize streaks, report distribution, and weekly activity at a glance with beautiful, live charts.', color: 'violet' },
                    { icon: Sparkles, title: 'AI PDF Export', desc: 'Generate AI-summarized, beautifully formatted PDF reports for any date range — one click, instant download.', color: 'cyan' },
                ].map(({ icon: Icon, title, desc, color }, i) => (
                    <motion.div
                        key={title}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-2xl border border-white/5 bg-[#1A1A2E] p-6 transition-all hover:border-indigo-500/20"
                    >
                        <div className={`mb-4 inline-flex rounded-xl bg-${color}-500/10 p-3`}>
                            <Icon size={22} className={`text-${color}-400`} />
                        </div>
                        <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                        <p className="text-sm text-slate-400">{desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* How it works */}
        <section className="relative mx-auto max-w-3xl px-6 py-10">
            <h2 className="mb-10 text-center text-3xl font-bold text-white">How it works</h2>
            <div className="space-y-6">
                {[
                    { n: '01', title: 'Log your daily report', desc: 'Write a quick summary of what you accomplished. Supports daily, weekly, and monthly formats.' },
                    { n: '02', title: 'Track your streak & analytics', desc: 'See your streak grow, monitor weekly activity, and explore report distribution in beautiful charts.' },
                    { n: '03', title: 'Generate and download your PDF', desc: 'Select a date range, hit Generate, and get an AI-summarized PDF report delivered instantly.' },
                ].map(({ n, title, desc }) => (
                    <div key={n} className="flex items-start gap-5 rounded-2xl border border-white/5 bg-[#1A1A2E] p-5">
                        <span className="shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-2xl font-bold text-transparent">{n}</span>
                        <div>
                            <h3 className="font-semibold text-white">{title}</h3>
                            <p className="mt-1 text-sm text-slate-400">{desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Final CTA */}
        <section className="relative mx-auto max-w-3xl px-6 py-20 text-center">
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-violet-600/10 p-10 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-white">Ready to own your productivity?</h2>
                <p className="mt-3 text-slate-400">Start tracking your work daily. Build the habit. Generate AI reports.</p>
                <Link
                    to="/login"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                >
                    Start for Free <ArrowRight size={16} />
                </Link>
            </div>
        </section>
    </div>
);

export default LandingPage;
