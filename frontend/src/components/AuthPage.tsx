import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, LogIn, UserPlus } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
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
    const { login, register, loginWithGoogle } = useAuth();

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

    const onGoogleSuccess = async (response: { credential?: string }) => {
        if (!response.credential) return;
        setError(null);
        try {
            await loginWithGoogle(response.credential);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail ?? err.message);
            } else {
                setError('Google sign-in failed. Please try again.');
            }
        }
    };

    const inputClass =
        'warm-input';

    const labelClass = 'block text-xs font-semibold text-[#78716C] mb-1.5 uppercase tracking-wider';

    return (
        <div className="min-h-screen warm-page flex items-center justify-center px-4"
             style={{ background: 'linear-gradient(135deg, #F5F3F0 0%, #FAFAF9 50%, #F0EDE8 100%)' }}>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2.5 mb-3">
                        <img src="/logo.png" alt="PHIL" className="w-10 h-10 object-contain" />
                        <span className="text-2xl font-bold text-gradient">PHIL</span>
                    </div>
                    <p className="text-[#78716C] text-sm">Your personal PPTX generator</p>
                </div>

                {/* Card */}
                <div className="warm-card p-8">

                    {/* Mode toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-[#E7E5E4] mb-6 p-1 bg-[#F5F4F2] gap-1">
                        <button
                            onClick={() => { setMode('login'); setError(null); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                mode === 'login'
                                    ? 'bg-white text-[#1E3A5F] shadow-sm'
                                    : 'text-[#78716C] hover:text-[#1C1917]'
                            }`}
                        >
                            <LogIn size={14} /> Sign In
                        </button>
                        <button
                            onClick={() => { setMode('register'); setError(null); }}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                                mode === 'register'
                                    ? 'bg-white text-[#1E3A5F] shadow-sm'
                                    : 'text-[#78716C] hover:text-[#1C1917]'
                            }`}
                        >
                            <UserPlus size={14} /> Create Account
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
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
                                className="btn-primary w-full justify-center py-2.5 mt-1 text-sm"
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
                                <label className={labelClass}>Full Name <span className="normal-case text-[#A8A29E]">(optional)</span></label>
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
                                    <p className="text-red-600 text-xs mt-1">Minimum 6 characters</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={registerForm.formState.isSubmitting}
                                className="btn-primary w-full justify-center py-2.5 mt-1 text-sm"
                            >
                                {registerForm.formState.isSubmitting ? (
                                    <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                                ) : (
                                    <><UserPlus size={15} /> Create Account</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Google Sign-In */}
                    <div className="mt-5">
                        <div className="divider-text mb-4">or continue with</div>
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={onGoogleSuccess}
                                onError={() => setError('Google sign-in failed. Please try again.')}
                                theme="outline"
                                shape="rectangular"
                                size="large"
                                width="100%"
                                text={mode === 'login' ? 'signin_with' : 'signup_with'}
                            />
                        </div>
                    </div>

                    <p className="text-center text-xs text-[#A8A29E] mt-5">
                        {mode === 'login' ? 'No account? ' : 'Already have an account? '}
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                            className="text-[#1E3A5F] hover:text-[#D97706] transition-colors font-medium"
                        >
                            {mode === 'login' ? 'Create one' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
