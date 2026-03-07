import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Building2, Clock, Plus, Loader2, AlertCircle,
    CheckCircle2, XCircle, ChevronRight, BarChart3, Activity,
    CalendarDays, ChevronDown, Search, Pencil, Target,
} from 'lucide-react';
import api from '../lib/api';

interface JobEntry {
    job_id: string;
    status: string;
    brand_name: string | null;
    industry: string | null;
    target_country: string | null;
    primary_objective: string | null;
    created_at: string;
    updated_at: string;
    failed_step: string | null;
    error_message: string | null;
}

interface ProjectsDashboardProps {
    onNewProject: () => void;
    onViewJob: (jobId: string) => void;
    onEditJob: (jobId: string) => void;
}

type FilterTab = 'all' | 'active' | 'completed';
type DateRange = '7d' | '30d' | '90d' | 'all';

const DATE_OPTIONS: { key: DateRange; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: '7d',  label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 3 months' },
];

function cutoffMs(range: DateRange): number {
    const now = Date.now();
    if (range === '7d')  return now - 7  * 86_400_000;
    if (range === '30d') return now - 30 * 86_400_000;
    if (range === '90d') return now - 90 * 86_400_000;
    return 0;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        completed:   'badge badge-completed',
        analyzing:   'badge badge-analyzing',
        researching: 'badge badge-researching',
        approved:    'badge badge-approved',
        pending:     'badge badge-pending',
        failed:      'badge badge-failed',
    };
    const cls = map[status] ?? 'badge badge-pending';
    const labels: Record<string, string> = {
        completed: 'Completed',
        analyzing: 'Analyzing',
        researching: 'Researching',
        approved: 'Queued',
        pending: 'Pending',
        failed: 'Failed',
    };
    return <span className={cls}>{labels[status] ?? status}</span>;
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

function StatChip({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={`flex flex-col items-center px-5 py-3 rounded-xl border ${highlight ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]/15' : 'bg-white border-[#E7E5E4]'}`}>
            <span className={`text-xl font-bold ${highlight ? 'text-[#1E3A5F]' : 'text-[#1C1917]'}`}>{value}</span>
            <span className="text-xs text-[#78716C] mt-0.5">{label}</span>
        </div>
    );
}

function ProjectCard({ job, onViewJob, onEditJob }: { job: JobEntry; onViewJob: (id: string) => void; onEditJob: (id: string) => void }) {
    const isCompleted = job.status === 'completed';
    const isActive = ['researching', 'analyzing', 'approved', 'pending'].includes(job.status);
    const isFailed = job.status === 'failed';

    const cardInner = (
        <div className={`warm-card flex flex-col h-full overflow-hidden transition-all duration-200 ${
            isCompleted ? 'cursor-pointer warm-card-hover' : ''
        } ${isFailed ? 'border-red-200' : ''}`}>
            {/* Top accent bar */}
            <div className={`h-1 w-full ${
                isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                isActive    ? 'bg-gradient-to-r from-blue-400 to-violet-400' :
                isFailed    ? 'bg-gradient-to-r from-red-400 to-red-500' :
                              'bg-[#E7E5E4]'
            }`} />

            <div className="flex flex-col flex-1 p-5">
                {/* Brand + Status row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-[#1E3A5F]/8 shrink-0">
                            <Building2 size={13} className="text-[#1E3A5F]" />
                        </div>
                        <span className="font-semibold text-[#1C1917] text-sm truncate">{job.brand_name ?? 'Unknown Client'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={job.status} />
                        <button
                            onClick={e => { e.stopPropagation(); onEditJob(job.job_id); }}
                            title="Edit project"
                            className="p-1 rounded-md text-[#A8A29E] hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/8 transition-colors"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>
                </div>

                {/* Objective pill */}
                {job.primary_objective && (
                    <div className="flex items-center gap-1 text-[10px] text-[#78716C] bg-[#F5F4F2] rounded-full px-2 py-0.5 w-fit mb-2">
                        <Target size={9} className="text-[#D97706]" />
                        <span className="truncate max-w-[140px]">{job.primary_objective}</span>
                    </div>
                )}

                {/* Industry + Date row */}
                <div className="flex items-center gap-3 text-xs text-[#A8A29E] mb-3">
                    {job.industry && <span className="truncate">{job.industry}</span>}
                    <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <Clock size={10} />
                        <span>{relativeTime(job.created_at)}</span>
                    </div>
                </div>

                {/* Failed hint */}
                {isFailed && job.failed_step && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                        <XCircle size={11} className="shrink-0" />
                        <span className="truncate">Failed at <span className="font-medium">{job.failed_step}</span></span>
                    </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Footer action */}
                <div className="pt-3 border-t border-[#F0EDEB]">
                    {isCompleted && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                                <CheckCircle2 size={12} />
                                <span>Ready to view</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-semibold text-[#1E3A5F] group-hover:text-[#D97706] transition-colors">
                                View Results
                                <ChevronRight size={12} />
                            </div>
                        </div>
                    )}
                    {isActive && (
                        <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                            <Loader2 size={11} className="animate-spin text-blue-500" />
                            <span>Processing…</span>
                        </div>
                    )}
                    {isFailed && (
                        <div className="flex items-center gap-1.5 text-xs text-red-500">
                            <XCircle size={11} />
                            <span>Job failed</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isCompleted) {
        return (
            <button
                className="text-left group w-full h-full"
                onClick={() => onViewJob(job.job_id)}
            >
                {cardInner}
            </button>
        );
    }
    return <div className="h-full">{cardInner}</div>;
}

const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'active',    label: 'Active' },
    { key: 'completed', label: 'Completed' },
];

export default function ProjectsDashboard({ onNewProject, onViewJob, onEditJob }: ProjectsDashboardProps) {
    const [filter, setFilter]       = useState<FilterTab>('all');
    const [clientFilter, setClient] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [search, setSearch]       = useState<string>('');

    const { data: jobs, isLoading, isError, refetch } = useQuery<JobEntry[]>({
        queryKey: ['jobs'],
        queryFn: () => api.get<JobEntry[]>('/jobs').then(r => r.data),
        refetchInterval: 15_000,
    });

    const all       = jobs ?? [];
    const completed = all.filter(j => j.status === 'completed');
    const active    = all.filter(j => ['researching', 'analyzing', 'approved', 'pending'].includes(j.status));

    // Unique clients for dropdown
    const clients = useMemo(() =>
        Array.from(new Set(all.map(j => j.brand_name ?? 'Unknown Client'))).sort(),
    [all]);

    const sorted = useMemo(() => {
        const cutoff = cutoffMs(dateRange);
        const q = search.trim().toLowerCase();
        return all
            .filter(j => {
                if (filter === 'completed' && j.status !== 'completed') return false;
                if (filter === 'active' && !['researching', 'analyzing', 'approved', 'pending'].includes(j.status)) return false;
                if (clientFilter !== 'all' && (j.brand_name ?? 'Unknown Client') !== clientFilter) return false;
                if (cutoff && new Date(j.created_at).getTime() < cutoff) return false;
                if (q) {
                    const haystack = [
                        j.brand_name,
                        j.primary_objective,
                        j.industry,
                        j.target_country,
                    ].filter(Boolean).join(' ').toLowerCase();
                    if (!haystack.includes(q)) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [all, filter, clientFilter, dateRange, search]);

    return (
        <div className="warm-page">
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1C1917]">My Projects</h1>
                        <p className="text-sm text-[#78716C] mt-0.5">
                            AI-generated marketing strategies
                        </p>
                    </div>
                    <button onClick={onNewProject} className="btn-primary text-sm">
                        <Plus size={15} />
                        New Project
                    </button>
                </div>

                {/* Stats strip */}
                {!isLoading && !isError && all.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <StatChip label="Total"     value={all.length}       highlight />
                        <StatChip label="Completed" value={completed.length} />
                        <StatChip label="Active"    value={active.length} />
                    </div>
                )}

                {/* Search bar */}
                {!isLoading && !isError && all.length > 0 && (
                    <div className="relative mb-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by client, goal, industry, country…"
                            className="warm-input pl-9 pr-4 py-2 text-sm w-full"
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
                )}

                {/* Filter row */}
                {!isLoading && !isError && all.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {/* Status tabs */}
                        <div className="flex items-center gap-1 bg-[#F5F4F2] p-1 rounded-xl">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all ${
                                        filter === tab.key
                                            ? 'bg-white text-[#1C1917] shadow-sm border border-[#E7E5E4]'
                                            : 'text-[#78716C] hover:text-[#1C1917]'
                                    }`}
                                >
                                    {tab.label}
                                    {tab.key !== 'all' && (
                                        <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                                            filter === tab.key ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' : 'bg-[#E7E5E4] text-[#78716C]'
                                        }`}>
                                            {tab.key === 'active' ? active.length : completed.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Client dropdown */}
                        <div className="relative">
                            <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                            <select
                                value={clientFilter}
                                onChange={e => setClient(e.target.value)}
                                className="warm-input pl-8 pr-8 py-1.5 text-sm appearance-none cursor-pointer min-w-[150px]"
                            >
                                <option value="all">All clients</option>
                                {clients.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                        </div>

                        {/* Date range dropdown */}
                        <div className="relative">
                            <CalendarDays size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                            <select
                                value={dateRange}
                                onChange={e => setDateRange(e.target.value as DateRange)}
                                className="warm-input pl-8 pr-8 py-1.5 text-sm appearance-none cursor-pointer min-w-[150px]"
                            >
                                {DATE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </select>
                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="warm-card h-40 overflow-hidden">
                                <div className="h-1 skeleton" />
                                <div className="p-5 flex flex-col gap-3">
                                    <div className="skeleton h-4 w-32" />
                                    <div className="skeleton h-3 w-20" />
                                    <div className="flex-1" />
                                    <div className="skeleton h-3 w-24 mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="warm-card p-6 flex items-center gap-3 text-red-700 border-red-200 bg-red-50">
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="text-sm">Failed to load projects.</span>
                        <button onClick={() => refetch()} className="ml-auto text-sm underline">Retry</button>
                    </div>
                )}

                {/* Empty state — no projects at all */}
                {!isLoading && !isError && all.length === 0 && (
                    <div className="warm-card p-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 size={28} className="text-[#1E3A5F]" />
                        </div>
                        <p className="text-[#1C1917] font-semibold text-lg mb-1">No projects yet</p>
                        <p className="text-[#78716C] text-sm mb-6 max-w-xs mx-auto">
                            Create your first marketing strategy to get started.
                        </p>
                        <button onClick={onNewProject} className="btn-primary text-sm">
                            <Plus size={15} />
                            New Project
                        </button>
                    </div>
                )}

                {/* Empty state — filter has no results */}
                {!isLoading && !isError && all.length > 0 && sorted.length === 0 && (
                    <div className="warm-card p-12 text-center">
                        <Activity size={28} className="mx-auto text-[#A8A29E] mb-3" />
                        <p className="text-[#78716C] text-sm">No {filter} projects found.</p>
                    </div>
                )}

                {/* Card grid */}
                {!isLoading && !isError && sorted.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sorted.map(job => (
                            <ProjectCard key={job.job_id} job={job} onViewJob={onViewJob} onEditJob={onEditJob} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
