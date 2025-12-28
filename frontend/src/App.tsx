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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
            <Activity className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Marketing<span className="text-blue-500">Mind</span> AI
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
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
                className="text-xs text-slate-600 hover:text-slate-400 underline"
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
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
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
