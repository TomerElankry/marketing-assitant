import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Download, Lightbulb, TrendingUp, Target, Loader2, CheckCircle } from 'lucide-react';

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
        <div className="max-w-6xl mx-auto p-2 pb-20 space-y-12 animate-fadeIn">

            {/* Hero Section */}
            <div className="text-center space-y-6 pt-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4 animate-slideUp">
                    <CheckCircle size={12} /> STRATEGY_GENERATED_SUCCESSFULLY
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white animate-slideUp" style={{ animationDelay: '0.1s' }}>
                    Strategy <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Unlocked</span>
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg animate-slideUp" style={{ animationDelay: '0.2s' }}>
                    Our agents have analyzed the market and crafted a winning narrative for your brand.
                </p>

                <div className="pt-8 animate-slideUp" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={handleDownload}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Download size={24} /> Download Presentation
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                    <p className="text-xs text-slate-500 mt-4 font-mono">format: .pptx | size: ~2MB</p>
                </div>
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slideUp" style={{ animationDelay: '0.4s' }}>

                {/* Hooks Card */}
                <div className="relative group p-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
                    <div className="absolute inset-0 bg-slate-950/80 rounded-2xl z-0"></div>
                    <div className="relative z-10 p-8 h-full">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                <Lightbulb size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Marketing Hooks</h3>
                        </div>
                        <ul className="space-y-4">
                            {analysis.hooks?.map((hook: string, i: number) => (
                                <li key={i} className="flex gap-4 group/item">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-mono text-indigo-400 border border-slate-700 group-hover/item:border-indigo-500/50 transition-colors">
                                        0{i + 1}
                                    </span>
                                    <span className="text-slate-300 group-hover/item:text-white transition-colors leading-relaxed">"{hook}"</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Creative Pivot Card */}
                <div className="relative group p-1 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
                    <div className="absolute inset-0 bg-slate-950/80 rounded-2xl z-0"></div>
                    <div className="relative z-10 p-8 h-full">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-fuchsia-500/20 rounded-xl text-fuchsia-400">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">The Creative Pivot</h3>
                        </div>
                        <div className="prose prose-invert">
                            <p className="text-lg text-slate-300 leading-relaxed italic">
                                "{analysis.creative_pivot}"
                            </p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Impact Score</div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full w-[85%] bg-gradient-to-r from-fuchsia-500 to-pink-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Strategic Angles */}
            <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-3 mb-6 pl-2">
                    <Target className="text-blue-400" size={24} />
                    <h3 className="text-xl font-bold text-white">Strategic Angles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analysis.angles?.map((angle: any, i: number) => (
                        <div key={i} className="group p-6 bg-slate-900/40 border border-slate-800 rounded-xl hover:bg-slate-800/60 hover:border-blue-500/30 transition-all duration-300 cursor-default hover:-translate-y-1">
                            <h4 className="font-bold text-white mb-2 text-lg group-hover:text-blue-400 transition-colors">{angle.title}</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">{angle.description}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ResultsView;
