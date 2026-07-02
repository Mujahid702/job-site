export interface HiringRound {
  name: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tips: string;
}

export interface OAQuestion {
  id: string;
  type: "aptitude" | "logical" | "coding" | "verbal" | "mcq";
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface QuestionBankItem {
  id: string;
  category: string;
  type: "Technical" | "HR" | "Behavioral" | "Managerial";
  question: string;
  answer: string;
}

export interface StudentExperience {
  id: string;
  student: string;
  role: string;
  year: string;
  outcome: "Selected" | "Rejected";
  story: string;
}

export interface RoadmapStep {
  skillName: string;
  whyItMatters: string;
  estimatedTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  priority: "High" | "Medium" | "Low";
}

export interface RoadmapStage {
  stageName: string;
  stageIndex: number;
  steps: RoadmapStep[];
}

export interface ResourceItem {
  title: string;
  url: string;
  type: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface ProjectRecommendation {
  title: string;
  desc: string;
  impactScore: number;
  recruiterAttractionScore: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  portfolioValue: "Low" | "Medium" | "High";
}

export interface PlanPeriod {
  dailyTasks: string[];
  weeklyTasks: string[];
  monthlyGoals: string[];
}

export interface TrackPreset {
  requiredSkills: string[];
  careerReadinessReport: {
    overview: string;
    resumeDiagnostics: string;
    interviewFeedback: string;
    portfolioFeedback: string;
  };
  readinessPredictions: {
    interviewReadiness: number;
    placementReadiness: number;
    industryReadiness: number;
  };
  stages: RoadmapStage[];
  resources: ResourceItem[];
  projects: ProjectRecommendation[];
  plan306090: {
    plan30Day: PlanPeriod;
    plan60Day: PlanPeriod;
    plan90Day: PlanPeriod;
  };
}

export const TRACK_PRESETS: Record<string, TrackPreset> = {
  "Software Engineer": {
    requiredSkills: [
      "Data Structures & Algorithms", "Java", "Python", "JavaScript", "TypeScript", "SQL Schema Design", "OOP Principles", "REST APIs", "Git", "React", "Docker"
    ],
    careerReadinessReport: {
      overview: "Your profile exhibits good foundations in general programming but needs structured system design, microservices, containerization, and advanced algorithms optimization to clear tier-1 hiring rounds.",
      resumeDiagnostics: "Strong frontend skills detected. However, backend schema normalizations, caching, and CI/CD pipelines are missing. Add project metrics detailing throughput or query performance improvements.",
      interviewFeedback: "Average mock interview score is 60%. Conceptual DSA answers are correct, but coding speed and complexity analysis need improvement. Practice voice articulation.",
      portfolioFeedback: "Recommend adding a high-throughput transactional backend or distributed cache service to showcase backend complexity."
    },
    readinessPredictions: { interviewReadiness: 65, placementReadiness: 60, industryReadiness: 68 },
    stages: [
      {
        stageName: "Stage 1: Foundation",
        stageIndex: 1,
        steps: [
          { skillName: "Object-Oriented Programming (OOP)", whyItMatters: "Mandatory for writing clean, structured code in technical interview trials.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
          { skillName: "Database Normalization & SQL Queries", whyItMatters: "Crucial for writing optimal schemas and index joins.", estimatedTime: "1.5 Weeks", difficulty: "Beginner", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: Core Tech Stack",
        stageIndex: 2,
        steps: [
          { skillName: "Node.js & Express REST APIs", whyItMatters: "Standard for backend routing and web services.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "React State Management", whyItMatters: "Required for creating premium, responsive client dashboards.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 3: Systems & Docker",
        stageIndex: 3,
        steps: [
          { skillName: "Docker Containerization", whyItMatters: "Guarantees reliable local environments translate directly to cloud platforms.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "Medium" },
          { skillName: "Distributed Caching (Redis)", whyItMatters: "Demonstrates advanced low-latency backend design concepts.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "High" }
        ]
      },
      {
        stageName: "Stage 4: Coding Test Prep",
        stageIndex: 4,
        steps: [
          { skillName: "DSA Trees & Graphs", whyItMatters: "Highly targeted topics for technical screening rounds in top tier companies.", estimatedTime: "3 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "System Design (LLD/HLD)", whyItMatters: "Crucial for engineering architectural design interviews.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 5: Placement Ready",
        stageIndex: 5,
        steps: [
          { skillName: "Behavioral STAR Stories", whyItMatters: "Essential to pass managerial culture checks and HR partner evaluations.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
          { skillName: "ATS-Scanned Resumes", whyItMatters: "Improves your placement shortlisting percentage across bulk hiring drives.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" }
        ]
      }
    ],
    resources: [
      { title: "React Official Docs & Quickstart Guide", url: "https://react.dev/reference/react", type: "Documentation", difficulty: "Beginner" },
      { title: "SQL Schema Design & Indexing Best Practices", url: "https://sqlbolt.com/", type: "Interactive Platform", difficulty: "Beginner" },
      { title: "System Design Primer GitHub Repository", url: "https://github.com/donnemartin/system-design-primer", type: "GitHub Guide", difficulty: "Advanced" },
      { title: "Interactive Roadmap: Developer Learning Paths", url: "https://roadmap.sh/", type: "Roadmap Article", difficulty: "Intermediate" },
      { title: "LeetCode Top Interview 150 Coding List", url: "https://leetcode.com/studyplan/top-interview-150/", type: "Practice Platform", difficulty: "Advanced" }
    ],
    projects: [
      { title: "Real-time Collaborative Whiteboard", desc: "Interactive canvas app with sub-second WebSocket synchronization, state rollback, and user presence nodes.", impactScore: 85, recruiterAttractionScore: 80, difficulty: "Intermediate", portfolioValue: "Medium" },
      { title: "Distributed Flash Sale API Service", desc: "High-throughput checkout backend featuring Redis inventory locks and Kafka queuing to handle thousands of requests per second.", impactScore: 96, recruiterAttractionScore: 94, difficulty: "Advanced", portfolioValue: "High" },
      { title: "LaTeX ATS Resume Generator", desc: "Dashboard enabling developers to customize PDF resumes using JSON templates and latex schemas.", impactScore: 72, recruiterAttractionScore: 70, difficulty: "Beginner", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Solve 1 SQL database query", "Practice 1 OOP method override code", "Write 1 node.js backend endpoint"],
        weeklyTasks: ["Solve 3 Easy DSA Array problems", "Implement local express session management"],
        monthlyGoals: ["Master SQL joins, database normalizations, and REST API controllers setup"]
      },
      plan60Day: {
        dailyTasks: ["Configure a custom Dockerfile", "Solve 1 Medium Heap/Stack DSA problem", "Review standard LLD patterns"],
        weeklyTasks: ["Deploy server container configs to sandbox registry", "Record 1 mock voice interview simulation"],
        monthlyGoals: ["Construct a full-stack Dockerized application integrated with relational database models"]
      },
      plan90Day: {
        dailyTasks: ["Study Redis write-through caching schemes", "Solve 1 Graph traversal problem", "Tailor CV keywords against live Job Listings"],
        weeklyTasks: ["Resolve 1 full System Design mock question", "Run a complete simulated recruiter technical mock test"],
        monthlyGoals: ["Complete all profile criteria checks to reach placement ready status"]
      }
    }
  },
  "Frontend Developer": {
    requiredSkills: [
      "HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "Redux", "Web Performance Optimization", "Git", "REST APIs"
    ],
    careerReadinessReport: {
      overview: "Excellent client UI design foundations. Needs focused training on complex state managers, Next.js hydration cycles, and Core Web Vitals optimizations.",
      resumeDiagnostics: "Strong JS/React keywords. However, missing modular CSS patterns, headless UI setups, performance diagnostics, and client-side testing modules (Jest/RTL).",
      interviewFeedback: "Average mock interview score is 65%. Clear on virtual DOM mechanics, but gets stuck on concurrency issues, hook dependencies, and server component concepts.",
      portfolioFeedback: "Recommend building a complex dashboard application featuring advanced layouts, interactive grids, and client-side caching to showcase state management depth."
    },
    readinessPredictions: { interviewReadiness: 68, placementReadiness: 62, industryReadiness: 70 },
    stages: [
      {
        stageName: "Stage 1: JavaScript & CSS Pro",
        stageIndex: 1,
        steps: [
          { skillName: "Advanced JS Engine (Closures, Event Loop)", whyItMatters: "Crucial for writing bug-free UI code and solving frontend conceptual rounds.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Modern CSS Architecture & Flexbox/Grid", whyItMatters: "Foundation for building highly responsive, pixel-perfect UI layouts.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: React Core & State",
        stageIndex: 2,
        steps: [
          { skillName: "React Hooks Deep Dive", whyItMatters: "Required for state synchronization, side effects handling, and custom hooks.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" },
          { skillName: "Global State Management (Redux/Zustand)", whyItMatters: "Essential for handling shared state in large scale dashboards.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 3: Next.js & Performance",
        stageIndex: 3,
        steps: [
          { skillName: "Next.js App Router (SSR & RSC)", whyItMatters: "Modern standard for building high-performance server-rendered React applications.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "Core Web Vitals & Webpack Optimizations", whyItMatters: "Guarantees low LCP/FID metrics, boosting SEO and recruiter attraction.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 4: Testing & Web Security",
        stageIndex: 4,
        steps: [
          { skillName: "Frontend Unit Testing (Jest & React Testing Library)", whyItMatters: "Shows production-grade quality code standard to tier-1 recruiters.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "Medium" },
          { skillName: "Web Security Basics (CORS, XSS, CSRF)", whyItMatters: "Protects frontend layouts from standard browser vulnerabilities.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 5: Portfolio Polish",
        stageIndex: 5,
        steps: [
          { skillName: "Tailwind UI Components Library Setup", whyItMatters: "Showcases clean modular interface styling and design token systems.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
          { skillName: "Portfolio Optimization & Web Performance Audit", whyItMatters: "Guarantees a premium first impression when recruiters view your work live.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" }
        ]
      }
    ],
    resources: [
      { title: "MDN Web Docs - JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", type: "Documentation", difficulty: "Beginner" },
      { title: "Next.js App Router Official Course", url: "https://nextjs.org/learn", type: "Interactive Platform", difficulty: "Intermediate" },
      { title: "Frontend Masters - Deep JS Learning Tracks", url: "https://frontendmasters.com/", type: "Course Platform", difficulty: "Advanced" },
      { title: "Framer Motion Animation Guide Docs", url: "https://www.framer.com/motion/", type: "Documentation", difficulty: "Intermediate" }
    ],
    projects: [
      { title: "Premium SaaS Analytics Board", desc: "Interactive drag-and-drop dashboard featuring recharts visualizations, custom widget layouts, and persistent Zustand configurations.", impactScore: 88, recruiterAttractionScore: 85, difficulty: "Intermediate", portfolioValue: "Medium" },
      { title: "Performance-Optimized Next.js e-Commerce", desc: "Server-side rendered storefront featuring static pre-rendering, image optimization modules, and integrated Stripe payments.", impactScore: 95, recruiterAttractionScore: 92, difficulty: "Advanced", portfolioValue: "High" },
      { title: "Tailwind CSS Component Builder", desc: "Interactive playground allowing developers to preview and copy modern glassmorphism tailwind button layouts.", impactScore: 70, recruiterAttractionScore: 68, difficulty: "Beginner", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Solve 1 JS scoping/closure puzzle", "Style 1 responsive flexbox grid layout", "Refactor 1 React hook dependencies"],
        weeklyTasks: ["Build 1 stateless UI element using Tailwind", "Implement custom error boundary in React app"],
        monthlyGoals: ["Master clean ES6+ coding patterns, responsive CSS layout, and basic custom hooks creation"]
      },
      plan60Day: {
        dailyTasks: ["Study Redux middleware setup", "Optimize 1 Next.js image loading component", "Write 1 Jest component unit test"],
        weeklyTasks: ["Build global search controller with Zustand", "Audit site score using Google Lighthouse"],
        monthlyGoals: ["Construct a Next.js multipage site integrated with global client-side state managers"]
      },
      plan90Day: {
        dailyTasks: ["Study HTTP caching headers (Cache-Control)", "Configure cross-origin resource sharing routes", "Deploy site to Vercel production branch"],
        weeklyTasks: ["Add Jest tests to cover 80% code branches", "Run full visual audits on mobile screen widths"],
        monthlyGoals: ["Complete frontend performance adjustments and deploy premium responsive showcase portfolio"]
      }
    }
  },
  "Backend Developer": {
    requiredSkills: [
      "Node.js", "Express", "Python", "Go", "SQL Databases (PostgreSQL)", "NoSQL (MongoDB)", "REST APIs", "gRPC", "Docker", "Redis", "Kafka", "Git", "Security Basics"
    ],
    careerReadinessReport: {
      overview: "Capable backend syntax foundations, but missing deep database optimization, message queues integration, secure middleware logic, and container architectures.",
      resumeDiagnostics: "Detected databases: MySQL. However, missing database indexing diagnostics, connection pool details, Redis caching layers, and gRPC routing definitions.",
      interviewFeedback: "Average mock interview score is 55%. Struggling on scale bottlenecks, transaction locking mechanisms, concurrency models, and system normalizations.",
      portfolioFeedback: "Must construct a high-concurrency background engine featuring worker pools, caching pipelines, and rate-limiters to stand out in backend drives."
    },
    readinessPredictions: { interviewReadiness: 60, placementReadiness: 55, industryReadiness: 65 },
    stages: [
      {
        stageName: "Stage 1: DB Normalization & SQL",
        stageIndex: 1,
        steps: [
          { skillName: "PostgreSQL & Schema Normalization", whyItMatters: "Ensures secure, query-optimal data models are implemented for enterprise backends.", estimatedTime: "1.5 Weeks", difficulty: "Beginner", priority: "High" },
          { skillName: "SQL Indexes & Transaction Locking", whyItMatters: "Mandatory to prevent data race conditions and optimize querying performance.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: Web APIs & Middleware",
        stageIndex: 2,
        steps: [
          { skillName: "Node.js/Go Web APIs & Middleware", whyItMatters: "Base framework for constructing transactional routes, validation checks, and secure loggers.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Web Security (JWT, CORS, SSL, Hashing)", whyItMatters: "Crucial for securing private data assets and preventing API vulnerabilities.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 3: Caching & Message Queues",
        stageIndex: 3,
        steps: [
          { skillName: "Redis Caching Strategies", whyItMatters: "Enables low-latency backend responses and avoids overloading core databases.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "Kafka / RabbitMQ Message Brokers", whyItMatters: "Key to decoupling services and implementing async processing pipelines.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "High" }
        ]
      },
      {
        stageName: "Stage 4: Infrastructure & Container",
        stageIndex: 4,
        steps: [
          { skillName: "Docker Container Configurations", whyItMatters: "Allows modular, reproducible deployments of database microservices.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "Medium" },
          { skillName: "gRPC & API Gateways", whyItMatters: "Enables fast, serialized communication inside backend microservice hubs.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 5: Scale Audits & Deploy",
        stageIndex: 5,
        steps: [
          { skillName: "Load Testing & DB Optimizations", whyItMatters: "Shows scalability metrics to prospective tech reviewers.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "High" },
          { skillName: "CI/CD & Cloud Deployments (AWS/GCP)", whyItMatters: "Automates tests checking and handles cloud virtual routing release.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "High" }
        ]
      }
    ],
    resources: [
      { title: "PostgreSQL Tutorial - Basic to Advanced SQL", url: "https://www.postgresqltutorial.com/", type: "Interactive Platform", difficulty: "Beginner" },
      { title: "Go Programming Language official tutorial", url: "https://go.dev/tour/", type: "Documentation", difficulty: "Intermediate" },
      { title: "Pragmatic System Design - Scalable Pipelines", url: "https://roadmap.sh/system-design", type: "Roadmap Article", difficulty: "Advanced" },
      { title: "Redis University - Free Cache Course Modules", url: "https://university.redis.com/", type: "Course Platform", difficulty: "Advanced" }
    ],
    projects: [
      { title: "Multi-tenant SaaS API Gateway", desc: "Express/Go gateway routing requests featuring JWT authentication, Redis rate-limiting blocks, and dynamic CORS configurations.", impactScore: 92, recruiterAttractionScore: 88, difficulty: "Intermediate", portfolioValue: "Medium" },
      { title: "Scalable Event-driven Notification Engine", desc: "Microservices engine decoupling transactional alerts through Kafka event pipelines, Node.js workers, and MongoDB metrics collections.", impactScore: 98, recruiterAttractionScore: 95, difficulty: "Advanced", portfolioValue: "High" },
      { title: "Mock Database Query Profiler Tool", desc: "Node script checking postgres query execution plans (EXPLAIN ANALYZE) and automatically proposing target index suggestions.", impactScore: 78, recruiterAttractionScore: 75, difficulty: "Intermediate", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Write 1 SQL query with subqueries", "Inspect 1 postgres query explain plan", "Build 1 JWT validation middleware"],
        weeklyTasks: ["Implement database connection pooling", "Write 1 integration test for API endpoint"],
        monthlyGoals: ["Master SQL schema normalizations, indexing tactics, and secure token-based routing modules"]
      },
      plan60Day: {
        dailyTasks: ["Implement 1 Redis get/set cache layer", "Publish 1 message to local Kafka broker", "Write 1 Dockerfile multi-stage configuration"],
        weeklyTasks: ["Deploy 1 Redis cache instance to Docker container", "Solve 1 Medium Heap/Queue LeetCode challenge"],
        monthlyGoals: ["Build decoupled backend engines utilizing containerized database models and asynchronous brokers"]
      },
      plan90Day: {
        dailyTasks: ["Profile 1 API endpoint load latency", "Define 1 basic Protobuf gRPC service schema", "Configure pipeline test routines on GitHub Actions"],
        weeklyTasks: ["Deploy mock gateway microservice on AWS EC2", "Run a complete simulated recruiter system design screen"],
        monthlyGoals: ["Complete backend latency optimizations, load tests diagnostics, and deploy database API gateway"]
      }
    }
  },
  "AI Engineer": {
    requiredSkills: [
      "Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Deep Learning", "Transformers (HuggingFace)", "Vector Databases (Pinecone/Chroma)", "LLMs API Tuning", "LangChain", "Git", "SQL"
    ],
    careerReadinessReport: {
      overview: "Proficient Python foundations. Needs strong mathematical modeling, vector databases integrations, fine-tuning structures, and scalable LLM inference optimizations.",
      resumeDiagnostics: "Strong Python/ML algorithms keywords. However, missing retrieval-augmented generation (RAG) metrics, vector search details, pipeline scale benchmarks, and model latency data.",
      interviewFeedback: "Average mock interview score is 58%. Struggles on backpropagation algebra, transformer attention math, vector similarity metrics, and scaling model endpoints.",
      portfolioFeedback: "Recommend building an advanced RAG chatbot or fine-tuning a small model on a custom dataset, detailing optimization steps and context windows."
    },
    readinessPredictions: { interviewReadiness: 62, placementReadiness: 56, industryReadiness: 66 },
    stages: [
      {
        stageName: "Stage 1: Python, NumPy & Math",
        stageIndex: 1,
        steps: [
          { skillName: "Linear Algebra & Probability for ML", whyItMatters: "Baseline math required to pass AI technical screening and modeling interviews.", estimatedTime: "1.5 Weeks", difficulty: "Beginner", priority: "High" },
          { skillName: "Data Operations (NumPy & Pandas)", whyItMatters: "Core libraries for cleansing and structuring training/inference data.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: ML Models & Scikit",
        stageIndex: 2,
        steps: [
          { skillName: "Supervised & Unsupervised Learning", whyItMatters: "Classical algorithms models form the basis of predictive analytics tasks.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Model Evaluation & Feature Tuning", whyItMatters: "Essential for debugging overfitting, metric metrics (F1, AUC), and bias.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 3: Deep Learning & PyTorch",
        stageIndex: 3,
        steps: [
          { skillName: "Deep Neural Networks (PyTorch)", whyItMatters: "Standard framework for constructing custom computer vision or NLP networks.", estimatedTime: "3 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "Transformer Attention Mechanisms", whyItMatters: "Required to understand how modern generative LLMs process sequence tasks.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "High" }
        ]
      },
      {
        stageName: "Stage 4: Generative AI & Vector OS",
        stageIndex: 4,
        steps: [
          { skillName: "Vector Databases & Semantic Search", whyItMatters: "Required for retrieval-augmented generation chatbots and semantic search.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "LangChain & LLM Agent Orchestration", whyItMatters: "Industry standard toolset for building complex AI applications and API agents.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 5: Model Deployment & API",
        stageIndex: 5,
        steps: [
          { skillName: "FastAPI Model Endpoints", whyItMatters: "Enables local models to expose clean routes for client web apps integration.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "Medium" },
          { skillName: "MLOps Basics (DVC, MLflow)", whyItMatters: "Shows production-grade model versioning capability to tech reviewers.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "Medium" }
        ]
      }
    ],
    resources: [
      { title: "Machine Learning Course by Andrew Ng", url: "https://www.coursera.org/specializations/machine-learning-introduction", type: "Free Course", difficulty: "Beginner" },
      { title: "Deep Learning Specialization Series", url: "https://www.deeplearning.ai/", type: "Course Platform", difficulty: "Intermediate" },
      { title: "PyTorch Official Interactive Tutorial Tracks", url: "https://pytorch.org/tutorials/", type: "Documentation", difficulty: "Intermediate" },
      { title: "Hugging Face NLP Transformer Course", url: "https://huggingface.co/learn/nlp-course", type: "Interactive Platform", difficulty: "Advanced" }
    ],
    projects: [
      { title: "Dynamic RAG Document Advisor", desc: "Semantic chatbot indexing pdf manuals using HuggingFace sentence embeddings, Chroma vector store, and Gemini API inference routes.", impactScore: 94, recruiterAttractionScore: 92, difficulty: "Advanced", portfolioValue: "High" },
      { title: "Customer Sentiment Pipeline Engine", desc: "Python pipeline fine-tuning DistilBERT on customer feedback datasets, logging metrics in MLflow, and deploying endpoint routes via FastAPI.", impactScore: 90, recruiterAttractionScore: 86, difficulty: "Intermediate", portfolioValue: "Medium" },
      { title: "Predictive Analytics House Pricing Engine", desc: "Scikit-Learn regression model comparing Lasso, Ridge, and XGBoost models to optimize price predictions.", impactScore: 75, recruiterAttractionScore: 72, difficulty: "Beginner", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Implement 1 NumPy array operation", "Calculate 1 matrix dot product math", "Write 1 Pandas data filtering script"],
        weeklyTasks: ["Train 1 linear regression using Scikit", "Perform 1 cross-validation model audit"],
        monthlyGoals: ["Master basic ML algorithms, feature extraction metrics, and classical model audits"]
      },
      plan60Day: {
        dailyTasks: ["Write 1 PyTorch loss function optimizer", "Configure 1 custom training loop", "Study transformer self-attention calculations"],
        weeklyTasks: ["Build 1 basic multi-layer perceptron neural net", "Train local dataset NLP model with PyTorch"],
        monthlyGoals: ["Finish deep learning networks training, model evaluation logs, and transformer concepts review"]
      },
      plan90Day: {
        dailyTasks: ["Index 1 document section in Chroma DB", "Build 1 FastAPI ML router endpoint", "Tune LLM system temperature metrics"],
        weeklyTasks: ["Deploy 1 RAG chatbot model on local sandbox port", "Profile model inference request response times"],
        monthlyGoals: ["Deploy generative AI RAG application, set FastAPI server endpoints, and optimize inference latency"]
      }
    }
  },
  "Data Scientist": {
    requiredSkills: [
      "Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Statistics & Probability", "A/B Testing", "Data Warehousing", "Machine Learning models", "Matplotlib"
    ],
    careerReadinessReport: {
      overview: "Good analytical foundations. Needs focused predictive stats modeling, quantitative A/B testing validations, database clustering setups, and advanced ML model architectures.",
      resumeDiagnostics: "Strong SQL/Pandas keywords. However, missing details on A/B testing statistical calculations, machine learning pipelines, and validation significance metrics.",
      interviewFeedback: "Average mock interview score is 62%. Clear on data cleaning, but struggles on statistics (hypothesis checks), mathematical ML derivatives, and SQL window operations.",
      portfolioFeedback: "Recommend adding a telecom customer churn predictive analytics project or dashboard layout displaying A/B test results and statistical significance."
    },
    readinessPredictions: { interviewReadiness: 66, placementReadiness: 60, industryReadiness: 64 },
    stages: [
      {
        stageName: "Stage 1: Advanced Statistics & SQL",
        stageIndex: 1,
        steps: [
          { skillName: "Probability, Hypothesis Checks & p-values", whyItMatters: "Mandatory mathematical baseline for validating data models and passing interviews.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "SQL Window Functions & Indexing", whyItMatters: "Essential for executing fast rows and partitions analysis queries.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: Core Machine Learning",
        stageIndex: 2,
        steps: [
          { skillName: "Supervised ML Regression & Classification", whyItMatters: "Core structures to train algorithms predicting numeric values or group labels.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Unsupervised Clustering & PCA", whyItMatters: "Key to identify segment groups and reduce dimensionality in high-feature datasets.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 3: A/B Testing & Significance",
        stageIndex: 3,
        steps: [
          { skillName: "A/B Testing significance calculations", whyItMatters: "Standard product metrics framework to evaluate new feature performance.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "Exploratory Data Analysis (EDA) libraries", whyItMatters: "Visualizing relationships using Seaborn and Matplotlib before model fitting.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" }
        ]
      },
      {
        stageName: "Stage 4: Data Warehousing & Scale",
        stageIndex: 4,
        steps: [
          { skillName: "Data Warehousing (Snowflake / BigQuery)", whyItMatters: "Required for querying large volumes of enterprise data logs.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "Medium" },
          { skillName: "Feature Store Setup", whyItMatters: "Saves ML pipeline computation costs by sharing processed feature pools.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "Low" }
        ]
      },
      {
        stageName: "Stage 5: Deployment & BI integration",
        stageIndex: 5,
        steps: [
          { skillName: "FastAPI Model Servers", whyItMatters: "Serves real-time model predictions via standard REST request formats.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "Tableau Integration & Dashboarding", whyItMatters: "Publishes analytics results to business stakeholder portals.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "Medium" }
        ]
      }
    ],
    resources: [
      { title: "Practical Statistics for Data Scientists Guide", url: "https://www.oreilly.com/library/view/practical-statistics-for/9781492072935/", type: "Documentation", difficulty: "Intermediate" },
      { title: "Kaggle Learning Paths - Intro to Machine Learning", url: "https://www.kaggle.com/learn", type: "Interactive Platform", difficulty: "Beginner" },
      { title: "Scikit-Learn Algorithms Mapping & User Guide Docs", url: "https://scikit-learn.org/stable/user_guide.html", type: "Documentation", difficulty: "Intermediate" },
      { title: "SQL Window Functions for Advanced Analytics", url: "https://mode.com/sql-tutorial/sql-window-functions/", type: "Interactive Platform", difficulty: "Intermediate" }
    ],
    projects: [
      { title: "Telecom Customer Churn Predictor", desc: "Python pipeline training RandomForest classifier models, profiling feature importance, and creating FastAPI routes.", impactScore: 92, recruiterAttractionScore: 88, difficulty: "Intermediate", portfolioValue: "High" },
      { title: "A/B Testing Impact Dashboard", desc: "Interactive Streamlit site executing z-score significance checks, p-value calculations, and visualizing success confidence grids.", impactScore: 95, recruiterAttractionScore: 90, difficulty: "Advanced", portfolioValue: "High" },
      { title: "Store Sales Time-Series Forecaster", desc: "TimeSeries prediction engine utilizing Facebook Prophet models to predict seasonal sales demand logs.", impactScore: 78, recruiterAttractionScore: 75, difficulty: "Intermediate", portfolioValue: "Medium" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Solve 1 complex SQL window partitioning query", "Calculate p-value for 1 sample set", "Study star schema database tables"],
        weeklyTasks: ["Audit 1 query join explain path", "Write 1 hypothesis checking code script"],
        monthlyGoals: ["Master SQL window operations, data warehousing structures, and statistical significance math"]
      },
      plan60Day: {
        dailyTasks: ["Profile Scikit classifier features", "Build Seaborn correlation charts", "Implement Lasso regularization scripts"],
        weeklyTasks: ["Optimize Scikit hyperparameters via grid-search", "Deploy a simple Streamlit interface online"],
        monthlyGoals: ["Master classical machine learning training models, exploratory graph analysis, and basic hosting sandboxes"]
      },
      plan90Day: {
        dailyTasks: ["Expose model API routes via FastAPI", "Configure 1 model metrics chart in Tableau", "Refine business insight slide deck summaries"],
        weeklyTasks: ["Deploy FastAPI model server inside Docker local instance", "Run a complete simulated recruiter analytics interview screen"],
        monthlyGoals: ["Deploy predictive analytics ML pipeline, integrate with Tableau dashboards, and outline business impact report"]
      }
    }
  },
  "Data Analyst": {
    requiredSkills: [
      "SQL", "Excel (VLOOKUP, Pivot Tables)", "Tableau", "Power BI", "Python (Pandas)", "Data Visualization", "Statistics Basics", "Data Cleaning", "Information Architecture"
    ],
    careerReadinessReport: {
      overview: "Strong visual mapping and basic query capabilities. Needs advanced SQL analytical scripting, robust database joins, and enterprise BI dashboard architectures.",
      resumeDiagnostics: "Strong Excel and SQL query keywords. However, missing complex window partitioning calculations, dimensional star schemas, and automated visual data updates.",
      interviewFeedback: "Average mock interview score is 65%. Clear on standard database queries, but gets stuck on SQL joins optimization, cohort calculations, and KPI mapping logic.",
      portfolioFeedback: "Must construct a multi-page Tableau dashboard reporting cohort retention and customer lifetime value (LTV) metrics for a business scenario."
    },
    readinessPredictions: { interviewReadiness: 68, placementReadiness: 62, industryReadiness: 60 },
    stages: [
      {
        stageName: "Stage 1: Advanced SQL for Analytics",
        stageIndex: 1,
        steps: [
          { skillName: "SQL Window Functions (ROW_NUMBER, LEAD/LAG)", whyItMatters: "Mandatory for cohort analysis, active user checks, and time-over-time metrics.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Common Table Expressions (CTEs) & Joins", whyItMatters: "Ensures clean, readable query scripts for processing complex multi-table databases.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: Excel & Data Cleaning",
        stageIndex: 2,
        steps: [
          { skillName: "Excel Pivot Tables & Power Query", whyItMatters: "Industry baseline tools to cleanse raw spreadsheets and prepare quick reports.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
          { skillName: "Python Pandas Data Cleansing", whyItMatters: "Enables fast, automated manipulation of messy csv files.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 3: Business Intelligence (BI) Tools",
        stageIndex: 3,
        steps: [
          { skillName: "Tableau/Power BI calculations & DAX", whyItMatters: "Essential to write custom data metrics and build interactive dashboard filters.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Dashboard Information Architecture", whyItMatters: "Ensures charts are organized logically, allowing stakeholders to draw fast insights.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 4: Practical Statistics & KPI",
        stageIndex: 4,
        steps: [
          { skillName: "Statistics Basics (Mean, Variance, Correlation)", whyItMatters: "Ensures your reporting dashboards do not misrepresent data trends.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
          { skillName: "Business KPI Definition & Mapping", whyItMatters: "Aligns analytical reporting charts directly with corporate growth metrics (ROI, LTV, Churn).", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 5: Data Reporting",
        stageIndex: 5,
        steps: [
          { skillName: "Data Storytelling & Executive Summaries", whyItMatters: "Translates technical chart metrics into clear business action recommendations.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "Medium" },
          { skillName: "Automated Data Pipelines (Airflow / Cron)", whyItMatters: "Enables dashboards to load fresh data dynamically without manual imports.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "Low" }
        ]
      }
    ],
    resources: [
      { title: "Mode Analytics - Interactive SQL Tutorial", url: "https://mode.com/sql-tutorial/", type: "Interactive Platform", difficulty: "Beginner" },
      { title: "Tableau Training - Free Video Learning Library", url: "https://www.tableau.com/learn/training", type: "Course Platform", difficulty: "Beginner" },
      { title: "Power BI DAX Formulas Official Guide", url: "https://learn.microsoft.com/en-us/dax/", type: "Documentation", difficulty: "Intermediate" },
      { title: "Pandas Data Cleaning Cookbook Guides", url: "https://pandas.pydata.org/docs/user_guide/index.html", type: "Documentation", difficulty: "Intermediate" }
    ],
    projects: [
      { title: "E-Commerce User Cohort Dashboard", desc: "Multi-page Power BI dashboard parsing SQL transactions database to chart user retention, cohort drop-offs, and monthly customer values.", impactScore: 90, recruiterAttractionScore: 86, difficulty: "Intermediate", portfolioValue: "High" },
      { title: "HR Recruitment & KPI Tracker", desc: "Interactive Tableau dashboard reporting application source metrics, funnel interview conversion percentages, and time-to-hire logs.", impactScore: 84, recruiterAttractionScore: 80, difficulty: "Beginner", portfolioValue: "Medium" },
      { title: "SaaS Financial Performance Analyzer", desc: "Python script importing subscription logs, performing cleaning via Pandas, and calculating MRR and churn metrics.", impactScore: 78, recruiterAttractionScore: 75, difficulty: "Intermediate", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Solve 1 SQL partitioning exercise", "Style 1 nested CTE query", "Revise 1 Excel VLOOKUP syntax"],
        weeklyTasks: ["Build 1 pivot table summary page", "Write 1 complex multi-table SQL JOIN query"],
        monthlyGoals: ["Master advanced analytical queries in SQL, CTE structures, and Excel data cleaning methods"]
      },
      plan60Day: {
        dailyTasks: ["Practice 1 Pandas dataframe merge", "Configure 1 DAX custom calculated column", "Perform a data import in Tableau"],
        weeklyTasks: ["Design 1 Tableau chart sheet layout", "Write a python script cleaning null database records"],
        monthlyGoals: ["Build custom metrics calculations in Power BI, clean dataset using Pandas, and prepare initial Tableau grids"]
      },
      plan90Day: {
        dailyTasks: ["Verify dashboard contrast readability", "Check LTV and churn metrics calculations", "Draft executive summary slides outline"],
        weeklyTasks: ["Publish multi-page dashboard to Power BI service", "Run a complete simulated recruiter BI analyst technical interview screen"],
        monthlyGoals: ["Deploy e-commerce user cohort retention dashboard, write business summaries report, and optimize visual load times"]
      }
    }
  },
  "Cloud Engineer": {
    requiredSkills: [
      "AWS", "GCP", "Linux CLI", "Terraform (IaC)", "Docker", "Kubernetes", "CI/CD Pipelines (GitHub Actions/Jenkins)", "Bash Scripting", "Networking (VPC, DNS, Load Balancers)", "Python", "Prometheus"
    ],
    careerReadinessReport: {
      overview: "Good scripting capabilities. Needs structured infrastructure-as-code (Terraform), complex networking configs (VPC, CIDR blocks), container orchestration, and centralized logging systems.",
      resumeDiagnostics: "Detected AWS. However, missing details on Terraform layouts, Kubernetes clusters scaling, VPC routing rules, pipeline security checks, and metrics monitoring.",
      interviewFeedback: "Average mock interview score is 58%. Struggling on VPC subnet configurations, multi-container Docker routing, Kubernetes pod configurations, and ingress gateways.",
      portfolioFeedback: "Recommend deploying an infrastructure-as-code repository setting up high-availability VPC networks with containerized load balancers."
    },
    readinessPredictions: { interviewReadiness: 62, placementReadiness: 56, industryReadiness: 68 },
    stages: [
      {
        stageName: "Stage 1: Linux & Scripting Foundations",
        stageIndex: 1,
        steps: [
          { skillName: "Linux System Admin & Bash CLI", whyItMatters: "Mandatory baseline for managing remote virtual servers and script task routines.", estimatedTime: "1.5 Weeks", difficulty: "Beginner", priority: "High" },
          { skillName: "Networking basics (VPC, Subnets, DNS)", whyItMatters: "Crucial for designing secure isolated networks and server routes.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: Core Cloud (AWS/GCP)",
        stageIndex: 2,
        steps: [
          { skillName: "Virtual Instances & Storage (EC2, S3, IAM)", whyItMatters: "Base services for routing application deployments and managing user permissions.", estimatedTime: "2 Weeks", difficulty: "Beginner", priority: "High" },
          { skillName: "Load Balancers & Auto-Scaling Groups", whyItMatters: "Guarantees virtual applications scale smoothly under high traffic loads.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 3: Infrastructure as Code (IaC)",
        stageIndex: 3,
        steps: [
          { skillName: "Terraform IaC Configurations", whyItMatters: "Allows developers to declare cloud architecture in simple config files.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Centralized Monitoring (Prometheus & Grafana)", whyItMatters: "Crucial to monitor container health and server usage profiles.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 4: Container Orchestration",
        stageIndex: 4,
        steps: [
          { skillName: "Docker Containerization", whyItMatters: "Base package standard for modern scalable microservice deployment patterns.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" },
          { skillName: "Kubernetes Cluster Architecture", whyItMatters: "Standard tool to automate pod setups, routing nodes, and horizontal scaling.", estimatedTime: "3 Weeks", difficulty: "Advanced", priority: "High" }
        ]
      },
      {
        stageName: "Stage 5: CI/CD & Security",
        stageIndex: 5,
        steps: [
          { skillName: "GitHub Actions / Jenkins Pipelines", whyItMatters: "Automates lint checks, testing, and continuous cloud deployments.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "IAM Policies & Cloud Compliance Rules", whyItMatters: "Essential for securing cloud assets against data breaches.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "High" }
        ]
      }
    ],
    resources: [
      { title: "Linux Command Line Cheat Sheet Docs", url: "https://www.linux.org/pages/download/", type: "Documentation", difficulty: "Beginner" },
      { title: "AWS Cloud Practitioner Training Guide", url: "https://aws.amazon.com/training/digital/", type: "Course Platform", difficulty: "Beginner" },
      { title: "Terraform up and running tutorials", url: "https://learn.hashicorp.com/terraform", type: "Interactive Platform", difficulty: "Intermediate" },
      { title: "Kubernetes Interactive Sandbox Academy", url: "https://kubernetes.io/docs/tutorials/", type: "Practice Platform", difficulty: "Advanced" }
    ],
    projects: [
      { title: "High-Availability VPC with Terraform", desc: "Terraform files setting up multi-region VPC subnets, application load balancers, EC2 auto-scaling groups, and secure security rules.", impactScore: 94, recruiterAttractionScore: 90, difficulty: "Advanced", portfolioValue: "High" },
      { title: "CI/CD Deployment pipeline using Docker", desc: "GitHub Actions pipeline validating code, building Docker images, logging to registry, and updating remote server endpoints.", impactScore: 90, recruiterAttractionScore: 88, difficulty: "Intermediate", portfolioValue: "Medium" },
      { title: "Centralized Prometheus/Grafana Board", desc: "Docker-compose file launching node-exporter logs, Prometheus monitors, and Grafana status dashboards.", impactScore: 78, recruiterAttractionScore: 75, difficulty: "Intermediate", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Solve 1 Bash script scripting task", "Configure 1 custom AWS security group", "Set up 1 isolated local subnet path"],
        weeklyTasks: ["Deploy 1 node server on AWS EC2", "Write 1 shell script monitoring disk space"],
        monthlyGoals: ["Master Linux terminal administration, VPC network routing, and basic IAM security rules"]
      },
      plan60Day: {
        dailyTasks: ["Write 1 Terraform resource statement", "Dockerize 1 sample python application", "Create 1 Grafana metric chart"],
        weeklyTasks: ["Deploy Terraform config building local network", "Configure Prometheus monitoring for Docker instance"],
        monthlyGoals: ["Construct infrastructure architecture layouts using Terraform and build active Prometheus diagnostic reports"]
      },
      plan90Day: {
        dailyTasks: ["Configure 1 Kubernetes deployment pod", "Define 1 automated GitHub Actions build rule", "Verify network security policies config"],
        weeklyTasks: ["Launch multi-pod application on local minikube set", "Solve 1 mock cloud systems scaling question"],
        monthlyGoals: ["Build automated CI/CD continuous deployment pipeline releasing container projects on active cloud systems"]
      }
    }
  },
  "UI/UX Designer": {
    requiredSkills: [
      "Figma", "User Research", "Wireframing", "Prototyping", "Design Systems", "Information Architecture", "Heuristic Evaluation", "UI Design Principles", "Adobe Creative Suite"
    ],
    careerReadinessReport: {
      overview: "Talented visual layout abilities. Needs focused training on user research analytics, accessibility compliance (WCAG), detailed prototyping flows, and design system tokens.",
      resumeDiagnostics: "Strong visual/Figma tools keywords. However, missing details on heuristic evaluation metrics, user testing research cases, web accessibility audits, and design handoff steps.",
      interviewFeedback: "Average mock interview score is 60%. Conceptual layout design is clean, but struggles on case study walkthroughs, user research testing logs, and developer handoff steps.",
      portfolioFeedback: "Recommend adding a detailed mobile app UX case study outlining user research methods, persona charts, wireframes, and design system grids."
    },
    readinessPredictions: { interviewReadiness: 65, placementReadiness: 58, industryReadiness: 62 },
    stages: [
      {
        stageName: "Stage 1: UI Principles & Typography",
        stageIndex: 1,
        steps: [
          { skillName: "Visual Hierarchy & Layout Grids", whyItMatters: "Mandatory base to arrange content elements cleanly and guide user focus.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" },
          { skillName: "Typography & Harmonious Color Palettes", whyItMatters: "Crucial for writing legible components and establishing strong design identity.", estimatedTime: "1 Week", difficulty: "Beginner", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: User Research & Persona",
        stageIndex: 2,
        steps: [
          { skillName: "User Interview & Survey Methods", whyItMatters: "Required to understand user pain points and ground layouts in actual needs.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Persona Mapping & User Journey Charts", whyItMatters: "Translates survey feedback data into clear step-by-step design paths.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 3: Wireframing & Prototyping",
        stageIndex: 3,
        steps: [
          { skillName: "Low-Fidelity Sketching & Wireframes", whyItMatters: "Enables designers to iterate layout options quickly before building details.", estimatedTime: "1.5 Weeks", difficulty: "Beginner", priority: "High" },
          { skillName: "High-Fidelity Prototyping (Figma)", whyItMatters: "Core skill to construct interactive, clickable app layouts showing transitions.", estimatedTime: "2.5 Weeks", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 4: Design Systems & Handover",
        stageIndex: 4,
        steps: [
          { skillName: "Figma Components & Auto Layout", whyItMatters: "Enables developers to match clean grid dimensions and reuse visual items.", estimatedTime: "2 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Developer Design Handoff Protocols", whyItMatters: "Ensures seamless translation of visual screens into clean code structures.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 5: Testing & WCAG Compliance",
        stageIndex: 5,
        steps: [
          { skillName: "Heuristic Evaluation & User Testing", whyItMatters: "Audits design usability issues before publishing final releases.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "Web Accessibility (WCAG 2.1) Audits", whyItMatters: "Ensures visual layouts are accessible for low-vision and assistive users.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "High" }
        ]
      }
    ],
    resources: [
      { title: "Nielsen Norman Group - UX Articles", url: "https://www.nngroup.com/articles/", type: "Documentation", difficulty: "Beginner" },
      { title: "Figma Official Typography & Layout Guide", url: "https://help.figma.com/hc/en-us", type: "Documentation", difficulty: "Beginner" },
      { title: "Interaction Design Foundation Free Lessons", url: "https://www.interaction-design.org/literature", type: "Course Platform", difficulty: "Intermediate" },
      { title: "Web Accessibility WCAG Checklist Guides", url: "https://www.w3.org/WAI/WCAG21/quickref/", type: "Documentation", difficulty: "Advanced" }
    ],
    projects: [
      { title: "UX Case Study: FinTech App Redesign", desc: "Detailed case study mapping 10 user interviews, persona journeys, wireframes, A/B validation testing, and high-fidelity Figma files.", impactScore: 92, recruiterAttractionScore: 88, difficulty: "Intermediate", portfolioValue: "High" },
      { title: "E-Commerce Design System Library", desc: "Figma component asset vault detailing type scales, interactive buttons, inputs grid systems, responsive card components, and code token definitions.", impactScore: 88, recruiterAttractionScore: 85, difficulty: "Advanced", portfolioValue: "Medium" },
      { title: "SaaS Landing Page Wireframe Layout", desc: "Interactive wireframes outline for a dashboard landing page focusing on user conversion optimization metrics.", impactScore: 72, recruiterAttractionScore: 70, difficulty: "Beginner", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Analyze 1 successful app UI layout", "Draft 5 font combination scales", "Draw 1 card component grid style"],
        weeklyTasks: ["Practice auto layout grids in Figma", "Write 5 user survey feedback queries"],
        monthlyGoals: ["Master visual grid structures, typography hierarchy scales, and modern Figma tool configurations"]
      },
      plan60Day: {
        dailyTasks: ["Sketch 2 low-fidelity mobile wireframes", "Map 1 user persona trajectory", "Configure 1 auto-layout component button"],
        weeklyTasks: ["Build 1 interactive clickable mobile mockup flow", "Perform heuristic audit on a live website"],
        monthlyGoals: ["Master user research surveys, low-fidelity wireframing drafts, and interactive prototyping setups"]
      },
      plan90Day: {
        dailyTasks: ["Audit 1 layout page color contrast", "Draft design token name schemas", "Run 1 mock user usability test"],
        weeklyTasks: ["Complete design system component library build", "Record video case study presentation summary"],
        monthlyGoals: ["Complete high-fidelity Figma components project, WCAG contrast audits, and release UX case study portfolio"]
      }
    }
  },
  "Product Manager": {
    requiredSkills: [
      "Product Strategy", "Market Research", "Agile Methodologies (Scrum)", "User Analytics", "Roadmapping (Jira)", "KPI Definition", "SQL Basics", "Wireframing", "A/B Testing Basics"
    ],
    careerReadinessReport: {
      overview: "Good communication and strategy concepts. Needs focused training on backlog refinement, product requirement documents (PRD), KPI tracking, and user analytics tools.",
      resumeDiagnostics: "Strong management keywords. However, missing details on quantified metric improvements (revenue/retention %), product specifications (PRD), and Jira workflows.",
      interviewFeedback: "Average mock interview score is 62%. Clear on conceptual design thinking, but gets stuck on metric calculations, prioritization frameworks (RICE), and tech handoffs.",
      portfolioFeedback: "Must add a detailed Product Requirement Document (PRD) detailing launch phases, RICE metrics, and API integrations for a simulated user dashboard."
    },
    readinessPredictions: { interviewReadiness: 66, placementReadiness: 60, industryReadiness: 62 },
    stages: [
      {
        stageName: "Stage 1: Product Strategy & Market Research",
        stageIndex: 1,
        steps: [
          { skillName: "Market Competitor Analysis", whyItMatters: "Mandatory base to identify market gaps and construct value propositions.", estimatedTime: "1.5 Weeks", difficulty: "Beginner", priority: "High" },
          { skillName: "User Interview & Pain Points Extraction", whyItMatters: "Crucial to ground new product features in actual customer requests.", estimatedTime: "1.5 Weeks", difficulty: "Beginner", priority: "High" }
        ]
      },
      {
        stageName: "Stage 2: Requirements & PRD Writing",
        stageIndex: 2,
        steps: [
          { skillName: "PRD Writing & User Stories", whyItMatters: "Essential tool to draft detailed product features, validation rules, and release milestones.", estimatedTime: "2.5 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Prioritization Frameworks (RICE, MoSCoW)", whyItMatters: "Required to allocate developer sprints logically and optimize launch value.", estimatedTime: "1 Week", difficulty: "Intermediate", priority: "High" }
        ]
      },
      {
        stageName: "Stage 3: Project Management (Agile/Scrum)",
        stageIndex: 3,
        steps: [
          { skillName: "Agile Sprints & Backlog Grooming (Jira)", whyItMatters: "Industry standard tool to coordinate sprint schedules and check developer tasks.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Technical Handoff & APIs basics", whyItMatters: "Ensures clear alignment when delegating tasks to engineering leads.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 4: Product Analytics & KPIs",
        stageIndex: 4,
        steps: [
          { skillName: "KPI Metrics tracking (LTV, CAC, Retention)", whyItMatters: "Crucial to monitor product financial performance and active user growth.", estimatedTime: "1.5 Weeks", difficulty: "Intermediate", priority: "High" },
          { skillName: "Product Analytics Platforms (Mixpanel/Amplitude)", whyItMatters: "Enables managers to query user event paths and optimize layout funnels.", estimatedTime: "2 Weeks", difficulty: "Advanced", priority: "Medium" }
        ]
      },
      {
        stageName: "Stage 5: Launch & Growth Strategy",
        stageIndex: 5,
        steps: [
          { skillName: "Go-To-Market (GTM) Strategy", whyItMatters: "Structures user acquisition plans and pricing paths for launch success.", estimatedTime: "1.5 Weeks", difficulty: "Advanced", priority: "High" },
          { skillName: "A/B Testing & Release Diagnostics", whyItMatters: "Validates feature performance metrics before releasing to 100% users.", estimatedTime: "1 Week", difficulty: "Advanced", priority: "High" }
        ]
      }
    ],
    resources: [
      { title: "Product School - Free PM Resource Guide", url: "https://productschool.com/resources/", type: "Documentation", difficulty: "Beginner" },
      { title: "Jira Software Official Sprint Training docs", url: "https://www.atlassian.com/software/jira/guides", type: "Documentation", difficulty: "Intermediate" },
      { title: "Amplitude Analytics User Journey Course", url: "https://academy.amplitude.com/", type: "Course Platform", difficulty: "Advanced" },
      { title: "RICE Framework Prioritization Cheat Sheet", url: "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/", type: "Roadmap Article", difficulty: "Beginner" }
    ],
    projects: [
      { title: "Product Specification (PRD): Messaging Agent", desc: "Detailed product requirement document setting up user stories, wireframe inputs layouts, API dependencies mappings, and launch metrics tracking plans.", impactScore: 92, recruiterAttractionScore: 88, difficulty: "Intermediate", portfolioValue: "High" },
      { title: "Agile Jira Sprint Board Simulation", desc: "Simulated dashboard mapping 4 epic milestones, 12 granular user stories, developer sprint allocations, and metrics tracking board summaries.", impactScore: 85, recruiterAttractionScore: 82, difficulty: "Intermediate", portfolioValue: "Medium" },
      { title: "Mixpanel Funnel Diagnostics Case Study", desc: "Analytical case study analyzing mock user signup logs to identify interface drop-off bottlenecks.", impactScore: 78, recruiterAttractionScore: 75, difficulty: "Advanced", portfolioValue: "Low" }
    ],
    plan306090: {
      plan30Day: {
        dailyTasks: ["Write 1 user feature story requirement", "Read 1 product design case study", "Analyze 1 competitors checkout flow"],
        weeklyTasks: ["Draft RICE calculations for 3 feature ideas", "Interview 2 students about app interface issues"],
        monthlyGoals: ["Master basic product strategy definitions, user survey queries, and prioritization math"]
      },
      plan60Day: {
        dailyTasks: ["Draft 1 wireframe layout page outline", "Configure 1 ticket backlog entry in Jira", "Review 1 API request format example"],
        weeklyTasks: ["Write 1 complete PRD document draft", "Simulate sprint planning board configurations"],
        monthlyGoals: ["Construct detailed Product Requirement Documents (PRD) and manage sprint backlogs on Jira boards"]
      },
      plan90Day: {
        dailyTasks: ["Map Mixpanel funnel metrics trajectories", "Calculate CAC and LTV ratios", "Draft A/B testing scenario metrics"],
        weeklyTasks: ["Define GTM pricing models strategy report", "Run mock presentation walk-through of PRD project"],
        monthlyGoals: ["Complete GTM marketing strategy, product analytics funnel diagnostics, and launch detailed PRD presentation"]
      }
    }
  }
};
