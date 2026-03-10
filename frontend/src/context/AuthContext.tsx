import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { TOKEN_KEY, authGoogle } from '../lib/api';
import type { UserResponse } from '../types';

interface AuthContextType {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName?: string) => Promise<void>;
    loginWithGoogle: (credential: string) => Promise<void>;
    logout: () => void;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    connectCanva: () => Promise<void>;
    disconnectCanva: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_CACHE_KEY = 'auth_user_cache';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Restore cached user immediately so the UI shows without waiting for the network
    const [user, setUser] = useState<UserResponse | null>(() => {
        try {
            const cached = localStorage.getItem(USER_CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

    // On mount: validate the token; also detect Canva OAuth callback (?canva=connected)
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);

        // If Canva just redirected back, strip the query param and refresh user
        const params = new URLSearchParams(window.location.search);
        const canvaConnected = params.get('canva') === 'connected';
        if (canvaConnected) {
            params.delete('canva');
            const newSearch = params.toString();
            window.history.replaceState({}, '', newSearch ? `?${newSearch}` : window.location.pathname);
        }

        if (!token) {
            setIsLoading(false);
            return;
        }
        api.get<UserResponse>('/auth/me')
            .then((res) => {
                setUser(res.data);
                localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data));
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_CACHE_KEY);
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        // OAuth2PasswordRequestForm requires form-encoded body
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);

        const res = await api.post<{ access_token: string; user: UserResponse }>(
            '/auth/login',
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const register = async (email: string, password: string, fullName?: string) => {
        const res = await api.post<{ access_token: string; user: UserResponse }>('/auth/register', {
            email,
            password,
            full_name: fullName || undefined,
        });
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const loginWithGoogle = async (credential: string) => {
        const res = await authGoogle(credential);
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
    };

    const forgotPassword = async (email: string) => {
        await api.post('/auth/forgot-password', { email });
    };

    const resetPassword = async (token: string, newPassword: string) => {
        await api.post('/auth/reset-password', { token, new_password: newPassword });
    };

    const connectCanva = async () => {
        const res = await api.get<{ auth_url: string }>('/auth/canva');
        window.location.href = res.data.auth_url;
    };

    const disconnectCanva = async () => {
        await api.delete('/auth/canva');
        const res = await api.get<UserResponse>('/auth/me');
        setUser(res.data);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.data));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, loginWithGoogle, logout, forgotPassword, resetPassword, connectCanva, disconnectCanva }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
