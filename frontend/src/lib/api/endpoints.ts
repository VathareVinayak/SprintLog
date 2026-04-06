import { apiClient, pdfClient } from './client';
import type {
    AuthTokens, UserProfile,
    Report, CreateReportPayload, UpdateReportPayload,
    PaginatedResponse, ReportListParams,
    DashboardData, WeeklyData, DistributionData,
    StreakData, TimelineData, HeatmapDay,
} from '../../types';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
    login: (username: string, password: string) =>
        apiClient.post<AuthTokens>('/api/auth/login/', { username, password }),

    register: (data: { username: string; email: string; password: string; full_name: string }) =>
        apiClient.post('/api/auth/register/', data),

    getProfile: () =>
        apiClient.get<UserProfile>('/api/auth/profile/'),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
    create: (payload: CreateReportPayload) =>
        apiClient.post<Report>('/api/reports/create/', payload),

    list: (params: ReportListParams = {}) =>
        apiClient.get<PaginatedResponse<Report>>('/api/reports/list/', { params }),

    get: (id: number) =>
        apiClient.get<Report>(`/api/reports/update/${id}/`),

    byDate: (date: string) =>
        apiClient.get<Report[]>('/api/reports/by-date/', { params: { date } }),

    update: (id: number, payload: UpdateReportPayload) =>
        apiClient.put<Report>(`/api/reports/update/${id}/`, payload),

    delete: (id: number) =>
        apiClient.delete(`/api/reports/delete/${id}/`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
    dashboard: () =>
        apiClient.get<DashboardData>('/api/reports/dashboard/'),

    weekly: () =>
        apiClient.get<WeeklyData>('/api/reports/weekly/'),

    distribution: () =>
        apiClient.get<DistributionData>('/api/reports/distribution/'),

    streak: () =>
        apiClient.get<StreakData>('/api/reports/streak/'),

    heatmap: (startDate?: string, endDate?: string) =>
        apiClient.get<{ start_date: string; end_date: string; heatmap: HeatmapDay[] }>('/api/reports/heatmap/', {
            params: { ...(startDate && { start_date: startDate }), ...(endDate && { end_date: endDate }) },
        }),

    timeline: () =>
        apiClient.get<TimelineData>('/api/reports/timeline/'),
};

// ── PDF ───────────────────────────────────────────────────────────────────────
export const pdfApi = {
    generate: (startDate: string, endDate: string) =>
        pdfClient.get('/api/reports/generate-pdf/', {
            params: { start_date: startDate, end_date: endDate },
        }),
};
