import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { JobResponse } from '../types';

interface StatusDashboardProps {
    jobId: string;
    onComplete: (data: any) => void;
}

const StatusDashboard: React.FC<StatusDashboardProps> = ({ jobId, onComplete }) => {
    // Poll every 3 seconds
    const { data: job, error } = useQuery<JobResponse>({
        queryKey: ['jobStatus', jobId],
        queryFn: async () => {
            const res = await axios.get(`/api/jobs/${jobId}`);
            // console.log("Polling Status:", res.data);
            return res.data;
        },
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return (status === 'completed' || status === 'failed') ? false : 3000;
        },
    });

    useEffect(() => {
        if (job?.status === 'completed') {
            onComplete(job);
        }
    }, [job?.status, onComplete, job]);

    const getProgress = (status: string) => {
        switch (status) {
            case 'pending': return 10;
            case 'researching': return 30;
            case 'analyzing': return 60;
            case 'consensus': return 85;
            case 'completed': return 100;
            default: return 5;
        }
    };

    const progress = getProgress(job?.status || 'pending');

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">

            {/* Terminal Container */}
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-2xl">

                {/* Visual Header */}
                <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                    </div>
                    <div className="text-xs font-mono text-slate-500">JOB-ID: {jobId?.substring(0, 8)}...</div>
                </div>

                <div className="p-8 space-y-8">

                    {/* Status Display */}
                    <div className="text-center space-y-2">
                        <div className="relative inline-flex items-center justify-center">
                            {job?.status === 'failed' ? (
                                <AlertCircle className="text-red-500 w-16 h-16" />
                            ) : (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                                    <Loader2 className="text-blue-500 w-12 h-12 animate-spin relative z-10" />
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
                            {job?.status || "Initializing..."}
                        </h2>
                        <p className="text-slate-400 font-mono text-sm">
                            AI Agents are working on your strategy...
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 font-mono uppercase">
                            <span>Start</span>
                            <span>Research</span>
                            <span>Analysis</span>
                            <span>Finish</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000 ease-out relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Terminal Logs */}
                    <div className="bg-black/40 rounded-lg p-4 font-mono text-xs md:text-sm text-slate-300 space-y-2 border border-slate-800/50 h-32 overflow-hidden relative">
                        <div className="flex items-center gap-2 text-emerald-500/80">
                            <CheckCircle2 size={12} /> <span>Validation complete.</span>
                        </div>
                        {progress >= 10 && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <span className="text-slate-500">➜</span>
                                <span>Initializing AI agents swarm...</span>
                            </div>
                        )}
                        {progress >= 30 && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <span className="text-blue-500">➜</span>
                                <span>Running Dual Research (Perplexity + Gemini)...</span>
                            </div>
                        )}
                        {progress >= 60 && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <span className="text-purple-500">➜</span>
                                <span>Triple Analysis (GPT-4o, Gemini, Perplexity)...</span>
                            </div>
                        )}
                        {progress >= 85 && (
                            <div className="flex items-center gap-2 animate-fadeIn">
                                <span className="text-yellow-500">➜</span>
                                <span>Generating Consensus Strategy...</span>
                            </div>
                        )}
                        {progress >= 95 && (
                            <div className="flex items-center gap-2 animate-fadeIn text-emerald-400">
                                <span className="text-emerald-500">➜</span>
                                <span>Finalizing Presentation...</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-3">
                    <AlertCircle />
                    <span>Failed to fetch job status. Backend might be down.</span>
                </div>
            )}
        </div>
    );
};

export default StatusDashboard;
