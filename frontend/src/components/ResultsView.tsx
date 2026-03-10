import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Download, Lightbulb, TrendingUp, Target, Loader2, Copy, Check, ChevronDown, ChevronUp, Radio, Zap, Globe, ExternalLink } from 'lucide-react';

interface ResultsViewProps {
    jobId: string;
}

function useCopyToClipboard() {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(id);
            setTimeout(() => setCopied(null), 1800);
        });
    };
    return { copied, copy };
}

const ResultsView: React.FC<ResultsViewProps> = ({ jobId }) => {
    const { user, connectCanva } = useAuth();
    const { data: analysis, isLoading } = useQuery({
        queryKey: ['jobAnalysis', jobId],
        queryFn: async () => {
            const res = await api.get(`/jobs/${jobId}/analysis`);
            return res.data;
        }
    });

    const { copied, copy } = useCopyToClipboard();
    const [expandedAngles, setExpandedAngles] = useState<Set<number>>(new Set());

    const toggleAngle = (i: number) => {
        setExpandedAngles(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    const [downloading, setDownloading] = useState(false);
    const [canvaImporting, setCanvaImporting] = useState(false);
    const [canvaError, setCanvaError] = useState<string | null>(null);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await api.get(`/jobs/${jobId}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `marketing_strategy_${jobId}.pptx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed', err);
        } finally {
            setDownloading(false);
        }
    };

    const handleEditInCanva = async () => {
        setCanvaImporting(true);
        setCanvaError(null);
        try {
            const res = await api.post<{ edit_url: string }>(`/jobs/${jobId}/canva-import`);
            window.open(res.data.edit_url, '_blank');
        } catch (err: any) {
            setCanvaError(err?.response?.data?.detail ?? 'Canva import failed. Please try again.');
        } finally {
            setCanvaImporting(false);
        }
    };


    if (isLoading) {
        return (
            <div className="text-center p-20 space-y-4">
                <Loader2 className="animate-spin mx-auto text-blue-500" size={40} />
                <p className="text-slate-400 text-sm font-mono">Loading your strategy...</p>
            </div>
        );
    }

    if (!analysis) {
        return <div className="text-center text-red-400 p-10">Failed to load analysis results.</div>;
    }

    const hooks = Array.isArray(analysis.hooks) ? analysis.hooks : [];
    const angles = Array.isArray(analysis.angles) ? analysis.angles : [];

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Hero Header */}
            <div className="text-center space-y-6 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
                    <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-2">
                        Three AI models collaborated to synthesize your winning narrative
                    </p>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-6 mt-4 mb-6">
                        <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-slate-700/50">
                            <Lightbulb size={14} className="text-emerald-400" />
                            <span className="text-xs font-mono text-slate-300">{hooks.length} hooks</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-slate-700/50">
                            <Target size={14} className="text-blue-400" />
                            <span className="text-xs font-mono text-slate-300">{angles.length} angles</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-slate-700/50">
                            <TrendingUp size={14} className="text-purple-400" />
                            <span className="text-xs font-mono text-slate-300">1 creative pivot</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 text-white font-bold text-lg rounded-full hover:scale-105 active:scale-95 transition-all glow-blue hover:glow-purple relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                            {downloading
                                ? <Loader2 size={24} className="relative z-10 animate-spin" />
                                : <Download size={24} className="relative z-10 group-hover:animate-bounce" />
                            }
                            <span className="relative z-10">{downloading ? 'Preparing…' : 'Download (.pptx)'}</span>
                        </button>

                        <button
                            onClick={user?.canva_connected ? handleEditInCanva : connectCanva}
                            disabled={canvaImporting}
                            className="inline-flex items-center gap-2.5 px-8 py-5 bg-[#7D2AE8] hover:bg-[#6a22cc] text-white font-bold text-lg rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {canvaImporting
                                ? <Loader2 size={20} className="animate-spin" />
                                : <ExternalLink size={20} />
                            }
                            {canvaImporting ? 'Importing…' : 'Edit in Canva'}
                        </button>
                    </div>

                    {canvaError && (
                        <p className="text-xs text-red-400 mt-2 font-mono">{canvaError}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-3 font-mono">
                        {user?.canva_connected
                            ? 'Download to PowerPoint or edit directly in Canva'
                            : 'Click "Edit in Canva" to connect your Canva account'}
                    </p>
                </div>
            </div>

            {/* Top two cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Hooks Card */}
                <div className="p-8 glass-strong rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 transition-all relative overflow-hidden holographic group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Lightbulb size={22} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gradient-animated">Marketing Hooks</h3>
                        </div>
                        <ul className="space-y-4">
                            {hooks.length > 0 ? hooks.map((hook: any, i: number) => {
                                const hookText = typeof hook === 'string' ? hook : hook.hook || String(hook);
                                const source = hook.source || '';
                                const copyId = `hook-${i}`;
                                return (
                                    <li key={i} className="flex gap-3 group/item">
                                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs font-mono text-emerald-400 mt-0.5">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-slate-200 leading-relaxed text-sm flex-1">"{hookText}"</p>
                                                <button
                                                    onClick={() => copy(hookText, copyId)}
                                                    className="flex-shrink-0 p-1.5 glass rounded-md border border-slate-700/50 hover:border-emerald-500/50 text-slate-500 hover:text-emerald-400 transition-all opacity-0 group-hover/item:opacity-100"
                                                    title="Copy hook"
                                                >
                                                    {copied === copyId ? <Check size={12} /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                            {source && (
                                                <p className="text-xs text-slate-500 mt-1 font-mono truncate">↳ {source}</p>
                                            )}
                                        </div>
                                    </li>
                                );
                            }) : <li className="text-slate-400 text-sm">No hooks generated.</li>}
                        </ul>

                        {hooks.length > 0 && (
                            <button
                                onClick={() => copy(hooks.map((h: any) => typeof h === 'string' ? h : h.hook).join('\n'), 'all-hooks')}
                                className="mt-5 w-full flex items-center justify-center gap-2 py-2 glass rounded-lg border border-slate-700/50 hover:border-emerald-500/30 text-xs text-slate-400 hover:text-emerald-400 transition-all"
                            >
                                {copied === 'all-hooks' ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy all hooks</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* Creative Pivot Card */}
                <div className="p-8 glass-strong rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all relative overflow-hidden holographic group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <TrendingUp size={22} className="text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gradient-animated">The Creative Pivot</h3>
                            </div>
                            <button
                                onClick={() => copy(analysis.creative_pivot || '', 'pivot')}
                                className="p-1.5 glass rounded-md border border-slate-700/50 hover:border-purple-500/50 text-slate-500 hover:text-purple-400 transition-all"
                                title="Copy pivot"
                            >
                                {copied === 'pivot' ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                        </div>
                        <p className="text-slate-200 leading-relaxed">
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

            {/* Brand Awareness Strategy */}
            {analysis.brand_awareness_strategy && Object.keys(analysis.brand_awareness_strategy).length > 0 && (() => {
                const bas = analysis.brand_awareness_strategy;
                const tactics: string[] = Array.isArray(bas.channel_tactics) ? bas.channel_tactics : [];
                const wins: string[] = Array.isArray(bas.quick_wins) ? bas.quick_wins : [];
                return (
                    <div className="p-8 glass-strong rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all relative overflow-hidden holographic group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-cyan-500/20 rounded-lg">
                                    <Radio size={22} className="text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gradient-animated">Brand Awareness Strategy</h3>
                            </div>

                            {bas.summary && (
                                <p className="text-slate-200 leading-relaxed mb-6">{bas.summary}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Channel tactics */}
                                {tactics.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Globe size={14} className="text-cyan-400" />
                                            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Channel Tactics</p>
                                        </div>
                                        <ul className="space-y-2">
                                            {tactics.map((t, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-slate-300">
                                                    <span className="text-cyan-500 flex-shrink-0 mt-0.5">▸</span>
                                                    <span>{t}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Positioning */}
                                {bas.positioning_recommendation && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Target size={14} className="text-purple-400" />
                                            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Positioning</p>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">{bas.positioning_recommendation}</p>
                                    </div>
                                )}

                                {/* Quick wins */}
                                {wins.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Zap size={14} className="text-amber-400" />
                                            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Quick Wins</p>
                                        </div>
                                        <ul className="space-y-2">
                                            {wins.map((w, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-slate-300">
                                                    <span className="text-amber-500 flex-shrink-0 font-mono text-xs mt-1">{i + 1}.</span>
                                                    <span>{w}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Strategic Angles — expandable cards */}
            <div>
                <div className="flex items-center gap-3 mb-6 pl-1">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Target size={22} className="text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gradient-animated">Strategic Angles</h3>
                    <span className="text-xs font-mono text-slate-500 ml-1">({angles.length} angles — click to expand)</span>
                </div>

                {angles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {angles.map((angle: any, i: number) => {
                            const title = angle.title || (typeof angle === 'string' ? angle : `Angle ${i + 1}`);
                            const description = angle.description || (typeof angle === 'string' ? '' : '');
                            const isExpanded = expandedAngles.has(i);
                            const copyId = `angle-${i}`;
                            return (
                                <div
                                    key={i}
                                    className="glass rounded-xl border border-slate-700/50 hover:border-blue-500/30 hover:glow-blue transition-all group cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                    {/* Header row — always visible */}
                                    <button
                                        type="button"
                                        onClick={() => toggleAngle(i)}
                                        className="w-full relative z-10 p-5 text-left"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-mono text-blue-400/60 block mb-1">ANGLE {String(i + 1).padStart(2, '0')}</span>
                                                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors text-sm leading-snug">{title}</h4>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                                                {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded body */}
                                    {isExpanded && description && (
                                        <div className="px-5 pb-5 relative z-10 border-t border-slate-700/40">
                                            <p className="text-sm text-slate-300 leading-relaxed mt-3">{description}</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copy(`${title}\n\n${description}`, copyId); }}
                                                className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors"
                                            >
                                                {copied === copyId ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 glass rounded-xl border border-slate-700/30 text-sm">
                        No strategic angles generated.
                    </div>
                )}
            </div>

        </div>
    );
};

export default ResultsView;
