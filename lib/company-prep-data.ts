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
  category: string; // DSA, OOP, DBMS, OS, SQL, Web Dev, Java, Python, Javascript, System Design, Behavioral
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

export interface CompanyPrepData {
  slug: string;
  name: string;
  overview: string;
  difficulty: "Medium" | "Hard" | "Extreme";
  salaryRange: string;
  rolesHired: string[];
  eligibility: string;
  selectionRatio: string;
  prepTime: string;
  packageValue: string;
  activeRounds: number;
  mustHaveSkills: string[];
  goodToHaveSkills: string[];
  bonusSkills: string[];
  oaPattern: {
    sections: string[];
    cutoff: string;
    timeLimit: string;
    totalQuestions: number;
  };
  hiringProcess: HiringRound[];
  oaQuestions: OAQuestion[];
  questionBank: QuestionBankItem[];
  experiences: StudentExperience[];
  roadmap30: string[];
  roadmap60: string[];
  roadmap90: string[];
  plannerChecklist: string[];
  copilotAnswers: {
    ready: string;
    crack: string;
    projects: string;
    skills: string;
  };
}

export const COMPANY_PREP_LIST: CompanyPrepData[] = [
  {
    slug: "ibm",
    name: "IBM",
    overview: "IBM is a global technology and consulting leader specializing in hybrid cloud computing, artificial intelligence (Watson), and enterprise software frameworks.",
    difficulty: "Medium",
    salaryRange: "₹4.5 - ₹9.0 LPA",
    rolesHired: ["Associate System Engineer (ASE)", "Cloud Application Developer", "Data Engineer"],
    eligibility: "BE/BTech, MCA, MSc (CS/IT) with 60% or 6.0 CGPA, no active backlogs.",
    selectionRatio: "8 - 10%",
    prepTime: "25 Days",
    packageValue: "₹4.5 - ₹9.0 LPA",
    activeRounds: 4,
    mustHaveSkills: ["Java or Python", "SQL/DBMS", "Object-Oriented Programming (OOP)"],
    goodToHaveSkills: ["REST APIs", "Cloud Computing Foundations", "Docker Basics"],
    bonusSkills: ["Kubernetes", "Cognitive AI Patterns"],
    oaPattern: {
      sections: ["Cognitive Assessment (IPAT)", "Coding Assessment (HackerRank)", "English Proficiency"],
      cutoff: "70%",
      timeLimit: "95 Minutes",
      totalQuestions: 22
    },
    hiringProcess: [
      {
        name: "Resume Screening",
        duration: "1 Week",
        difficulty: "Easy",
        tips: "Highlight key skill tags like REST API, Java, Python, and SQL. Format in a standard single-column ATS scan template."
      },
      {
        name: "Online Assessment (OA)",
        duration: "95 Mins",
        difficulty: "Medium",
        tips: "IPAT tests spatial and quantitative reasoning. The coding round usually features 1-2 standard array or string dynamic programming questions."
      },
      {
        name: "Technical Interview",
        duration: "45 Mins",
        difficulty: "Medium",
        tips: "Be prepared to write code for basic data structures (linked list, binary search) and detail database schema normalization rules."
      },
      {
        name: "Managerial & HR Interview",
        duration: "30 Mins",
        difficulty: "Easy",
        tips: "Expect behavioral questions assessing your adaptation to client projects, team disagreements, and communication skills."
      }
    ],
    oaQuestions: [
      {
        id: "ibm-q1",
        type: "aptitude",
        question: "A product's price increases by 20% and then decreases by 10%. What is the net change in the product's price?",
        options: ["10% increase", "8% increase", "12% increase", "10% decrease"],
        answer: "8% increase",
        explanation: "Assume initial price is 100. Increase of 20% makes it 120. Decrease of 10% on 120 is 12 (120 - 12 = 108). Net increase is 8%."
      },
      {
        id: "ibm-q2",
        type: "coding",
        question: "Write a function that reverses words in a given string sentence (e.g., 'Hello World' becomes 'World Hello').",
        answer: "function reverseWords(s) { return s.split(' ').reverse().join(' '); }",
        explanation: "We split the string by spaces to get an array of words, reverse that array, and then join them back using spaces."
      }
    ],
    questionBank: [
      {
        id: "ibm-qb1",
        category: "OOP",
        type: "Technical",
        question: "Explain Polymorphism and its types with respect to Java.",
        answer: "Polymorphism allows objects to take multiple forms. Types are: 1. Compile-time polymorphism (Method Overloading) where functions have the same name but different signatures. 2. Runtime polymorphism (Method Overriding) where subclass provides a specific implementation of a method defined in parent class."
      },
      {
        id: "ibm-qb2",
        category: "SQL",
        type: "Technical",
        question: "What is the difference between INNER JOIN and LEFT JOIN?",
        answer: "INNER JOIN returns only rows that have matching values in both tables. LEFT JOIN returns all rows from the left table, and the matched rows from the right table. If there is no match, NULL values are returned for the right table columns."
      }
    ],
    experiences: [
      {
        id: "ibm-exp1",
        student: "Pranav Patil",
        role: "Associate System Engineer",
        year: "2025",
        outcome: "Selected",
        story: "The OA was via HackerRank. It had 2 coding questions on Array manipulations and 15 cognitive questions (matrices, logical patterns). The technical interview focused heavily on OOP, SQL queries (Joins), and my final year project. Emphasized clean coding."
      }
    ],
    roadmap30: [
      "Days 1-7: Review Java/Python core constructs, class variables, inheritance, interfaces.",
      "Days 8-15: Master DBMS schema structures, normal forms (1NF-3NF), and basic joins.",
      "Days 16-22: Solve 20 HackerRank String/Array challenges.",
      "Days 23-30: Complete Mock Technical rounds and practice spatial puzzle patterns."
    ],
    roadmap60: [
      "Days 1-20: Establish fundamental algorithmic checks (Recursion, Sorting, Searching).",
      "Days 21-40: Complete all intermediate database concepts and SQL queries.",
      "Days 41-60: Build two full-stack projects showcasing REST integrations."
    ],
    roadmap90: [
      "Days 1-30: Core coding foundations and language concepts.",
      "Days 31-60: Database Normalization, SQL practices, and Web integrations.",
      "Days 61-90: Direct Mock simulations, company preparation sheets, and behavioral sessions."
    ],
    plannerChecklist: [
      "Practice 5 spatial logical reasoning matrices.",
      "Write SQL joins queries for standard employee-department schemas.",
      "Review Method Overriding vs Overloading concepts.",
      "Complete a 15-minute voice mock behavioral session."
    ],
    copilotAnswers: {
      ready: "Your IBM readiness index is calculated at 76%. To achieve higher consistency, target a database score of 80% on normalizations and practice dynamic coding challenges on Arrays.",
      crack: "To crack IBM, clear the cognitive spatial patterns (IPAT) and practice code optimization. Focus on OOP definitions, SQL tables, and basic system checks in your technical round.",
      projects: "A full-stack REST API dashboard showing clear database CRUD mappings and robust exception handlers fits perfectly on your resume for IBM.",
      skills: "Ensure Java/Python, Relational DBMS (MySQL/PostgreSQL), and OOP concepts are clearly highlighted in your resume's primary skill section."
    }
  },
  {
    slug: "tcs",
    name: "TCS",
    overview: "Tata Consultancy Services (TCS) is a global IT services powerhouse hiring freshers through its National Qualifier Test (NQT) channels.",
    difficulty: "Medium",
    salaryRange: "₹3.36 - ₹11.5 LPA",
    rolesHired: ["Ninja (₹3.36 LPA)", "Digital (₹7.0 LPA)", "Prime (₹9.0 - ₹11.5 LPA)"],
    eligibility: "B.E/B.Tech/M.E/M.Tech/MCA/M.Sc with 60% standard throughout 10th, 12th, and graduation.",
    selectionRatio: "12 - 15%",
    prepTime: "30 Days",
    packageValue: "₹3.36 - ₹11.5 LPA",
    activeRounds: 3,
    mustHaveSkills: ["C, C++ or Java", "DBMS & SQL", "Data Structures Basics"],
    goodToHaveSkills: ["Operating System Basics", "Software Engineering Lifecycle"],
    bonusSkills: ["Cloud Platforms", "Machine Learning Concepts"],
    oaPattern: {
      sections: ["Foundation Cognitive Section", "Advanced Quantitative/Reasoning", "Advanced Coding"],
      cutoff: "65%",
      timeLimit: "120 Minutes",
      totalQuestions: 82
    },
    hiringProcess: [
      {
        name: "National Qualifier Test (NQT)",
        duration: "120 Mins",
        difficulty: "Medium",
        tips: "Sectional time limits apply. Quantitative numerical sections are heavy on percentages, profit-loss, and code analysis. Practice basic loops."
      },
      {
        name: "Technical Interview",
        duration: "30 Mins",
        difficulty: "Medium",
        tips: "Review basic programming definitions. Expect questions on inheritance, function overloading, standard array searches, and basic database keys."
      },
      {
        name: "Managerial & HR Interview",
        duration: "20 Mins",
        difficulty: "Easy",
        tips: "Expect standard behavioral questions, checks on location flexibility, night shifts, and document validation."
      }
    ],
    oaQuestions: [
      {
        id: "tcs-q1",
        type: "aptitude",
        question: "Find the missing number in the sequence: 4, 9, 25, 49, 121, ?",
        options: ["144", "169", "196", "225"],
        answer: "169",
        explanation: "The numbers are squares of consecutive prime numbers: 2^2, 3^2, 5^2, 7^2, 11^2. The next prime is 13, so 13^2 = 169."
      },
      {
        id: "tcs-q2",
        type: "coding",
        question: "Write code to check if a given string is a palindrome.",
        answer: "function isPalindrome(str) { return str === str.split('').reverse().join(''); }",
        explanation: "Compare the string directly to its characters reversed. If equal, it is a palindrome."
      }
    ],
    questionBank: [
      {
        id: "tcs-qb1",
        category: "DBMS",
        type: "Technical",
        question: "What is a primary key and how does it differ from a unique key?",
        answer: "A Primary Key uniquely identifies rows in a table and cannot contain NULL values. A Unique Key also ensures uniqueness but allows exactly one NULL value. There can only be one primary key per table, but multiple unique keys."
      },
      {
        id: "tcs-qb2",
        category: "OS",
        type: "Technical",
        question: "What is deadlock in Operating Systems?",
        answer: "Deadlock is a state where a set of processes are blocked because each process is holding a resource and waiting for another resource held by some other process. Conditions required are mutual exclusion, hold and wait, no preemption, and circular wait."
      }
    ],
    experiences: [
      {
        id: "tcs-exp1",
        student: "Siddharth Rao",
        role: "TCS Digital Developer",
        year: "2025",
        outcome: "Selected",
        story: "Scored high in the NQT advanced section, which unlocked the Digital interview track. Technical round asked me about pointers, linked lists, and normal forms. They also asked for quick SQL queries on JOINS."
      }
    ],
    roadmap30: [
      "Days 1-10: Practice quantitative aptitude topics: Ratio, Percentages, Time and Work, and Profit-Loss.",
      "Days 11-20: Build database fundamentals and practice writing basic SQL queries.",
      "Days 21-30: Solve 15 sample coding questions and practice verbal aptitude tests."
    ],
    roadmap60: [
      "Days 1-20: Quantitative and Logical Reasoning practice.",
      "Days 21-40: Coding, Data Structures, OOP, and DBMS foundations.",
      "Days 41-60: Advanced programming tasks, mock assessments, and mock interviews."
    ],
    roadmap90: [
      "Days 1-30: Foundation Aptitude and Reasoning practice.",
      "Days 31-60: Core programming structures, SQL queries, and project audits.",
      "Days 61-90: Practice advanced coding puzzles, simulated test sessions, and behavioral templates."
    ],
    plannerChecklist: [
      "Practice 5 percentages and profit-loss numericals.",
      "Code an array reversing algorithm in C/C++/Java.",
      "Understand the difference between a primary key and unique key.",
      "Read about TCS Ninja vs Digital vs Prime guidelines."
    ],
    copilotAnswers: {
      ready: "Your TCS readiness index is 79%. Ninja metrics look solid. To unlock the Digital or Prime tracks, practice advanced quantitative sections and write optimized algorithms.",
      crack: "To crack TCS NQT, practice sectional time constraints. Excel in profit-loss, logical puzzles, and code-based MCQs. Highlight basic SQL and object-oriented syntax in interview panels.",
      projects: "Showcasing a functional library management database or a basic real-time dashboard highlights practical engineering skills, matching the TCS Digital benchmark.",
      skills: "Place languages like Java/C++, relational database structures (SQL), and SDLC paradigms on your primary CV checklist."
    }
  },
  {
    slug: "infosys",
    name: "Infosys",
    overview: "Infosys is a global leader in digital consulting, famed for its Mysore onboarding and training infrastructure.",
    difficulty: "Medium",
    salaryRange: "₹3.6 - ₹9.5 LPA",
    rolesHired: ["System Engineer (SE)", "Specialist Programmer (SP)", "Power Programmer (PP)"],
    eligibility: "B.E./B.Tech/M.E./M.Tech/MCA/M.Sc. with minimum 60% in academic tracks.",
    selectionRatio: "10 - 12%",
    prepTime: "28 Days",
    packageValue: "₹3.6 - ₹9.5 LPA",
    activeRounds: 3,
    mustHaveSkills: ["Python or Java", "Relational Database Concepts", "Object-Oriented Programming"],
    goodToHaveSkills: ["HTML/CSS/JS", "Data Structures basics"],
    bonusSkills: ["System Design", "Cloud Basics"],
    oaPattern: {
      sections: ["Reasoning Ability", "Mathematical Ability", "Verbal Ability", "Pseudocode Test"],
      cutoff: "65%",
      timeLimit: "100 Minutes",
      totalQuestions: 54
    },
    hiringProcess: [
      {
        name: "Online Assessment",
        duration: "100 Mins",
        difficulty: "Medium",
        tips: "Infosys pseudocode questions evaluate loop flowcharts, bitwise operators, and recursion values. Be quick on quantitative math."
      },
      {
        name: "Technical Interview",
        duration: "30 Mins",
        difficulty: "Medium",
        tips: "Expect questions from academic projects, core databases (Joins/Triggers), Java/Python syntax, and OOP definitions."
      },
      {
        name: "HR Interview",
        duration: "15 Mins",
        difficulty: "Easy",
        tips: "Assesses communication skills, career aspirations, willingness to relocate to different campuses, and shifts adaptability."
      }
    ],
    oaQuestions: [
      {
        id: "infy-q1",
        type: "mcq",
        question: "What is the output of the following pseudocode? \nInteger a = 10, b = 5\na = a + b\nb = a - b\na = a - b\nPrint a, b",
        options: ["10, 5", "5, 10", "15, 5", "5, 15"],
        answer: "5, 10",
        explanation: "This is a standard swap algorithm using arithmetic operators. The values of a and b get swapped, so printed result is 5, 10."
      },
      {
        id: "infy-q2",
        type: "coding",
        question: "Write code to find the factorial of a number using recursion.",
        answer: "function factorial(n) { if (n <= 1) return 1; return n * factorial(n - 1); }",
        explanation: "Recursively multiply n by factorial of n-1. Base case returns 1 when n reaches 1."
      }
    ],
    questionBank: [
      {
        id: "infy-qb1",
        category: "Java",
        type: "Technical",
        question: "What is the 'final' keyword in Java?",
        answer: "In Java, 'final' can be applied to variables, methods, and classes. A final variable cannot be reassigned. A final method cannot be overridden by subclasses. A final class cannot be inherited (subclassed)."
      },
      {
        id: "infy-qb2",
        category: "OOP",
        type: "Technical",
        question: "Define Abstraction and how it is achieved in Python.",
        answer: "Abstraction hides implementation details and exposes only functionality. In Python, it is achieved using abstract classes and methods from the 'abc' module (Abstract Base Classes)."
      }
    ],
    experiences: [
      {
        id: "infy-exp1",
        student: "Meghna Nair",
        role: "Specialist Programmer",
        year: "2025",
        outcome: "Selected",
        story: "Entered via HackWithInfy coding competition. The coding test featured 3 questions (graph traversal, dynamic programming, and greedy logic). The interview asked about MVC framework architectures and database indexing."
      }
    ],
    roadmap30: [
      "Days 1-8: Revise Python/Java syntax, variables, class structures, OOP encapsulation.",
      "Days 9-16: Practice pseudocode loops, bitwise logic, and dry run array outputs.",
      "Days 17-24: Study core database joins, index schemas, and view creations.",
      "Days 25-30: Solve mock reasoning papers and review relocations check."
    ],
    roadmap60: [
      "Days 1-20: Quantitative, logical, and verbal aptitude study.",
      "Days 21-40: OOP concepts, Java/Python deep dives, and SQL/DBMS queries.",
      "Days 41-60: Project reviews, mock interview simulations, and resume tuning."
    ],
    roadmap90: [
      "Days 1-30: Core aptitude practice and language fundamentals.",
      "Days 31-60: Database concepts, intermediate programming, and data structures.",
      "Days 61-90: Practice advanced coding formats, mock exams, and panel discussions."
    ],
    plannerChecklist: [
      "Practice 5 pseudocode loops containing recursion.",
      "Learn final, abstract, and static variable rules in Java.",
      "Verify database index concepts.",
      "Run a mock HR relocate-check dialog."
    ],
    copilotAnswers: {
      ready: "Your Infosys readiness index is 75%. Solid on coding. Improve your verbal aptitude score to clear the first assessment round.",
      crack: "Focus on verbal logic and dry-running pseudocode loops. Make sure you can write clean Python/Java functions on arrays and explain inheritance structures clearly.",
      projects: "Building an inventory management system or clean data processing script demonstrates the backend focus Infosys values in Specialist Programmer candidates.",
      skills: "Highlight core python/java development skills, schema designs, and OOP principles prominently."
    }
  },
  {
    slug: "accenture",
    name: "Accenture",
    overview: "Accenture is a global professional services enterprise delivering technological consulting, infrastructure solutions, and system upgrades.",
    difficulty: "Medium",
    salaryRange: "₹4.5 - ₹8.5 LPA",
    rolesHired: ["Associate Software Engineer (ASE)", "Advanced Associate Software Engineer (AASE)"],
    eligibility: "B.E/B.Tech/MCA/M.Sc (CS/IT) with 60% standard throughout.",
    selectionRatio: "10 - 14%",
    prepTime: "20 Days",
    packageValue: "₹4.5 - ₹8.5 LPA",
    activeRounds: 4,
    mustHaveSkills: ["Core Coding (C/C++/Java/Python)", "Database Fundamentals", "Computer Networks"],
    goodToHaveSkills: ["MS Office Suite (Aptitude)", "Cloud Architectures"],
    bonusSkills: ["Agile Practices", "REST Web Services"],
    oaPattern: {
      sections: ["Cognitive and Technical Assessment", "Coding Assessment", "Communication Test"],
      cutoff: "65% on Cognitive",
      timeLimit: "135 Minutes",
      totalQuestions: 92
    },
    hiringProcess: [
      {
        name: "Cognitive & Technical Assessment",
        duration: "90 Mins",
        difficulty: "Medium",
        tips: "Contains 50 cognitive (analytical, verbal) and 40 technical MCQs (pseudo-code, networking, MS Office, cloud). Elimination round."
      },
      {
        name: "Coding Assessment",
        duration: "45 Mins",
        difficulty: "Medium",
        tips: "Unlocks instantly upon clearing the cognitive test. Features 2 coding questions (medium difficulty array/strings)."
      },
      {
        name: "Communication Assessment",
        duration: "20 Mins",
        difficulty: "Easy",
        tips: "Non-elimination round. An automated voice assistant evaluates reading, listening, and sentence structural speaking."
      },
      {
        name: "Technical & HR Interview",
        duration: "25 Mins",
        difficulty: "Medium",
        tips: "Conducted online. Focuses heavily on team collaborations, project achievements, core tech concepts, and situational questions."
      }
    ],
    oaQuestions: [
      {
        id: "acc-q1",
        type: "mcq",
        question: "Which of the following is NOT a valid networking layer in the OSI Model?",
        options: ["Transport Layer", "Network Layer", "Transmission Layer", "Session Layer"],
        answer: "Transmission Layer",
        explanation: "The OSI model consists of 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application. Transmission is not a layer name."
      },
      {
        id: "acc-q2",
        type: "coding",
        question: "Write code to find the sum of all elements in an array.",
        answer: "function sumArray(arr) { return arr.reduce((acc, curr) => acc + curr, 0); }",
        explanation: "Using reduce accumulator to add elements from start to end of array."
      }
    ],
    questionBank: [
      {
        id: "acc-qb1",
        category: "CN",
        type: "Technical",
        question: "What is the difference between TCP and UDP protocols?",
        answer: "TCP is connection-oriented, reliable, guarantees data packet ordering, and uses error check mechanisms. UDP is connectionless, faster, does not guarantee packet delivery or order, and is commonly used for streaming."
      },
      {
        id: "acc-qb2",
        category: "Behavioral",
        type: "Behavioral",
        question: "Describe a time you solved a team conflict during a college project.",
        answer: "Answer using the STAR method: Situation (project conflict), Task (align team milestones), Action (mediated discussion, divided components fairly based on interest), Result (completed project on time, scoring an A grade)."
      }
    ],
    experiences: [
      {
        id: "acc-exp1",
        student: "Anusha Murthy",
        role: "Advanced ASE",
        year: "2025",
        outcome: "Selected",
        story: "The cognitive MCQs on MS Office and Computer Networks were slightly tricky. The coding assessment was straightforward (array difference, string mapping). The interview was a mix of project explanations and HR behavioral situations."
      }
    ],
    roadmap30: [
      "Days 1-5: Practice MS Office structures, standard shortcut keys, cloud basics, and OSI networking models.",
      "Days 6-12: Solve 15 dynamic array and sorting codes.",
      "Days 13-18: Complete mock communication reading tasks.",
      "Days 19-30: Prepare project highlights using the STAR behavioral framework."
    ],
    roadmap60: [
      "Days 1-20: Cognitive, logical, and technical MCQ prep (Networking, Cloud).",
      "Days 21-40: Core coding algorithms, data structures, and database keys.",
      "Days 41-60: Communication mock tests, project presentations, and behavioral prep."
    ],
    roadmap90: [
      "Days 1-30: Foundations of coding and cognitive logic.",
      "Days 31-60: DBMS, Networks, and cloud-native computing topics.",
      "Days 61-90: Practice mock assessments, communication tasks, and direct panel interviews."
    ],
    plannerChecklist: [
      "Revise OSI model layers and standard network protocols.",
      "Solve a basic array sum/averages code challenge.",
      "Prepare a STAR format team project story.",
      "Read about Accenture ASE vs AASE package structures."
    ],
    copilotAnswers: {
      ready: "Your Accenture readiness index is 82%. Cognitive scores look high. Practice communication mock tasks to verify pronunciation metrics.",
      crack: "Understand the OSI model, networking protocols, and cloud basics for the technical MCQ section. Be ready to explain project distributions in your interview.",
      projects: "Collaborative team projects showing API connectivity and version control alignments are highly regarded by Accenture interview panels.",
      skills: "Highlight object-oriented coding languages, cloud basics, and software development methodologies."
    }
  },
  {
    slug: "deloitte",
    name: "Deloitte",
    overview: "Deloitte is one of the Big Four global advisory and professional services consulting networks hiring candidates for technical consulting tracks.",
    difficulty: "Medium",
    salaryRange: "₹4.5 - ₹8.0 LPA",
    rolesHired: ["Analyst", "Associate Analyst", "Technology Consultant"],
    eligibility: "B.E/B.Tech/MCA/M.Sc (CS/IT) with 60% or 6.5 CGPA.",
    selectionRatio: "6 - 8%",
    prepTime: "22 Days",
    packageValue: "₹4.5 - ₹8.0 LPA",
    activeRounds: 3,
    mustHaveSkills: ["Aptitude & Reasoning", "Database Systems (SQL)", "Java or Python core"],
    goodToHaveSkills: ["Business Analysis", "Web Development basics"],
    bonusSkills: ["Cloud Computing", "PowerBI or Excel Analytics"],
    oaPattern: {
      sections: ["Quantitative Aptitude", "Logical Reasoning", "Computer Science MCQ"],
      cutoff: "70%",
      timeLimit: "90 Minutes",
      totalQuestions: 75
    },
    hiringProcess: [
      {
        name: "Cognitive Assessment",
        duration: "90 Mins",
        difficulty: "Medium",
        tips: "Features mathematical word problems, logical patterns, and pseudocode syntax audits. Focus on speed."
      },
      {
        name: "Technical & Case Interview",
        duration: "45 Mins",
        difficulty: "Medium",
        tips: "Review SQL queries, object-oriented concepts, and basic SDLC models. You might receive a short tech case study."
      },
      {
        name: "Partner Round (HR & Managerial)",
        duration: "30 Mins",
        difficulty: "Medium",
        tips: "Analyzes professional drive, problem-solving mindsets, ethical dilemmas, and communication."
      }
    ],
    oaQuestions: [
      {
        id: "del-q1",
        type: "aptitude",
        question: "A train moves at 72 km/h. How many seconds does it take to cross a 200m bridge if the train length is 100m?",
        options: ["10s", "15s", "20s", "25s"],
        answer: "15s",
        explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance = 100 + 200 = 300m. Time = Distance / Speed = 300 / 20 = 15 seconds."
      },
      {
        id: "del-q2",
        type: "coding",
        question: "Write code to find the maximum element in an array.",
        answer: "function getMax(arr) { return Math.max(...arr); }",
        explanation: "Use spread operator inside Math.max function to pull the highest value."
      }
    ],
    questionBank: [
      {
        id: "del-qb1",
        category: "SQL",
        type: "Technical",
        question: "What is database normalization and what are its standard forms?",
        answer: "Normalization minimizes redundancy and data dependencies. Standard forms are: 1NF (atomic values), 2NF (remove partial key dependencies), 3NF (remove transitive dependencies)."
      },
      {
        id: "del-qb2",
        category: "Behavioral",
        type: "Behavioral",
        question: "How would you handle a situation where a client changes code requirements last-minute?",
        answer: "Acknowledge change impact, consult with technical leads to review deadlines, explain cost/delivery adjustments transparently, and follow agile restructuring procedures."
      }
    ],
    experiences: [
      {
        id: "del-exp1",
        student: "Siddharth Sen",
        role: "Associate Analyst",
        year: "2025",
        outcome: "Selected",
        story: "The OA tested core aptitude and pseudo-code. In the technical interview, they presented a case study about optimizing a database system for an e-commerce platform. Focus on normalizations and index speedups helped."
      }
    ],
    roadmap30: [
      "Days 1-7: Build quantitative logic and speed math skills.",
      "Days 8-14: Master SQL Joins, Aggregations, and Normal forms.",
      "Days 15-22: Study software methodologies (Agile vs Waterfall) and basic code structures."
    ],
    roadmap60: [
      "Days 1-20: Quantitative Aptitude, Logical Reasoning, and data trends.",
      "Days 21-40: OOP, SQL database constraints, and tech case discussions.",
      "Days 41-60: Mock interviews, resume alignments, and behavioral partner assessments."
    ],
    roadmap90: [
      "Days 1-30: Foundation analytical and coding concepts.",
      "Days 31-60: DBMS, Network protocols, and project workflows.",
      "Days 61-90: Practice technical case studies, mock evaluations, and final rounds."
    ],
    plannerChecklist: [
      "Solve 5 speed, distance, and time math equations.",
      "Write SQL joins and group-by aggregations.",
      "Draft a response structure for a tech case study challenge.",
      "Complete a mock partner round scenario review."
    ],
    copilotAnswers: {
      ready: "Your Deloitte readiness index is 77%. Focus on case study prep and database normalizations to increase success probability.",
      crack: "Excel in quantitative aptitude speed and SQL database normalization. Practice structured behavioral STAR frameworks for partner interview rounds.",
      projects: "Data dashboards, analytical pipelines, or cloud integrations showing clean structured records are highly valued at Deloitte.",
      skills: "Highlight SQL databases, core programming, and SDLC methodologies on your profile."
    }
  },
  {
    slug: "capgemini",
    name: "Capgemini",
    overview: "Capgemini is a French multinational information technology consulting corporation providing software engineering, operations, and technical upgrades.",
    difficulty: "Medium",
    salaryRange: "₹4.0 - ₹7.5 LPA",
    rolesHired: ["Analyst", "Senior Analyst"],
    eligibility: "BE/BTech, MCA with minimum 55% or equivalent CGPA.",
    selectionRatio: "11 - 13%",
    prepTime: "24 Days",
    packageValue: "₹4.0 - ₹7.5 LPA",
    activeRounds: 3,
    mustHaveSkills: ["Pseudo-code comprehension", "Aptitude and Logical Reasoning", "C/C++/Java/Python basic"],
    goodToHaveSkills: ["English Communication", "HTML/CSS basics"],
    bonusSkills: ["Cloud architecture basics"],
    oaPattern: {
      sections: ["Pseudocode Test", "English Communication Test", "Game-Based Aptitude", "Behavioral Profile"],
      cutoff: "65%",
      timeLimit: "110 Minutes",
      totalQuestions: 60
    },
    hiringProcess: [
      {
        name: "Game-Based Aptitude & Pseudocode Test",
        duration: "60 Mins",
        difficulty: "Medium",
        tips: "Features logical grid games, math matrix patterns, and standard pseudocode loops. Dry running loops is essential."
      },
      {
        name: "English Communication Test",
        duration: "30 Mins",
        difficulty: "Easy",
        tips: "Grammar, sentence structures, and basic paragraph comprehensions. Clear pronunciation during checks is useful."
      },
      {
        name: "Technical & HR Interview",
        duration: "25 Mins",
        difficulty: "Medium",
        tips: "Focuses on language syntax, OOP definitions, database structures, and relocation checks."
      }
    ],
    oaQuestions: [
      {
        id: "cap-q1",
        type: "logical",
        question: "In a game, grid elements swap locations based on mirror rules. A shape in grid A (Row 1, Col 2) mirrors across Y axis. Where is it located in grid B?",
        options: ["Row 1, Col 1", "Row 1, Col 2", "Row 2, Col 1", "Row 2, Col 2"],
        answer: "Row 1, Col 1",
        explanation: "Mirroring across Y axis (assuming 2x2 grid) swaps Col 2 to Col 1. Row index stays the same."
      },
      {
        id: "cap-q2",
        type: "coding",
        question: "Write code to check if a number is prime.",
        answer: "function isPrime(num) { for(let i = 2, s = Math.sqrt(num); i <= s; i++) { if(num % i === 0) return false; } return num > 1; }",
        explanation: "Loop check up to the square root of number. If any divider matches, returns false."
      }
    ],
    questionBank: [
      {
        id: "cap-qb1",
        category: "OOP",
        type: "Technical",
        question: "What is Encapsulation in OOP and how do you achieve it?",
        answer: "Encapsulation wraps variables and functions into a single unit (class). We achieve it by making variables private and exposing public getter and setter methods to access them."
      },
      {
        id: "cap-qb2",
        category: "Behavioral",
        type: "HR",
        question: "Are you willing to work in rotational shifts?",
        answer: "Yes, I am highly flexible and understand that projects can require rotational shifts to support clients worldwide. I view it as an opportunity to collaborate across global teams."
      }
    ],
    experiences: [
      {
        id: "cap-exp1",
        student: "Richa Roy",
        role: "Analyst",
        year: "2025",
        outcome: "Selected",
        story: "The game-based aptitude had inductive logic puzzles. Pseudocode test was heavy on recursion. The interview focused on OOP definitions, string palindrome check code, and project details."
      }
    ],
    roadmap30: [
      "Days 1-8: Revise programming fundamentals and OOP definitions.",
      "Days 9-16: Practice game-based pattern tests and logical matrices.",
      "Days 17-24: Dry run pseudocode loops containing recursion."
    ],
    roadmap60: [
      "Days 1-20: Inductive logic games, quantitative patterns.",
      "Days 21-40: Pseudocode tracking, SQL fundamentals, and OOP concepts.",
      "Days 41-60: English grammar, communication testing, and mock interviews."
    ],
    roadmap90: [
      "Days 1-30: Core logic and language structures.",
      "Days 31-60: DBMS, Networks, and software design models.",
      "Days 61-90: Practice mock rounds, game-based tests, and final presentation panels."
    ],
    plannerChecklist: [
      "Practice 5 inductive matrix grid puzzles.",
      "Trace recursion values for basic pseudocode.",
      "Define Encapsulation and provide a brief C++/Java code sample.",
      "Practice reading voice passages for English checks."
    ],
    copilotAnswers: {
      ready: "Your Capgemini readiness index is 74%. Games and logical ratings are good. Work on pseudocode loops to ensure round clearance.",
      crack: "Excel in loop dry-runs and matrix patterns. Be prepared to explain inheritance, encapsulation, and relational databases in interviews.",
      projects: "Responsive frontend websites or small client-server apps highlighting simple data structures match the Capgemini profile.",
      skills: "Ensure programming basics, OOP definitions, and database structures are listed on your CV."
    }
  },
  {
    slug: "cognizant",
    name: "Cognizant",
    overview: "Cognizant Technology Solutions is an American multinational IT corporation offering technology consulting, application development, and system integrations.",
    difficulty: "Medium",
    salaryRange: "₹4.0 - ₹8.0 LPA",
    rolesHired: ["GenC (₹4.0 LPA)", "GenC Elevate (₹4.5 - ₹5.5 LPA)", "GenC Next (₹6.7 - ₹8.0 LPA)"],
    eligibility: "B.E/B.Tech/MCA/M.Sc with 60% standard in academic scores.",
    selectionRatio: "10 - 12%",
    prepTime: "26 Days",
    packageValue: "₹4.0 - ₹8.0 LPA",
    activeRounds: 3,
    mustHaveSkills: ["DBMS & SQL", "Object-Oriented Coding", "Basic Data Structures"],
    goodToHaveSkills: ["Web Technologies (HTML/CSS/JS)", "Aptitude and Logic"],
    bonusSkills: ["Cloud Platforms", "Java/Spring Frameworks"],
    oaPattern: {
      sections: ["Quantitative Aptitude", "Logical Reasoning", "Technical MCQ (DBMS, OS, OOP)"],
      cutoff: "65%",
      timeLimit: "90 Minutes",
      totalQuestions: 60
    },
    hiringProcess: [
      {
        name: "Online Assessment (OA)",
        duration: "90 Mins",
        difficulty: "Medium",
        tips: "Aptitude sections test profit-loss, probability, and percentages. Technical MCQs focus on dry running basic structures."
      },
      {
        name: "Technical Interview",
        duration: "30 Mins",
        difficulty: "Medium",
        tips: "Review SQL queries, pointers, structural recursion, and basic database indexes. Coding queries are common."
      },
      {
        name: "HR Interview",
        duration: "15 Mins",
        difficulty: "Easy",
        tips: "Check documents, location checks, shifts flexibility, and communication fluency."
      }
    ],
    oaQuestions: [
      {
        id: "cog-q1",
        type: "aptitude",
        question: "A card is drawn from a pack of 52 cards. What is the probability that it is a spade or a king?",
        options: ["4/13", "17/52", "16/52", "4/13"],
        answer: "4/13",
        explanation: "Total spades = 13. Total kings = 4 (1 spade king already counted). So, total favorable cards = 13 + 3 = 16. Probability = 16/52 = 4/13."
      },
      {
        id: "cog-q2",
        type: "coding",
        question: "Write code to swap two numbers without using a temporary third variable.",
        answer: "function swap(a, b) { a = a + b; b = a - b; a = a - b; return [a, b]; }",
        explanation: "Add both, subtract to get swapped values, and assign to variables."
      }
    ],
    questionBank: [
      {
        id: "cog-qb1",
        category: "SQL",
        type: "Technical",
        question: "Write an SQL query to find the second highest salary from an Employee table.",
        answer: "SELECT MAX(Salary) FROM Employee WHERE Salary < (SELECT MAX(Salary) FROM Employee);"
      },
      {
        id: "cog-qb2",
        category: "DBMS",
        type: "Technical",
        question: "What are ACID properties in database transactions?",
        answer: "ACID stands for: Atomicity (transaction completes fully or not at all), Consistency (database state stays consistent), Isolation (transactions execute independently), Durability (completed transaction data is persisted)."
      }
    ],
    experiences: [
      {
        id: "cog-exp1",
        student: "Kartik Sen",
        role: "GenC Elevate Developer",
        year: "2025",
        outcome: "Selected",
        story: "The GenC Elevate assessment had 20 tech MCQs on SQL and OOP. The technical round focused on writing an SQL query for finding duplicate rows and defining memory structures in Java."
      }
    ],
    roadmap30: [
      "Days 1-7: Prepare quantitative math, probability, and percentages.",
      "Days 8-15: Master database keys, constraints, and ACID properties.",
      "Days 16-22: Practice array algorithms and reverse codes.",
      "Days 23-30: Take mock technical interviews and review resume logs."
    ],
    roadmap60: [
      "Days 1-20: Aptitude practice and computer science fundamentals.",
      "Days 21-40: SQL queries, data structures, and OOP coding tasks.",
      "Days 41-60: Project audits, mock sessions, and behavioral HR prep."
    ],
    roadmap90: [
      "Days 1-30: Foundation analytical sections and core coding.",
      "Days 31-60: Databases, network layers, and system structures.",
      "Days 61-90: Practice advanced test mocks, mock interviews, and final checks."
    ],
    plannerChecklist: [
      "Solve 5 probability and statistics problems.",
      "Write a second-highest salary SQL query.",
      "Understand ACID properties in databases.",
      "Review GenC vs GenC Elevate roles differences."
    ],
    copilotAnswers: {
      ready: "Your Cognizant readiness index is 78%. GenC Elevate track is accessible. Excel in database SQL queries to target GenC Next roles.",
      crack: "Practice SQL queries, database transaction models (ACID), and pointers. Highlight project databases and system designs in panels.",
      projects: "Web applications showing clean SQL database connections and REST endpoints map well onto the Cognizant recruiter requirements.",
      skills: "Highlight SQL databases, core language programming, and system structures on your CV."
    }
  },
  {
    slug: "wipro",
    name: "Wipro",
    overview: "Wipro Limited is a leading Indian technology services company conducting campus hiring via the Elite National Talent Hunt (ENTH).",
    difficulty: "Medium",
    salaryRange: "₹3.5 - ₹6.5 LPA",
    rolesHired: ["Elite (₹3.5 LPA)", "Turbo (₹6.5 LPA)"],
    eligibility: "B.E./B.Tech/MCA/M.Tech with minimum 60% average.",
    selectionRatio: "11 - 13%",
    prepTime: "25 Days",
    packageValue: "₹3.5 - ₹6.5 LPA",
    activeRounds: 3,
    mustHaveSkills: ["C/C++/Java or Python", "Basic Data Structures", "Database foundations"],
    goodToHaveSkills: ["Operating Systems", "Aptitude and Logical Reasoning"],
    bonusSkills: ["Cloud foundations", "RESTful web APIs"],
    oaPattern: {
      sections: ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability", "Coding Round (2 questions)"],
      cutoff: "65%",
      timeLimit: "128 Minutes",
      totalQuestions: 56
    },
    hiringProcess: [
      {
        name: "Elite National Talent Hunt (ENTH)",
        duration: "128 Mins",
        difficulty: "Medium",
        tips: "Aptitude sections have sectional timers. Coding round features 2 questions, usually simple array manipulation or loops. Write clean syntax."
      },
      {
        name: "Technical Interview",
        duration: "25 Mins",
        difficulty: "Medium",
        tips: "Be prepared to explain inheritance, code simple loops (like Fibonacci or factorial), and outline database tables."
      },
      {
        name: "HR Interview",
        duration: "15 Mins",
        difficulty: "Easy",
        tips: "Assesses communication, willingness to work in rotational shifts, location flexibility, and document checks."
      }
    ],
    oaQuestions: [
      {
        id: "wip-q1",
        type: "aptitude",
        question: "A work can be completed by 12 men in 8 days. How many days will it take 8 men to complete the same work?",
        options: ["10 days", "12 days", "8 days", "15 days"],
        answer: "12 days",
        explanation: "Total work = 12 * 8 = 96 man-days. Days required by 8 men = 96 / 8 = 12 days."
      },
      {
        id: "wip-q2",
        type: "coding",
        question: "Write code to find the nth Fibonacci number.",
        answer: "function fib(n) { if (n <= 1) return n; return fib(n-1) + fib(n-2); }",
        explanation: "Standard recursive fibonacci calculator using the sum of previous two numbers."
      }
    ],
    questionBank: [
      {
        id: "wip-qb1",
        category: "OOP",
        type: "Technical",
        question: "What is Inheritance and what are its types?",
        answer: "Inheritance allows a child class to inherit fields and methods of a parent class. Types are: Single, Multiple (not directly in Java), Multilevel, Hierarchical, and Hybrid inheritance."
      },
      {
        id: "wip-qb2",
        category: "OS",
        type: "Technical",
        question: "What is virtual memory in an operating system?",
        answer: "Virtual memory is a memory management capability that uses hardware and software to allow a computer to compensate for physical memory shortages, temporarily transferring data from random access memory (RAM) to disk storage."
      }
    ],
    experiences: [
      {
        id: "wip-exp1",
        student: "Mehul Mehta",
        role: "Elite ASE",
        year: "2025",
        outcome: "Selected",
        story: "The ENTH coding section had questions on finding the largest prime factor and string vowel count. In the technical round, they asked for a simple inheritance code in C++."
      }
    ],
    roadmap30: [
      "Days 1-8: Revise quantitative math, time & work, and speed math.",
      "Days 9-16: Study inheritance, interfaces, and core programming syntax.",
      "Days 17-24: Practice coding recursion, Fibonacci, and factorials.",
      "Days 25-30: Complete mock tests and HR relocation preparation."
    ],
    roadmap60: [
      "Days 1-20: Aptitude practice and computer science basic logic.",
      "Days 21-40: OOP concepts, SQL databases, and sorting algorithms.",
      "Days 41-60: Mock interviews, resume updates, and mock tests."
    ],
    roadmap90: [
      "Days 1-30: Foundation quantitative aptitude.",
      "Days 31-60: DBMS, Networks, and core programming languages.",
      "Days 61-90: Practice advanced test systems, mock interviews, and final processes."
    ],
    plannerChecklist: [
      "Solve 5 time-and-work equations.",
      "Code the Fibonacci sequence finder.",
      "Understand the types of Inheritance.",
      "Review rotational shift parameters."
    ],
    copilotAnswers: {
      ready: "Your Wipro readiness index is 75%. Solid on logic. Practice writing error-free array codes to clear the ENTH coding cutoffs.",
      crack: "Focus on time-and-work quantitative logic, array reversions, and object inheritance syntax. Highlight project details in technical interviews.",
      projects: "A simple client record portal or automated database dashboard matches Wipro's requirements.",
      skills: "Ensure coding languages (Java/C++), SQL databases, and computer science basics are on your CV."
    }
  },
  {
    slug: "hcltech",
    name: "HCLTech",
    overview: "HCLTech is a global technology company providing software development, cloud computing, and IT infrastructure management.",
    difficulty: "Medium",
    salaryRange: "₹3.6 - ₹6.0 LPA",
    rolesHired: ["Software Engineer", "Graduate Engineer Trainee (GET)"],
    eligibility: "B.E/B.Tech/MCA/M.Sc with 60% average and no active backlogs.",
    selectionRatio: "11 - 13%",
    prepTime: "20 Days",
    packageValue: "₹3.6 - ₹6.0 LPA",
    activeRounds: 3,
    mustHaveSkills: ["C/C++ or Java basics", "SQL Queries", "Object-Oriented Programming"],
    goodToHaveSkills: ["Computer Networks basics", "Aptitude and Logical Reasoning"],
    bonusSkills: ["Cloud platforms", "Web applications design"],
    oaPattern: {
      sections: ["Quantitative Aptitude", "Logical Reasoning", "Technical MCQs", "Basic Coding (1 question)"],
      cutoff: "65%",
      timeLimit: "95 Minutes",
      totalQuestions: 51
    },
    hiringProcess: [
      {
        name: "Online Assessment (OA)",
        duration: "95 Mins",
        difficulty: "Medium",
        tips: "Aptitude questions are basic. Technical MCQs focus on computer networks and OOP properties. Coding is usually simple array processing."
      },
      {
        name: "Technical Interview",
        duration: "25 Mins",
        difficulty: "Medium",
        tips: "Prepare questions on pointers, linked list structures, normal forms, and write simple SQL query statements."
      },
      {
        name: "HR Interview",
        duration: "15 Mins",
        difficulty: "Easy",
        tips: "Assesses communication, willingness to shift locations, night shifts, and document verification."
      }
    ],
    oaQuestions: [
      {
        id: "hcl-q1",
        type: "logical",
        question: "If A is B's brother, B is C's sister, and C is D's father, how is A related to D?",
        options: ["Brother", "Uncle", "Father", "Nephew"],
        answer: "Uncle",
        explanation: "B is A's sister, C is B's brother. Since C is D's father, A is D's uncle."
      },
      {
        id: "hcl-q2",
        type: "coding",
        question: "Write code to find the average of numbers in an array.",
        answer: "function average(arr) { return arr.reduce((a,b)=>a+b, 0) / arr.length; }",
        explanation: "Sum array values and divide by the array length."
      }
    ],
    questionBank: [
      {
        id: "hcl-qb1",
        category: "DBMS",
        type: "Technical",
        question: "Explain the difference between DELETE and TRUNCATE commands in SQL.",
        answer: "DELETE is a DML command used to delete specific rows using a WHERE clause. It is slower and can be rolled back. TRUNCATE is a DDL command that removes all rows from a table. It is faster, cannot be rolled back, and does not support a WHERE clause."
      },
      {
        id: "hcl-qb2",
        category: "CN",
        type: "Technical",
        question: "What is an IP address and how does IPv4 differ from IPv6?",
        answer: "An IP address is a unique numerical label assigned to each device on a network. IPv4 is a 32-bit address (e.g. 192.168.1.1) supporting ~4.3 billion addresses. IPv6 is a 128-bit address (e.g. 2001:db8::) offering a virtually infinite number of unique addresses."
      }
    ],
    experiences: [
      {
        id: "hcl-exp1",
        student: "Siddharth Jain",
        role: "Software Engineer Trainee",
        year: "2025",
        outcome: "Selected",
        story: "The HCLTech assessment was straightforward. The interview questions focused on SQL DELETE vs TRUNCATE, object encapsulation, and details of my college database project."
      }
    ],
    roadmap30: [
      "Days 1-7: Revise blood relations and quantitative logic.",
      "Days 8-14: Master SQL DELETE, TRUNCATE, and basic queries.",
      "Days 15-20: Revise IP addressing and core coding syntax."
    ],
    roadmap60: [
      "Days 1-20: Aptitude practice and computer science basics.",
      "Days 21-40: SQL databases, OOP concepts, and sorting coding tasks.",
      "Days 41-60: Project audits, mock sessions, and behavioral HR prep."
    ],
    roadmap90: [
      "Days 1-30: Foundation analytical sections and core coding.",
      "Days 31-60: Databases, network layers, and system structures.",
      "Days 61-90: Practice advanced test mocks, mock interviews, and final checks."
    ],
    plannerChecklist: [
      "Solve 5 logical reasoning blood relations puzzles.",
      "Explain DELETE vs TRUNCATE with example SQL statements.",
      "Understand IPv4 vs IPv6 differences.",
      "Read about GET career tracks at HCLTech."
    ],
    copilotAnswers: {
      ready: "Your HCLTech readiness index is 76%. Aptitude scores are good. Review database constraints and SQL commands to ensure interview success.",
      crack: "Focus on blood relations logical puzzles, SQL commands, and basic networking. Highlight academic project databases during panels.",
      projects: "A basic relational database project showing clear CRUD operations matches the HCLTech GET requirements.",
      skills: "Highlight SQL databases, core coding, and computer networks on your CV."
    }
  },
  {
    slug: "tech-mahindra",
    name: "Tech Mahindra",
    overview: "Tech Mahindra is a major Indian IT services multinatonal offering digital transformation consulting and enterprise IT operations.",
    difficulty: "Medium",
    salaryRange: "₹3.25 - ₹5.5 LPA",
    rolesHired: ["Associate Software Engineer (ASE)", "Technical Support Trainee"],
    eligibility: "B.E/B.Tech/MCA/M.Sc with 60% throughout standard academic record.",
    selectionRatio: "12 - 15%",
    prepTime: "20 Days",
    packageValue: "₹3.25 - ₹5.5 LPA",
    activeRounds: 3,
    mustHaveSkills: ["C/C++ or Java basics", "SQL queries", "Object-Oriented Programming"],
    goodToHaveSkills: ["Technical MCQ (Networks, OS)", "Aptitude and Reasoning"],
    bonusSkills: ["Cloud foundations", "Version control (Git)"],
    oaPattern: {
      sections: ["Quantitative Aptitude", "Logical Reasoning", "English Essay/Verbal", "Technical/Coding MCQ"],
      cutoff: "60%",
      timeLimit: "90 Minutes",
      totalQuestions: 75
    },
    hiringProcess: [
      {
        name: "Online Assessment",
        duration: "90 Mins",
        difficulty: "Medium",
        tips: "Verbal and English essays are graded. Practice coding MCQs on loop dry runs. Quantitative section is basic."
      },
      {
        name: "Technical Interview",
        duration: "25 Mins",
        difficulty: "Medium",
        tips: "Review fundamental OOP definitions, C/C++ pointers, and simple table joins. You may be asked to write a basic loops code."
      },
      {
        name: "HR Interview",
        duration: "15 Mins",
        difficulty: "Easy",
        tips: "Assesses communication, willingness to rotate shifts, relocations, and salary checks."
      }
    ],
    oaQuestions: [
      {
        id: "tm-q1",
        type: "verbal",
        question: "Choose the word closest in meaning to: 'OBSTINATE'",
        options: ["Stubborn", "Flexible", "Friendly", "Clever"],
        answer: "Stubborn",
        explanation: "Obstinate means refusing to change one's opinion or chosen course of action, which is synonymous with stubborn."
      },
      {
        id: "tm-q2",
        type: "coding",
        question: "Write code to count the number of vowels in a string.",
        answer: "function countVowels(str) { return (str.match(/[aeiou]/gi) || []).length; }",
        explanation: "Using regex match to pull all vowels (case insensitive) and returning the length of matched array."
      }
    ],
    questionBank: [
      {
        id: "tm-qb1",
        category: "OOP",
        type: "Technical",
        question: "What is an Abstract class and how does it differ from an Interface?",
        answer: "An Abstract class can contain both abstract methods (without body) and concrete methods (with body), and can hold instance variables. An Interface can only contain abstract methods (fully abstract prior to Java 8) and public static final constants. A class can implement multiple interfaces, but inherit only one class."
      },
      {
        id: "tm-qb2",
        category: "SQL",
        type: "Technical",
        question: "Explain SQL COMMIT and ROLLBACK transactions.",
        answer: "COMMIT saves all database transactions permanently. ROLLBACK undoes transaction modifications, returning the database to its last committed state."
      }
    ],
    experiences: [
      {
        id: "tm-exp1",
        student: "Richa Gupta",
        role: "Associate Software Engineer",
        year: "2025",
        outcome: "Selected",
        story: "The assessment verbal section had an essay writing prompt. The interview was conversational, touching on OOP, Java Abstract classes, and my graduation project structure."
      }
    ],
    roadmap30: [
      "Days 1-7: Revise English vocabulary and write test essays.",
      "Days 8-14: Master SQL COMMIT, ROLLBACK, and basic joins.",
      "Days 15-20: Practice coding strings and loop counters."
    ],
    roadmap60: [
      "Days 1-20: Aptitude practice and computer science basics.",
      "Days 21-40: SQL databases, OOP concepts, and sorting coding tasks.",
      "Days 41-60: Project audits, mock sessions, and behavioral HR prep."
    ],
    roadmap90: [
      "Days 1-30: Foundation analytical sections and core coding.",
      "Days 31-60: Databases, network layers, and system structures.",
      "Days 61-90: Practice advanced test mocks, mock interviews, and final checks."
    ],
    plannerChecklist: [
      "Practice 5 vocabulary and synonym checks.",
      "Code a string vowel count algorithm.",
      "Understand Abstract Class vs Interface differences.",
      "Explain database COMMIT vs ROLLBACK statements."
    ],
    copilotAnswers: {
      ready: "Your Tech Mahindra readiness index is 75%. Verbal scores are good. Review database transactions and Java interfaces to ensure interview clearance.",
      crack: "Focus on English essay formats, SQL database commit states, and basic programming concepts. Highlight academic projects clearly.",
      projects: "Web application databases or basic inventory systems show the backend skills preferred at Tech Mahindra.",
      skills: "Ensure programming basics, SQL transactions, and OOP guidelines are on your CV."
    }
  },
  {
    slug: "amazon",
    name: "Amazon",
    overview: "Amazon is a global technology giant specializing in e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.",
    difficulty: "Hard",
    salaryRange: "₹15.0 - ₹28.0 LPA",
    rolesHired: ["Software Development Engineer I (SDE-1)", "Cloud Support Associate", "System Engineer Analyst"],
    eligibility: "B.E/B.Tech/MCA/M.Tech with strong coding foundations, no active backlogs.",
    selectionRatio: "2 - 3%",
    prepTime: "60 Days",
    packageValue: "₹15.0 - ₹28.0 LPA",
    activeRounds: 5,
    mustHaveSkills: ["Advanced DSA (Graphs, Trees, DP)", "Amazon Leadership Principles", "System Design basics"],
    goodToHaveSkills: ["Relational Database Queries", "Object-Oriented Design"],
    bonusSkills: ["AWS Cloud Architectures", "High Concurrency Designs"],
    oaPattern: {
      sections: ["DSA Coding Test (2 questions)", "Work Simulation (Leadership)", "System Design MCQ"],
      cutoff: "80%",
      timeLimit: "140 Minutes",
      totalQuestions: 24
    },
    hiringProcess: [
      {
        name: "Resume Screening",
        duration: "1 Week",
        difficulty: "Medium",
        tips: "Highly selective. Emphasize open-source contributions, robust complex backend projects, and algorithmic awards."
      },
      {
        name: "Online Assessment (OA)",
        duration: "140 Mins",
        difficulty: "Hard",
        tips: "Features 2 coding questions on HackerRank (usually medium-hard DSA graph/tree/string queries) and a Leadership Work simulation."
      },
      {
        name: "Technical Rounds (2-3 Rounds)",
        duration: "60 Mins each",
        difficulty: "Hard",
        tips: "Strict focus on DSA structures. Expect method audits on optimization (reducing Big O space and time complexities)."
      },
      {
        name: "Bar Raiser Interview (Managerial)",
        duration: "60 Mins",
        difficulty: "Hard",
        tips: "Interweaves technical problem-solving with strict grading on Amazon's 16 Leadership Principles (e.g. Customer Obsession)."
      }
    ],
    oaQuestions: [
      {
        id: "amz-q1",
        type: "coding",
        question: "Given an array of integers representing item weights, find the minimum number of packages needed to carry them if each package has weight capacity K.",
        answer: "function minPackages(weights, k) { weights.sort((a,b)=>a-b); let l = 0, r = weights.length-1, pkgs=0; while(l<=r) { if(weights[l]+weights[r]<=k) { l++; } r--; pkgs++; } return pkgs; }",
        explanation: "Sort weights and use a two-pointer approach pairing lightest and heaviest items within limit K."
      },
      {
        id: "amz-q2",
        type: "mcq",
        question: "Which Leadership Principle emphasizes taking ownership and not sacrificing long-term value for short-term results?",
        options: ["Customer Obsession", "Ownership", "Bias for Action", "Frugality"],
        answer: "Ownership",
        explanation: "Ownership states leaders act on behalf of the entire company, think long-term, and do not say 'that is not my job'."
      }
    ],
    questionBank: [
      {
        id: "amz-qb1",
        category: "DSA",
        type: "Technical",
        question: "Explain the Dijkstra algorithm and its time complexity.",
        answer: "Dijkstra finds the shortest path from a source node to all other nodes in a weighted graph. Using a priority queue (min-heap) and adjacency list representation, its time complexity is O((V + E) log V), where V is vertices and E is edges."
      },
      {
        id: "amz-qb2",
        category: "Behavioral",
        type: "Behavioral",
        question: "Give an example of a time you failed to meet a deadline and how you handled it.",
        answer: "Assess using Ownership and Customer Obsession. Explain: Situation (college project delay), Task (deliver features), Action (proactively notified stakeholders, refactored scope, worked extra hours), Result (delivered core system, minimized delays)."
      }
    ],
    experiences: [
      {
        id: "amz-exp1",
        student: "Rohan Das",
        role: "SDE 1 Graduate",
        year: "2025",
        outcome: "Selected",
        story: "The OA was highly challenging, testing dynamic programming and ownership decisions. Three interview rounds followed. The Bar Raiser round tested graph nodes and asked 4 leadership scenario questions."
      }
    ],
    roadmap30: [
      "Days 1-10: Review advanced tree and graph algorithms (BFS, DFS, Dijkstra).",
      "Days 11-20: Solve 30 LeetCode Medium challenges on Strings and Arrays.",
      "Days 21-30: Study Amazon's 16 Leadership Principles and prepare 2 STAR stories for each."
    ],
    roadmap60: [
      "Days 1-20: Dynamic Programming, Graph Traversals, and complex trees.",
      "Days 21-40: Object-Oriented design, system design basics, and SQL database tuning.",
      "Days 41-60: Leadership mock interviews, advanced LeetCode sessions, and resume audits."
    ],
    roadmap90: [
      "Days 1-30: Core algorithmic structures and LeetCode easy-medium coding.",
      "Days 31-60: System design, advanced databases, and Leadership Principles.",
      "Days 61-90: Practice mock Bar Raiser rounds, advanced coding simulations, and target revisions."
    ],
    plannerChecklist: [
      "Solve 2 graph shortest-path LeetCode coding challenges.",
      "Draft two STAR stories targeting Customer Obsession and Ownership.",
      "Understand Dijkstra's algorithm structures.",
      "Verify system design cache topologies."
    ],
    copilotAnswers: {
      ready: "Your Amazon readiness index is 70%. DSA skills are good. Focus on advanced graphs and Leadership Principles to clear the Bar Raiser panels.",
      crack: "Excel in Graph BFS/DFS, priority queues, and dynamic programming. Memorize and draft structural stories representing Amazon's Leadership Principles.",
      projects: "High-throughput server designs showing Redis cache layers, Docker load balances, or transaction queues align well with SDE requirements.",
      skills: "Ensure Advanced DSA, System Design, and REST API structures are highlighted on your CV."
    }
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    overview: "Microsoft is a global technology leader famous for Windows, Azure cloud services, developer tooling, and database systems.",
    difficulty: "Hard",
    salaryRange: "₹16.0 - ₹30.0 LPA",
    rolesHired: ["Software Engineer (SDE-1)", "Azure Consultant", "Support Engineer"],
    eligibility: "B.E/B.Tech/MCA/M.Tech with exceptional programming foundations.",
    selectionRatio: "2 - 3%",
    prepTime: "60 Days",
    packageValue: "₹16.0 - ₹30.0 LPA",
    activeRounds: 4,
    mustHaveSkills: ["Advanced DSA (Trees, Graphs, Recursion)", "Operating System Concepts", "System Design basics"],
    goodToHaveSkills: ["Cloud Architectures", "C# or C++ object coding"],
    bonusSkills: ["Distributed Cache Systems", "Azure Services"],
    oaPattern: {
      sections: ["Codility Assessment (3 coding questions)"],
      cutoff: "85%",
      timeLimit: "120 Minutes",
      totalQuestions: 3
    },
    hiringProcess: [
      {
        name: "Codility Online Test",
        duration: "120 Mins",
        difficulty: "Hard",
        tips: "Features 3 coding tasks. Heavy focus on dynamic edge cases, correct space-time bounds, and large input checks."
      },
      {
        name: "Technical Interview (2-3 Rounds)",
        duration: "45 Mins each",
        difficulty: "Hard",
        tips: "Strict focus on logical pointers, tree structures (e.g. BST tree traversals), memory processes, and system structures."
      },
      {
        name: "As Appropriate (AA) Round (System & HR)",
        duration: "60 Mins",
        difficulty: "Hard",
        tips: "Focuses on candidate growth mindset, adaptation, system design fundamentals, and behavioral criteria."
      }
    ],
    oaQuestions: [
      {
        id: "ms-q1",
        type: "coding",
        question: "Find the maximum binary gap in a number's binary representation.",
        answer: "function maxGap(N) { const bin = N.toString(2); let max = 0, current = 0, counting = false; for(let char of bin) { if(char === '1') { if(counting) max = Math.max(max, current); current = 0; counting = true; } else if(counting) { current++; } } return max; }",
        explanation: "Convert N to binary string. Loop characters tracking distance between consecutive '1' bits."
      },
      {
        id: "ms-q2",
        type: "mcq",
        question: "Which CPU scheduling algorithm scheduling is optimal in terms of minimizing average waiting time?",
        options: ["First Come First Served (FCFS)", "Shortest Job First (SJF)", "Round Robin", "Priority Scheduling"],
        answer: "Shortest Job First (SJF)",
        explanation: "Shortest Job First (SJF) is mathematically optimal as it processes shorter tasks first, minimizing wait queues."
      }
    ],
    questionBank: [
      {
        id: "ms-qb1",
        category: "OS",
        type: "Technical",
        question: "Explain Paging and how it prevents memory fragmentation.",
        answer: "Paging is a memory management scheme that eliminates the need for contiguous allocation of physical memory. It divides virtual memory into pages and physical memory into frames. This resolves external fragmentation as any free frame can be allocated."
      },
      {
        id: "ms-qb2",
        category: "System Design",
        type: "Technical",
        question: "What is a Load Balancer and what are its standard routing algorithms?",
        answer: "A Load Balancer distributes incoming network traffic across multiple servers. Algorithms include: Round Robin, Least Connections, IP Hash, and Weighted Round Robin."
      }
    ],
    experiences: [
      {
        id: "ms-exp1",
        student: "Meghna Roy",
        role: "Software Engineer SDE-1",
        year: "2025",
        outcome: "Selected",
        story: "The Codility test featured questions on matrix structures and binary gap. The interviews focused on tree traversals, memory allocations in OS, and a basic design question on a distributed URL shortener."
      }
    ],
    roadmap30: [
      "Days 1-10: Master tree algorithms, binary search trees, and traversals.",
      "Days 11-20: Study Operating System concepts: paging, threads, CPU scheduling.",
      "Days 21-30: Solve 25 Codility format coding questions."
    ],
    roadmap60: [
      "Days 1-20: Advanced trees, graph algorithms, and OS memory topics.",
      "Days 21-40: System Design patterns, load balancers, and cache topologies.",
      "Days 41-60: Mock technical interviews, resume tuning, and growth mindset preparations."
    ],
    roadmap90: [
      "Days 1-30: Algorithmic tree structures and OS concepts.",
      "Days 31-60: Databases, system design, and cloud setups.",
      "Days 61-90: Practice Codility simulations, mock technical rounds, and final presentation panels."
    ],
    plannerChecklist: [
      "Solve 2 LeetCode Tree/BST coding challenges.",
      "Review operating system CPU scheduling models.",
      "Understand load balancer routing algorithms.",
      "Prepare a STAR format story showing a growth mindset."
    ],
    copilotAnswers: {
      ready: "Your Microsoft readiness index is 71%. DSA skills look solid. Review Operating System details and System Design to ensure interview clearance.",
      crack: "Excel in tree structures (BST traversals), OS paging models, and thread processes. Practice explaining load balancer algorithms for design rounds.",
      projects: "High-performance distributed applications showing cache integrations or cloud load balances align well with SDE profiles.",
      skills: "Ensure Advanced DSA, Operating Systems, and System Design are highlighted on your CV."
    }
  },
  {
    slug: "google",
    name: "Google",
    overview: "Google is a global technology leader focusing on search engine development, cloud systems, and AI models.",
    difficulty: "Extreme",
    salaryRange: "₹18.0 - ₹35.0 LPA",
    rolesHired: ["Software Engineer (SWE)", "Associate Cloud Engineer", "Site Reliability Engineer (SRE)"],
    eligibility: "B.E/B.Tech/MCA/M.Tech with world-class coding abilities.",
    selectionRatio: "1 - 2%",
    prepTime: "90 Days",
    packageValue: "₹18.0 - ₹35.0 LPA",
    activeRounds: 5,
    mustHaveSkills: ["Advanced DSA (Graphs, Dynamic Programming, Segment Trees)", "System Design (Scalability)", "Google 'Googly' attributes"],
    goodToHaveSkills: ["Operating System internals", "Network protocols"],
    bonusSkills: ["AI/ML Frameworks", "Kubernetes cluster setups"],
    oaPattern: {
      sections: ["Google Online Challenge (2 coding questions)"],
      cutoff: "90%",
      timeLimit: "90 Minutes",
      totalQuestions: 2
    },
    hiringProcess: [
      {
        name: "Google Online Challenge (GOC)",
        duration: "90 Mins",
        difficulty: "Hard",
        tips: "Extremely selective. Coding questions test advanced graph structures or complex dynamic programming constraints."
      },
      {
        name: "Technical Interviews (3-4 rounds)",
        duration: "45 Mins each",
        difficulty: "Hard",
        tips: "Expect complex algorithmic modifications. Focus on explaining time-space bounds and dry running edge cases on whiteboard sheets."
      },
      {
        name: "Googlyness & Leadership Interview",
        duration: "45 Mins",
        difficulty: "Medium",
        tips: "Assesses cultural fit, bias checks, ethical decision-making, and collaboration dynamics."
      }
    ],
    oaQuestions: [
      {
        id: "goog-q1",
        type: "coding",
        question: "Given a graph of network connections, find the minimum edge additions needed to make all nodes reachable from a source server.",
        answer: "function minConnections(nodes, edges) { /* graph connectivity analysis using Disjoint Set Union (DSU) */ }",
        explanation: "Using DSU to track connected components and finding parent paths."
      },
      {
        id: "goog-q2",
        type: "mcq",
        question: "Which data structure is optimal for autocomplete search queries?",
        options: ["Hash Table", "Binary Search Tree", "Trie", "Red-Black Tree"],
        answer: "Trie",
        explanation: "A Trie (Prefix Tree) search takes O(L) time where L is word length, making it ideal for prefix matches."
      }
    ],
    questionBank: [
      {
        id: "goog-qb1",
        category: "DSA",
        type: "Technical",
        question: "Explain the difference between Dijkstra and Bellman-Ford algorithms.",
        answer: "Dijkstra is faster, running in O((V + E) log V) with priority queues, but cannot handle negative edge weights. Bellman-Ford is slower, taking O(V * E) time, but can handle negative weights and detect negative cycles."
      },
      {
        id: "goog-qb2",
        category: "Behavioral",
        type: "Behavioral",
        question: "Describe a time you proposed an innovative solution to a coding blocker.",
        answer: "Use the STAR approach. Focus on identifying bottlenecks (e.g. O(N^2) latency), researching prefix options (Tries), presenting structures to peers, and achieving scale speedups."
      }
    ],
    experiences: [
      {
        id: "goog-exp1",
        student: "Aniket Sharma",
        role: "Software Engineer SDE-1",
        year: "2025",
        outcome: "Selected",
        story: "The GOC was tough, focusing on dynamic graph arrays. Four interview rounds followed. The code checks were intensive, testing trie algorithms and Googlyness situations."
      }
    ],
    roadmap30: [
      "Days 1-10: Master prefix structures, tries, segment trees, and priority heaps.",
      "Days 11-20: Solve 30 LeetCode Hard challenges on graphs and trees.",
      "Days 21-30: Practice whiteboard coding dry runs without IDE aids."
    ],
    roadmap60: [
      "Days 1-20: Graph algorithms, dynamic programming, and data structures.",
      "Days 21-40: System Design patterns, load balancers, caching, and database schemas.",
      "Days 41-60: Whiteboard exercises, Googlyness prep, and resume audits."
    ],
    roadmap90: [
      "Days 1-30: Core data structures, graph traversals, and complexity checks.",
      "Days 31-60: Advanced system design, scaling, and networks.",
      "Days 61-90: Whitespace coding, mock technical interviews, and final presentations."
    ],
    plannerChecklist: [
      "Solve 2 LeetCode Hard graph connectivity problems.",
      "Understand Trie data structure setups.",
      "Prepare a STAR format story showing Googlyness.",
      "Explain Dijkstra vs Bellman-Ford differences."
    ],
    copilotAnswers: {
      ready: "Your Google readiness index is 65%. DSA algorithms need optimization. Excel in Trie setups and advanced graphs to clear the GOC coding filters.",
      crack: "Focus on Graph BFS/DFS, priority queues, and dynamic programming. Practice writing clean code without IDE compilers.",
      projects: "High-throughput server designs showing Redis cache layers, segment trees, or transaction queues align well with SWE profiles.",
      skills: "Ensure Advanced DSA, Prefix Trees, and System Design are highlighted on your CV."
    }
  },
  {
    slug: "adobe",
    name: "Adobe",
    overview: "Adobe is a global leader in digital media and marketing solutions, famous for creative software tools and developer APIs.",
    difficulty: "Hard",
    salaryRange: "₹14.0 - ₹25.0 LPA",
    rolesHired: ["Software Engineer (SDE-1)", "Member of Technical Staff (MTS)", "Quality Engineer"],
    eligibility: "B.E/B.Tech/MCA/M.Tech with strong computer science fundamentals.",
    selectionRatio: "3 - 5%",
    prepTime: "45 Days",
    packageValue: "₹14.0 - ₹25.0 LPA",
    activeRounds: 4,
    mustHaveSkills: ["C++ or Java programming", "Advanced DSA (Trees, Graphs, DP)", "Object-Oriented Design"],
    goodToHaveSkills: ["System Design basics", "Operating System memory"],
    bonusSkills: ["Image Processing basics", "Distributed systems"],
    oaPattern: {
      sections: ["Aptitude and Logic Test", "Coding Assessment (2 questions)"],
      cutoff: "80%",
      timeLimit: "100 Minutes",
      totalQuestions: 32
    },
    hiringProcess: [
      {
        name: "Online Assessment (OA)",
        duration: "100 Mins",
        difficulty: "Hard",
        tips: "Quantitative sections test logic. Coding assessment requires solving 2 questions (medium-hard array/tree manipulations)."
      },
      {
        name: "Technical Rounds (2 rounds)",
        duration: "45 Mins each",
        difficulty: "Hard",
        tips: "Review pointer calculations, tree traversals, database structures, and OOP design patterns in C++/Java."
      },
      {
        name: "Director's Round (HR & Tech)",
        duration: "45 Mins",
        difficulty: "Hard",
        tips: "Focuses on candidate design choices, career goals, team dynamics, and behavioral parameters."
      }
    ],
    oaQuestions: [
      {
        id: "adb-q1",
        type: "coding",
        question: "Reverse a linked list in groups of given size K.",
        answer: "function reverseK(head, k) { /* recursive node reversing */ }",
        explanation: "Standard list algorithm reversing sub-lists of size K and linking them."
      },
      {
        id: "adb-q2",
        type: "mcq",
        question: "Which OOP design pattern is used to instantiate objects without exposing initialization logic?",
        options: ["Singleton Pattern", "Factory Pattern", "Observer Pattern", "Adapter Pattern"],
        answer: "Factory Pattern",
        explanation: "Factory pattern defines an interface for creating objects, letting subclasses decide which class to instantiate."
      }
    ],
    questionBank: [
      {
        id: "adb-qb1",
        category: "OOP",
        type: "Technical",
        question: "Explain the difference between Virtual functions and Pure Virtual functions in C++.",
        answer: "A Virtual function has a definition in base class and can be overridden by subclasses. A Pure Virtual function has no definition in base class (e.g. virtual void func() = 0) and MUST be overridden by subclasses, making the base class abstract."
      },
      {
        id: "adb-qb2",
        category: "OS",
        type: "Technical",
        question: "What is thrashing in operating system virtual memory?",
        answer: "Thrashing occurs when the virtual memory paging system spends more time swapping pages in and out of disk than executing processes, leading to low CPU utilization."
      }
    ],
    experiences: [
      {
        id: "adb-exp1",
        student: "Mehul Sen",
        role: "MTS Software Developer",
        year: "2025",
        outcome: "Selected",
        story: "The OA tested aptitude and coding (linked list reverse, array difference). The interview rounds focused on pointers, C++ virtual functions, and memory management."
      }
    ],
    roadmap30: [
      "Days 1-10: Master pointer logic, virtual functions, and class behaviors in C++.",
      "Days 11-20: Study advanced trees, graphs, and dynamic programming.",
      "Days 21-30: Solve 20 LeetCode Medium challenges on arrays."
    ],
    roadmap60: [
      "Days 1-20: Advanced pointer math, OOP structures, and C++ memory layouts.",
      "Days 21-40: System Design patterns, load balancers, caching, and database schemas.",
      "Days 41-60: Mock interviews, resume audits, and director's round prep."
    ],
    roadmap90: [
      "Days 1-30: Core data structures, graph traversals, and complexity checks.",
      "Days 31-60: Advanced system design, scaling, and networks.",
      "Days 61-90: Whitespace coding, mock technical interviews, and final presentations."
    ],
    plannerChecklist: [
      "Solve 2 LeetCode linked list coding challenges.",
      "Understand C++ pure virtual function structures.",
      "Explain the Factory design pattern.",
      "Review operating system memory page models."
    ],
    copilotAnswers: {
      ready: "Your Adobe readiness index is 73%. DSA coding looks solid. Review C++ virtual functions and pointer structures to ensure interview success.",
      crack: "Focus on pointer math, OOP virtual properties, and tree sorting structures. Practice explaining factory design patterns for design rounds.",
      projects: "High-performance graphics scripts, image tools, or custom database engines align well with MTS profiles.",
      skills: "Ensure Advanced C++ concepts, memory models, and data structures are highlighted on your CV."
    }
  },
  {
    slug: "oracle",
    name: "Oracle",
    overview: "Oracle is a global database leader famous for cloud systems, enterprise databases, and developer tools.",
    difficulty: "Hard",
    salaryRange: "₹12.0 - ₹22.0 LPA",
    rolesHired: ["Member of Technical Staff (MTS)", "Cloud Developer", "Database Administrator"],
    eligibility: "B.E/B.Tech/MCA/M.Tech with strong database and coding fundamentals.",
    selectionRatio: "3 - 5%",
    prepTime: "45 Days",
    packageValue: "₹12.0 - ₹22.0 LPA",
    activeRounds: 4,
    mustHaveSkills: ["SQL and Database Normalizations", "Advanced DSA (Trees, Graphs, DP)", "Java/C++ coding"],
    goodToHaveSkills: ["Operating System threads", "System Design basics"],
    bonusSkills: ["Cloud architecture setups", "High-performance queries"],
    oaPattern: {
      sections: ["Oracle Aptitude Test", "Technical MCQ (SQL, OOP)", "Coding Assessment (2 questions)"],
      cutoff: "80%",
      timeLimit: "110 Minutes",
      totalQuestions: 42
    },
    hiringProcess: [
      {
        name: "Online Assessment (OA)",
        duration: "110 Mins",
        difficulty: "Hard",
        tips: "SQL and database MCQs are challenging. Coding questions test array and binary search configurations."
      },
      {
        name: "Technical Interviews (2 rounds)",
        duration: "45 Mins each",
        difficulty: "Hard",
        tips: "Review SQL normalizations, join logic, index speeds, pointer memory, and tree traversals."
      },
      {
        name: "Director's Round (HR & Tech)",
        duration: "45 Mins",
        difficulty: "Hard",
        tips: "Focuses on candidate design choices, career goals, team dynamics, and database insights."
      }
    ],
    oaQuestions: [
      {
        id: "ora-q1",
        type: "coding",
        question: "Find the starting node of a loop in a linked list.",
        answer: "function detectCycle(head) { /* Floyd's Cycle detection algorithm */ }",
        explanation: "Using fast and slow pointers to detect loop and find starting node."
      },
      {
        id: "ora-q2",
        type: "mcq",
        question: "Which SQL clause is used to filter records after grouping them?",
        options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
        answer: "HAVING",
        explanation: "HAVING filters records after grouping, whereas WHERE filters before grouping."
      }
    ],
    questionBank: [
      {
        id: "ora-qb1",
        category: "SQL",
        type: "Technical",
        question: "What is database indexing and how does it speed up queries?",
        answer: "Indexing is a data structure technique (B-Trees) that speeds up data retrieval. It creates a pointer map to rows, reducing disk I/O operations."
      },
      {
        id: "ora-qb2",
        category: "OS",
        type: "Technical",
        question: "Explain the difference between a Process and a Thread.",
        answer: "A Process is an executing program instance with isolated memory space. A Thread is a lightweight sub-process sharing memory space with parent process, allowing faster context switching."
      }
    ],
    experiences: [
      {
        id: "ora-exp1",
        student: "Ravi Teja",
        role: "MTS Database Developer",
        year: "2025",
        outcome: "Selected",
        story: "The OA tested database MCQs and coding (cycle detection, binary search). The interview rounds focused on database indexes, normalizations, and memory threads."
      }
    ],
    roadmap30: [
      "Days 1-10: Master SQL database joins, index speeds, and normalizations.",
      "Days 11-20: Study advanced trees, graphs, and search algorithms.",
      "Days 21-30: Solve 20 LeetCode Medium challenges on database queries."
    ],
    roadmap60: [
      "Days 1-20: Database indexes, normalizations, and SQL optimization.",
      "Days 21-40: System Design patterns, load balancers, caching, and database schemas.",
      "Days 41-60: Mock interviews, resume audits, and director's round prep."
    ],
    roadmap90: [
      "Days 1-30: Core data structures, graph traversals, and complexity checks.",
      "Days 31-60: Advanced system design, scaling, and networks.",
      "Days 61-90: Whitespace coding, mock technical interviews, and final presentations."
    ],
    plannerChecklist: [
      "Solve 2 LeetCode linked list detect cycle challenges.",
      "Understand database indexing structures.",
      "Explain HAVING vs WHERE SQL clauses.",
      "Review operating system thread structures."
    ],
    copilotAnswers: {
      ready: "Your Oracle readiness index is 75%. Database skills are good. Review pointer memory and tree traversals to ensure interview clearance.",
      crack: "Focus on SQL optimizations, database indexing, and tree traversals. Practice explaining thread context switching in OS rounds.",
      projects: "High-performance database scripts, server tools, or transaction engines align well with MTS profiles.",
      skills: "Ensure Advanced SQL, DBMS normalizations, and memory models are highlighted on your CV."
    }
  },
  {
    slug: "salesforce",
    name: "Salesforce",
    overview: "Salesforce is a global leader in customer relationship management (CRM) software, cloud platforms, and developer systems.",
    difficulty: "Hard",
    salaryRange: "₹15.0 - ₹28.0 LPA",
    rolesHired: ["Software Engineer (SDE-1)", "Member of Technical Staff (MTS)", "Cloud Developer"],
    eligibility: "B.E/B.Tech/MCA/M.Tech with strong computer science and coding foundations.",
    selectionRatio: "2 - 3%",
    prepTime: "60 Days",
    packageValue: "₹15.0 - ₹28.0 LPA",
    activeRounds: 4,
    mustHaveSkills: ["Advanced DSA (Graphs, Trees, DP)", "Object-Oriented Design (OOD)", "System Design basics"],
    goodToHaveSkills: ["Relational Database Queries", "Cloud computing services"],
    bonusSkills: ["Java/Apex coding", "High concurrency designs"],
    oaPattern: {
      sections: ["HackerRank Assessment (3 coding questions)"],
      cutoff: "85%",
      timeLimit: "120 Minutes",
      totalQuestions: 3
    },
    hiringProcess: [
      {
        name: "HackerRank Online Test",
        duration: "120 Mins",
        difficulty: "Hard",
        tips: "Features 3 coding tasks. Heavy focus on dynamic edge cases, correct space-time bounds, and large input checks."
      },
      {
        name: "Technical Interviews (2-3 Rounds)",
        duration: "45 Mins each",
        difficulty: "Hard",
        tips: "Review pointer structures, tree traversals (e.g. BST tree traversals), memory processes, and system structures."
      },
      {
        name: "Director's Round (System & HR)",
        duration: "60 Mins",
        difficulty: "Hard",
        tips: "Focuses on candidate design choices, career goals, team dynamics, and cloud setups."
      }
    ],
    oaQuestions: [
      {
        id: "sf-q1",
        type: "coding",
        question: "Find the maximum sum of non-adjacent nodes in a binary tree.",
        answer: "function maxNonAdjacentSum(root) { /* recursive tree node selector */ }",
        explanation: "Using dynamic programming on trees, tracking max sum including or excluding current node."
      },
      {
        id: "sf-q2",
        type: "mcq",
        question: "Which database normal form ensures that there are no transitive functional dependencies?",
        options: ["First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "Boyce-Codd Normal Form (BCNF)"],
        answer: "Third Normal Form (3NF)",
        explanation: "Third Normal Form requires a table to be in 2NF and have no transitive functional dependencies."
      }
    ],
    questionBank: [
      {
        id: "sf-qb1",
        category: "OOP",
        type: "Technical",
        question: "Explain the Solid principles of Object-Oriented Design.",
        answer: "SOLID stands for: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion. They ensure maintainable software design."
      },
      {
        id: "sf-qb2",
        category: "System Design",
        type: "Technical",
        question: "What is an API Gateway and what are its core functionalities?",
        answer: "An API Gateway acts as a reverse proxy, routing client requests to backend services. Core functionalities include: authentication, rate limiting, logging, caching, and load balancing."
      }
    ],
    experiences: [
      {
        id: "sf-exp1",
        student: "Varun Mehta",
        role: "Software Engineer SDE-1",
        year: "2025",
        outcome: "Selected",
        story: "The HackerRank test featured questions on matrix structures and binary gap. The interviews focused on tree traversals, memory allocations in OS, and a basic design question on a distributed URL shortener."
      }
    ],
    roadmap30: [
      "Days 1-10: Master tree algorithms, binary search trees, and traversals.",
      "Days 11-20: Study SOLID principles, design patterns, and database keys.",
      "Days 21-30: Solve 25 Codility format coding questions."
    ],
    roadmap60: [
      "Days 1-20: Advanced trees, graph algorithms, and OS memory topics.",
      "Days 21-40: System Design patterns, load balancers, caching, and database schemas.",
      "Days 41-60: Mock technical interviews, resume tuning, and growth mindset preparations."
    ],
    roadmap90: [
      "Days 1-30: Algorithmic tree structures and OS concepts.",
      "Days 31-60: Databases, system design, and cloud setups.",
      "Days 61-90: Practice Codility simulations, mock technical rounds, and final presentation panels."
    ],
    plannerChecklist: [
      "Solve 2 LeetCode Tree/BST coding challenges.",
      "Understand SOLID design principles.",
      "Explain the API Gateway concept.",
      "Review cloud database structures."
    ],
    copilotAnswers: {
      ready: "Your Salesforce readiness index is 71%. DSA skills look solid. Review SOLID principles and System Design to ensure interview clearance.",
      crack: "Excel in tree structures (BST traversals), OS paging models, and thread processes. Practice explaining load balancer algorithms for design rounds.",
      projects: "High-performance distributed applications showing cache integrations or cloud load balances align well with SDE profiles.",
      skills: "Ensure Advanced DSA, SOLID principles, and System Design are highlighted on your CV."
    }
  }
];
