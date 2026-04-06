import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../../lib/api/endpoints';
import type { UserProfile } from '../../types';

interface AuthState {
    isAuthenticated: boolean;
    user: UserProfile | null;
    isLoading: boolean;
    login: (access: string, refresh: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { data } = await authApi.getProfile();
            setUser(data);
        } catch {
            setUser(null);
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            fetchProfile();
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (access: string, refresh: string) => {
        sessionStorage.setItem('access_token', access);
        sessionStorage.setItem('refresh_token', refresh);
        await fetchProfile();
    };

    const logout = () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
