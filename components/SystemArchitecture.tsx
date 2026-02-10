
import React from 'react';

const SystemArchitecture: React.FC = () => {
  const modules = [
    { name: 'Input Orchestrator', icon: 'fa-box-open', color: 'blue', desc: 'Handles text & metadata' },
    { name: 'Heuristic Engine', icon: 'fa-code-branch', color: 'indigo', desc: 'Regex-based Red Flag detection' },
    { name: 'Semantic Logic (Gemini)', icon: 'fa-brain', color: 'purple', desc: 'LLM-powered tone & logic audit' },
    { name: 'Risk Aggregator', icon: 'fa-calculator', color: 'amber', desc: 'Weighted scoring & deduction' },
    { name: 'XAI Dashboard', icon: 'fa-desktop', color: 'green', desc: 'Explainable UI for students' }
  ];

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <i className="fas fa-project-diagram mr-3 text-indigo-400"></i>
        System Architecture
      </h3>
      
      <div className="space-y-4">
        {modules.map((m, i) => (
          <div key={m.name} className="relative">
            <div className={`flex items-center space-x-4 p-3 rounded-lg bg-slate-800 border-l-4 border-${m.color}-500`}>
              <div className={`bg-${m.color}-500/20 p-2 rounded-lg`}>
                <i className={`fas ${m.icon} text-${m.color}-400`}></i>
              </div>
              <div>
                <h4 className="text-sm font-bold">{m.name}</h4>
                <p className="text-[10px] text-slate-400">{m.desc}</p>
              </div>
            </div>
            {i < modules.length - 1 && (
              <div className="flex justify-center my-1 opacity-30">
                <i className="fas fa-arrow-down text-[10px]"></i>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Technical Differentiator</h4>
        <p className="text-[11px] text-indigo-200 leading-relaxed">
          Hybrid Logic: Combines deterministic expert systems (Heuristics) with probabilistic LLMs (Gemini) to minimize False Positives and ensure explainability.
        </p>
      </div>
    </div>
  );
};

export default SystemArchitecture;
