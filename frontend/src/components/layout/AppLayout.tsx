import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart3, FileDown, Settings, Zap, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Reports', icon: FileText, to: '/reports' },
    { label: 'Analytics', icon: BarChart3, to: '/analytics' },
    { label: 'PDF Generator', icon: FileDown, to: '/pdf' },
    { label: 'Settings', icon: Settings, to: '/settings' },
];

const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarContent = (
        <div className="flex h-full flex-col bg-[#0F0F1A] w-60">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                    <Zap size={16} className="text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                    SprintLog
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 px-3">
                {navItems.map(({ label, icon: Icon, to }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                                ? 'text-white'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 rounded-lg bg-indigo-600/20"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22D3EE]" />
                                )}
                                <Icon size={18} className={`relative ${isActive ? 'text-indigo-400' : ''}`} />
                                <span className="relative">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User */}
            <div className="p-3">
                <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                        {user?.user?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">{user?.user ?? 'User'}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email ?? ''}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="rounded p-1 text-slate-500 transition-colors hover:text-red-400"
                        title="Logout"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop */}
            <aside className="hidden shrink-0 lg:block">{sidebarContent}</aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                            onClick={onClose}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 z-50 lg:hidden"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#0B0B14]">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#0d0d16]/80 px-4 backdrop-blur-md lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Spacer */}
                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        <div className="h-5 w-px bg-white/10" />
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                            U
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-[#13131F] p-4 lg:p-8">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
};
