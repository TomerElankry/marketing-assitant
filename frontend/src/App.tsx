import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import StatusDashboard from './components/StatusDashboard';
import ResultsView from './components/ResultsView';
import AuthPage from './components/AuthPage';
import ClientsDashboard from './components/ClientsDashboard';
import ClientDetail from './components/ClientDetail';
import ClientForm from './components/ClientForm';
import CampaignForm from './components/CampaignForm';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { Client } from './types';
import { LayoutDashboard, LogOut, Loader2, ArrowRight } from 'lucide-react';

const JOB_RESUME_KEY = 'phil_resume_job';

type View = 'clients' | 'client-detail' | 'new-client' | 'edit-client' | 'new-campaign' | 'processing' | 'results';

function AppInner() {
    const { isAuthenticated, isLoading, user, logout, connectCanva, disconnectCanva } = useAuth();
    const queryClient = useQueryClient();
    const [view, setView] = useState<View>('clients');
    const [currentClientId, setCurrentClientId] = useState<string | null>(null);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [resumableJob, setResumableJob] = useState<{ jobId: string; view: 'processing' | 'results' } | null>(() => {
        try {
            const saved = localStorage.getItem(JOB_RESUME_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    // Persist resumable job to localStorage
    useEffect(() => {
        if (resumableJob) {
            localStorage.setItem(JOB_RESUME_KEY, JSON.stringify(resumableJob));
        } else {
            localStorage.removeItem(JOB_RESUME_KEY);
        }
    }, [resumableJob]);

    // ── Navigation handlers ─────────────────────────────────────
    const goClients = () => {
        // If a job is in progress/done, keep it resumable instead of discarding
        if (currentJobId && (view === 'processing' || view === 'results')) {
            setResumableJob({ jobId: currentJobId, view });
        }
        setCurrentClientId(null);
        setCurrentJobId(null);
        setEditingClient(null);
        setView('clients');
        queryClient.invalidateQueries({ queryKey: ['clients'] });
    };

    const handleViewClient = (clientId: string) => {
        setCurrentClientId(clientId);
        setView('client-detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewClient = () => {
        setEditingClient(null);
        setView('new-client');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditClient = (clientId: string) => {
        // Grab from cache so the form is pre-filled immediately
        const cached = queryClient.getQueryData<Client>(['client', clientId]);
        setEditingClient(cached ?? null);
        setCurrentClientId(clientId);
        setView('edit-client');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClientSaved = (client: Client) => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.setQueryData(['client', client.id], client);
        setCurrentClientId(client.id);
        setView('client-detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewCampaign = (clientId: string) => {
        setCurrentClientId(clientId);
        setView('new-campaign');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJobCreated = (jobId: string) => {
        setResumableJob(null); // new job replaces any previous resumable job
        setCurrentJobId(jobId);
        setView('processing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJobComplete = () => {
        setView('results');
        // Update resumable job view to 'results' so resume goes to results
        if (currentJobId) setResumableJob({ jobId: currentJobId, view: 'results' });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
    };

    const handleResumeJob = () => {
        if (!resumableJob) return;
        setCurrentJobId(resumableJob.jobId);
        setView(resumableJob.view);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDismissResume = () => setResumableJob(null);

    const handleViewJob = (jobId: string) => {
        setCurrentJobId(jobId);
        setView('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Auth loading ────────────────────────────────────────────
    if (isLoading && !user) {
        return (
            <div className="min-h-screen warm-page flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[#1E3A5F]" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    // ── Back label helper ────────────────────────────────────────
    const backToClientDetail = currentClientId
        ? () => handleViewClient(currentClientId)
        : goClients;

    return (
        <div className="min-h-screen warm-page">
            {/* ── Nav ─────────────────────────────────────────────── */}
            <header className="warm-nav sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <button onClick={goClients} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="PHIL" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-[#1C1917] text-base tracking-tight">
                            <span className="text-gradient">PHIL</span>
                        </span>
                    </button>

                    {/* Centre tab */}
                    <button
                        onClick={goClients}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                            view === 'clients'
                                ? 'bg-[#1E3A5F]/8 text-[#1E3A5F]'
                                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4F2]'
                        }`}
                    >
                        <LayoutDashboard size={14} />
                        My Clients
                    </button>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        {/* Canva connection chip */}
                        {user?.canva_connected ? (
                            <div className="flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1.5 rounded-lg">
                                <span className="font-medium">Canva ✓</span>
                                <button
                                    onClick={disconnectCanva}
                                    title="Disconnect Canva"
                                    className="text-emerald-400 hover:text-red-500 transition-colors ml-0.5"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={connectCanva}
                                className="text-xs text-[#78716C] hover:text-[#1E3A5F] border border-[#E7E5E4] hover:border-[#1E3A5F] bg-white px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                                Connect Canva
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-[#78716C] px-2 py-1.5 rounded-lg border border-[#E7E5E4] bg-white">
                            <span className="hidden sm:inline max-w-[120px] truncate">{user?.email}</span>
                            <button
                                onClick={logout}
                                title="Sign out"
                                className="text-[#A8A29E] hover:text-red-500 transition-colors ml-0.5"
                            >
                                <LogOut size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Views ───────────────────────────────────────────── */}

            {view === 'clients' && (
                <>
                    {resumableJob && (
                        <div className="max-w-4xl mx-auto px-6 pt-5">
                            <div className="flex items-center justify-between gap-3 bg-[#1E3A5F]/6 border border-[#1E3A5F]/20 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full bg-[#1E3A5F] animate-pulse shrink-0" />
                                    <span className="text-sm text-[#1C1917] font-medium">
                                        {resumableJob.view === 'processing' ? 'A campaign is still being generated' : 'Your last campaign is ready to view'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={handleResumeJob}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A5F] hover:underline"
                                    >
                                        {resumableJob.view === 'processing' ? 'Check progress' : 'View results'}
                                        <ArrowRight size={12} />
                                    </button>
                                    <button onClick={handleDismissResume} className="text-[#A8A29E] hover:text-[#1C1917] text-xs transition-colors ml-1">✕</button>
                                </div>
                            </div>
                        </div>
                    )}
                    <ClientsDashboard
                        onNewClient={handleNewClient}
                        onViewClient={handleViewClient}
                    />
                </>
            )}

            {view === 'client-detail' && currentClientId && (
                <ClientDetail
                    clientId={currentClientId}
                    onBack={goClients}
                    onNewCampaign={handleNewCampaign}
                    onViewJob={handleViewJob}
                    onEditClient={handleEditClient}
                />
            )}

            {(view === 'new-client' || view === 'edit-client') && (
                <div className="max-w-3xl mx-auto px-6 py-10">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-[#1C1917]">
                            {view === 'edit-client' ? 'Edit Client Profile' : 'New Client'}
                        </h2>
                        <p className="text-[#78716C] text-sm mt-1 max-w-md mx-auto">
                            {view === 'edit-client'
                                ? 'Update the brand profile. Future campaigns will use the latest info.'
                                : 'Fill in the brand profile once — campaigns will reuse this info automatically.'}
                        </p>
                    </div>
                    <ClientForm
                        onSaved={handleClientSaved}
                        onCancel={view === 'edit-client' ? backToClientDetail : goClients}
                        initialData={editingClient}
                    />
                </div>
            )}

            {view === 'new-campaign' && currentClientId && (
                <div className="max-w-3xl mx-auto px-6 py-10">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-[#1C1917]">New Campaign</h2>
                        <p className="text-[#78716C] text-sm mt-1 max-w-md mx-auto">
                            Define your goal. Our AI will recommend the best channels and generate a complete strategy.
                        </p>
                    </div>
                    <CampaignForm
                        clientId={currentClientId}
                        onJobCreated={handleJobCreated}
                        onBack={backToClientDetail}
                    />
                </div>
            )}

            {view === 'processing' && currentJobId && (
                <div className="max-w-3xl mx-auto px-6 py-10">
                    <StatusDashboard
                        jobId={currentJobId}
                        onComplete={handleJobComplete}
                    />
                    <div className="text-center mt-8">
                        <button onClick={backToClientDetail} className="btn-ghost text-sm">
                            Cancel / Back to Client
                        </button>
                    </div>
                </div>
            )}

            {view === 'results' && currentJobId && (
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <ResultsView jobId={currentJobId} />
                    <div className="text-center mt-12">
                        <button onClick={backToClientDetail} className="btn-ghost text-sm">
                            ← Back to Client
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppInner />
        </AuthProvider>
    );
}

export default App;
