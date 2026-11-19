import type { AchievementDefinition, CareerPath, ReadinessWeights, SkillThresholds } from '../types/student';

export const DEFAULT_WEIGHTS: ReadinessWeights = {
  technicalSkills: 45,
  projectExperience: 20,
  academicPerformance: 10,
  interviewPerformance: 15,
  learningConsistency: 10,
};

export const DEFAULT_THRESHOLDS: SkillThresholds = {
  goodMin: 75,
  moderateMin: 50,
  careerReadyMilestone: 75,
};

export const DEFAULT_CAREER_PATHS: CareerPath[] = [
  {
    id: 'java-developer',
    title: 'Java Developer',
    tagline: 'Enterprise backend services, JVM architecture, and resilient REST APIs',
    description:
      'Designs, develops, and maintains scalable backend applications using Java, Spring Boot, relational databases, and strong computer science fundamentals.',
    averageExperienceTrack: 'Campus Placement · SDE-1 / Associate Java Engineer',
    requiredSkills: [
      { name: 'Core Java', requiredScore: 90, importance: 'High', weight: 3, category: 'Language' },
      { name: 'Object-Oriented Programming', requiredScore: 85, importance: 'High', weight: 3, category: 'Architecture' },
      { name: 'Data Structures & Algorithms', requiredScore: 85, importance: 'High', weight: 3, category: 'CS Fundamentals' },
      { name: 'SQL', requiredScore: 85, importance: 'High', weight: 2.5, category: 'Database' },
      { name: 'Spring Boot', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Framework' },
      { name: 'JDBC', requiredScore: 75, importance: 'Medium', weight: 2, category: 'Database' },
      { name: 'Git & GitHub', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Tooling' },
      { name: 'Problem Solving', requiredScore: 80, importance: 'High', weight: 2, category: 'CS Fundamentals' },
      { name: 'Technical Interview Skills', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Career' },
    ],
    suggestedProjects: [
      'RESTful E-Commerce Order & Inventory Engine (Spring Boot + PostgreSQL + JWT)',
      'University Student Management System with Role-Based Access & JPA',
      'Library Circulation & Fine Tracking Service with Caching',
    ],
    learningRecommendations: [
      'Master arrays, strings, linked lists, trees, and graph traversals in Java',
      'Build multi-table SQL joins, indexing, and transaction isolation fluency',
      'Create a Spring Boot REST API with validation, DTO mapping, and unit tests',
    ],
    interviewTopics: ['Core Java', 'OOP', 'Collections', 'Exception Handling', 'Multithreading', 'SQL', 'DSA'],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    tagline: 'Business intelligence, SQL analytics, statistical storytelling, and dashboards',
    description:
      'Transforms raw operational and product datasets into actionable insights using SQL, Python, statistical analysis, spreadsheets, and interactive BI dashboards.',
    averageExperienceTrack: 'Campus Placement · Junior Data / Business Analyst',
    requiredSkills: [
      { name: 'SQL', requiredScore: 90, importance: 'High', weight: 3, category: 'Database' },
      { name: 'Python', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Language' },
      { name: 'Excel', requiredScore: 85, importance: 'High', weight: 2.5, category: 'Analytics' },
      { name: 'Statistics', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Math' },
      { name: 'Pandas', requiredScore: 80, importance: 'High', weight: 2, category: 'Data Library' },
      { name: 'NumPy', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Data Library' },
      { name: 'Power BI', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Visualization' },
      { name: 'Data Visualization', requiredScore: 80, importance: 'High', weight: 2, category: 'Visualization' },
      { name: 'Analytical Thinking', requiredScore: 85, importance: 'High', weight: 2, category: 'Career' },
    ],
    suggestedProjects: [
      'SaaS Customer Churn & Cohort Retention Dashboard (SQL + Power BI)',
      'Retail Sales Forecasting & Anomaly Detection Notebook (Python + Pandas)',
      'Campus Placement Trend Explorer with Statistical Hypothesis Testing',
    ],
    learningRecommendations: [
      'Practice window functions, CTEs, and cohort queries in SQL',
      'Build clean exploratory data notebooks using Pandas and NumPy',
      'Design executive KPI dashboards in Power BI with clear narratives',
    ],
    interviewTopics: ['SQL', 'Excel', 'Python', 'Statistics', 'Data Visualization', 'Business Analytics'],
  },
  {
    id: 'python-developer',
    title: 'Python Developer',
    tagline: 'Backend APIs, automation pipelines, FastAPI/Django services, and scripting',
    description:
      'Builds maintainable backend services, microservices, automation tooling, and data-processing APIs using modern Python ecosystems.',
    averageExperienceTrack: 'Campus Placement · Python Backend / Automation Engineer',
    requiredSkills: [
      { name: 'Python', requiredScore: 90, importance: 'High', weight: 3, category: 'Language' },
      { name: 'Data Structures & Algorithms', requiredScore: 80, importance: 'High', weight: 3, category: 'CS Fundamentals' },
      { name: 'Object-Oriented Programming', requiredScore: 80, importance: 'High', weight: 2, category: 'Architecture' },
      { name: 'FastAPI / Django', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Framework' },
      { name: 'SQL', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Database' },
      { name: 'REST API Design', requiredScore: 80, importance: 'High', weight: 2, category: 'Architecture' },
      { name: 'Git & GitHub', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Tooling' },
      { name: 'Automated Testing (Pytest)', requiredScore: 70, importance: 'Medium', weight: 1.5, category: 'Quality' },
    ],
    suggestedProjects: [
      'Async Student Analytics Microservice using FastAPI, Pandas, and Docker',
      'Automated Resume Parser & Skill Matcher REST API',
      'Multi-Tenant Task Scheduler with Django REST Framework & Celery',
    ],
    learningRecommendations: [
      'Write idiomatic typed Python with Pydantic schemas and Pytest coverage',
      'Master FastAPI dependency injection, async IO, and SQLAlchemy ORM',
      'Strengthen algorithmic problem-solving speed in Python',
    ],
    interviewTopics: ['Core Python', 'OOP', 'FastAPI & Django', 'SQL', 'DSA', 'Async & Concurrency'],
  },
  {
    id: 'full-stack-developer',
    title: 'Full Stack Developer',
    tagline: 'End-to-end web engineering across React, TypeScript, APIs, and databases',
    description:
      'Delivers complete web applications from responsive user interfaces and state management to secure REST APIs, authentication, and cloud deployment.',
    averageExperienceTrack: 'Campus Placement · Full Stack Software Engineer',
    requiredSkills: [
      { name: 'JavaScript / TypeScript', requiredScore: 85, importance: 'High', weight: 3, category: 'Language' },
      { name: 'React.js', requiredScore: 85, importance: 'High', weight: 3, category: 'Frontend' },
      { name: 'Node.js & Express', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Backend' },
      { name: 'SQL', requiredScore: 80, importance: 'High', weight: 2, category: 'Database' },
      { name: 'HTML & CSS / Tailwind', requiredScore: 80, importance: 'Medium', weight: 2, category: 'Frontend' },
      { name: 'Data Structures & Algorithms', requiredScore: 75, importance: 'High', weight: 2.5, category: 'CS Fundamentals' },
      { name: 'REST API Design', requiredScore: 80, importance: 'High', weight: 2, category: 'Architecture' },
      { name: 'Git & GitHub', requiredScore: 80, importance: 'Medium', weight: 1.5, category: 'Tooling' },
    ],
    suggestedProjects: [
      'Real-Time Collaborative Study Board with Auth & Role Permissions',
      'Campus Placement Portal with Resume Tracker & Analytics Dashboard',
      'Full-Stack SaaS Expense Splitter with TypeScript & PostgreSQL',
    ],
    learningRecommendations: [
      'Build type-safe React + TypeScript interfaces connected to Express APIs',
      'Understand JWT/OAuth security, CORS, validation, and database indexing',
      'Deploy full-stack projects with CI/CD pipelines and clean READMEs',
    ],
    interviewTopics: ['JavaScript & TypeScript', 'React', 'Node.js & Express', 'SQL & NoSQL', 'System Design Basics', 'DSA'],
  },
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    tagline: 'Accessible interfaces, React architecture, performance, and design systems',
    description:
      'Crafts responsive, accessible, and high-performance client applications with modern JavaScript, TypeScript, CSS architecture, and component design systems.',
    averageExperienceTrack: 'Campus Placement · Frontend / UI Engineer',
    requiredSkills: [
      { name: 'JavaScript / TypeScript', requiredScore: 90, importance: 'High', weight: 3, category: 'Language' },
      { name: 'React.js', requiredScore: 85, importance: 'High', weight: 3, category: 'Frontend' },
      { name: 'HTML & CSS / Tailwind', requiredScore: 85, importance: 'High', weight: 2.5, category: 'Frontend' },
      { name: 'Web Accessibility & Performance', requiredScore: 75, importance: 'Medium', weight: 2, category: 'Quality' },
      { name: 'State Management & APIs', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Frontend' },
      { name: 'Git & GitHub', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Tooling' },
      { name: 'Data Structures & Algorithms', requiredScore: 70, importance: 'Medium', weight: 1.5, category: 'CS Fundamentals' },
    ],
    suggestedProjects: [
      'Accessible Component Design System & Interactive Documentation Site',
      'Interactive Financial Analytics Dashboard with Keyboard Navigation',
      'Offline-First Study Planner SPA with State Persistence',
    ],
    learningRecommendations: [
      'Deepen JavaScript event loop, closures, promises, and TypeScript generics',
      'Audit Core Web Vitals, bundle splitting, and WCAG AA accessibility',
      'Practice machine-coding UI rounds under time constraints',
    ],
    interviewTopics: ['JavaScript Fundamentals', 'React Hooks & Rendering', 'CSS & Responsive Layout', 'TypeScript', 'Web Performance'],
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    tagline: 'Distributed APIs, relational modeling, security, and high-throughput systems',
    description:
      'Architects reliable server-side systems, database schemas, authentication flows, caching strategies, and scalable microservices.',
    averageExperienceTrack: 'Campus Placement · Backend Engineer',
    requiredSkills: [
      { name: 'Core Java', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Language' },
      { name: 'SQL', requiredScore: 90, importance: 'High', weight: 3, category: 'Database' },
      { name: 'Data Structures & Algorithms', requiredScore: 85, importance: 'High', weight: 3, category: 'CS Fundamentals' },
      { name: 'REST API Design', requiredScore: 85, importance: 'High', weight: 2.5, category: 'Architecture' },
      { name: 'Spring Boot', requiredScore: 80, importance: 'High', weight: 2.5, category: 'Framework' },
      { name: 'System Design Basics', requiredScore: 75, importance: 'High', weight: 2, category: 'Architecture' },
      { name: 'Git & GitHub', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Tooling' },
    ],
    suggestedProjects: [
      'Rate-Limited URL Shortener & Analytics Engine with Redis Caching',
      'Distributed Job Queue & Webhook Notification Service',
      'Role-Based Academic Records API with Audit Logging',
    ],
    learningRecommendations: [
      'Master SQL normalization, query plans, transactions, and ACID guarantees',
      'Study authentication patterns, rate limiting, and horizontal scaling',
      'Practice low-level object design and high-level API design questions',
    ],
    interviewTopics: ['API Design', 'Databases & SQL', 'System Design', 'Security & Auth', 'DSA', 'Concurrency'],
  },
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    tagline: 'Core CS algorithms, systems programming, clean OOP, and engineering rigor',
    description:
      'Solves general-purpose engineering problems with strong mastery of algorithms, operating systems, DBMS, object-oriented design, and software testing.',
    averageExperienceTrack: 'Campus Placement · Software Development Engineer (SDE-1)',
    requiredSkills: [
      { name: 'Data Structures & Algorithms', requiredScore: 90, importance: 'High', weight: 3, category: 'CS Fundamentals' },
      { name: 'Core Java', requiredScore: 85, importance: 'High', weight: 2.5, category: 'Language' },
      { name: 'Object-Oriented Programming', requiredScore: 85, importance: 'High', weight: 2.5, category: 'Architecture' },
      { name: 'SQL', requiredScore: 80, importance: 'High', weight: 2, category: 'Database' },
      { name: 'Operating Systems & DBMS', requiredScore: 80, importance: 'High', weight: 2, category: 'CS Fundamentals' },
      { name: 'Problem Solving', requiredScore: 85, importance: 'High', weight: 2.5, category: 'CS Fundamentals' },
      { name: 'Git & GitHub', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Tooling' },
      { name: 'Technical Interview Skills', requiredScore: 80, importance: 'High', weight: 2, category: 'Career' },
    ],
    suggestedProjects: [
      'Custom In-Memory Key-Value Store with Snapshot Persistence',
      'Multi-Threaded Log Aggregator & Query CLI',
      'Full-Stack Issue Tracker with Clean Architecture & Automated Tests',
    ],
    learningRecommendations: [
      'Solve medium-to-hard DSA problems across graphs, DP, trees, and heaps',
      'Review OS processes, deadlocks, memory paging, and DBMS indexing',
      'Practice explaining time/space trade-offs clearly in mock interviews',
    ],
    interviewTopics: ['DSA', 'OOP & LLD', 'OS & DBMS', 'SQL', 'Problem Solving', 'Behavioral & Projects'],
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    tagline: 'Machine learning models, experimentation, Python pipelines, and statistics',
    description:
      'Designs predictive models, feature engineering pipelines, and statistical experiments to solve complex quantitative problems.',
    averageExperienceTrack: 'Campus Placement · Junior Data Scientist / ML Analyst',
    requiredSkills: [
      { name: 'Python', requiredScore: 90, importance: 'High', weight: 3, category: 'Language' },
      { name: 'Statistics', requiredScore: 85, importance: 'High', weight: 3, category: 'Math' },
      { name: 'Machine Learning', requiredScore: 85, importance: 'High', weight: 3, category: 'ML' },
      { name: 'Pandas', requiredScore: 85, importance: 'High', weight: 2.5, category: 'Data Library' },
      { name: 'NumPy', requiredScore: 80, importance: 'High', weight: 2, category: 'Data Library' },
      { name: 'SQL', requiredScore: 80, importance: 'High', weight: 2, category: 'Database' },
      { name: 'Data Visualization', requiredScore: 75, importance: 'Medium', weight: 1.5, category: 'Visualization' },
      { name: 'Analytical Thinking', requiredScore: 85, importance: 'High', weight: 2, category: 'Career' },
    ],
    suggestedProjects: [
      'Student Dropout Risk Prediction Model with SHAP Explainability',
      'NLP Course Review Sentiment Classifier Deployed via FastAPI',
      'Time-Series Demand Forecaster with Cross-Validation Benchmarks',
    ],
    learningRecommendations: [
      'Master probability distributions, hypothesis testing, and evaluation metrics',
      'Build reproducible scikit-learn pipelines with leak-free validation',
      'Practice explaining bias-variance trade-offs and feature importance',
    ],
    interviewTopics: ['Machine Learning', 'Statistics & Probability', 'Python & Pandas', 'SQL', 'Model Evaluation', 'Case Studies'],
  },
];

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  {
    code: 'FIRST_STEP',
    title: 'First Step',
    description: 'Completed your student profile and onboarding setup.',
    criteria: 'Complete personal, academic, and career goal profile details.',
    iconName: 'UserCheck',
  },
  {
    code: 'SKILL_EXPLORER',
    title: 'Skill Explorer',
    description: 'Tracked at least five technical skills in your skill inventory.',
    criteria: 'Add 5 or more technical skills to My Skills.',
    iconName: 'Layers',
  },
  {
    code: 'PROJECT_BUILDER',
    title: 'Project Builder',
    description: 'Shipped and logged a completed technical project.',
    criteria: 'Mark at least 1 project with status "Completed".',
    iconName: 'FolderCheck',
  },
  {
    code: 'CONSISTENT_LEARNER',
    title: 'Consistent Learner',
    description: 'Sustained qualifying learning activities across 7 distinct days.',
    criteria: 'Log completed learning activities on 7 or more unique days.',
    iconName: 'Flame',
  },
  {
    code: 'INTERVIEW_STARTER',
    title: 'Interview Starter',
    description: 'Completed your first AI-evaluated mock interview session.',
    criteria: 'Finish and save at least 1 mock interview.',
    iconName: 'MessageSquareCheck',
  },
  {
    code: 'SKILL_IMPROVER',
    title: 'Skill Improver',
    description: 'Demonstrated measurable growth in an assessed technical skill.',
    criteria: 'Improve an assessment score compared to a previous assessment.',
    iconName: 'TrendingUp',
  },
  {
    code: 'ROADMAP_FINISHER',
    title: 'Roadmap Finisher',
    description: 'Completed every milestone in a personalized learning roadmap.',
    criteria: 'Mark 100% of tasks in an active learning roadmap as completed.',
    iconName: 'MapPinCheck',
  },
  {
    code: 'CAREER_READY',
    title: 'Career Ready',
    description: 'Reached your configurable career readiness milestone score.',
    criteria: 'Achieve an indicative Career Readiness Score >= configured milestone.',
    iconName: 'Award',
  },
];
