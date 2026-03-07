import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import JobForm from './components/JobForm';
import StatusDashboard from './components/StatusDashboard';
import ResultsView from './components/ResultsView';
import AuthPage from './components/AuthPage';
import ProjectsDashboard from './components/ProjectsDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './lib/api';
import { Plus, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';

type View = 'dashboard' | 'new-job' | 'edit-job' | 'processing' | 'results';

function AppInner() {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [view, setView] = useState<View>('dashboard');
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [editJobData, setEditJobData] = useState<any | null>(null);

    const handleJobCreated = (jobId: string) => {
        setCurrentJobId(jobId);
        setView('processing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJobComplete = () => {
        setView('results');
        // Refresh project list so the new completed job appears
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
    };

    const handleViewJob = (jobId: string) => {
        setCurrentJobId(jobId);
        setView('results');
    };

    const handleEditJob = async (jobId: string) => {
        try {
            const res = await api.get(`/jobs/${jobId}/questionnaire`);
            setEditJobData(res.data);
            setView('edit-job');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            setEditJobData(null);
            setView('new-job');
        }
    };

    const handleBackToDashboard = () => {
        setCurrentJobId(null);
        setEditJobData(null);
        setView('dashboard');
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
    };

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

    return (
        <div className="min-h-screen warm-page">
            {/* ── Warm Professional Nav ─────────────────────────────── */}
            <header className="warm-nav sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <button onClick={handleBackToDashboard} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="PHIL" className="w-8 h-8 object-contain" />
                        <span className="font-bold text-[#1C1917] text-base tracking-tight">
                            <span className="text-gradient">PHIL</span>
                        </span>
                    </button>

                    {/* Centre tab */}
                    <button
                        onClick={handleBackToDashboard}
                        className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                            view === 'dashboard'
                                ? 'bg-[#1E3A5F]/8 text-[#1E3A5F]'
                                : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F4F2]'
                        }`}
                    >
                        <LayoutDashboard size={14} />
                        My Projects
                    </button>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView('new-job')}
                            className="btn-primary text-xs py-1.5 px-3"
                        >
                            <Plus size={13} />
                            New Project
                        </button>
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

            {/* ── Main Content ─────────────────────────────────────── */}
            {view === 'dashboard' && (
                <ProjectsDashboard
                    onNewProject={() => setView('new-job')}
                    onViewJob={handleViewJob}
                    onEditJob={handleEditJob}
                />
            )}

            {view === 'new-job' && (
                <div className="warm-page">
                    <div className="max-w-5xl mx-auto px-6 py-10">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-[#1C1917]">New Marketing Strategy</h2>
                            <p className="text-[#78716C] text-sm mt-1 max-w-xl mx-auto">
                                Fill in the details below. Our AI agents will research, analyze, and generate a complete presentation.
                            </p>
                        </div>
                        <JobForm onJobCreated={handleJobCreated} />
                        <div className="text-center mt-8">
                            <button onClick={handleBackToDashboard} className="btn-ghost text-sm">
                                ← Back to Projects
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'edit-job' && (
                <div className="warm-page">
                    <div className="max-w-5xl mx-auto px-6 py-10">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-bold text-[#1C1917]">Edit & Re-run Project</h2>
                            <p className="text-[#78716C] text-sm mt-1 max-w-xl mx-auto">
                                Update the details below. Submitting will launch a new analysis with the revised inputs.
                            </p>
                        </div>
                        <JobForm onJobCreated={handleJobCreated} initialData={editJobData} />
                        <div className="text-center mt-8">
                            <button onClick={handleBackToDashboard} className="btn-ghost text-sm">
                                ← Back to Projects
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'processing' && currentJobId && (
                <div className="warm-page">
                    <div className="max-w-3xl mx-auto px-6 py-10">
                        <StatusDashboard
                            jobId={currentJobId}
                            onComplete={handleJobComplete}
                        />
                        <div className="text-center mt-8">
                            <button
                                onClick={handleBackToDashboard}
                                className="btn-ghost text-sm"
                            >
                                Cancel / Back to Projects
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'results' && currentJobId && (
                <div className="warm-page">
                    <div className="max-w-5xl mx-auto px-6 py-10">
                        <ResultsView jobId={currentJobId} />
                        <div className="text-center mt-12">
                            <button
                                onClick={handleBackToDashboard}
                                className="btn-ghost text-sm"
                            >
                                ← Back to Projects
                            </button>
                        </div>
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
