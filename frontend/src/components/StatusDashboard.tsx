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
    { label: "Queued", icon: FileText },
    { label: "Deep Research (Perplexity)", icon: Loader2 },
    { label: "Strategic Analysis (GPT-4o)", icon: Loader2 },
    { label: "Presentation Ready", icon: Download }
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
        <div className="max-w-2xl mx-auto p-8">
            <h2 className="text-3xl font-bold text-center text-white mb-8">
                {status === 'completed' ? "Strategy Generated!" : "AI Agents at Work..."}
            </h2>

            {/* Progress Steps */}
            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {steps.map((step, index) => {
                    const isActive = index === activeStep;
                    const isCompleted = index < activeStep;
                    const Icon = step.icon;

                    let stepColor = "text-slate-500 bg-slate-900 border-slate-700"; // Default
                    if (isActive && !isFailed) stepColor = "text-blue-400 bg-blue-900/20 border-blue-500/50";
                    if (isCompleted) stepColor = "text-emerald-400 bg-emerald-900/20 border-emerald-500/50";
                    if (isFailed && index === steps.length - 1) stepColor = "text-red-400 bg-red-900/20 border-red-500";

                    return (
                        <div key={index} className="relative flex items-center gap-4">
                            {/* Dot/Icon */}
                            <div className={`
                                z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                ${stepColor}
                            `}>
                                {isCompleted ? (
                                    <CheckCircle2 size={20} />
                                ) : isActive && !isFailed && index !== 0 && index !== 3 ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Icon size={18} />
                                )}
                            </div>

                            {/* Label */}
                            <div className={`${isActive || isCompleted ? "opacity-100" : "opacity-40"} transition-opacity`}>
                                <h4 className="font-semibold text-lg text-slate-200">{step.label}</h4>
                                {isActive && !isFailed && (
                                    <p className="text-sm text-blue-400 animate-pulse">Processing...</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isFailed && (
                <div className="mt-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-center text-red-400">
                    Process Failed. Please check backend logs.
                </div>
            )}
        </div>
    );
};

export default StatusDashboard;
