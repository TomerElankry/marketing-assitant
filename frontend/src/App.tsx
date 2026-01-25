import { useState } from 'react';
import JobForm from './components/JobForm';
import StatusDashboard from './components/StatusDashboard';
import ResultsView from './components/ResultsView';
import { Activity } from 'lucide-react';
import type { JobResponse } from './types';

function App() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobCompleted, setJobCompleted] = useState<boolean>(false);

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
          <div className="hidden md:flex items-center gap-2 px-4 py-2 glass rounded-lg border border-slate-700/50">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-slate-400">AI Agents Active</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-12 z-10">
        {!currentJobId ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 text-center space-y-2">
              <h2 className="text-4xl font-extrabold text-white">
                Create Your Strategy
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Fill in the details below or import a JSON file. Our AI agents will research, analyze, and generate a complete marketing presentation for you.
              </p>
            </div>
            <JobForm onJobCreated={(id) => {
              setCurrentJobId(id);
              setJobCompleted(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
          </div>
        ) : !jobCompleted ? (
          <div className="animate-in zoom-in duration-300">
            <StatusDashboard
              jobId={currentJobId}
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
            <ResultsView jobId={currentJobId} />
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

export default App;
