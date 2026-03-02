import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, LogIn, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

type Mode = 'login' | 'register';

interface LoginForm {
    email: string;
    password: string;
}

interface RegisterForm {
    email: string;
    password: string;
    full_name?: string;
}

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>('login');
    const [error, setError] = useState<string | null>(null);
    const { login, register } = useAuth();

    const loginForm = useForm<LoginForm>();
    const registerForm = useForm<RegisterForm>();

    const onLogin = async (data: LoginForm) => {
        setError(null);
        try {
            await login(data.email, data.password);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail ?? err.message);
            } else {
                setError('Login failed. Please try again.');
            }
        }
    };

    const onRegister = async (data: RegisterForm) => {
        setError(null);
        try {
            await register(data.email, data.password, data.full_name);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail ?? err.message);
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    const inputClass =
        'w-full glass border border-slate-600/50 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-sm';

    const labelClass = 'block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider';

    return (
        <div className="min-h-screen ai-gradient-bg flex items-center justify-center px-4">
            {/* Background grid */}
            <div className="fixed inset-0 neural-grid opacity-20 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo / title */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center glow-blue">
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gradient-animated">MarketingAI</span>
                    </div>
                    <p className="text-slate-400 text-sm">Creative Marketing Strategy Engine</p>
                </div>

                {/* Card */}
                <div className="glass-strong rounded-2xl border border-slate-700/50 p-8 scan-line relative overflow-hidden">
                    <div className="absolute inset-0 holographic opacity-10 pointer-events-none" />

                    <div className="relative z-10">
                        {/* Mode toggle */}
                        <div className="flex rounded-xl overflow-hidden border border-slate-700/50 mb-6">
                            <button
                                onClick={() => { setMode('login'); setError(null); }}
                                className={`flex-1 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-blue-600/40 text-blue-300 glow-blue' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <LogIn size={14} /> Sign In
                            </button>
                            <button
                                onClick={() => { setMode('register'); setError(null); }}
                                className={`flex-1 py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-purple-600/40 text-purple-300 glow-purple' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <UserPlus size={14} /> Create Account
                            </button>
                        </div>

                        {/* Error banner */}
                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* LOGIN FORM */}
                        {mode === 'login' && (
                            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className={inputClass}
                                        {...loginForm.register('email', { required: true })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className={inputClass}
                                        {...loginForm.register('password', { required: true })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loginForm.formState.isSubmitting}
                                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all glow-blue hover:glow-purple disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                >
                                    {loginForm.formState.isSubmitting ? (
                                        <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                                    ) : (
                                        <><LogIn size={15} /> Sign In</>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* REGISTER FORM */}
                        {mode === 'register' && (
                            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Full Name <span className="normal-case text-slate-600">(optional)</span></label>
                                    <input
                                        type="text"
                                        placeholder="Jane Doe"
                                        className={inputClass}
                                        {...registerForm.register('full_name')}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className={inputClass}
                                        {...registerForm.register('email', { required: true })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className={inputClass}
                                        {...registerForm.register('password', { required: true, minLength: 6 })}
                                    />
                                    {registerForm.formState.errors.password && (
                                        <p className="text-red-400 text-xs mt-1">Minimum 6 characters</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={registerForm.formState.isSubmitting}
                                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all glow-purple hover:glow-blue disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                >
                                    {registerForm.formState.isSubmitting ? (
                                        <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                                    ) : (
                                        <><UserPlus size={15} /> Create Account</>
                                    )}
                                </button>
                            </form>
                        )}

                        <p className="text-center text-xs text-slate-600 mt-6">
                            {mode === 'login' ? 'No account? ' : 'Already have an account? '}
                            <button
                                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                {mode === 'login' ? 'Create one' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
