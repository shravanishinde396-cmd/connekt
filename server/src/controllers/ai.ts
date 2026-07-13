import { Response, NextFunction } from 'express';
import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { Drive } from '../models/Drive.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { getGeminiModel, parseAndRepairJson, isMockKey } from '../utils/gemini.js';

// 1. CHATBOT: Handles the AI Assistant Chat
export const chatWithAI = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const latestMessage = messages[messages.length - 1]?.content || '';
    const userRole = req.user?.role || 'student';
    
    let userName = 'User';
    if (req.user?.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        userName = user.name;
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!isMockKey(apiKey)) {
      try {
        const model = getGeminiModel(apiKey);
        if (model) {
          const systemPrompt = `You are PlacePilot AI, a brilliant placement coordinator and career counselor at a university.
          You assist students, placement officers, and recruiters.
          The current user is ${userName} who is logged in as a ${userRole}.
          Keep your response clear, engaging, and professional. Focus on helping them achieve high placement success.
          Context: ${JSON.stringify(context || {})}
          User message: ${latestMessage}`;

          const result = await model.generateContent(systemPrompt);
          res.json({ reply: result.response.text() });
          return;
        }
      } catch (err) {
        console.error('Gemini Chat failed, falling back to mock:', err);
      }
    }

    // Mock Chatbot fallback responses based on queries
    let reply = `Hello ${userName}! As your PlacePilot AI assistant, I am here to help you navigate campus placements. How can I assist you with your role as a ${userRole.replace('_', ' ')} today?`;
    const query = latestMessage.toLowerCase();

    if (query.includes('resume') || query.includes('ats')) {
      reply = `I can help you audit your resume! Upload your PDF on the profile page, and click 'Run ATS Check'. I will analyze your formatting, find missing skills like ${userRole === 'student' ? 'System Design, Docker, or Kubernetes' : 'required stack elements'}, and give you an ATS Score out of 100.`;
    } else if (query.includes('interview') || query.includes('mock') || query.includes('question')) {
      reply = `Preparing for interviews is key. I can generate role-specific mock questions for companies like Google, Microsoft, or TCS. Try clicking on our 'Mock Interview' tab to practice with tailored questions and answers!`;
    } else if (query.includes('eligibility') || query.includes('eligible') || query.includes('probability')) {
      reply = `Your placement eligibility depends on meeting CGPA cutoffs, backlog limits, and branch restrictions set by recruiters. Check out the 'Roadmap to Eligibility' tab on your dashboard to see how to improve your probability score!`;
    } else if (query.includes('certification') || query.includes('course')) {
      reply = `Adding industry certifications will boost your resume. For software roles, I recommend AWS Certified Solutions Architect, Google Cloud Associate Developer, or Certified Kubernetes Administrator (CKA).`;
    }

    res.json({ reply });
  } catch (error) {
    next(error);
  }
};

// 2. ELIGIBILITY PREDICTION & PLACEMENT PROBABILITY SCORE
export const predictEligibilityAndProbability = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { driveId } = req.body;
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    let driveDetail = null;
    if (driveId) {
      driveDetail = await Drive.findById(driveId).populate('companyId');
    }

    // Standard placement probability logic based on profile metrics
    const cgpa = profile.CGPA || 0.0;
    const backlogs = profile.backlogs || 0;
    const skillCount = profile.skills?.length || 0;
    const projectCount = profile.projects?.length || 0;
    const experienceCount = profile.experience?.length || 0;

    let baseProb = 40; // baseline
    if (cgpa >= 9.0) baseProb += 25;
    else if (cgpa >= 8.0) baseProb += 20;
    else if (cgpa >= 7.0) baseProb += 10;

    if (backlogs === 0) baseProb += 15;
    else baseProb -= backlogs * 15;

    baseProb += Math.min(skillCount * 3, 15);
    baseProb += Math.min(projectCount * 5, 15);
    baseProb += Math.min(experienceCount * 5, 10);

    const placementProbability = Math.max(Math.min(baseProb, 98), 15);

    // Contextual eligibility rules
    const eligibilityAnalysis = {
      isEligible: driveDetail ? (cgpa >= driveDetail.cgpaCutoff && backlogs <= driveDetail.backlogCutoff) : true,
      probabilityScore: placementProbability,
      verdict: placementProbability > 80 ? 'Excellent candidate, very high chance of selection' :
               placementProbability > 60 ? 'Strong candidate, focus on mock interviews and resume details' :
               'Needs improvement: Focus on boosting CGPA, acquiring core certifications, and resolving active backlogs',
      factors: [
        { name: 'Academic Standing (CGPA)', score: Math.round(cgpa * 10), feedback: cgpa >= 8 ? 'Strong GPA' : 'Maintain higher GPA to clear recruiter thresholds' },
        { name: 'Backlog Status', score: backlogs === 0 ? 100 : 30, feedback: backlogs === 0 ? 'Clear record' : `Clear ${backlogs} active backlogs` },
        { name: 'Technical Skills Profile', score: Math.min(skillCount * 12, 100), feedback: `${skillCount} skills listed. Add cloud and developer tools.` },
        { name: 'Project Portfolio', score: Math.min(projectCount * 25, 100), feedback: `${projectCount} major projects completed.` }
      ],
      improvementRoadmap: [
        'Complete at least one premium certification to offset GPA thresholds.',
        'Inject more quantitative achievements in your project descriptions.',
        'Conduct mock interview sessions to improve technical articulation.'
      ]
    };

    res.json(eligibilityAnalysis);
  } catch (error) {
    next(error);
  }
};

// 3. CAREER RECOMMENDATION, COMPANY RECOMMENDATION, ROADMAP & CERTIFICATIONS
export const generateCareerAndCompanyRoadmap = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      res.status(404).json({ error: 'Student profile not found.' });
      return;
    }

    const skills = profile.skills || [];
    const department = profile.department || 'Computer Science';

    // Mock/Simulated Career Roadmap customized to user skills
    const recommendations = {
      primaryCareerPath: skills.some(s => s.toLowerCase().includes('react') || s.toLowerCase().includes('web')) ? 'Full Stack Developer' : 'Software Engineer',
      skillsAnalysis: {
        strengths: skills.slice(0, 4),
        gaps: ['Docker', 'System Design', 'Kubernetes', 'CI/CD Pipelines']
      },
      recommendedCertifications: [
        { name: 'AWS Certified Cloud Practitioner', provider: 'Amazon Web Services', difficulty: 'Beginner', effortDays: 30 },
        { name: 'Certified Kubernetes Administrator (CKA)', provider: 'CNCF', difficulty: 'Advanced', effortDays: 60 },
        { name: 'Meta Full-Stack Developer Professional Certificate', provider: 'Coursera/Meta', difficulty: 'Intermediate', effortDays: 45 }
      ],
      recommendedCompanies: [
        { name: 'Google LLC', reason: 'High alignment with algorithms and frontend architectures.', compatibilityScore: 88 },
        { name: 'Microsoft Corporation', reason: 'Matches enterprise stack skills and cloud framework knowledge.', compatibilityScore: 82 },
        { name: 'Stripe', reason: 'Strong interest in API design and finance-tech projects.', compatibilityScore: 79 }
      ],
      roadmapSteps: [
        { phase: 'Phase 1: Foundation (Weeks 1-4)', target: 'Acquire system architecture and Docker basics. Optimize data structures.' },
        { phase: 'Phase 2: Project Deployment (Weeks 5-8)', target: 'Deploy 2 full-stack projects using AWS EC2/S3. Document with clean READMEs.' },
        { phase: 'Phase 3: ATS & Mock Prep (Weeks 9-12)', target: 'Optimize resume ATS score to 80+. Execute 10+ mock tech interviews.' }
      ]
    };

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

// 4. MOCK INTERVIEW QUESTIONS GENERATOR
export const generateInterviewQuestions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { role = 'Software Engineer', company = 'Tech Industry' } = req.body;
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    const skills = profile?.skills || ['JavaScript', 'HTML/CSS'];

    const fallbackQuestions = [
      {
        question: `How do you handle asynchronous operations in JavaScript, and what is the difference between Promises and async/await?`,
        expectedAnswerHint: `Async/await is syntactic sugar over Promises. Under the hood, it returns a Promise and uses generators. Await pauses the execution of async function, making code read synchronously while keeping runtime non-blocking.`,
        difficulty: 'Medium'
      },
      {
        question: `Describe a complex project you built. What architectural challenges did you face and how did you optimize its performance?`,
        expectedAnswerHint: `Highlight technical choices (e.g., using React state, indexing in databases, memoization hooks, lazy loading, and caching). Use numbers (e.g., 'reduced load time by 40%').`,
        difficulty: 'Hard'
      },
      {
        question: `Explain how REST APIs differ from GraphQL, and when would you choose one over the other for a university placement portal?`,
        expectedAnswerHint: `REST has defined endpoints with fixed schemas. GraphQL allows client-defined queries preventing over-fetching. GraphQL is great for dashboards with multiple components rendering distinct parts of data.`,
        difficulty: 'Medium'
      },
      {
        question: `What are React hooks, and what rules must you follow when creating or using custom hooks?`,
        expectedAnswerHint: `Hooks let you use state and lifecycle features in functional components. Rules: 1. Only call hooks at the top level (not inside loops or conditions). 2. Only call hooks from React function components or custom hooks.`,
        difficulty: 'Easy'
      },
      {
        question: `How would you secure a MERN stack application against common security vulnerabilities like XSS, CSRF, and SQL/NoSQL Injection?`,
        expectedAnswerHint: `Use Helmet for security headers, express-rate-limit to block DDoS, sanitize inputs using validation libraries like Zod/Mongoose schemas, and enforce HttpOnly cookies for session storage.`,
        difficulty: 'Hard'
      }
    ];

    let questions = fallbackQuestions;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!isMockKey(apiKey)) {
      try {
        const model = getGeminiModel(apiKey);
        if (model) {
          const prompt = `You are a Lead Software Architect and Technical Interviewer at ${company}.
          Generate 5 standard interview questions for a ${role} position.
          Make them highly realistic and tailormade based on these skills: ${skills.join(', ')}.
          Return a JSON array containing objects with the following keys:
          - "question": string
          - "expectedAnswerHint": string
          - "difficulty": "Easy" | "Medium" | "Hard"
          Return only the raw JSON. Do not include markdown code block formatting.`;

          const result = await model.generateContent(prompt);
          const resultText = result.response.text();
          questions = parseAndRepairJson(resultText, fallbackQuestions);
        }
      } catch (err) {
        console.error('Gemini Questions failed, falling back to mock:', err);
      }
    }

    res.json({ questions });
  } catch (error) {
    next(error);
  }
};

// 5. COVER LETTER GENERATOR
export const generateCoverLetter = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { companyName = 'Target Company', jobTitle = 'Software Engineer' } = req.body;
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    const userDetails = await User.findById(req.user.id);

    const userName = userDetails?.name || 'Candidate';
    const skills = profile?.skills || [];
    const CGPA = profile?.CGPA || 8.5;

    const fallbackLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. As a highly motivated student with a solid academic record (CGPA: ${CGPA}) and extensive training in Software Engineering, I am excited about the opportunity to contribute to your engineering team.

My technical profile is anchored in core systems and modern development tools, including: ${skills.join(', ')}. Throughout my academic projects, I have focused on building performant backend servers, secure authentication workflows, and interactive frontend interfaces.

I am particularly drawn to ${companyName} because of your commitment to engineering excellence. I am confident that my technical proficiency, coupled with my problem-solving capabilities, makes me a valuable addition to your team.

Thank you for your time and consideration. I look forward to the opportunity to discuss my qualifications with you in more detail.

Sincerely,
${userName}`;

    let coverLetter = fallbackLetter;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!isMockKey(apiKey)) {
      try {
        const model = getGeminiModel(apiKey);
        if (model) {
          const prompt = `Write a professional cover letter for ${userName} applying for the ${jobTitle} position at ${companyName}.
          Include key skills: ${skills.join(', ')}.
          Mention their strong academic standing (CGPA: ${CGPA}).
          Format it as a formal professional letter. Keep it engaging, confident, and under 300 words.`;

          const result = await model.generateContent(prompt);
          coverLetter = result.response.text();
        }
      } catch (err) {
        console.error('Gemini Cover Letter failed, falling back to mock:', err);
      }
    }

    res.json({ coverLetter });
  } catch (error) {
    next(error);
  }
};
