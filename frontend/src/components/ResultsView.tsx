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
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

            <div className="text-center space-y-4">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                    Strategy Unlocked
                </h1>
                <p className="text-slate-400">
                    Our AI has analyzed the market and crafted your winning narrative.
                </p>
                <div className="pt-4">
                    <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-900 font-bold text-lg rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <Download size={24} /> Download Presentation (.pptx)
                    </button>
                    <p className="text-xs text-slate-500 mt-2">Ready for PowerPoint</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Hooks Card */}
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                        <Lightbulb size={24} />
                        <h3 className="text-xl font-bold">Marketing Hooks</h3>
                    </div>
                    <ul className="space-y-3">
                        {analysis.hooks?.map((hook: string, i: number) => (
                            <li key={i} className="flex gap-3 text-slate-300">
                                <span className="text-emerald-500/50 font-mono">0{i + 1}</span>
                                <span>"{hook}"</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Creative Pivot Card */}
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4 text-purple-400">
                        <TrendingUp size={24} />
                        <h3 className="text-xl font-bold">The Creative Pivot</h3>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        {analysis.creative_pivot}
                    </p>
                </div>

            </div>

            {/* Angles Section */}
            <div>
                <div className="flex items-center gap-3 mb-4 text-blue-400 pl-2">
                    <Target size={24} />
                    <h3 className="text-xl font-bold">Strategic Angles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.angles?.map((angle: any, i: number) => (
                        <div key={i} className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:bg-slate-800/60 transition-colors">
                            <h4 className="font-bold text-white mb-1">{angle.title}</h4>
                            <p className="text-sm text-slate-400">{angle.description}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ResultsView;
