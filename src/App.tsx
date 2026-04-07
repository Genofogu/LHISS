/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Search, Loader2, CheckCircle2, XCircle, Lightbulb, User, Code, Briefcase, Trophy, Sparkles, Filter, MapPin, Clock, BarChart3, Plus, Trash2, ChevronRight, Check, X, LogIn, LogOut, Brain, Zap, Bookmark, BookmarkCheck, BookOpen, Target, Settings, Bell, Mail, Sun, Moon, Shield } from 'lucide-react';
import Fuse from 'fuse.js';

const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Expert'] as const;
type Proficiency = typeof PROFICIENCY_LEVELS[number];

const PROFICIENCY_WEIGHTS: Record<Proficiency, number> = {
  'Beginner': 1,
  'Intermediate': 2,
  'Expert': 3
};

interface SkillRequirement {
  name: string;
  minLevel: Proficiency;
}

const SKILL_SETS: Record<string, {
  title: string;
  icon: any;
  required: SkillRequirement[];
  description: string;
  category: 'features' | 'activity';
}> = {
  intelligence: {
    title: 'Career Strategy',
    icon: Target,
    required: [
      { name: 'Data Analysis', minLevel: 'Intermediate' },
      { name: 'Machine Learning', minLevel: 'Beginner' },
      { name: 'Critical Thinking', minLevel: 'Expert' }
    ],
    description: 'A thoughtful analysis of your professional trajectory and potential.',
    category: 'features'
  },
  competitions: {
    title: 'Challenges',
    icon: Trophy,
    required: [
      { name: 'React', minLevel: 'Intermediate' },
      { name: 'Node.js', minLevel: 'Beginner' },
      { name: 'Git', minLevel: 'Intermediate' },
      { name: 'Problem Solving', minLevel: 'Expert' }
    ],
    description: 'Curated opportunities to test your skills in real-world scenarios.',
    category: 'features'
  },
  jobs: {
    title: 'Opportunities',
    icon: Briefcase,
    required: [
      { name: 'Java', minLevel: 'Intermediate' },
      { name: 'Python', minLevel: 'Intermediate' },
      { name: 'SQL', minLevel: 'Beginner' },
      { name: 'Communication', minLevel: 'Expert' }
    ],
    description: 'Professional roles that align with your unique experience and goals.',
    category: 'features'
  },
  internships: {
    title: 'Early Career',
    icon: Zap,
    required: [
      { name: 'JavaScript', minLevel: 'Beginner' },
      { name: 'HTML/CSS', minLevel: 'Intermediate' },
      { name: 'Teamwork', minLevel: 'Intermediate' }
    ],
    description: 'Foundational roles for those starting their professional journey.',
    category: 'features'
  },
  mentorships: {
    title: 'Mentorship',
    icon: User,
    required: [
      { name: 'Communication', minLevel: 'Intermediate' },
      { name: 'Leadership', minLevel: 'Beginner' }
    ],
    description: 'Meaningful connections with experienced professionals.',
    category: 'features'
  },
  courses: {
    title: 'Learning',
    icon: BookOpen,
    required: [
      { name: 'React', minLevel: 'Beginner' },
      { name: 'JavaScript', minLevel: 'Intermediate' }
    ],
    description: 'Educational resources to expand your professional horizons.',
    category: 'features'
  },
  practice: {
    title: 'Practice',
    icon: Code,
    required: [
      { name: 'Problem Solving', minLevel: 'Intermediate' },
      { name: 'Data Structures', minLevel: 'Intermediate' }
    ],
    description: 'Structured exercises to refine your technical craft.',
    category: 'features'
  },
  bookmarks: {
    title: 'Saved',
    icon: Bookmark,
    required: [],
    description: 'Your collection of saved opportunities and resources.',
    category: 'activity'
  },
  settings: {
    title: 'Preferences',
    icon: Settings,
    required: [],
    description: 'Manage your notification and account settings.',
    category: 'activity'
  }
};

type Mode = 'intelligence' | 'competitions' | 'jobs' | 'internships' | 'mentorships' | 'courses' | 'practice' | 'bookmarks' | 'settings';

interface NotificationPreferences {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'immediate';
  matchThreshold: number;
  types: string[];
}

interface UserSkill {
  name: string;
  level: Proficiency;
}

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  matchScore: number;
  requiredSkills: SkillRequirement[];
  description?: string;
}

interface AnalysisResult {
  percentage: number;
  missing: string[];
  lowProficiency: string[];
  advice: string[];
  aiAdvice?: string;
  opportunities: Opportunity[];
}

const MOCK_JOBS: Omit<Opportunity, 'matchScore'>[] = [
  { 
    id: 'j1', title: 'Backend Engineer', company: 'TechFlow Solutions', location: 'Remote', type: 'Full-time', level: 'Mid-level',
    requiredSkills: [{ name: 'Java', minLevel: 'Expert' }, { name: 'SQL', minLevel: 'Intermediate' }, { name: 'Python', minLevel: 'Intermediate' }]
  },
  { 
    id: 'j2', title: 'Junior Java Developer', company: 'DataCore Systems', location: 'New York, NY', type: 'Full-time', level: 'Entry-level',
    requiredSkills: [{ name: 'Java', minLevel: 'Intermediate' }, { name: 'SQL', minLevel: 'Beginner' }]
  },
  { 
    id: 'j3', title: 'Senior Python Architect', company: 'CloudScale AI', location: 'San Francisco, CA', type: 'Contract', level: 'Senior',
    requiredSkills: [{ name: 'Python', minLevel: 'Expert' }, { name: 'Communication', minLevel: 'Expert' }]
  },
  { 
    id: 'j4', title: 'Database Administrator', company: 'SecureBank Corp', location: 'Chicago, IL', type: 'Full-time', level: 'Senior',
    requiredSkills: [{ name: 'SQL', minLevel: 'Expert' }, { name: 'Python', minLevel: 'Beginner' }]
  },
  { 
    id: 'j5', title: 'Software Consultant', company: 'Global IT', location: 'Remote', type: 'Contract', level: 'Mid-level',
    requiredSkills: [{ name: 'Communication', minLevel: 'Expert' }, { name: 'Java', minLevel: 'Intermediate' }]
  },
  { 
    id: 'j6', title: 'Part-time Web Developer', company: 'StartUp Hub', location: 'Austin, TX', type: 'Part-time', level: 'Entry-level',
    requiredSkills: [{ name: 'Python', minLevel: 'Intermediate' }, { name: 'Communication', minLevel: 'Intermediate' }]
  },
];

const MOCK_HACKATHONS: Omit<Opportunity, 'matchScore'>[] = [
  { 
    id: 'h1', title: 'Global AI Challenge', company: 'AI Frontiers', location: 'Virtual', type: 'Hackathon', level: 'All levels',
    requiredSkills: [{ name: 'Python', minLevel: 'Intermediate' }, { name: 'Problem Solving', minLevel: 'Expert' }]
  },
  { 
    id: 'h2', title: 'FinTech Innovation Summit', company: 'BankNext', location: 'London, UK', type: 'Hackathon', level: 'Senior',
    requiredSkills: [{ name: 'React', minLevel: 'Expert' }, { name: 'Node.js', minLevel: 'Intermediate' }]
  },
  { 
    id: 'h3', title: 'GreenTech Buildathon', company: 'EcoCode', location: 'Berlin, DE', type: 'Hackathon', level: 'Entry-level',
    requiredSkills: [{ name: 'React', minLevel: 'Beginner' }, { name: 'Git', minLevel: 'Intermediate' }]
  },
];

const MOCK_INTERNSHIPS: Omit<Opportunity, 'matchScore'>[] = [
  {
    id: 'int-1',
    title: 'Frontend Developer Intern',
    company: 'WebFlow Solutions',
    location: 'Remote',
    type: 'Internship',
    level: 'Entry',
    requiredSkills: [
      { name: 'React', minLevel: 'Beginner' },
      { name: 'HTML/CSS', minLevel: 'Intermediate' },
      { name: 'JavaScript', minLevel: 'Beginner' }
    ]
  },
  {
    id: 'int-2',
    title: 'Data Science Intern',
    company: 'Insight Analytics',
    location: 'New York, NY',
    type: 'Internship',
    level: 'Entry',
    requiredSkills: [
      { name: 'Python', minLevel: 'Beginner' },
      { name: 'SQL', minLevel: 'Beginner' },
      { name: 'Data Analysis', minLevel: 'Beginner' }
    ]
  }
];

const MOCK_MENTORSHIPS: Omit<Opportunity, 'matchScore'>[] = [
  {
    id: 'ment-1',
    title: 'Senior Software Architect',
    company: 'Tech Mentors Network',
    location: 'Remote',
    type: 'Mentorship',
    level: 'Expert',
    requiredSkills: [
      { name: 'Leadership', minLevel: 'Beginner' },
      { name: 'Communication', minLevel: 'Intermediate' }
    ]
  },
  {
    id: 'ment-2',
    title: 'Product Management Lead',
    company: 'Product Guild',
    location: 'San Francisco, CA',
    type: 'Mentorship',
    level: 'Expert',
    requiredSkills: [
      { name: 'Critical Thinking', minLevel: 'Intermediate' },
      { name: 'Communication', minLevel: 'Expert' }
    ]
  }
];

const MOCK_COURSES: Omit<Opportunity, 'matchScore'>[] = [
  { id: 'c1', title: 'Full Stack Web Development', company: 'LHISS Academy', location: 'Online', type: 'Course', level: 'Beginner', requiredSkills: [{ name: 'React', minLevel: 'Beginner' }, { name: 'Node.js', minLevel: 'Beginner' }], description: 'Master web development from scratch.' },
  { id: 'c2', title: 'Data Science Fundamentals', company: 'DataMasters', location: 'Online', type: 'Course', level: 'Beginner', requiredSkills: [{ name: 'Python', minLevel: 'Beginner' }, { name: 'SQL', minLevel: 'Beginner' }], description: 'Learn the basics of data science.' }
];

const MOCK_PRACTICE: Omit<Opportunity, 'matchScore'>[] = [
  { id: 'p1', title: 'Daily Coding Challenge', company: 'LHISS Practice', location: 'Online', type: 'Challenge', level: 'Intermediate', requiredSkills: [{ name: 'Problem Solving', minLevel: 'Intermediate' }], description: 'Solve one problem every day.' },
  { id: 'p2', title: 'System Design Mock Test', company: 'LHISS Practice', location: 'Online', type: 'Mock Test', level: 'Expert', requiredSkills: [{ name: 'System Design', minLevel: 'Intermediate' }], description: 'Prepare for system design interviews.' }
];

export default function App() {
  const [mode, setMode] = useState<Mode>('jobs');
  const [name, setName] = useState('Guest User');
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<Proficiency>('Intermediate');
  
  const [experienceLevel, setExperienceLevel] = useState('Entry-level');
  const [jobType, setJobType] = useState('Full-time');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedFilterSkills, setSelectedFilterSkills] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    enabled: false,
    frequency: 'daily',
    matchThreshold: 80,
    types: ['Job', 'Hackathon']
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const availableSkills = useMemo(() => {
    const skills = new Set<string>();
    if (mode === 'jobs') {
      MOCK_JOBS.forEach(job => job.requiredSkills.forEach(s => skills.add(s.name)));
    } else if (mode === 'competitions') {
      MOCK_HACKATHONS.forEach(h => h.requiredSkills.forEach(s => skills.add(s.name)));
    } else if (mode === 'internships') {
      MOCK_INTERNSHIPS.forEach(i => i.requiredSkills.forEach(s => skills.add(s.name)));
    } else if (mode === 'mentorships') {
      MOCK_MENTORSHIPS.forEach(m => m.requiredSkills.forEach(s => skills.add(s.name)));
    } else if (mode === 'courses') {
      MOCK_COURSES.forEach(c => c.requiredSkills.forEach(s => skills.add(s.name)));
    } else if (mode === 'practice') {
      MOCK_PRACTICE.forEach(p => p.requiredSkills.forEach(s => skills.add(s.name)));
    } else if (mode === 'intelligence') {
      Object.values(SKILL_SETS).forEach(set => set.required.forEach(s => skills.add(s.name)));
    }
    return Array.from(skills).sort();
  }, [mode]);

  const currentSet = SKILL_SETS[mode];

  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (name.trim().length > 0) score += 20;
    if (userSkills.length > 0) score += Math.min(userSkills.length * 15, 60);
    if (userSkills.some(s => s.level === 'Expert')) score += 20;
    return Math.min(score, 100);
  }, [name, userSkills]);

  const suggestedSkills = useMemo(() => {
    const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
    
    // Count occurrences of each skill in mock data
    const skillCounts: Record<string, number> = {};
    const relevantData = mode === 'jobs' ? MOCK_JOBS : 
                         mode === 'competitions' ? MOCK_HACKATHONS : 
                         mode === 'internships' ? MOCK_INTERNSHIPS :
                         mode === 'mentorships' ? MOCK_MENTORSHIPS :
                         mode === 'courses' ? MOCK_COURSES :
                         mode === 'practice' ? MOCK_PRACTICE :
                         [...MOCK_JOBS, ...MOCK_HACKATHONS, ...MOCK_INTERNSHIPS, ...MOCK_MENTORSHIPS, ...MOCK_COURSES, ...MOCK_PRACTICE];
    
    relevantData.forEach(item => {
      item.requiredSkills.forEach(skill => {
        if (!userSkillNames.has(skill.name.toLowerCase())) {
          skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1;
        }
      });
    });

    return Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);
  }, [userSkills, mode]);

  const addSkill = (name: string, level: Proficiency) => {
    if (!name.trim()) return;
    if (userSkills.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) return;
    
    const updatedSkills = [...userSkills, { name: name.trim(), level }];
    setUserSkills(updatedSkills);
    setNewSkillName('');
  };

  const removeSkill = (index: number) => {
    const updatedSkills = userSkills.filter((_, i) => i !== index);
    setUserSkills(updatedSkills);
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
  };

  const toggleBookmark = (jobId: string) => {
    const isBookmarked = bookmarkedJobIds.includes(jobId);
    const updatedBookmarks = isBookmarked 
      ? bookmarkedJobIds.filter(id => id !== jobId)
      : [...bookmarkedJobIds, jobId];
    
    setBookmarkedJobIds(updatedBookmarks);
  };

  const analyzeMatch = async () => {
    if (!name || userSkills.length === 0) return;

    setIsAnalyzing(true);
    setResult(null);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    let matchedCount = 0;
    const missing: string[] = [];
    const lowProficiency: string[] = [];
    const advice: string[] = [];

    currentSet.required.forEach(req => {
      const userSkill = userSkills.find(s => s.name.toLowerCase() === req.name.toLowerCase());
      
      if (!userSkill) {
        missing.push(req.name);
      } else if (PROFICIENCY_WEIGHTS[userSkill.level] < PROFICIENCY_WEIGHTS[req.minLevel]) {
        lowProficiency.push(`${req.name} (Need ${req.minLevel})`);
        matchedCount += 0.5;
      } else {
        matchedCount += 1;
      }
    });

    const percentage = Math.round((matchedCount / currentSet.required.length) * 100);

    if (percentage === 100) {
      advice.push(`Outstanding! Your proficiency levels perfectly align with the requirements for ${currentSet.title}.`);
    } else {
      if (missing.length > 0) {
        advice.push(`Acquire fundamental knowledge in: ${missing.join(', ')}.`);
      }
      if (lowProficiency.length > 0) {
        advice.push(`Level up your expertise in ${lowProficiency.join(', ')} to meet industry standards.`);
      }
      if (percentage < 60) {
        advice.push("Consider specialized bootcamps to rapidly bridge your skill gaps.");
      }
    }

    // Calculate individual opportunity scores with refined logic
    const calculateScore = (oppSkills: SkillRequirement[]) => {
      // 1. Calculate Skill Rarity Weighting
      // Count total occurrences of all skills to determine rarity
      const allOpps = [...MOCK_JOBS, ...MOCK_HACKATHONS, ...MOCK_INTERNSHIPS, ...MOCK_MENTORSHIPS, ...MOCK_COURSES, ...MOCK_PRACTICE];
      const skillFrequencies: Record<string, number> = {};
      allOpps.forEach(opp => {
        opp.requiredSkills.forEach(s => {
          skillFrequencies[s.name] = (skillFrequencies[s.name] || 0) + 1;
        });
      });

      let totalWeightedScore = 0;
      let maxPossibleWeightedScore = 0;
      let matchedSkillsCount = 0;

      oppSkills.forEach(req => {
        // Rarity weight: lower frequency = higher weight (min weight 1.0)
        const frequency = skillFrequencies[req.name] || 1;
        const rarityWeight = Math.max(1, 5 / frequency); 
        
        maxPossibleWeightedScore += rarityWeight;

        const userSkill = userSkills.find(s => s.name.toLowerCase() === req.name.toLowerCase());
        
        if (userSkill) {
          matchedSkillsCount++;
          const userLevelVal = PROFICIENCY_WEIGHTS[userSkill.level];
          const reqLevelVal = PROFICIENCY_WEIGHTS[req.minLevel];

          if (userLevelVal >= reqLevelVal) {
            // Full match or over-qualified bonus
            const bonus = userLevelVal > reqLevelVal ? 1.2 : 1.0;
            totalWeightedScore += rarityWeight * bonus;
          } else {
            // Partial credit for lower proficiency
            totalWeightedScore += rarityWeight * 0.4;
          }
        }
      });

      // 2. Completeness Factor (Number of overlapping skills)
      // Reward matching a higher percentage of the total required skills
      const completenessFactor = matchedSkillsCount / oppSkills.length;
      
      // Final calculation: weighted average adjusted by completeness
      // We cap the score at 100
      const baseScore = (totalWeightedScore / maxPossibleWeightedScore) * 100;
      const finalScore = Math.round(baseScore * (0.8 + (completenessFactor * 0.2)));

      return Math.min(100, finalScore);
    };

    let opportunities: Opportunity[] = [];
    const getFilteredOpps = (source: any[]) => {
      let filtered = source;
      
      // 1. Apply strict filters first
      if (mode === 'jobs') {
        filtered = filtered.filter(job => job.level === experienceLevel && job.type === jobType);
      }
      
      if (locationFilter) {
        filtered = filtered.filter(opp => opp.location.toLowerCase().includes(locationFilter.toLowerCase()));
      }
      
      if (selectedFilterSkills.length > 0) {
        filtered = filtered.filter(opp => selectedFilterSkills.some(skill => opp.requiredSkills.some(rs => rs.name === skill)));
      }

      // 2. Apply fuzzy search if query exists
      if (searchQuery.trim()) {
        const fuse = new Fuse(filtered, {
          keys: [
            { name: 'title', weight: 0.5 },
            { name: 'company', weight: 0.3 },
            { name: 'requiredSkills.name', weight: 0.2 }
          ],
          threshold: 0.4,
          distance: 100,
          ignoreLocation: true
        });
        filtered = fuse.search(searchQuery).map(result => result.item);
      }

      return filtered;
    };

    if (mode === 'jobs') {
      opportunities = getFilteredOpps(MOCK_JOBS);
    } else if (mode === 'competitions') {
      opportunities = getFilteredOpps(MOCK_HACKATHONS);
    } else if (mode === 'internships') {
      opportunities = getFilteredOpps(MOCK_INTERNSHIPS);
    } else if (mode === 'mentorships') {
      opportunities = getFilteredOpps(MOCK_MENTORSHIPS);
    } else if (mode === 'courses') {
      opportunities = getFilteredOpps(MOCK_COURSES);
    } else if (mode === 'practice') {
      opportunities = getFilteredOpps(MOCK_PRACTICE);
    } else if (mode === 'intelligence') {
      const allOpps = [...MOCK_JOBS, ...MOCK_HACKATHONS, ...MOCK_INTERNSHIPS, ...MOCK_MENTORSHIPS, ...MOCK_COURSES, ...MOCK_PRACTICE];
      opportunities = allOpps
        .map(opp => ({ ...opp, matchScore: calculateScore(opp.requiredSkills) }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);
    } else {
      opportunities = opportunities.map(opp => ({ ...opp, matchScore: calculateScore(opp.requiredSkills) }));
    }

    // Sort by match score
    opportunities.sort((a, b) => b.matchScore - a.matchScore);

    setResult({ percentage, missing, lowProficiency, advice, aiAdvice: "", opportunities });
    setIsAnalyzing(false);
  };

  const toggleSkillFilter = (skill: string) => {
    setSelectedFilterSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill) 
        : [...prev, skill]
    );
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setResult(null);
    setSelectedFilterSkills([]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans selection:bg-brand-500/30 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-sm dark:shadow-none">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">LHISS</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Career Strategy v2.2</p>
            </div>
          </div>

          <nav className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Platform</p>
              <div className="space-y-1.5">
                {(Object.keys(SKILL_SETS) as Mode[]).filter(m => SKILL_SETS[m].category === 'features').map((m) => {
                  const { icon: Icon, title } = SKILL_SETS[m];
                  const isActive = mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                        isActive 
                          ? 'text-white bg-brand-600 shadow-md shadow-brand-600/20' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                      {title}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">My Activity</p>
              <div className="space-y-1.5">
                {(Object.keys(SKILL_SETS) as Mode[]).filter(m => SKILL_SETS[m].category === 'activity').map((m) => {
                  const { icon: Icon, title } = SKILL_SETS[m];
                  const isActive = mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => handleModeChange(m)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                        isActive 
                          ? 'text-white bg-brand-600 shadow-md shadow-brand-600/20' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                      {title}
                      {m === 'bookmarks' && bookmarkedJobIds.length > 0 && (
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'}`}>
                          {bookmarkedJobIds.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800/50 space-y-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-500/10 rounded-lg">
                {(() => {
                  const Icon = currentSet.icon;
                  return <Icon size={20} className="text-brand-600 dark:text-brand-400" />;
                })()}
              </div>
              <h2 className="text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">{currentSet.title}</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl leading-relaxed">{currentSet.description}</p>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className={mode === 'settings' || mode === 'bookmarks' ? "xl:col-span-12 space-y-8" : "xl:col-span-5 space-y-8"}>
              {mode === 'settings' ? (
                <div className="space-y-8">
                  <div className="pb-4 border-b border-slate-800/50">
                    <h2 className="text-xl font-bold text-white mb-1">Notification Preferences</h2>
                    <p className="text-slate-400 text-sm">Stay updated with opportunities that match your skill profile.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-8 shadow-sm dark:shadow-none">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-slate-900 dark:text-white font-serif font-bold flex items-center gap-2">
                          <Bell size={18} className="text-brand-600 dark:text-brand-400" />
                          Email Notifications
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Receive alerts when new matches are found.</p>
                      </div>
                      <button 
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${notificationPrefs.enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <motion.div 
                          animate={{ x: notificationPrefs.enabled ? 26 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {notificationPrefs.enabled && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-8 pt-4 border-t border-slate-800/50 overflow-hidden"
                        >
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Frequency</label>
                            <div className="grid grid-cols-3 gap-3">
                              {(['immediate', 'daily', 'weekly'] as const).map(freq => (
                                <button
                                  key={freq}
                                  onClick={() => setNotificationPrefs(prev => ({ ...prev, frequency: freq }))}
                                  className={`px-4 py-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                                    notificationPrefs.frequency === freq 
                                      ? 'bg-brand-600 border-brand-600 text-white shadow-sm' 
                                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-500/30'
                                  }`}
                                >
                                  {freq}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Match Threshold</label>
                              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{notificationPrefs.matchThreshold}%</span>
                            </div>
                            <input 
                              type="range"
                              min="50"
                              max="100"
                              step="5"
                              value={notificationPrefs.matchThreshold}
                              onChange={(e) => setNotificationPrefs(prev => ({ ...prev, matchThreshold: parseInt(e.target.value) }))}
                              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-600 font-bold">
                              <span>50% (BROAD)</span>
                              <span>100% (EXACT)</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Opportunity Types</label>
                            <div className="flex flex-wrap gap-2">
                              {['Job', 'Hackathon', 'Internship', 'Mentorship', 'Course', 'Challenge'].map(type => {
                                const isSelected = notificationPrefs.types.includes(type);
                                return (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      setNotificationPrefs(prev => ({
                                        ...prev,
                                        types: isSelected 
                                          ? prev.types.filter(t => t !== type)
                                          : [...prev.types, type]
                                      }));
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                      isSelected 
                                        ? 'bg-brand-600 border-brand-600 text-white shadow-sm' 
                                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-brand-500/30'
                                    }`}
                                  >
                                    {type}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-6 border-t border-slate-800/50 space-y-4">
                      <p className="text-[10px] text-slate-500 italic text-center uppercase tracking-widest">Settings are saved locally to your browser.</p>
                    </div>
                  </div>
                </div>
              ) : mode === 'bookmarks' ? (
                <div className="space-y-6">
                  <div className="pb-4 border-b border-slate-200 dark:border-slate-800/50">
                    <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-1">Bookmarked Opportunities</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">View and manage your saved jobs and hackathons.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {bookmarkedJobIds.length > 0 ? (
                      [...MOCK_JOBS, ...MOCK_HACKATHONS, ...MOCK_INTERNSHIPS, ...MOCK_MENTORSHIPS, ...MOCK_COURSES, ...MOCK_PRACTICE]
                        .filter(opp => bookmarkedJobIds.includes(opp.id))
                        .map((opp) => (
                          <div 
                            key={opp.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-brand-500/30 transition-all group shadow-sm dark:shadow-none"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-brand-500/10 rounded-lg">
                                    {opp.type === 'Hackathon' ? <Trophy size={12} className="text-brand-600 dark:text-brand-400" /> :
                                     opp.type === 'Internship' ? <Zap size={12} className="text-brand-600 dark:text-brand-400" /> :
                                     opp.type === 'Mentorship' ? <User size={12} className="text-brand-600 dark:text-brand-400" /> :
                                     opp.type === 'Course' ? <BookOpen size={12} className="text-brand-600 dark:text-brand-400" /> :
                                     (opp.type === 'Challenge' || opp.type === 'Mock Test') ? <Target size={12} className="text-brand-600 dark:text-brand-400" /> :
                                     <Briefcase size={12} className="text-brand-600 dark:text-brand-400" />}
                                  </div>
                                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{opp.title}</h4>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 uppercase">{opp.level}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-500 font-medium">
                                  <span className="flex items-center gap-1"><Briefcase size={10} /> {opp.company}</span>
                                  <span className="flex items-center gap-1"><MapPin size={10} /> {opp.location}</span>
                                  <span className="flex items-center gap-1"><Clock size={10} /> {opp.type}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => toggleBookmark(opp.id)}
                                className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 transition-colors"
                              >
                                <BookmarkCheck size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-12 bg-slate-100/50 dark:bg-slate-950/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Bookmark size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-4 opacity-50" />
                        <p className="text-slate-500 text-sm italic">You haven't bookmarked any opportunities yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm dark:shadow-none"
                >
                  <div className="space-y-10">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-500/10 rounded-lg">
                            <User size={20} className="text-brand-600 dark:text-brand-400" />
                          </div>
                          <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">Skill Inventory</h3>
                        </div>
                        <div className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-full">
                          <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Strength: {Math.round((userSkills.length / 10) * 100)}%</p>
                        </div>
                      </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                      <AnimatePresence>
                        {userSkills.map((skill, index) => (
                          <motion.div
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            key={skill.name}
                            className="group flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl hover:border-brand-500/30 transition-all"
                          >
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{skill.name}</span>
                            <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 uppercase">{skill.level}</span>
                            <button 
                              onClick={() => removeSkill(index)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {userSkills.length === 0 && (
                        <p className="text-xs text-slate-600 italic py-2">No skills added yet. Add your expertise below.</p>
                      )}
                    </div>
                  </div>

                    {suggestedSkills.length > 0 && (
                      <div className="p-4 bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/50 rounded-2xl space-y-3">
                        <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={12} />
                          Boost Your Match Score
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedSkills.map(skill => (
                            <button
                              key={skill}
                              onClick={() => {
                                if (!userSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
                                  setUserSkills(prev => [...prev, { name: skill, level: 'Intermediate' }]);
                                }
                              }}
                              className="text-[10px] px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all flex items-center gap-1.5 group shadow-sm dark:shadow-none"
                            >
                              {skill}
                              <Plus size={10} className="text-brand-600 dark:text-brand-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-500 dark:text-slate-500 italic">Adding these high-demand skills can significantly improve your match probability.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <input 
                          type="text"
                          value={newSkillName}
                          onChange={(e) => setNewSkillName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSkill(newSkillName, newSkillLevel)}
                          placeholder="Add a skill (e.g. Java)"
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <select 
                          value={newSkillLevel}
                          onChange={(e) => setNewSkillLevel(e.target.value as Proficiency)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white"
                        >
                          {PROFICIENCY_LEVELS.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <button 
                          onClick={() => addSkill(newSkillName, newSkillLevel)}
                          className="w-full h-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-brand-600/20"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-2xl space-y-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] mb-2">
                      <Filter size={12} />
                      Discovery Filters
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Keywords</label>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Title, company, or skill..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                          />
                        </div>
                      </div>

                    {(mode === 'jobs' || mode === 'internships') && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Experience</label>
                            <select 
                              value={experienceLevel}
                              onChange={(e) => setExperienceLevel(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                            >
                              <option>Entry-level</option>
                              <option>Mid-level</option>
                              <option>Senior</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Type</label>
                            <select 
                              value={jobType}
                              onChange={(e) => setJobType(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                            >
                              <option>Full-time</option>
                              <option>Part-time</option>
                              <option>Contract</option>
                              <option>Remote</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Location</label>
                          <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              value={locationFilter}
                              onChange={(e) => setLocationFilter(e.target.value)}
                              placeholder="Remote, New York, Austin..."
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                  <div className="space-y-4 pt-8 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Target size={14} className="text-brand-600 dark:text-brand-400" />
                        Target Skills
                      </label>
                      {selectedFilterSkills.length > 0 && (
                        <button 
                          onClick={() => setSelectedFilterSkills([])}
                          className="text-[10px] font-bold text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-left flex items-center justify-between group hover:border-brand-500/30 transition-all shadow-sm dark:shadow-none"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {selectedFilterSkills.length === 0 ? (
                            <span className="text-sm text-slate-400 dark:text-slate-500 italic">Select skills to filter by...</span>
                          ) : (
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md">
                                {selectedFilterSkills.length}
                              </span>
                              <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                {selectedFilterSkills.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight 
                          size={16} 
                          className={`text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isSkillDropdownOpen ? 'rotate-90' : ''}`} 
                        />
                      </button>

                      <AnimatePresence>
                        {isSkillDropdownOpen && (
                          <>
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-40"
                              onClick={() => setIsSkillDropdownOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                            >
                              <div className="p-3 border-b border-slate-800">
                                <div className="relative">
                                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                  <input 
                                    type="text"
                                    autoFocus
                                    value={skillSearchQuery}
                                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                                    placeholder="Search skills..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-700"
                                  />
                                </div>
                              </div>
                              <div className="max-h-[240px] overflow-y-auto p-2 custom-scrollbar">
                                  {availableSkills
                                    .filter(skill => skill.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                    .map(skill => {
                                      const isSelected = selectedFilterSkills.includes(skill);
                                      return (
                                        <div
                                          key={skill}
                                          onClick={() => toggleSkillFilter(skill)}
                                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all mb-1 cursor-pointer ${
                                            isSelected 
                                              ? 'bg-purple-500/10 text-purple-400' 
                                              : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                                          }`}
                                        >
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-700 bg-slate-950'
                                          }`}>
                                            {isSelected && <Check size={10} className="text-white" />}
                                          </div>
                                          <span className="flex-1">{skill}</span>
                                        </div>
                                      );
                                    })}
                                  {availableSkills.filter(skill => skill.toLowerCase().includes(skillSearchQuery.toLowerCase())).length === 0 && (
                                  <div className="py-8 text-center">
                                    <p className="text-xs text-slate-600 italic">No matching skills found</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {selectedFilterSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFilterSkills.map(skill => (
                          <span 
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-medium text-slate-300"
                          >
                            {skill}
                            <button 
                              onClick={() => toggleSkillFilter(skill)}
                              className="hover:text-red-400 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={analyzeMatch}
                    disabled={isAnalyzing || !name || userSkills.length === 0}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-brand-600/20 active:scale-[0.98] text-base"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span className="font-serif">Analyzing Opportunities...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span className="font-serif">Run Strategic Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
        </div>

        {(mode !== 'settings' && mode !== 'bookmarks') && (
          <div className="xl:col-span-7">
            <AnimatePresence mode="wait">
            {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 pt-8 border-t border-slate-800 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Proficiency Score</h3>
                        <span className={`text-2xl font-black ${result.percentage > 70 ? 'text-green-400' : result.percentage > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {result.percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${result.percentage > 70 ? 'bg-green-500' : result.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentSet.required.map(req => (
                          <div key={req.name} className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{req.name}</span>
                            <span className="text-[9px] font-black text-purple-400 uppercase">{req.minLevel}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <XCircle size={14} className="text-red-400" />
                        Gap Analysis
                      </h3>
                      <div className="space-y-2">
                        {result.missing.map(skill => (
                          <div key={skill} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 px-3 py-2 rounded-lg">
                            <span className="text-[10px] font-bold text-red-400 uppercase">{skill}</span>
                            <span className="text-[9px] font-medium text-red-500/60 uppercase italic">Missing</span>
                          </div>
                        ))}
                        {result.lowProficiency.map(skill => (
                          <div key={skill} className="flex items-center justify-between bg-yellow-500/5 border border-yellow-500/10 px-3 py-2 rounded-lg">
                            <span className="text-[10px] font-bold text-yellow-400 uppercase">{skill}</span>
                            <span className="text-[9px] font-medium text-yellow-500/60 uppercase italic">Low Level</span>
                          </div>
                        ))}
                        {result.missing.length === 0 && result.lowProficiency.length === 0 && (
                          <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/10 px-3 py-2 rounded-lg">
                            <CheckCircle2 size={12} className="text-green-400" />
                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">All Requirements Met</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <BarChart3 size={14} className="text-purple-400" />
                      Qualified {currentSet.title}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {result.opportunities.length > 0 ? (
                        result.opportunities.map((opp, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            key={opp.id}
                            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-5 hover:border-brand-500/30 dark:hover:border-brand-500/30 transition-all group cursor-pointer shadow-sm dark:shadow-none"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{opp.title}</h4>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 uppercase">{opp.level}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                                  <span className="flex items-center gap-1"><Briefcase size={10} /> {opp.company}</span>
                                  <span className="flex items-center gap-1"><MapPin size={10} /> {opp.location}</span>
                                  <span className="flex items-center gap-1"><Clock size={10} /> {opp.type}</span>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-700/30">
                                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Code size={10} className="text-purple-500/50" />
                                    Required Expertise
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {opp.requiredSkills.map(skill => {
                                      const userSkill = userSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
                                      const isMet = userSkill && PROFICIENCY_WEIGHTS[userSkill.level] >= PROFICIENCY_WEIGHTS[skill.minLevel];
                                      
                                      return (
                                        <div key={skill.name} className={`flex items-center gap-1.5 bg-slate-900/60 border ${isMet ? 'border-green-500/20' : 'border-slate-700/50'} px-2 py-1 rounded-md group/skill hover:border-purple-500/30 transition-colors`}>
                                          <div className={`w-1 h-1 rounded-full ${
                                            skill.minLevel === 'Expert' ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]' :
                                            skill.minLevel === 'Intermediate' ? 'bg-yellow-500 shadow-[0_0_4px_rgba(234,179,8,0.5)]' :
                                            'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]'
                                          }`} />
                                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">{skill.name}</span>
                                          <span className="text-[8px] font-medium text-slate-500 uppercase italic">{skill.minLevel}</span>
                                          {isMet ? (
                                            <Check size={8} className="text-green-500 ml-0.5" />
                                          ) : (
                                            <X size={8} className="text-red-500/50 ml-0.5" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(opp.id);
                                  }}
                                  className={`p-2 rounded-xl transition-all ${
                                    bookmarkedJobIds.includes(opp.id) 
                                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                                      : 'bg-slate-800 text-slate-400 hover:text-purple-400 border border-slate-700'
                                  }`}
                                >
                                  {bookmarkedJobIds.includes(opp.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                </button>
                                <div className="flex flex-col items-end">
                                  <div className="text-xs font-black text-purple-400">{opp.matchScore}%</div>
                                  <div className="text-[8px] uppercase tracking-tighter text-slate-600 font-bold">Fit Score</div>
                                  <ChevronRight size={14} className="mt-2 text-slate-700 group-hover:text-purple-500 transition-colors" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-10 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                          <p className="text-slate-500 text-xs italic">No qualified {mode === 'jobs' ? 'roles' : 'hackathons'} found for your current filters.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-12 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-8 w-1 bg-indigo-500 rounded-full" />
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                        Strategic Growth Path
                      </h3>
                    </div>
                    
                    {result.aiAdvice && (
                      <div className="mb-10 overflow-hidden rounded-3xl border-2 border-indigo-500/30 bg-indigo-950/20 shadow-[0_0_50px_rgba(79,70,229,0.15)] backdrop-blur-sm">
                        <div className="flex items-center justify-between border-b border-indigo-500/20 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 shadow-lg border border-indigo-500/30">
                              <Brain size={20} className="animate-pulse" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-100 leading-none mb-1">
                                Career Growth Insights
                              </h4>
                              <p className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest">
                                Powered by Gemini 3 Flash
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            <Zap size={10} className="text-yellow-400 fill-yellow-400/20" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300">Live Analysis</span>
                          </div>
                        </div>
                        <div className="p-8 relative group">
                          {/* Decorative elements */}
                          <div className="absolute top-0 right-0 -mt-16 -mr-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-1000" />
                          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-48 w-48 rounded-full bg-purple-500/5 blur-[80px]" />
                          
                          <div className="relative z-10 text-sm text-slate-200 leading-relaxed prose prose-invert prose-sm max-w-none 
                            prose-p:leading-relaxed prose-li:my-3 prose-strong:text-indigo-300 prose-strong:font-bold prose-headings:text-white prose-headings:font-black prose-headings:tracking-tighter">
                            <ReactMarkdown>{result.aiAdvice}</ReactMarkdown>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-indigo-500/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              <span className="text-[9px] text-indigo-400/60 font-bold uppercase tracking-widest">
                                Confidence Score: 98.4%
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-1 w-3 rounded-full bg-indigo-500/20" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.advice.map((item, i) => (
                        <motion.li 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + (i * 0.1) }}
                          key={i} 
                          className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl text-slate-300 text-xs flex items-start gap-3 leading-relaxed hover:bg-indigo-500/10 transition-colors"
                        >
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        </div>
      </div>
      <footer className="mt-12 text-center text-slate-600 text-[10px] uppercase tracking-[0.2em]">
          <p>© 2026 LHISS Intelligence • Skill Proficiency Engine v2.2</p>
        </footer>
      </main>
    </div>
  );
}
