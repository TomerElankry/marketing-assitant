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
        case 'pending':     return 0;
        case 'approved':    return 0;
        case 'researching': return 1;
        case 'analyzing':   return 2;
        case 'completed':   return 3;
        case 'failed':      return 3;
        default:            return 0;
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

    useEffect(() => {
        if (activityTimerRef.current) clearInterval(activityTimerRef.current);
        if (status === 'completed' || status === 'failed') return;
        setActivityIndex(0);
        activityTimerRef.current = setInterval(() => {
            setActivityIndex(i => i + 1);
        }, 2800);
        return () => { if (activityTimerRef.current) clearInterval(activityTimerRef.current); };
    }, [activeStep, status]);

    useEffect(() => {
        if (status === 'completed') onComplete(data);
    }, [status, data, onComplete]);

    const currentMessages = steps[activeStep]?.messages ?? [];
    const currentMessage = currentMessages[activityIndex % currentMessages.length];

    if (isError) {
        return (
            <div className="warm-card p-8 text-center max-w-2xl mx-auto border-red-200 bg-red-50">
                <AlertCircle className="mx-auto text-red-500 mb-3" size={32} />
                <h3 className="text-lg font-bold text-red-700 mb-1">Error Fetching Status</h3>
                <p className="text-red-600 text-sm">{String(error)}</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="warm-card p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-[#1C1917] mb-1">
                        {status === 'completed' ? "Strategy Ready!" : "AI Agents at Work"}
                    </h2>
                    <p className="text-[#78716C] text-sm">
                        {status === 'completed'
                            ? "Your marketing strategy has been generated"
                            : "Multiple AI models collaborating on your strategy"}
                    </p>
                </div>

                {/* Live activity ticker */}
                {status !== 'completed' && !isFailed && (
                    <div className="mb-8 px-4 py-3 bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-xl flex items-center gap-3">
                        <div className="shrink-0 p-1.5 bg-[#1E3A5F]/10 rounded-lg">
                            <Zap size={13} className="text-[#1E3A5F]" />
                        </div>
                        <p
                            key={`${activeStep}-${activityIndex}`}
                            className="text-sm font-mono text-[#1E3A5F] flex-1 animate-in fade-in slide-in-from-left-2 duration-300"
                        >
                            {currentMessage}
                        </p>
                        <div className="flex gap-1 shrink-0">
                            <div className="w-1.5 h-1.5 bg-[#1E3A5F] rounded-full animate-pulse" />
                            <div className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                            <div className="w-1.5 h-1.5 bg-[#1E3A5F] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-6 before:bottom-6 before:w-0.5 before:bg-[#E7E5E4] before:rounded-full">
                    {steps.map((step, index) => {
                        const isActive    = index === activeStep && !isFailed;
                        const isCompleted = index < activeStep || (index === activeStep && status === 'completed');
                        const Icon = step.icon;

                        return (
                            <div key={index} className="relative flex items-start gap-4">
                                {/* Step icon */}
                                <div className={`
                                    z-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 shrink-0
                                    ${isCompleted
                                        ? 'bg-emerald-50 border-emerald-400'
                                        : isActive
                                            ? 'bg-[#1E3A5F]/8 border-[#1E3A5F] scale-105'
                                            : 'bg-white border-[#E7E5E4]'}
                                `}>
                                    {isCompleted ? (
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                    ) : isActive && index !== 0 && index !== 3 ? (
                                        <Loader2 size={18} className="animate-spin text-[#1E3A5F]" />
                                    ) : (
                                        <Icon size={16} className={isActive ? 'text-[#1E3A5F]' : 'text-[#A8A29E]'} />
                                    )}
                                </div>

                                {/* Step label */}
                                <div className={`flex-1 pt-1.5 transition-opacity ${isActive || isCompleted ? 'opacity-100' : 'opacity-35'}`}>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-semibold text-[#1C1917] text-sm">{step.label}</h4>
                                        {isCompleted && (
                                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Done</span>
                                        )}
                                        {isActive && !isFailed && (
                                            <span className="text-[10px] font-semibold text-[#1E3A5F] bg-[#1E3A5F]/8 border border-[#1E3A5F]/20 px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">Active</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#78716C]">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Failed state */}
                {isFailed && (
                    <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl text-center">
                        <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
                        <h3 className="text-base font-bold text-red-700 mb-1">Process Failed</h3>
                        {(data as any)?.failed_step && (
                            <p className="text-xs font-mono text-red-500 mb-1">Step: {(data as any).failed_step}</p>
                        )}
                        <p className="text-sm text-red-600">
                            {(data as any)?.error_message ?? "Please check backend logs for details."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusDashboard;
