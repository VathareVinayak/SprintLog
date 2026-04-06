import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../../lib/api/endpoints';
import { useAuth } from './AuthContext';
import type { NormalizedError } from '../../types';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
    const sessionExpired = new URLSearchParams(location.search).get('session') === 'expired';

    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError(null);
        try {
            const { data: tokens } = await authApi.login(data.username, data.password);
            await login(tokens.access, tokens.refresh);
            navigate(from, { replace: true });
        } catch (err) {
            const normalized = err as NormalizedError;
            if (normalized.isAuthError) {
                setServerError('Invalid username or password.');
            } else {
                setServerError(normalized.message || 'Login failed. Please try again.');
            }
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B14] px-4">
            {/* Background glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                        <Zap size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                    <p className="mt-1 text-sm text-slate-400">Sign in to your SprintLog account</p>
                </div>

                {sessionExpired && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                        <AlertCircle size={16} />
                        Your session expired. Please sign in again.
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Username
                        </label>
                        <input
                            {...register('username')}
                            type="text"
                            autoComplete="username"
                            className="w-full rounded-xl bg-[#252532] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-cyan-400/40"
                            placeholder="your_username"
                        />
                        {errors.username && (
                            <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                className="w-full rounded-xl bg-[#252532] px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-cyan-400/40"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                        )}
                    </div>

                    {serverError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            <AlertCircle size={16} />
                            {serverError}
                        </div>
                    )}

                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileTap={{ scale: 0.97 }}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
