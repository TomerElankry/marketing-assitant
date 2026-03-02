import { useState, useEffect } from 'react';
import JobForm from './components/JobForm';
import StatusDashboard from './components/StatusDashboard';
import ResultsView from './components/ResultsView';
import AuthPage from './components/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Activity, History, Clock, ChevronRight, LogOut, Loader2 } from 'lucide-react';

interface HistoryEntry {
    jobId: string;
    brandName: string;
    createdAt: string;
}

const HISTORY_KEY = 'mma_job_history';

function loadHistory(): HistoryEntry[] {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveHistory(entries: HistoryEntry[]) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 10)));
}

function AppInner() {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [jobCompleted, setJobCompleted] = useState<boolean>(false);
    const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        saveHistory(history);
    }, [history]);

    const handleJobCreated = (jobId: string, brandName: string) => {
        setCurrentJobId(jobId);
        setJobCompleted(false);
        setHistory(prev => [
            { jobId, brandName, createdAt: new Date().toISOString() },
            ...prev.filter(e => e.jobId !== jobId),
        ]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLoadHistory = (entry: HistoryEntry) => {
        setCurrentJobId(entry.jobId);
        setJobCompleted(true);
        setShowHistory(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClearHistory = () => {
        setHistory([]);
        setShowHistory(false);
    };

    const isOnForm = !currentJobId;

    if (isLoading) {
        return (
            <div className="min-h-screen ai-gradient-bg flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-blue-400" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    return (
        <div className="min-h-screen ai-gradient-bg text-slate-200 font-sans selection:bg-blue-500/30 relative overflow-hidden particles">
            {/* Animated Background Grid */}
            <div className="fixed inset-0 neural-grid opacity-30 pointer-events-none"></div>

            {/* Floating Orbs */}
            <div className="fixed top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="fixed top-1/2 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Header */}
            <header className="glass sticky top-0 z-50 border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg glow-blue pulse-glow">
                            <Activity className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span className="text-white">Marketing</span>
                            <span className="text-gradient-animated">Mind</span>
                            <span className="text-white"> AI</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* History button — only show if there's history */}
                        {history.length > 0 && (
                            <button
                                onClick={() => setShowHistory(v => !v)}
                                className={`flex items-center gap-2 px-3 py-2 glass rounded-lg border transition-all text-sm font-medium ${showHistory ? 'border-blue-500/50 text-blue-400 glow-blue' : 'border-slate-700/50 text-slate-400 hover:border-slate-600/50 hover:text-slate-200'}`}
                            >
                                <History size={15} />
                                <span className="hidden sm:inline">History</span>
                                <span className="text-xs bg-blue-500/20 text-blue-400 rounded-full px-1.5 py-0.5 font-mono">{history.length}</span>
                            </button>
                        )}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 glass rounded-lg border border-slate-700/50">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-slate-400">AI Agents Active</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 glass rounded-lg border border-slate-700/50 text-sm text-slate-400">
                            <span className="hidden sm:inline max-w-[120px] truncate">{user?.email}</span>
                            <button
                                onClick={logout}
                                title="Sign out"
                                className="text-slate-500 hover:text-red-400 transition-colors ml-1"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* History dropdown */}
                {showHistory && (
                    <div className="border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
                        <div className="max-w-7xl mx-auto px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Recent Jobs</p>
                                <button onClick={handleClearHistory} className="text-xs text-slate-600 hover:text-red-400 transition-colors">
                                    Clear all
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {history.map((entry) => (
                                    <button
                                        key={entry.jobId}
                                        onClick={() => handleLoadHistory(entry)}
                                        className="flex items-center gap-2 px-3 py-2 glass rounded-lg border border-slate-700/50 hover:border-blue-500/40 hover:text-blue-400 transition-all text-sm group"
                                    >
                                        <Clock size={12} className="text-slate-500 group-hover:text-blue-400 flex-shrink-0" />
                                        <span className="font-medium max-w-[140px] truncate">{entry.brandName}</span>
                                        <span className="text-[10px] font-mono text-slate-600 hidden sm:inline">
                                            {new Date(entry.createdAt).toLocaleDateString()}
                                        </span>
                                        <ChevronRight size={12} className="text-slate-600 group-hover:text-blue-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative max-w-7xl mx-auto px-6 py-12 z-10">
                {isOnForm ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-10 text-center space-y-2">
                            <h2 className="text-4xl font-extrabold text-white">
                                Create Your Strategy
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Fill in the details below or import a JSON file. Our AI agents will research, analyze, and generate a complete marketing presentation for you.
                            </p>
                        </div>
                        <JobForm onJobCreated={handleJobCreated} />
                    </div>
                ) : !jobCompleted ? (
                    <div className="animate-in zoom-in duration-300">
                        <StatusDashboard
                            jobId={currentJobId!}
                            onComplete={() => setJobCompleted(true)}
                        />
                        <div className="text-center mt-12">
                            <button
                                onClick={() => setCurrentJobId(null)}
                                className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2 glass rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all"
                            >
                                Cancel / Start Over
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <ResultsView jobId={currentJobId!} />
                        <div className="text-center mt-20">
                            <button
                                onClick={() => {
                                    setCurrentJobId(null);
                                    setJobCompleted(false);
                                }}
                                className="px-8 py-4 glass hover:glow-blue text-white rounded-xl transition-all border border-slate-700/50 hover:border-blue-500/50 font-semibold"
                            >
                                Create Another Strategy
                            </button>
                        </div>
                    </div>
                )}
            </main>
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
