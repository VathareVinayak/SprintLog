import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    open: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    loading = false,
}) => {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className="rounded-2xl border border-white/10 bg-[#1A1A2E] p-6 shadow-2xl shadow-black/60">
                            {/* Icon */}
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10">
                                <AlertTriangle size={22} className="text-red-400" />
                            </div>

                            {/* Text */}
                            <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
                            <p className="text-sm text-slate-400">{description}</p>

                            {/* Actions */}
                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
                                >
                                    {cancelLabel}
                                </button>
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 disabled:opacity-60"
                                >
                                    {loading && (
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    )}
                                    {loading ? 'Deleting...' : confirmLabel}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
