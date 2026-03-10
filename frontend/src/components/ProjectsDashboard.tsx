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
    const styles: Record<string, string> = {
        completed:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
        analyzing:   'bg-blue-50 text-blue-700 border border-blue-200',
        researching: 'bg-violet-50 text-violet-700 border border-violet-200',
        approved:    'bg-amber-50 text-amber-700 border border-amber-200',
        pending:     'bg-stone-100 text-stone-600 border border-stone-200',
        failed:      'bg-red-50 text-red-700 border border-red-200',
    };
    const labels: Record<string, string> = {
        completed: 'COMPLETED',
        analyzing: 'ANALYZING',
        researching: 'RESEARCHING',
        approved: 'QUEUED',
        pending: 'PENDING',
        failed: 'FAILED',
    };
    const cls = styles[status] ?? styles.pending;
    return (
        <span className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full ${cls}`}>
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

function ProjectRow({ job, onViewJob, onEditJob }: { job: JobEntry; onViewJob: (id: string) => void; onEditJob: (id: string) => void }) {
    const isCompleted = job.status === 'completed';
    const isActive = ['researching', 'analyzing', 'approved', 'pending'].includes(job.status);
    const isFailed = job.status === 'failed';

    const accentColor = isCompleted ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : isFailed ? 'bg-red-500' : 'bg-stone-300';

    const inner = (
        <div className={`bg-white border border-[#E7E5E4] rounded-xl flex overflow-hidden transition-all duration-150 ${isCompleted ? 'hover:border-[#C7C3BE] hover:shadow-sm cursor-pointer' : ''} ${isFailed ? 'border-red-200' : ''}`}>
            {/* Left accent bar */}
            <div className={`w-1 shrink-0 ${accentColor}`} />

            <div className="flex flex-col flex-1 px-5 py-4 min-w-0">
                {/* Top row: brand + objective | status + edit */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-stone-100 shrink-0">
                            <Building2 size={13} className="text-stone-500" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-semibold text-[#1C1917] text-sm">{job.brand_name ?? 'Unknown Client'}</span>
                            {job.primary_objective && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Target size={9} className="text-amber-500 shrink-0" />
                                    <span className="text-xs text-[#78716C] truncate">{job.primary_objective}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={job.status} />
                        <button
                            onClick={e => { e.stopPropagation(); e.preventDefault(); onEditJob(job.job_id); }}
                            title="Edit project"
                            className="p-1.5 rounded-md text-[#A8A29E] hover:text-[#1E3A5F] hover:bg-stone-100 transition-colors"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>
                </div>

                {/* Industry */}
                {job.industry && (
                    <p className="text-xs text-[#A8A29E] mb-3">{job.industry}{job.target_country ? ` · ${job.target_country}` : ''}</p>
                )}

                {/* Failed hint */}
                {isFailed && job.failed_step && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mb-3 w-fit">
                        <XCircle size={11} className="shrink-0" />
                        <span>Failed at <span className="font-medium">{job.failed_step}</span></span>
                    </div>
                )}

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-3 border-t border-[#F0EDEB]">
                    {isCompleted && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            Ready to view
                        </div>
                    )}
                    {isActive && (
                        <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                            <Loader2 size={11} className="animate-spin text-blue-500" />
                            Processing…
                        </div>
                    )}
                    {isFailed && (
                        <div className="flex items-center gap-1.5 text-xs text-red-500">
                            <XCircle size={11} />
                            Job failed
                        </div>
                    )}

                    <div className="flex items-center gap-3 ml-auto">
                        <div className="flex items-center gap-1 text-xs text-[#A8A29E]">
                            <Clock size={10} />
                            <span>{relativeTime(job.created_at)}</span>
                        </div>
                        {isCompleted && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-[#1E3A5F]">
                                View Results
                                <ChevronRight size={12} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isCompleted) {
        return (
            <button className="text-left w-full" onClick={() => onViewJob(job.job_id)}>
                {inner}
            </button>
        );
    }
    return <div>{inner}</div>;
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
        refetchOnWindowFocus: true,
    });

    const all       = jobs ?? [];
    const completed = all.filter(j => j.status === 'completed');
    const active    = all.filter(j => ['researching', 'analyzing', 'approved', 'pending'].includes(j.status));

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
                    const haystack = [j.brand_name, j.primary_objective, j.industry, j.target_country]
                        .filter(Boolean).join(' ').toLowerCase();
                    if (!haystack.includes(q)) return false;
                }
                return true;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [all, filter, clientFilter, dateRange, search]);

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            <div className="max-w-4xl mx-auto px-6 py-10">

                {/* Page header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1C1917]">My Projects</h1>
                        <p className="text-sm text-[#78716C] mt-0.5">AI-generated marketing strategies</p>
                    </div>
                    <button onClick={onNewProject} className="btn-primary text-sm">
                        <Plus size={15} />
                        New Project
                    </button>
                </div>

                {/* Stats strip */}
                {!isLoading && !isError && all.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Total',     value: all.length },
                            { label: 'Completed', value: completed.length },
                            { label: 'Active',    value: active.length },
                        ].map(s => (
                            <div key={s.label} className="bg-white border border-[#E7E5E4] rounded-xl px-6 py-5">
                                <p className="text-3xl font-bold text-[#1C1917]">{s.value}</p>
                                <p className="text-sm text-[#78716C] mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search + Filters */}
                {!isLoading && !isError && all.length > 0 && (
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 mb-4">
                        {/* Search */}
                        <div className="relative mb-3">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by client, goal, industry, country…"
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

                        {/* Filter row */}
                        <div className="flex items-center justify-between gap-3">
                            {/* Status tabs */}
                            <div className="flex items-center gap-1">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFilter(tab.key)}
                                        className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                                            filter === tab.key
                                                ? 'bg-[#1C1917] text-white'
                                                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-stone-100'
                                        }`}
                                    >
                                        {tab.label}
                                        {tab.key !== 'all' && (
                                            <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                                                filter === tab.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-[#78716C]'
                                            }`}>
                                                {tab.key === 'active' ? active.length : completed.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Dropdowns */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Building2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                                    <select
                                        value={clientFilter}
                                        onChange={e => setClient(e.target.value)}
                                        className="pl-7 pr-7 py-1.5 text-sm bg-[#F5F5F5] border border-[#E7E5E4] rounded-lg appearance-none cursor-pointer outline-none focus:border-[#1E3A5F] transition-colors min-w-[130px]"
                                    >
                                        <option value="all">All clients</option>
                                        {clients.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                                </div>

                                <div className="relative">
                                    <CalendarDays size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                                    <select
                                        value={dateRange}
                                        onChange={e => setDateRange(e.target.value as DateRange)}
                                        className="pl-7 pr-7 py-1.5 text-sm bg-[#F5F5F5] border border-[#E7E5E4] rounded-lg appearance-none cursor-pointer outline-none focus:border-[#1E3A5F] transition-colors min-w-[130px]"
                                    >
                                        {DATE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A8A29E] pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white border border-[#E7E5E4] rounded-xl flex overflow-hidden h-24">
                                <div className="w-1 bg-stone-200 shrink-0" />
                                <div className="p-5 flex flex-col gap-2.5 flex-1">
                                    <div className="h-4 w-36 bg-stone-100 rounded animate-pulse" />
                                    <div className="h-3 w-24 bg-stone-100 rounded animate-pulse" />
                                    <div className="flex-1" />
                                    <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="bg-white border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="text-sm">Failed to load projects.</span>
                        <button onClick={() => refetch()} className="ml-auto text-sm underline">Retry</button>
                    </div>
                )}

                {/* Empty state — no projects */}
                {!isLoading && !isError && all.length === 0 && (
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 size={28} className="text-stone-400" />
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
                    <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
                        <Activity size={28} className="mx-auto text-stone-300 mb-3" />
                        <p className="text-[#78716C] text-sm">No {filter} projects found.</p>
                    </div>
                )}

                {/* Project list */}
                {!isLoading && !isError && sorted.length > 0 && (
                    <div className="space-y-2">
                        {sorted.map(job => (
                            <ProjectRow key={job.job_id} job={job} onViewJob={onViewJob} onEditJob={onEditJob} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
