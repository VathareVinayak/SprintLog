// Base API types aligned with Django DRF responses

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface UserProfile {
    user: string;
    email: string;
}

export type ReportType = 'SCRUM' | 'TRACK_CALL' | 'SPRINT_CALL';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    SCRUM: 'Scrum Call',
    TRACK_CALL: 'Track Call',
    SPRINT_CALL: 'Sprint Call',
};

export interface Report {
    id: number;
    report_type: ReportType;
    title: string;
    content: string;
    report_date: string; // YYYY-MM-DD
    created_at: string;
    updated_at: string;
}

export interface CreateReportPayload {
    report_type: ReportType;
    title?: string;
    content: string;
    report_date: string;
}

export interface UpdateReportPayload extends Partial<CreateReportPayload> { }

// Analytics types
export interface DashboardData {
    total_reports: number;
    today_reports: number;
    this_week_reports: number;
    report_type_distribution: Record<string, number>;
    recent_reports: Report[];
}

export interface WeeklyDay {
    date: string;
    count: number;
}

export interface WeeklyData {
    start_date: string;
    end_date: string;
    total_reports: number;
    days: WeeklyDay[];
}

export interface DistributionItem {
    report_type: ReportType;
    count: number;
    percentage: number;
}

export interface DistributionData {
    total_reports: number;
    distribution: DistributionItem[];
}

export interface StreakData {
    current_streak: number;
    longest_streak: number;
    last_report_date: string | null;
    active_today: boolean;
}

export interface HeatmapDay {
    date: string;
    count: number;
}

export interface TimelineDay {
    date: string;
    count: number;
}

export interface TimelineData {
    total_days: number;
    timeline: TimelineDay[];
}

// API error shape normalized from backend
export interface NormalizedError {
    status: number;
    message: string;
    fieldErrors?: Record<string, string[]>;
    isAuthError: boolean;
    isRateLimited: boolean;
    retryAfter?: number;
}

// Report list query params
export interface ReportListParams {
    page?: number;
    report_type?: ReportType | '';
    report_date?: string;
    search?: string;
    ordering?: string;
}
