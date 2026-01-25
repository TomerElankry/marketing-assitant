import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, CheckCircle2, FileText, Download, AlertCircle } from 'lucide-react';
import type { JobResponse } from '../types';

interface StatusDashboardProps {
    jobId: string;
    onComplete: (data: any) => void;
}

// Map status to step index
const getStepIndex = (status?: string) => {
    switch (status) {
        case 'pending': return 0;
        case 'approved': return 0;
        case 'researching': return 1;
        case 'analyzing': return 2;
        case 'completed': return 3;
        case 'failed': return 3; // treat as end
        default: return 0;
    }
};

const steps = [
    { label: "Queued", icon: FileText, description: "Job queued for processing" },
    { label: "Dual Research", icon: Loader2, description: "Perplexity + Gemini analyzing market" },
    { label: "Triple Analysis", icon: Loader2, description: "GPT-4o, Gemini, Perplexity generating strategies" },
    { label: "Consensus & Presentation", icon: Download, description: "Synthesizing final strategy" }
];

const StatusDashboard: React.FC<StatusDashboardProps> = ({ jobId, onComplete }) => {

    const { data, error, isError } = useQuery({
        queryKey: ['jobStatus', jobId],
        queryFn: async () => {
            const res = await axios.get(`/api/jobs/${jobId}`);
            return res.data; // This matches the specific endpoint return structure
        },
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === 'completed' || status === 'failed') {
                return false; // Stop polling
            }
            return 2000; // Poll every 2s
        },
    });

    const status = data?.status;
    const activeStep = getStepIndex(status);
    const isFailed = status === 'failed';

    useEffect(() => {
        if (status === 'completed') {
            onComplete(data);
        }
    }, [status, data, onComplete]);

    if (isError) {
        return (
            <div className="p-6 bg-red-900/20 border border-red-900 rounded-xl text-center">
                <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                <h3 className="text-xl font-bold text-red-400">Error Fetching Status</h3>
                <p className="text-red-300/80">{String(error)}</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-8 glass-strong rounded-2xl border border-slate-700/50 relative overflow-hidden">
            <div className="absolute inset-0 neural-grid opacity-20 pointer-events-none"></div>
            <div className="relative z-10">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gradient-animated mb-3">
                    {status === 'completed' ? "Strategy Generated!" : "AI Agents at Work..."}
                </h2>
                <p className="text-slate-400 text-sm">
                    {status === 'completed' 
                        ? "Your marketing strategy is ready" 
                        : "Multiple AI models collaborating to create your strategy"}
                </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-10 relative before:absolute before:left-[24px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-blue-500/30 before:via-purple-500/30 before:to-cyan-500/30 before:rounded-full">
                {steps.map((step, index) => {
                    const isActive = index === activeStep;
                    const isCompleted = index < activeStep;
                    const Icon = step.icon;

                    let stepColor = "text-slate-500 glass border-slate-700/50"; // Default
                    let glowClass = "";
                    if (isActive && !isFailed) {
                        stepColor = "text-blue-400 glass border-blue-500/50";
                        glowClass = "glow-blue";
                    }
                    if (isCompleted) {
                        stepColor = "text-emerald-400 glass border-emerald-500/50";
                        glowClass = "glow-cyan";
                    }
                    if (isFailed && index === steps.length - 1) {
                        stepColor = "text-red-400 glass border-red-500/50";
                    }

                    return (
                        <div key={index} className="relative flex items-start gap-6 group">
                            {/* Dot/Icon */}
                            <div className={`
                                z-10 w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-500 relative
                                ${stepColor} ${glowClass}
                                ${isActive ? 'scale-110' : ''}
                            `}>
                                {isCompleted ? (
                                    <CheckCircle2 size={24} className="text-emerald-400" />
                                ) : isActive && !isFailed && index !== 0 && index !== 3 ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin text-blue-400" />
                                        <div className="absolute inset-0 rounded-xl bg-blue-500/20 animate-ping"></div>
                                    </>
                                ) : (
                                    <Icon size={20} />
                                )}
                            </div>

                            {/* Label */}
                            <div className={`flex-1 pt-1 ${isActive || isCompleted ? "opacity-100" : "opacity-50"} transition-opacity`}>
                                <h4 className="font-bold text-xl text-slate-100 mb-1">{step.label}</h4>
                                <p className="text-sm text-slate-400 mb-2">{step.description}</p>
                                {isActive && !isFailed && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                        <span className="text-blue-400 font-mono text-xs">AI processing...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isFailed && (
                <div className="mt-8 p-6 glass border border-red-500/50 rounded-xl text-center">
                    <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
                    <h3 className="text-lg font-bold text-red-400 mb-1">Process Failed</h3>
                    <p className="text-sm text-red-300/80">Please check backend logs for details.</p>
                </div>
            )}
            </div>
        </div>
    );
};

export default StatusDashboard;
