import { useQuery } from '@tanstack/react-query';
import {
    Building2, Globe, Layers, ArrowLeft, Plus, Pencil, ChevronRight,
    Loader2, AlertCircle, Target, Clock, XCircle, CheckCircle2, Users,
    ShoppingBag, Swords,
} from 'lucide-react';
import api from '../lib/api';
import type { Client, JobEntry } from '../types';

interface ClientDetailProps {
    clientId: string;
    onBack: () => void;
    onNewCampaign: (clientId: string) => void;
    onViewJob: (jobId: string) => void;
    onEditClient: (clientId: string) => void;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        completed:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
        analyzing:   'bg-blue-50 text-blue-700 border border-blue-200',
        researching: 'bg-violet-50 text-violet-700 border border-violet-200',
        approved:    'bg-amber-50 text-amber-700 border border-amber-200',
        pending:     'bg-stone-100 text-stone-600 border border-stone-200',
        failed:      'bg-red-50 text-red-700 border border-red-200',
    };
    const labels: Record<string, string> = {
        completed: 'COMPLETED', analyzing: 'ANALYZING', researching: 'RESEARCHING',
        approved: 'QUEUED', pending: 'PENDING', failed: 'FAILED',
    };
    return (
        <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full ${styles[status] ?? styles.pending}`}>
            {labels[status] ?? status.toUpperCase()}
        </span>
    );
}

function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-[10px] font-semibold tracking-wider text-[#A8A29E] uppercase mb-0.5">{label}</p>
            <p className="text-sm text-[#1C1917]">{value}</p>
        </div>
    );
}

export default function ClientDetail({ clientId, onBack, onNewCampaign, onViewJob, onEditClient }: ClientDetailProps) {
    const { data: client, isLoading: clientLoading, isError: clientError } = useQuery<Client>({
        queryKey: ['client', clientId],
        queryFn: () => api.get<Client>(`/clients/${clientId}`).then(r => r.data),
    });

    const { data: jobs, isLoading: jobsLoading } = useQuery<JobEntry[]>({
        queryKey: ['jobs'],
        queryFn: () => api.get<JobEntry[]>('/jobs').then(r => r.data),
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
    });

    const campaigns = (jobs ?? []).filter(j => j.client_id === clientId);

    if (clientLoading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#1E3A5F]" />
            </div>
        );
    }

    if (clientError || !client) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <div className="bg-white border border-red-200 rounded-xl p-8 flex items-center gap-3 text-red-700 max-w-sm">
                    <AlertCircle size={20} className="shrink-0" />
                    <span className="text-sm">Failed to load client.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Back + header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="btn-ghost text-sm flex items-center gap-1.5">
                        <ArrowLeft size={14} />
                        Clients
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                                <Building2 size={16} className="text-[#1E3A5F]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[#1C1917]">{client.brand_name}</h1>
                                <div className="flex items-center gap-3 text-xs text-[#78716C]">
                                    <span className="flex items-center gap-1"><Layers size={10} />{client.industry}</span>
                                    <span className="flex items-center gap-1"><Globe size={10} />{client.target_country}</span>
                                    {client.website_url && (
                                        <a href={client.website_url} target="_blank" rel="noreferrer" className="hover:text-[#1E3A5F] transition-colors">
                                            {client.website_url.replace(/^https?:\/\//, '')}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onEditClient(clientId)}
                            className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] px-3 py-1.5 border border-[#E7E5E4] rounded-lg hover:bg-white transition-all"
                        >
                            <Pencil size={13} />
                            Edit Client
                        </button>
                        <button onClick={() => onNewCampaign(clientId)} className="btn-primary text-sm">
                            <Plus size={14} />
                            New Campaign
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-[300px_1fr] gap-6">
                    {/* Left: Client profile */}
                    <div className="space-y-4">
                        {/* Product */}
                        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <ShoppingBag size={14} className="text-[#1E3A5F]" />
                                <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Product</span>
                            </div>
                            <InfoRow label="Description" value={client.product_description} />
                            <InfoRow label="Problem Solved" value={client.core_problem_solved} />
                            <InfoRow label="USP" value={client.unique_selling_proposition} />
                        </div>

                        {/* Audience */}
                        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={14} className="text-[#1E3A5F]" />
                                <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Audience</span>
                            </div>
                            <InfoRow label="Demographics" value={client.demographics} />
                            <InfoRow label="Psychographics" value={client.psychographics} />
                            <InfoRow label="Cultural Nuances" value={client.cultural_nuances} />
                        </div>

                        {/* Competitors */}
                        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Swords size={14} className="text-[#1E3A5F]" />
                                <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">Competitors</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {client.main_competitors.map(c => (
                                    <span key={c} className="text-xs px-2.5 py-1 bg-stone-100 text-[#78716C] rounded-full">{c}</span>
                                ))}
                            </div>
                            {client.current_marketing_efforts && (
                                <div className="mt-4">
                                    <InfoRow label="Current Marketing" value={client.current_marketing_efforts} />
                                </div>
                            )}
                            {client.known_customer_objections && (
                                <div className="mt-4">
                                    <InfoRow label="Known Objections" value={client.known_customer_objections} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Campaigns */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-[#1C1917]">
                                Campaigns
                                {campaigns.length > 0 && (
                                    <span className="ml-2 text-sm font-normal text-[#A8A29E]">({campaigns.length})</span>
                                )}
                            </h2>
                        </div>

                        {/* Campaign list loading */}
                        {jobsLoading && (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white border border-[#E7E5E4] rounded-xl p-5 h-24 animate-pulse" />
                                ))}
                            </div>
                        )}

                        {/* Empty */}
                        {!jobsLoading && campaigns.length === 0 && (
                            <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
                                <Target size={24} className="mx-auto text-stone-300 mb-3" />
                                <p className="text-[#78716C] text-sm mb-4">No campaigns yet for this client.</p>
                                <button onClick={() => onNewCampaign(clientId)} className="btn-primary text-sm">
                                    <Plus size={14} />
                                    Create First Campaign
                                </button>
                            </div>
                        )}

                        {/* Campaign rows */}
                        {!jobsLoading && campaigns.length > 0 && (
                            <div className="space-y-2">
                                {campaigns.map(job => {
                                    const isCompleted = job.status === 'completed';
                                    const isActive = ['researching', 'analyzing', 'approved', 'pending'].includes(job.status);
                                    const isFailed = job.status === 'failed';
                                    const accentColor = isCompleted ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : isFailed ? 'bg-red-500' : 'bg-stone-300';

                                    const inner = (
                                        <div className={`bg-white border border-[#E7E5E4] rounded-xl flex overflow-hidden transition-all duration-150 ${isCompleted ? 'hover:border-[#C7C3BE] hover:shadow-sm cursor-pointer' : ''} ${isFailed ? 'border-red-200' : ''}`}>
                                            <div className={`w-1 shrink-0 ${accentColor}`} />
                                            <div className="flex flex-col flex-1 px-5 py-4 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-1.5">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-[#1C1917] truncate">
                                                            {job.campaign_name ?? job.primary_objective ?? 'Campaign'}
                                                        </p>
                                                        {job.primary_objective && (
                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                <Target size={9} className="text-amber-500 shrink-0" />
                                                                <span className="text-xs text-[#78716C] truncate">{job.primary_objective}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <StatusBadge status={job.status} />
                                                </div>

                                                {/* Recommended channels */}
                                                {job.recommended_channels && job.recommended_channels.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                                        {job.recommended_channels.map(ch => (
                                                            <span key={ch} className="text-[10px] px-2 py-0.5 bg-[#1E3A5F]/6 text-[#1E3A5F] rounded-full font-medium">{ch}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                {isFailed && job.failed_step && (
                                                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mb-2 w-fit">
                                                        <XCircle size={11} className="shrink-0" />
                                                        <span>Failed at <span className="font-medium">{job.failed_step}</span></span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2.5 border-t border-[#F0EDEB] mt-auto">
                                                    <div className="flex items-center gap-1 text-xs text-[#A8A29E]">
                                                        <Clock size={10} />
                                                        <span>{relativeTime(job.created_at)}</span>
                                                    </div>
                                                    {isActive && (
                                                        <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                                                            <Loader2 size={11} className="animate-spin text-blue-500" />
                                                            Processing…
                                                        </div>
                                                    )}
                                                    {isCompleted && (
                                                        <div className="flex items-center gap-1 text-xs font-semibold text-[#1E3A5F]">
                                                            View Results <ChevronRight size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );

                                    return isCompleted ? (
                                        <button key={job.job_id} className="text-left w-full" onClick={() => onViewJob(job.job_id)}>
                                            {inner}
                                        </button>
                                    ) : (
                                        <div key={job.job_id}>{inner}</div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
