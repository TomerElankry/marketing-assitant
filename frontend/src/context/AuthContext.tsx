import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { TOKEN_KEY } from '../lib/api';
import type { UserResponse } from '../types';

interface AuthContextType {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: restore session from localStorage
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setIsLoading(false);
            return;
        }
        api.get<UserResponse>('/auth/me')
            .then((res) => setUser(res.data))
            .catch(() => localStorage.removeItem(TOKEN_KEY))
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
        setUser(res.data.user);
    };

    const register = async (email: string, password: string, fullName?: string) => {
        const res = await api.post<{ access_token: string; user: UserResponse }>('/auth/register', {
            email,
            password,
            full_name: fullName || undefined,
        });
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
