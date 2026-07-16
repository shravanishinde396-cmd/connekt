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
          const systemPrompt = `You are Connekt AI, a brilliant placement coordinator and career counselor at a university.
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
    let reply = `Hello ${userName}! As your Connekt AI assistant, I am here to help you navigate campus placements. How can I assist you with your role as a ${userRole.replace('_', ' ')} today?`;
    const query = latestMessage.toLowerCase();

    if (query.includes('resume') || query.includes('ats')) {
      reply = `I can help you audit your resume! Upload your PDF on the profile page, and click 'Run ATS Check'. I will analyze your formatting, find missing skills like ${userRole === 'student' ? 'System Design, Docker, or Kubernetes' : 'required stack elements'}, and give you an ATS Score out of 100.`;
    } else if (query.includes('interview') || query.includes('mock') || query.includes('question')) {
      reply = `Preparing for interviews is key. I can generate role-specific mock questions for companies like Google, Microsoft, or TCS. Try clicking on our 'Mock Interview' tab to practice with tailored questions and answers!`;
    } else if (query.includes('eligibility') || query.includes('eligible') || query.includes('probability')) {
      reply = `Your placement eligibility depends on meeting CGPA cutoffs, backlog limits, and branch restrictions set by recruiters. Check out the 'Roadmap to Eligibility' tab on your dashboard to see how to improve your probability score!`;
    } else if (query.includes('certification') || query.includes('course')) {
      reply = `Adding industry certifications will boost your resume. For software roles, I recommend AWS Certified Solutions Architect, Google Cloud Associate Developer, or Certified Kubernetes Administrator (CKA).`;
    } else if (query.includes('api')) {
      reply = `An API (Application Programming Interface) allows different software applications to communicate with each other. In placement preparation, expect questions on REST vs GraphQL, HTTP methods (GET, POST, PUT, DELETE), status codes (2xx, 4xx, 5xx), and security (JWT, OAuth).`;
    } else if (query.includes('react') || query.includes('javascript') || query.includes('frontend')) {
      reply = `For frontend roles, be prepared to explain React Virtual DOM reconciliation, Hooks rules, State Management models (Redux, Context API), asynchronous event loops, and asset bundle loading optimizations.`;
    } else if (query.includes('database') || query.includes('sql') || query.includes('mongodb')) {
      reply = `Database structures are crucial. Expect questions on JOIN operations, indexing performance, ACID transaction properties, normalization levels, and the trade-offs of relational databases vs NoSQL.`;
    } else if (query.includes('finance') || query.includes('valuation') || query.includes('dcf')) {
      reply = `For finance placement rounds, focus on financial modeling, Discounted Cash Flow (DCF) valuation, three-statement analysis (Income Statement, Balance Sheet, Cash Flow), WACC calculations, and corporate valuation multiples.`;
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
    const department = profile?.department || 'Computer Science';

    const isFinance = 
      department.toLowerCase().includes('finance') || 
      department.toLowerCase().includes('business') || 
      department.toLowerCase().includes('management') || 
      skills.some(s => s.toLowerCase().includes('finance') || s.toLowerCase().includes('accounting') || s.toLowerCase().includes('valuation')) ||
      (profile?.resumeAnalysis?.summary && (
        profile.resumeAnalysis.summary.toLowerCase().includes('finance') ||
        profile.resumeAnalysis.summary.toLowerCase().includes('accounting') ||
        profile.resumeAnalysis.summary.toLowerCase().includes('investment') ||
        profile.resumeAnalysis.summary.toLowerCase().includes('portfolio')
      ));

    const finalRole = isFinance ? 'Financial Analyst' : role;
    const finalCompany = isFinance ? 'Investment Bank & Financial Services' : company;

    const questionsPool = [
      {
        question: `Explain the relationship between the Income Statement, Balance Sheet, and Cash Flow Statement. How does a $10 increase in depreciation affect all three?`,
        expectedAnswerHint: `Depreciation reduces net income by $10 (or $6-$8 after tax). Net income flows into Retained Earnings on the Balance Sheet. On the Cash Flow statement, depreciation is added back to Operating Cash Flow. Cash goes up by $2-$4, balancing the assets/liabilities.`,
        difficulty: 'Hard' as const,
        tags: ['finance', 'accounting', 'financial statements', 'valuation'],
        departments: ['Finance', 'Management', 'Business']
      },
      {
        question: `Walk me through a Discounted Cash Flow (DCF) valuation. How do you calculate Free Cash Flow, and how do you determine the discount rate (WACC)?`,
        expectedAnswerHint: `Calculate Unlevered FCF from EBIT * (1-Tax Rate) + D&A - CapEx - Change in Net Working Capital. Discount using WACC (Weighted Average Cost of Capital), which is the weighted average of cost of debt and cost of equity (CAPM).`,
        difficulty: 'Hard' as const,
        tags: ['finance', 'valuation', 'dcf', 'corporate finance'],
        departments: ['Finance', 'Management', 'Business']
      },
      {
        question: `What is Net Working Capital? What does it mean if a company has negative working capital, and is it always a bad sign?`,
        expectedAnswerHint: `Net Working Capital = Current Assets - Current Liabilities. Negative working capital can mean a company is highly efficient (like Amazon or Apple) with high inventory turnover and customer payment speed, or that it is struggling to pay short-term debts.`,
        difficulty: 'Medium' as const,
        tags: ['finance', 'working capital', 'corporate finance', 'accounting'],
        departments: ['Finance', 'Management', 'Business']
      },
      {
        question: `What is the difference between debt and equity financing? Under what circumstances would a firm prefer debt over equity to optimize its capital structure?`,
        expectedAnswerHint: `Debt is cheaper because interest is tax-deductible and doesn't dilute ownership, but it adds leverage risk. Equity dilutes ownership but has no repayment schedule. A firm prefers debt if cash flows are highly stable and predictable.`,
        difficulty: 'Medium' as const,
        tags: ['finance', 'capital structure', 'corporate finance'],
        departments: ['Finance', 'Management', 'Business']
      },
      {
        question: `Explain the concept of portfolio diversification and Modern Portfolio Theory. What is the difference between systematic and unsystematic risk?`,
        expectedAnswerHint: `Diversification reduces unsystematic risk (specific to a company/industry) by holding non-correlated assets. Systematic risk (market-wide risk, like inflation or interest rates) cannot be diversified away and is measured by Beta.`,
        difficulty: 'Easy' as const,
        tags: ['finance', 'portfolio', 'risk management', 'investment'],
        departments: ['Finance', 'Management', 'Business']
      },
      {
        question: `Explain the Time Value of Money (TVM) concept. How do you calculate Net Present Value (NPV) and Internal Rate of Return (IRR) for capital budgeting?`,
        expectedAnswerHint: `TVM states a dollar today is worth more than a dollar tomorrow. NPV discounts future cash flows back to today using WACC and subtracts initial investment. IRR is the discount rate at which NPV equals zero.`,
        difficulty: 'Easy' as const,
        tags: ['finance', 'tvm', 'npv', 'irr', 'budgeting'],
        departments: ['Finance', 'Management', 'Business']
      },
      {
        question: `How do you handle asynchronous operations in JavaScript, and what is the difference between Promises and async/await?`,
        expectedAnswerHint: `Async/await is syntactic sugar over Promises. Under the hood, it returns a Promise and uses generators. Await pauses the execution of async function, making code read synchronously while keeping runtime non-blocking.`,
        difficulty: 'Medium' as const,
        tags: ['javascript', 'promises', 'async', 'web', 'react', 'node.js'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Describe a complex project you built. What architectural challenges did you face and how did you optimize its performance?`,
        expectedAnswerHint: `Highlight technical choices (e.g., using React state, indexing in databases, memoization hooks, lazy loading, and caching). Use numbers (e.g., 'reduced load time by 40%').`,
        difficulty: 'Hard' as const,
        tags: ['system design', 'performance', 'architecture', 'react', 'node.js', 'mongodb', 'postgresql', 'spring boot'],
        departments: ['Computer Science', 'Information Technology', 'Electronics & Communication']
      },
      {
        question: `Explain how REST APIs differ from GraphQL, and when would you choose one over the other for a university placement portal?`,
        expectedAnswerHint: `REST has defined endpoints with fixed schemas. GraphQL allows client-defined queries preventing over-fetching. GraphQL is great for dashboards with multiple components rendering distinct parts of data.`,
        difficulty: 'Medium' as const,
        tags: ['rest', 'graphql', 'api', 'web', 'node.js', 'express'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `What are React hooks, and what rules must you follow when creating or using custom hooks?`,
        expectedAnswerHint: `Hooks let you use state and lifecycle features in functional components. Rules: 1. Only call hooks at the top level (not inside loops or conditions). 2. Only call hooks from React function components or custom hooks.`,
        difficulty: 'Easy' as const,
        tags: ['react', 'hooks', 'frontend', 'javascript', 'typescript'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `How would you secure a MERN stack application against common security vulnerabilities like XSS, CSRF, and SQL/NoSQL Injection?`,
        expectedAnswerHint: `Use Helmet for security headers, express-rate-limit to block DDoS, sanitize inputs using validation libraries like Zod/Mongoose schemas, and enforce HttpOnly cookies for session storage.`,
        difficulty: 'Hard' as const,
        tags: ['security', 'mern', 'xss', 'csrf', 'backend', 'node.js', 'express', 'mongodb'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Explain the difference between a Docker image and a container. How does containerization differ from traditional hypervisor-based virtualization?`,
        expectedAnswerHint: `A Docker image is a read-only template with instructions for creating a container. A container is a runnable instance of an image. Containerization shares the host OS kernel, making it lightweight compared to VMs.`,
        difficulty: 'Medium' as const,
        tags: ['docker', 'containers', 'devops', 'kubernetes', 'aws'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Describe the core components of the Kubernetes control plane and node agent, and how they interact to maintain pod state.`,
        expectedAnswerHint: `Control plane includes kube-apiserver, etcd, kube-scheduler, and kube-controller-manager. Nodes run kubelet (agent) and kube-proxy. Kubelet monitors pod specs from apiserver and ensures container health.`,
        difficulty: 'Hard' as const,
        tags: ['kubernetes', 'devops', 'cloud', 'docker'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `When designing a database schema, how do you decide between a relational database (like PostgreSQL) and a non-relational database (like MongoDB)?`,
        expectedAnswerHint: `Use relational databases for structured data requiring ACID compliance, complex joins, and strict schema. Use NoSQL for unstructured/semi-structured data, high horizontal scalability, and rapid dev cycles.`,
        difficulty: 'Medium' as const,
        tags: ['sql', 'nosql', 'databases', 'mongodb', 'postgresql', 'mysql'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `What is database indexing? Explain the difference between clustered and non-clustered indexes and how they affect query execution time.`,
        expectedAnswerHint: `Indexing is a data structure technique to optimize search speed. Clustered index defines the physical order of data storage (one per table). Non-clustered index is a separate structure pointing to physical rows.`,
        difficulty: 'Hard' as const,
        tags: ['databases', 'indexing', 'performance', 'sql', 'postgresql', 'mysql', 'mongodb'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Explain how a hash map works internally. What is collision resolution, and what are the time complexity bounds in the average and worst cases?`,
        expectedAnswerHint: `Hash map uses a hash function to map keys to bucket indices. Collisions are handled via chaining (linked lists/trees) or open addressing. Average time complexity is O(1) for lookup/insert; worst case is O(n).`,
        difficulty: 'Medium' as const,
        tags: ['dsa', 'algorithms', 'hashmap', 'data structures', 'java', 'c++', 'python'],
        departments: ['Computer Science', 'Information Technology', 'Electronics & Communication']
      },
      {
        question: `How does a load balancer work? Describe different load balancing algorithms and how you would design a system to handle sudden traffic spikes.`,
        expectedAnswerHint: `Load balancer distributes incoming traffic across servers. Algorithms include Round Robin, Least Connections, and IP Hash. Handle spikes via horizontal scaling, auto-scaling groups, and CDN caching.`,
        difficulty: 'Hard' as const,
        tags: ['system design', 'load balancing', 'scalability', 'architecture', 'aws'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Explain the concept of Dependency Injection in Spring Boot. What is the difference between constructor injection and field injection?`,
        expectedAnswerHint: `DI is a design pattern where dependencies are provided rather than hardcoded. Constructor injection is preferred because it allows immutability, facilitates unit testing, and prevents null pointer issues.`,
        difficulty: 'Medium' as const,
        tags: ['java', 'spring boot', 'backend', 'dependency injection'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `What is the difference between a process and a thread in Java? Explain thread safety and the volatile keyword.`,
        expectedAnswerHint: `A process is an independent executing program with its own memory. A thread is a path of execution within a process sharing memory. Volatile ensures variable updates are visible across threads immediately.`,
        difficulty: 'Hard' as const,
        tags: ['java', 'multithreading', 'concurrency', 'threads'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `What is the Global Interpreter Lock (GIL) in Python? How does it affect multithreaded applications and what are ways to bypass it?`,
        expectedAnswerHint: `GIL is a mutex preventing multiple native threads from executing Python bytecodes at once. It limits CPU-bound multithreading. Bypass via multiprocessing, using alternative interpreters (Jython), or C extensions.`,
        difficulty: 'Hard' as const,
        tags: ['python', 'gil', 'concurrency', 'multithreading'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `What is overfitting in machine learning models? Explain techniques like regularization, cross-validation, and pruning to prevent it.`,
        expectedAnswerHint: `Overfitting occurs when a model learns noise in training data instead of general patterns. Prevent via L1/L2 regularization, K-fold cross-validation, pruning decision trees, or adding dropout layers.`,
        difficulty: 'Medium' as const,
        tags: ['python', 'machine learning', 'data science', 'ai', 'tensorflow', 'pytorch'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `What is an Interrupt Service Routine (ISR) in embedded C, and what constraints must be followed when writing an ISR?`,
        expectedAnswerHint: `ISR is a callback function called when an interrupt occurs. Constraints: Keep it short, avoid dynamic memory allocation, do not use blocking operations (like sleep/printf), and declare shared variables volatile.`,
        difficulty: 'Hard' as const,
        tags: ['embedded', 'c', 'interrupts', 'electronics', 'microcontrollers'],
        departments: ['Electronics & Communication']
      },
      {
        question: `Compare MQTT and HTTP protocols for resource-constrained IoT devices. When would you use MQTT over HTTP?`,
        expectedAnswerHint: `MQTT is light, publish-subscribe, and uses minimal header overhead (2 bytes), ideal for low bandwidth/unstable networks. HTTP is request-response and heavier. Use MQTT for continuous real-time telemetry.`,
        difficulty: 'Medium' as const,
        tags: ['iot', 'mqtt', 'http', 'protocols', 'electronics', 'networks'],
        departments: ['Electronics & Communication']
      },
      {
        question: `Explain the difference between Finite Element Analysis (FEA) and Computational Fluid Dynamics (CFD) in mechanical testing.`,
        expectedAnswerHint: `FEA simulates physical structural behaviors (stress, strain, deformation) under forces. CFD simulates fluid flow, heat transfer, and aerodynamic forces on structures. Both use numerical discretization techniques.`,
        difficulty: 'Hard' as const,
        tags: ['cad', 'fea', 'cfd', 'mechanical', 'simulation'],
        departments: ['Mechanical Engineering']
      },
      {
        question: `State the Second Law of Thermodynamics and describe its significance in internal combustion engines and power cycles.`,
        expectedAnswerHint: `Total entropy of an isolated system always increases over time. No engine can be 100% efficient; some heat must be rejected to a low-temperature sink, imposing the Carnot efficiency limit on power cycles.`,
        difficulty: 'Medium' as const,
        tags: ['thermodynamics', 'engines', 'mechanical', 'energy'],
        departments: ['Mechanical Engineering']
      },
      {
        question: `Explain the difference between git merge and git rebase. When would you prefer one over the other in a collaborative team setting?`,
        expectedAnswerHint: `Git merge combines branches preserving complete historical commits and merge nodes. Git rebase moves/applies commits on top of another base tip, creating a flat linear history. Rebase is great for clean feature PRs.`,
        difficulty: 'Easy' as const,
        tags: ['git', 'version control', 'collaboration'],
        departments: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering']
      },
      {
        question: `How would you implement rate limiting in a backend API? Describe different algorithms like Token Bucket, Leaky Bucket, and Fixed Window.`,
        expectedAnswerHint: `Rate limiting protects API endpoints. Token Bucket allows bursts by storing tokens. Leaky Bucket smooths request rates. Fixed window tracks request count in a timeline chunk, simple but has boundary spikes.`,
        difficulty: 'Hard' as const,
        tags: ['rate limiting', 'security', 'api', 'backend', 'node.js', 'express'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `What is Redux, and what are the three core principles of Redux state management? Contrast Redux with React's Context API.`,
        expectedAnswerHint: `Redux is a predictable state container. Principles: 1. Single source of truth. 2. State is read-only. 3. Changes are made with pure functions. Context API is for prop drilling; Redux is optimized for high-frequency updates.`,
        difficulty: 'Medium' as const,
        tags: ['redux', 'react', 'context', 'state management', 'javascript', 'typescript'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Explain the storage classes in Amazon S3 (Simple Storage Service) and how you would design a lifecycle policy to optimize storage costs.`,
        expectedAnswerHint: `Classes: Standard (frequent access), Infrequent Access (IA), Glacier (archival). Optimize by transitioning uploaded files (e.g. resumes older than 6 months) to IA and then to Glacier after 1 year.`,
        difficulty: 'Easy' as const,
        tags: ['aws', 's3', 'cloud', 'devops'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Compare synchronous (REST/gRPC) and asynchronous (Message Queues/Event Buses) communication patterns in a microservice architecture.`,
        expectedAnswerHint: `Synchronous blocks execution until response returns (ideal for read queries). Asynchronous decouples services using brokers (RabbitMQ/Kafka) (ideal for write transactions or heavy background jobs).`,
        difficulty: 'Medium' as const,
        tags: ['microservices', 'communication', 'grpc', 'rest', 'architecture', 'system design'],
        departments: ['Computer Science', 'Information Technology']
      },
      {
        question: `Explain the key architectural differences between CSS Flexbox and CSS Grid. When is Flexbox preferred over Grid?`,
        expectedAnswerHint: `Flexbox is 1-dimensional (rows OR columns), aligning items dynamically. Grid is 2-dimensional (rows AND columns). Flexbox is preferred for simple layouts (like navigation menus or single rows).`,
        difficulty: 'Easy' as const,
        tags: ['css', 'flexbox', 'grid', 'frontend', 'html/css', 'tailwind'],
        departments: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering']
      }
    ];

    // Compute relevance scores for each question based on student department and skills
    const scored = questionsPool.map(q => {
      let score = 0;
      // Match department
      if (q.departments.includes(department)) {
        score += 10;
      }
      // Match skills
      const skillMatches = q.tags.filter(tag =>
        skills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(skill.toLowerCase()))
      );
      score += skillMatches.length * 5;

      return { questionObj: q, score };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.score - a.score);

    // Take top 12 relevant questions to choose from
    const topQuestions = scored.slice(0, 12).map(item => item.questionObj);

    // Shuffle topQuestions
    const shuffled = [...topQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Select the first 5 questions
    const fallbackQuestions = shuffled.slice(0, 5);

    let questions = fallbackQuestions;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!isMockKey(apiKey)) {
      try {
        const model = getGeminiModel(apiKey);
        if (model) {
          const interviewerPersona = isFinance 
            ? `Chief Financial Officer (CFO) and Lead Investment Director at ${finalCompany}` 
            : `Lead Software Architect and Technical Interviewer at ${finalCompany}`;

          const prompt = `You are a ${interviewerPersona}.
          Generate 5 standard interview questions for a ${finalRole} position.
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
