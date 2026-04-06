import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Eager
import LoginPage from '../features/auth/LoginPage';
import LandingPage from '../features/landing/LandingPage';

// Lazy
const DashboardPage = lazy(() => import('../features/analytics/DashboardPage'));
const ReportsPage = lazy(() => import('../features/reports/ReportsPage'));
const AnalyticsPage = lazy(() => import('../features/analytics/AnalyticsPage'));
const PdfGeneratorPage = lazy(() => import('../features/pdf/PdfGeneratorPage'));

const PageFallback = () => (
    <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
);

const SettingsPage = () => (
    <div className="rounded-2xl border border-white/5 bg-[#1A1A2E] p-8 text-center text-slate-400">
        Settings coming soon.
    </div>
);

export const AppRouter: React.FC = () => (
    <BrowserRouter>
        <AuthProvider>
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Protected */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <AppLayout>
                                <Suspense fallback={<PageFallback />}>
                                    <Routes>
                                        <Route path="/dashboard" element={<DashboardPage />} />
                                        <Route path="/reports" element={<ReportsPage />} />
                                        <Route path="/analytics" element={<AnalyticsPage />} />
                                        <Route path="/pdf" element={<PdfGeneratorPage />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                                    </Routes>
                                </Suspense>
                            </AppLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </AuthProvider>
    </BrowserRouter>
);
