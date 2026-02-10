
export interface RedFlag {
  id: string;
  category: 'Financial' | 'Professional' | 'Communication' | 'Logical';
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  weight: number;
}

export interface AnalysisResult {
  trustScore: number;
  verdict: 'Genuine' | 'Suspicious' | 'Likely Fake' | 'Confirmed Scam';
  foundFlags: RedFlag[];
  aiReasoning: string;
  companyVerification: {
    domainTrust: number;
    socialPresence: string;
    details: string;
  };
  jobMetadata: {
    salaryRange: string;
    location: string;
    role: string;
  };
}

export interface JobInput {
  title: string;
  company: string;
  description: string;
  email: string;
  platform: string;
}
