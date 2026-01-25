import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Download, Lightbulb, TrendingUp, Target, Loader2 } from 'lucide-react';

interface ResultsViewProps {
    jobId: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({ jobId }) => {

    // Fetch Analysis Data
    const { data: analysis, isLoading } = useQuery({
        queryKey: ['jobAnalysis', jobId],
        queryFn: async () => {
            const res = await axios.get(`/api/jobs/${jobId}/analysis`);
            return res.data;
        }
    });

    const handleDownload = () => {
        // Direct navigation to download endpoint to trigger browser download
        window.location.href = `/api/jobs/${jobId}/download`;
    };

    if (isLoading) {
        return <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>;
    }

    if (!analysis) {
        return <div className="text-center text-red-400">Failed to load analysis results.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

            <div className="text-center space-y-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full border border-emerald-500/30 mb-4">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs font-mono text-emerald-400">CONSENSUS GENERATED</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gradient-animated mb-4">
                        Strategy Unlocked
                    </h1>
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                        Three AI models collaborated to synthesize your winning narrative
                    </p>
                    <div className="pt-6">
                        <button
                            onClick={handleDownload}
                            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 text-white font-bold text-lg rounded-full hover:scale-105 active:scale-95 transition-all glow-blue hover:glow-purple relative overflow-hidden"
                        >
                            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                            <Download size={24} className="relative z-10 group-hover:animate-bounce" />
                            <span className="relative z-10">Download Presentation (.pptx)</span>
                        </button>
                        <p className="text-xs text-slate-400 mt-3 font-mono">Ready for PowerPoint</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Hooks Card */}
                <div className="p-8 glass-strong rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 transition-all relative overflow-hidden holographic group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Lightbulb size={24} className="text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gradient-animated">Marketing Hooks</h3>
                        </div>
                        <ul className="space-y-4">
                            {Array.isArray(analysis.hooks) ? analysis.hooks.map((hook: any, i: number) => {
                                const hookText = typeof hook === 'string' ? hook : hook.hook || hook;
                                const source = hook.source || '';
                                return (
                                    <li key={i} className="flex gap-4 group/item">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm font-mono text-emerald-400 group-hover/item:glow-cyan transition-all">
                                            0{i + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-slate-200 leading-relaxed">"{hookText}"</p>
                                            {source && (
                                                <p className="text-xs text-slate-500 mt-1 font-mono">Source: {source}</p>
                                            )}
                                        </div>
                                    </li>
                                );
                            }) : <li className="text-slate-400">No hooks generated.</li>}
                        </ul>
                    </div>
                </div>

                {/* Creative Pivot Card */}
                <div className="p-8 glass-strong rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all relative overflow-hidden holographic group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <TrendingUp size={24} className="text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gradient-animated">The Creative Pivot</h3>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-lg">
                            {analysis.creative_pivot || "No creative pivot generated."}
                        </p>
                        {analysis.consensus_notes && (
                            <div className="mt-6 pt-6 border-t border-slate-700/50">
                                <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Consensus Notes</p>
                                <p className="text-sm text-slate-300 leading-relaxed">{analysis.consensus_notes}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Angles Section */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-6 pl-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Target size={24} className="text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gradient-animated">Strategic Angles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(analysis.angles) && analysis.angles.length > 0 ? analysis.angles.map((angle: any, i: number) => (
                        <div key={i} className="p-6 glass rounded-xl border border-slate-700/50 hover:border-blue-500/30 hover:glow-blue transition-all group cursor-default relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs font-mono text-blue-400/50">Angle {i + 1}</span>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                                </div>
                                <h4 className="font-bold text-lg text-white mb-2 group-hover:text-blue-400 transition-colors">{angle.title || angle}</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{angle.description || angle}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-8 text-slate-400 glass rounded-xl border border-slate-700/30">
                            No strategic angles generated.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ResultsView;
