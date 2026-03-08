import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

interface LoginForm {
    email: string;
    password: string;
}

interface RegisterForm {
    email: string;
    password: string;
    full_name?: string;
}

interface ForgotForm { email: string; }
interface ResetForm { new_password: string; confirm_password: string; }

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>('login');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [resetToken, setResetToken] = useState<string | null>(null);
    const { login, register, loginWithGoogle, forgotPassword, resetPassword } = useAuth();

    const loginForm = useForm<LoginForm>();
    const registerForm = useForm<RegisterForm>();
    const forgotForm = useForm<ForgotForm>();
    const resetForm = useForm<ResetForm>();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('reset_token');
        if (token) {
            setResetToken(token);
            setMode('reset');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

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

    const onForgot = async (data: ForgotForm) => {
        setError(null);
        setSuccess(null);
        try {
            await forgotPassword(data.email);
            setSuccess('If that email exists, a reset link has been sent. Check your inbox (or the backend logs in dev).');
            forgotForm.reset();
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.detail ?? err.message);
            else setError('Something went wrong. Please try again.');
        }
    };

    const onReset = async (data: ResetForm) => {
        setError(null);
        setSuccess(null);
        if (data.new_password !== data.confirm_password) {
            setError('Passwords do not match.');
            return;
        }
        try {
            await resetPassword(resetToken!, data.new_password);
            setSuccess('Password updated! You can now sign in.');
            setResetToken(null);
            setTimeout(() => { setMode('login'); setSuccess(null); }, 2000);
        } catch (err) {
            if (axios.isAxiosError(err)) setError(err.response?.data?.detail ?? err.message);
            else setError('Something went wrong. Please try again.');
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

                    {/* Mode toggle — only show for login/register */}
                    {(mode === 'forgot' || mode === 'reset') && null}
                    <div className={`flex rounded-xl overflow-hidden border border-[#E7E5E4] mb-6 p-1 bg-[#F5F4F2] gap-1 ${mode === 'forgot' || mode === 'reset' ? 'hidden' : ''}`}>
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

                    {/* Error / Success */}
                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                            {success}
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
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
                                    className="text-xs text-[#A8A29E] hover:text-[#1E3A5F] transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
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

                    {/* FORGOT PASSWORD FORM */}
                    {mode === 'forgot' && (
                        <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                            <p className="text-sm text-[#78716C]">Enter your email and we'll send a reset link.</p>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className={inputClass}
                                    {...forgotForm.register('email', { required: true })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={forgotForm.formState.isSubmitting}
                                className="btn-primary w-full justify-center py-2.5 mt-1 text-sm"
                            >
                                {forgotForm.formState.isSubmitting ? (
                                    <><Loader2 size={15} className="animate-spin" /> Sending…</>
                                ) : (
                                    <><KeyRound size={15} /> Send Reset Link</>
                                )}
                            </button>
                            <p className="text-center text-xs text-[#A8A29E]">
                                <button type="button" onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="text-[#1E3A5F] hover:text-[#D97706] transition-colors font-medium">
                                    Back to Sign In
                                </button>
                            </p>
                        </form>
                    )}

                    {/* RESET PASSWORD FORM */}
                    {mode === 'reset' && (
                        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                            <p className="text-sm text-[#78716C]">Choose a new password.</p>
                            <div>
                                <label className={labelClass}>New Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className={inputClass}
                                    {...resetForm.register('new_password', { required: true, minLength: 6 })}
                                />
                                {resetForm.formState.errors.new_password && (
                                    <p className="text-red-600 text-xs mt-1">Minimum 6 characters</p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className={inputClass}
                                    {...resetForm.register('confirm_password', { required: true })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={resetForm.formState.isSubmitting}
                                className="btn-primary w-full justify-center py-2.5 mt-1 text-sm"
                            >
                                {resetForm.formState.isSubmitting ? (
                                    <><Loader2 size={15} className="animate-spin" /> Updating…</>
                                ) : (
                                    <><KeyRound size={15} /> Set New Password</>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Google Sign-In */}
                    <div className={`mt-5 ${mode === 'forgot' || mode === 'reset' ? 'hidden' : ''}`}>
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

                    {(mode === 'login' || mode === 'register') && (
                        <p className="text-center text-xs text-[#A8A29E] mt-5">
                            {mode === 'login' ? 'No account? ' : 'Already have an account? '}
                            <button
                                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccess(null); }}
                                className="text-[#1E3A5F] hover:text-[#D97706] transition-colors font-medium"
                            >
                                {mode === 'login' ? 'Create one' : 'Sign in'}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
