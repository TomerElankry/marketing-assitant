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

    // On mount: validate the token in the background
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
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

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
