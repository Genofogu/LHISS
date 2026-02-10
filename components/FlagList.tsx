
import React from 'react';
import { RedFlag } from '../types';

interface FlagListProps {
  flags: RedFlag[];
}

const FlagList: React.FC<FlagListProps> = ({ flags }) => {
  if (flags.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
        <div className="bg-green-100 p-2 rounded-full">
          <i className="fas fa-check-circle text-green-600"></i>
        </div>
        <p className="text-green-800 text-sm font-medium">No obvious technical red flags detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-tight">System Detected Risks</h3>
      {flags.map((flag) => (
        <div key={flag.id} className="flex items-start space-x-3 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
            flag.severity === 'Critical' ? 'bg-red-600 animate-pulse' : 
            flag.severity === 'High' ? 'bg-orange-500' : 
            'bg-yellow-500'
          }`}></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase">{flag.category}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                flag.severity === 'Critical' ? 'bg-red-100 text-red-700' : 
                flag.severity === 'High' ? 'bg-orange-100 text-orange-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>{flag.severity}</span>
            </div>
            <p className="text-sm text-slate-800 mt-1">{flag.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlagList;
