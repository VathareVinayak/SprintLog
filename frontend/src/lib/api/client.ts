import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { NormalizedError } from '../../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Default client for regular requests
export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// PDF client with extended timeout
export const pdfClient = axios.create({
    baseURL: BASE_URL,
    timeout: 45000,
    responseType: 'blob',
});

// Attach auth token to every request
const attachToken = (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('access_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

apiClient.interceptors.request.use(attachToken);
pdfClient.interceptors.request.use(attachToken);

// Normalize backend error formats
export const normalizeError = (error: AxiosError): NormalizedError => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;

    let message = 'An unexpected error occurred.';
    let fieldErrors: Record<string, string[]> | undefined;

    if (!error.response) {
        message = error.code === 'ECONNABORTED' ? 'Request timed out.' : 'Network error. Please check your connection.';
    } else if (data) {
        if (typeof data.detail === 'string') {
            message = data.detail;
        } else if (typeof data.error === 'string') {
            message = data.error;
        } else if (typeof data.message === 'string') {
            message = data.message;
        } else {
            // Field-level validation errors from DRF
            fieldErrors = {};
            for (const [key, value] of Object.entries(data)) {
                if (Array.isArray(value)) {
                    fieldErrors[key] = value as string[];
                }
            }
            message = 'Validation failed. Please check the form fields.';
        }
    }

    const retryAfterHeader = error.response?.headers?.['retry-after'];
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

    return {
        status,
        message,
        fieldErrors,
        isAuthError: status === 401,
        isRateLimited: status === 429,
        retryAfter: isNaN(retryAfter as number) ? undefined : retryAfter,
    };
};

// 401 response interceptor — clears auth and redirects to login
apiClient.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            window.location.href = '/login?session=expired';
        }
        return Promise.reject(normalizeError(error));
    }
);
