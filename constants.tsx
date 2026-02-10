
import { RedFlag } from './types';

export const HEURISTIC_FLAGS: RedFlag[] = [
  { id: 'F01', category: 'Financial', description: 'Request for "Registration Fee" or "Security Deposit"', severity: 'Critical', weight: 50 },
  { id: 'F02', category: 'Financial', description: 'Direct payment requested via UPI/WhatsApp Pay', severity: 'Critical', weight: 45 },
  { id: 'P01', category: 'Professional', description: 'Recruiter uses free domain (gmail/yahoo) for a Corporate role', severity: 'High', weight: 30 },
  { id: 'P02', category: 'Professional', description: 'Interview only via WhatsApp/Telegram Chat (No Video/In-Person)', severity: 'High', weight: 25 },
  { id: 'C01', category: 'Communication', description: 'Artificial urgency ("Last 2 spots", "Offer expires in 1 hour")', severity: 'Medium', weight: 15 },
  { id: 'L01', category: 'Logical', description: 'Unrealistic Pay (e.g., ₹50k/week for Data Entry)', severity: 'High', weight: 35 },
  { id: 'L02', category: 'Logical', description: 'No specific skills required for high-paying role', severity: 'Medium', weight: 20 }
];

export const SCORING_WEIGHTS = {
  HEURISTICS: 0.7, // Higher weight for explainable rules
  AI_SEMANTIC: 0.3
};
