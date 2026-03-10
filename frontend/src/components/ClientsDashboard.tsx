import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Building2, Plus, AlertCircle, Search,
    ChevronRight, BarChart3, Globe, Layers,
} from 'lucide-react';
import api from '../lib/api';
import type { Client } from '../types';

interface ClientsDashboardProps {
    onNewClient: () => void;
    onViewClient: (clientId: string) => void;
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

export default function ClientsDashboard({ onNewClient, onViewClient }: ClientsDashboardProps) {
    const [search, setSearch] = useState('');

    const { data: clients, isLoading, isError, refetch } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: () => api.get<Client[]>('/clients').then(r => r.data),
        refetchOnWindowFocus: true,
    });

    const all = clients ?? [];

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return all;
        return all.filter(c =>
            [c.brand_name, c.industry, c.target_country]
                .filter(Boolean).join(' ').toLowerCase().includes(q)
        );
    }, [all, search]);

    const totalCampaigns = all.reduce((sum, c) => sum + c.campaign_count, 0);

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1C1917]">My Clients</h1>
                        <p className="text-sm text-[#78716C] mt-0.5">Manage your brand profiles and campaigns</p>
                    </div>
                    <button onClick={onNewClient} className="btn-primary text-sm">
                        <Plus size={15} />
                        New Client
                    </button>
                </div>

                {/* Stats strip */}
                {!isLoading && !isError && all.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Clients', value: all.length },
                            { label: 'Total Campaigns', value: totalCampaigns },
                            { label: 'Industries', value: new Set(all.map(c => c.industry)).size },
                        ].map(s => (
                            <div key={s.label} className="bg-white border border-[#E7E5E4] rounded-xl px-6 py-5">
                                <p className="text-3xl font-bold text-[#1C1917]">{s.value}</p>
                                <p className="text-sm text-[#78716C] mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search */}
                {!isLoading && !isError && all.length > 0 && (
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 mb-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by brand name, industry, or country…"
                                className="w-full pl-9 pr-8 py-2 text-sm bg-[#F5F5F5] border border-[#E7E5E4] rounded-lg outline-none focus:border-[#1E3A5F] transition-colors"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] transition-colors text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-[#F0EDEB] grid grid-cols-[1fr_120px_100px_90px_40px] gap-4">
                            {['Brand', 'Industry', 'Country', 'Campaigns', ''].map(h => (
                                <div key={h} className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
                            ))}
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="px-5 py-4 border-b border-[#F0EDEB] grid grid-cols-[1fr_120px_100px_90px_40px] gap-4 items-center">
                                <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
                                <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
                                <div className="h-3 w-8 bg-stone-100 rounded animate-pulse" />
                                <div className="h-3 w-6 bg-stone-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="bg-white border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="text-sm">Failed to load clients.</span>
                        <button onClick={() => refetch()} className="ml-auto text-sm underline">Retry</button>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !isError && all.length === 0 && (
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 size={28} className="text-stone-400" />
                        </div>
                        <p className="text-[#1C1917] font-semibold text-lg mb-1">No clients yet</p>
                        <p className="text-[#78716C] text-sm mb-6 max-w-xs mx-auto">
                            Add your first client to start creating campaigns without re-entering brand info every time.
                        </p>
                        <button onClick={onNewClient} className="btn-primary text-sm">
                            <Plus size={15} />
                            Add Client
                        </button>
                    </div>
                )}

                {/* No filter results */}
                {!isLoading && !isError && all.length > 0 && filtered.length === 0 && (
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
                        <Search size={24} className="mx-auto text-stone-300 mb-3" />
                        <p className="text-[#78716C] text-sm">No clients match your search.</p>
                    </div>
                )}

                {/* Table */}
                {!isLoading && !isError && filtered.length > 0 && (
                    <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-[#F0EDEB] grid grid-cols-[1fr_130px_100px_90px_36px] gap-4 items-center">
                            {['Brand', 'Industry', 'Country', 'Campaigns', ''].map(h => (
                                <span key={h} className="text-[10px] font-semibold tracking-wider text-[#A8A29E] uppercase">{h}</span>
                            ))}
                        </div>

                        {/* Rows */}
                        {filtered.map((client, idx) => (
                            <button
                                key={client.id}
                                onClick={() => onViewClient(client.id)}
                                className={`w-full text-left px-5 py-4 grid grid-cols-[1fr_130px_100px_90px_36px] gap-4 items-center hover:bg-[#F5F4F2] transition-colors ${idx < filtered.length - 1 ? 'border-b border-[#F0EDEB]' : ''}`}
                            >
                                {/* Brand */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                                        <Building2 size={14} className="text-[#1E3A5F]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-[#1C1917] truncate">{client.brand_name}</p>
                                        <p className="text-[10px] text-[#A8A29E] truncate">{relativeTime(client.updated_at)}</p>
                                    </div>
                                </div>

                                {/* Industry */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Layers size={11} className="text-[#A8A29E] shrink-0" />
                                    <span className="text-sm text-[#78716C] truncate">{client.industry}</span>
                                </div>

                                {/* Country */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Globe size={11} className="text-[#A8A29E] shrink-0" />
                                    <span className="text-sm text-[#78716C] truncate">{client.target_country}</span>
                                </div>

                                {/* Campaign count */}
                                <div>
                                    <span className={`text-sm font-semibold ${client.campaign_count > 0 ? 'text-[#1E3A5F]' : 'text-[#A8A29E]'}`}>
                                        {client.campaign_count}
                                    </span>
                                    <span className="text-[#A8A29E] text-xs ml-1">
                                        {client.campaign_count === 1 ? 'campaign' : 'campaigns'}
                                    </span>
                                </div>

                                {/* Arrow */}
                                <ChevronRight size={14} className="text-[#A8A29E]" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
