import { useState } from 'react';
import JobForm from './components/JobForm';
import StatusDashboard from './components/StatusDashboard';
import ResultsView from './components/ResultsView';
import { ToolsInspector } from './components/ToolsInspector';
import { Activity, LayoutGrid, Wrench } from 'lucide-react';

function App() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobCompleted, setJobCompleted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'form' | 'tools'>('form');

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-rose-500/30">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 rounded-lg shadow-lg shadow-rose-500/20">
              <Activity className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Creative<span className="text-rose-500">Agent</span>
            </h1>
          </div>
          
          <div className="flex bg-neutral-800 rounded-full p-1 border border-neutral-700">
             <button
                onClick={() => setActiveTab('form')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'form' 
                    ? 'bg-neutral-700 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
             >
                <LayoutGrid size={14} />
                Workflows
             </button>
             <button
                onClick={() => setActiveTab('tools')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'tools' 
                    ? 'bg-neutral-700 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
             >
                <Wrench size={14} />
                MCP Tools
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {activeTab === 'tools' ? (
           <ToolsInspector />
        ) : (
          /* Workflow / Job Views */
          <>
            {!currentJobId ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-12 text-center space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Let's build your strategy.
                  </h2>
                  <p className="text-neutral-400 max-w-lg mx-auto text-lg leading-relaxed">
                    Tell us about your brand. Our AI creative team will handle the research, strategy, and design.
                  </p>
                </div>
                <JobForm onJobCreated={(id) => {
                  setCurrentJobId(id);
                  setJobCompleted(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} />
              </div>
            ) : !jobCompleted ? (
              <div className="animate-in zoom-in duration-500">
                <StatusDashboard
                  jobId={currentJobId}
                  onComplete={() => setJobCompleted(true)}
                />
                <div className="text-center mt-12">
                  <button
                    onClick={() => setCurrentJobId(null)}
                    className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    ← Cancel and start over
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700">
                <ResultsView jobId={currentJobId} />
                <div className="text-center mt-16">
                  <button
                    onClick={() => {
                      setCurrentJobId(null);
                      setJobCompleted(false);
                    }}
                    className="px-8 py-3 bg-neutral-100 text-neutral-900 hover:bg-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Create Another Strategy
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}

export default App;
