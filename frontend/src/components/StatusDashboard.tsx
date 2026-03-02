import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Loader2, CheckCircle2, FileText, Download, AlertCircle, Zap } from 'lucide-react';
import type { JobResponse } from '../types';

const POLL_MIN_MS = 2_000;
const POLL_MAX_MS = 30_000;

interface StatusDashboardProps {
    jobId: string;
    onComplete: (data: any) => void;
}

const getStepIndex = (status?: string) => {
    switch (status) {
        case 'pending': return 0;
        case 'approved': return 0;
        case 'researching': return 1;
        case 'analyzing': return 2;
        case 'completed': return 3;
        case 'failed': return 3;
        default: return 0;
    }
};

const steps = [
    {
        label: "Queued",
        icon: FileText,
        description: "Job queued for processing",
        messages: [
            "Validating your brief...",
            "Preparing AI agent pipeline...",
            "Allocating research resources...",
        ],
    },
    {
        label: "Dual Research",
        icon: Loader2,
        description: "Perplexity + Gemini analyzing market",
        messages: [
            "Scanning competitor websites...",
            "Analyzing market trends & positioning...",
            "Pulling cultural insights for your region...",
            "Cross-referencing industry benchmarks...",
            "Mining customer sentiment data...",
            "Mapping the competitive landscape...",
        ],
    },
    {
        label: "Triple Analysis",
        icon: Loader2,
        description: "GPT-4o, Gemini, Perplexity generating strategies",
        messages: [
            "GPT-4o generating creative angles...",
            "Gemini crafting narrative hooks...",
            "Perplexity validating with real-time data...",
            "Synthesizing three independent analyses...",
            "Scoring strategy candidates...",
            "Refining tone and messaging...",
            "Aligning strategy with your creative goal...",
        ],
    },
    {
        label: "Consensus & Deck",
        icon: Download,
        description: "Synthesizing final strategy",
        messages: [
            "Building consensus from AI models...",
            "Scoring and ranking insights...",
            "Assembling presentation slides...",
            "Applying brand-specific theming...",
            "Finalizing your strategy deck...",
        ],
    },
];

const StatusDashboard: React.FC<StatusDashboardProps> = ({ jobId, onComplete }) => {
    const pollIntervalRef = useRef(POLL_MIN_MS);
    const [activityIndex, setActivityIndex] = useState(0);
    const activityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { data, error, isError } = useQuery({
        queryKey: ['jobStatus', jobId],
        queryFn: async () => {
            const res = await api.get(`/jobs/${jobId}`);
            return res.data as JobResponse;
        },
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === 'completed' || status === 'failed') return false;
            const current = pollIntervalRef.current;
            pollIntervalRef.current = Math.min(current * 2, POLL_MAX_MS);
            return current;
        },
    });

    const status = data?.status;
    const activeStep = getStepIndex(status);
    const isFailed = status === 'failed';

    // Rotate activity messages for the active step
    useEffect(() => {
        if (activityTimerRef.current) clearInterval(activityTimerRef.current);
        if (status === 'completed' || status === 'failed') return;
        setActivityIndex(0);
        activityTimerRef.current = setInterval(() => {
            setActivityIndex(i => i + 1);
        }, 2800);
        return () => {
            if (activityTimerRef.current) clearInterval(activityTimerRef.current);
        };
    }, [activeStep, status]);

    useEffect(() => {
        if (status === 'completed') onComplete(data);
    }, [status, data, onComplete]);

    const currentMessages = steps[activeStep]?.messages ?? [];
    const currentMessage = currentMessages[activityIndex % currentMessages.length];

    if (isError) {
        return (
            <div className="p-6 bg-red-900/20 border border-red-900 rounded-xl text-center">
                <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                <h3 className="text-xl font-bold text-red-400">Error Fetching Status</h3>
                <p className="text-red-300/80 text-sm">{String(error)}</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-8 glass-strong rounded-2xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 neural-grid opacity-20 pointer-events-none"></div>
            <div className="relative z-10">

                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-gradient-animated mb-2">
                        {status === 'completed' ? "Strategy Generated!" : "AI Agents at Work"}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {status === 'completed'
                            ? "Your marketing strategy is ready"
                            : "Multiple AI models collaborating to create your strategy"}
                    </p>
                </div>

                {/* Live activity ticker */}
                {status !== 'completed' && !isFailed && (
                    <div className="mb-8 px-5 py-3 glass rounded-xl border border-blue-500/20 flex items-center gap-3">
                        <div className="flex-shrink-0 p-1.5 bg-blue-500/20 rounded-lg">
                            <Zap size={14} className="text-blue-400" />
                        </div>
                        <p
                            key={`${activeStep}-${activityIndex}`}
                            className="text-sm font-mono text-blue-300 animate-in fade-in slide-in-from-left-2 duration-300 flex-1"
                        >
                            {currentMessage}
                        </p>
                        <div className="flex gap-1 flex-shrink-0">
                            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="space-y-8 relative before:absolute before:left-[23px] before:top-6 before:bottom-6 before:w-0.5 before:bg-gradient-to-b before:from-blue-500/30 before:via-purple-500/30 before:to-cyan-500/30 before:rounded-full">
                    {steps.map((step, index) => {
                        const isActive = index === activeStep && !isFailed;
                        const isCompleted = index < activeStep || (index === activeStep && status === 'completed');
                        const Icon = step.icon;

                        let iconClasses = "text-slate-500 glass border-slate-700/50";
                        let glowClass = "";
                        if (isActive) { iconClasses = "text-blue-400 glass border-blue-500/50"; glowClass = "glow-blue"; }
                        if (isCompleted) { iconClasses = "text-emerald-400 glass border-emerald-500/50"; glowClass = "glow-cyan"; }
                        if (isFailed && index === activeStep) { iconClasses = "text-red-400 glass border-red-500/50"; }

                        return (
                            <div key={index} className="relative flex items-start gap-5">
                                <div className={`z-10 w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-500 flex-shrink-0 ${iconClasses} ${glowClass} ${isActive ? 'scale-110' : ''}`}>
                                    {isCompleted ? (
                                        <CheckCircle2 size={22} className="text-emerald-400" />
                                    ) : isActive && index !== 0 && index !== 3 ? (
                                        <>
                                            <Loader2 size={22} className="animate-spin text-blue-400" />
                                            <div className="absolute inset-0 rounded-xl bg-blue-500/20 animate-ping"></div>
                                        </>
                                    ) : (
                                        <Icon size={18} />
                                    )}
                                </div>

                                <div className={`flex-1 pt-1 transition-opacity ${isActive || isCompleted ? "opacity-100" : "opacity-40"}`}>
                                    <div className="flex items-center gap-3 mb-0.5">
                                        <h4 className="font-bold text-lg text-slate-100">{step.label}</h4>
                                        {isCompleted && (
                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">DONE</span>
                                        )}
                                        {isActive && !isFailed && (
                                            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full animate-pulse">ACTIVE</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {isFailed && (
                    <div className="mt-8 p-6 glass border border-red-500/50 rounded-xl text-center">
                        <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
                        <h3 className="text-lg font-bold text-red-400 mb-1">Process Failed</h3>
                        {(data as any)?.failed_step && (
                            <p className="text-xs font-mono text-red-400/70 mb-1">Step: {(data as any).failed_step}</p>
                        )}
                        {(data as any)?.error_message ? (
                            <p className="text-sm text-red-300/80">{(data as any).error_message}</p>
                        ) : (
                            <p className="text-sm text-red-300/80">Please check backend logs for details.</p>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default StatusDashboard;
