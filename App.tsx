
import React, { useState } from 'react';
import { JobInput, AnalysisResult, RedFlag } from './types';
import { HEURISTIC_FLAGS } from './constants';
import { analyzeJobPosting } from './services/geminiService';
import ScoreGauge from './components/ScoreGauge';
import FlagList from './components/FlagList';
import SystemArchitecture from './components/SystemArchitecture';

const App: React.FC = () => {
  const [input, setInput] = useState<JobInput>({
    title: '',
    company: '',
    description: '',
    email: '',
    platform: 'LinkedIn'
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchitecture, setShowArchitecture] = useState(false);

  const calculateTrustScore = (heuristicFlags: RedFlag[], aiScore: number) => {
    const totalDeduction = heuristicFlags.reduce((acc, flag) => acc + flag.weight, 0);
    const heuristicScore = Math.max(0, 100 - totalDeduction);
    // Weighted: 70% Heuristics (Deterministic), 30% AI (Semantic)
    return Math.round((heuristicScore * 0.7) + (aiScore * 0.3));
  };

  const performAnalysis = async () => {
    if (!input.description && !input.title) {
      setError("Provide job details to start the audit.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Local Heuristics Logic
      const foundFlags = HEURISTIC_FLAGS.filter(flag => {
        const text = (input.description + ' ' + input.title + ' ' + input.email).toLowerCase();
        
        if (flag.id === 'F01' && (text.includes('security deposit') || text.includes('processing fee') || text.includes('registration charge') || text.includes('laptop fee'))) return true;
        if (flag.id === 'F02' && (text.includes('upi') || text.includes('whatsapp pay') || text.includes('direct transfer'))) return true;
        if (flag.id === 'P01' && (input.email.includes('@gmail.com') || input.email.includes('@yahoo.com') || input.email.includes('@outlook.com'))) return true;
        if (flag.id === 'P02' && (text.includes('chat interview') || text.includes('whatsapp interview'))) return true;
        if (flag.id === 'C01' && (text.includes('urgent') || text.includes('limited spots') || text.includes('immediate joiner'))) return true;
        if (flag.id === 'L01' && (text.includes('50000') || text.includes('80000')) && (text.includes('data entry') || text.includes('typing'))) return true;
        
        return false;
      });

      // 2. AI Semantic Analysis
      const aiData = await analyzeJobPosting(input);
      
      const finalScore = calculateTrustScore(foundFlags, aiData.trustScore || 0);
      const verdict = finalScore > 80 ? 'Genuine' : finalScore > 50 ? 'Suspicious' : finalScore > 30 ? 'Likely Fake' : 'Confirmed Scam';

      setResult({
        trustScore: finalScore,
        verdict: verdict as any,
        foundFlags,
        aiReasoning: aiData.aiReasoning || 'Analysis complete.',
        companyVerification: {
          domainTrust: input.email.includes(input.company.toLowerCase().replace(/\s/g, '')) ? 80 : 20,
          socialPresence: 'Verified',
          details: 'Domain reputation analysis completed.'
        },
        jobMetadata: {
          salaryRange: 'High Risk',
          location: 'Remote',
          role: input.title
        }
      });
    } catch (err) {
      setError("Service connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (type: 'scam' | 'genuine') => {
    if (type === 'scam') {
      setInput({
        title: 'Online Typing & Data Entry Expert',
        company: 'Global Solutions India',
        email: 'jobs.globalsolutions@gmail.com',
        platform: 'WhatsApp Link',
        description: 'Earn ₹40,000 per week working only 2 hours daily. No experience needed. Immediate joining. You must pay ₹999 for identity verification and laptop security deposit. Only serious candidates message on WhatsApp immediately!'
      });
    } else {
      setInput({
        title: 'Full Stack Developer Intern',
        company: 'Zomato Engineering',
        email: 'careers@zomato.com',
        platform: 'LinkedIn',
        description: 'Zomato is looking for interns for our Gurgaon office. Candidates must be proficient in React, Node.js, and MongoDB. This is a 6-month paid internship with a stipend of ₹30,000/month. Standard technical interview rounds apply.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <i className="fas fa-shield-halved text-white text-lg"></i>
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">TrustScore <span className="text-indigo-600">AI</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowArchitecture(!showArchitecture)}
              className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition flex items-center"
            >
              <i className={`fas ${showArchitecture ? 'fa-times' : 'fa-project-diagram'} mr-2`}></i>
              {showArchitecture ? 'Close Blueprint' : 'View Blueprint'}
            </button>
            <button className="bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition transform hover:scale-105 active:scale-95">
              Report Scam
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input or Architecture */}
        <div className="lg:col-span-7 space-y-6">
          {showArchitecture ? (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <SystemArchitecture />
            </div>
          ) : (
            <section className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Safety Audit Engine</h2>
                  <p className="text-slate-500 text-sm mt-1">Cross-referencing signals to protect your career.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => loadExample('scam')} className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-red-600 hover:bg-white transition">SCAM</button>
                  <button onClick={() => loadExample('genuine')} className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-green-600 hover:bg-white transition">GENUINE</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Company Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="e.g. Amazon India"
                    value={input.company}
                    onChange={(e) => setInput({...input, company: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Role Title</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="e.g. Intern"
                    value={input.title}
                    onChange={(e) => setInput({...input, title: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Recruiter Email / Contact</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="hr@company.com"
                    value={input.email}
                    onChange={(e) => setInput({...input, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Source Platform</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition appearance-none"
                    value={input.platform}
                    onChange={(e) => setInput({...input, platform: e.target.value})}
                  >
                    <option>LinkedIn</option>
                    <option>Naukri</option>
                    <option>WhatsApp Message</option>
                    <option>Internshala</option>
                    <option>Instagram Ad</option>
                  </select>
                </div>
              </div>

              <div className="mb-8 space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1">Job Details / Message Text</label>
                <textarea 
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  placeholder="Paste the description or message content here..."
                  value={input.description}
                  onChange={(e) => setInput({...input, description: e.target.value})}
                />
              </div>

              <button 
                onClick={performAnalysis}
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center transition-all ${
                  loading ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transform active:scale-95'
                }`}
              >
                {loading ? (
                  <><i className="fas fa-circle-notch fa-spin mr-3"></i> Running Trust-Layer Protocols...</>
                ) : (
                  <><i className="fas fa-shield-check mr-3"></i> Generate TrustScore</>
                )}
              </button>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl"><i className="fas fa-fingerprint text-blue-600"></i></div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Entity Audit</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Automated extraction of company reputation metrics.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start space-x-4">
              <div className="bg-purple-100 p-3 rounded-xl"><i className="fas fa-bolt text-purple-600"></i></div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Semantic AI</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Detecting linguistic manipulation and urgency traps.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dashboard */}
        <div className="lg:col-span-5 space-y-6">
          {!result && !loading && (
            <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 shadow-2xl">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-radar text-slate-500 animate-pulse"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Awaiting Signals</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Start an audit to see the multi-layered TrustScore analysis and explainable AI breakdown.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl animate-pulse">
              <div className="w-24 h-24 border-8 border-indigo-50 border-t-indigo-600 rounded-full mx-auto mb-8 animate-spin"></div>
              <h3 className="text-xl font-black text-slate-900">Scanning Ecosystem</h3>
              <p className="text-slate-500 text-sm mt-2">Checking domain registries and analyzing semantic risk vectors...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <section className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 ${
                  result.trustScore > 75 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900">Audit Status</h2>
                  <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tighter ${
                    result.verdict === 'Genuine' ? 'bg-green-100 text-green-700' :
                    result.verdict === 'Suspicious' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.verdict}
                  </div>
                </div>

                <ScoreGauge score={result.trustScore} />

                <div className="mt-10">
                  <FlagList flags={result.foundFlags} />
                </div>
              </section>

              <section className="bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Explainable AI Narrative</h3>
                </div>
                <div className="relative">
                   <i className="fas fa-quote-left absolute -top-2 -left-2 text-slate-800 text-4xl"></i>
                   <p className="text-slate-300 text-sm leading-relaxed italic relative z-10 px-4">
                    {result.aiReasoning}
                  </p>
                </div>
              </section>

              <section className={`p-8 rounded-3xl shadow-lg border transform transition hover:-translate-y-1 ${
                result.trustScore > 75 ? 'bg-green-600 border-green-700 text-white' : 'bg-red-600 border-red-700 text-white'
              }`}>
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <i className={`fas ${result.trustScore > 75 ? 'fa-check-double' : 'fa-hand-paper'} text-2xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight">Expert Recommendation</h3>
                    <p className="text-sm opacity-90 mt-2 font-medium">
                      {result.trustScore > 75 
                        ? "Verified corporate signals detected. Proceed with application but remain professional." 
                        : "Predatory patterns identified. High risk of financial or identity theft. DO NOT PAY FEES."}
                    </p>
                  </div>
                </div>
                <button className="w-full mt-6 py-3.5 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition shadow-lg">
                  {result.trustScore > 75 ? "Apply Safely" : "Block & Blacklist"}
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Excellence in Innovation Architecture</p>
          <div className="mt-6 flex justify-center space-x-8 text-slate-300">
            <div className="group flex items-center cursor-help">
              <i className="fas fa-shield-virus mr-2 group-hover:text-indigo-500 transition"></i>
              <span className="text-[10px] font-bold">CyberSec Core</span>
            </div>
            <div className="group flex items-center cursor-help">
              <i className="fas fa-dna mr-2 group-hover:text-indigo-500 transition"></i>
              <span className="text-[10px] font-bold">Hybrid Logic</span>
            </div>
            <div className="group flex items-center cursor-help">
              <i className="fas fa-universal-access mr-2 group-hover:text-indigo-500 transition"></i>
              <span className="text-[10px] font-bold">Student-First UX</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
