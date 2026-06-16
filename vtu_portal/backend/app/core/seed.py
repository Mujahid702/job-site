import asyncio
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import SessionLocal, engine
from app.models.academic import University, Subject, Module, SyllabusTopic

# Realistic VTU syllabus modules definition
SYLLABUS_DATA = {
    "DBMS": {
        "name": "Database Management Systems",
        "code": "21CS42",
        "semester": 4,
        "branch": "Computer Science & Engineering",
        "modules": [
            {
                "number": 1,
                "name": "Introduction to Databases & ER Model",
                "description": "Characteristics of database approach, data models, schemas, ER diagrams, entity types, and key attributes.",
                "topics": ["Database Systems", "ER Diagrams", "Weak Entity Types", "Attribute Mapping"]
            },
            {
                "number": 2,
                "name": "Relational Model & SQL",
                "description": "Relational model constraints, relational algebra, SQL DDL/DML, joins, subqueries, and views.",
                "topics": ["Relational Algebra", "SQL Queries", "Outer Joins", "Views & Triggers"]
            },
            {
                "number": 3,
                "name": "Database Design Theory & Normalization",
                "description": "Functional dependencies, normalization process, 1NF, 2NF, 3NF, and Boyce-Codd Normal Form (BCNF).",
                "topics": ["Functional Dependencies", "3NF Normalization", "BCNF Decomposition", "Lossless Join"]
            },
            {
                "number": 4,
                "name": "Transaction Management & Concurrency Control",
                "description": "Transaction states, ACID properties, schedules, serializability, lock-based protocols, and deadlocks.",
                "topics": ["ACID Properties", "Conflict Serializability", "Two-Phase Locking (2PL)", "Deadlock Detection"]
            },
            {
                "number": 5,
                "name": "Storage, Indexing & Query Processing",
                "description": "Disk storage, file structures, primary/secondary indexing, B-Trees, B+ Trees, and query optimization.",
                "topics": ["B+ Trees", "Primary Indexing", "Hash Joins", "Query Execution Plan"]
            }
        ]
    },
    "OS": {
        "name": "Operating Systems",
        "code": "21CS43",
        "semester": 4,
        "branch": "Computer Science & Engineering",
        "modules": [
            {
                "number": 1,
                "name": "Introduction to OS & System Structures",
                "description": "OS services, system calls, virtual machines, process concepts, operations, and inter-process communication.",
                "topics": ["System Calls", "Process Control Block", "Inter-Process Communication", "Monolithic vs Microkernel"]
            },
            {
                "number": 2,
                "name": "Threads & CPU Scheduling",
                "description": "Multithreading models, CPU scheduler, scheduling criteria, and algorithms (FCFS, SJF, Priority, Round Robin).",
                "topics": ["Multithreading Models", "Round Robin Scheduling", "SJF Algorithm", "Thread pools"]
            },
            {
                "number": 3,
                "name": "Process Synchronization & Deadlocks",
                "description": "Critical-section problem, Peterson's solution, semaphores, monitors, deadlock characterization, and Banker's algorithm.",
                "topics": ["Producer-Consumer Problem", "Semaphores & Mutex", "Deadlock Avoidance", "Banker's Algorithm"]
            },
            {
                "number": 4,
                "name": "Memory Management & Virtual Memory",
                "description": "Paging, segmentation, page replacement algorithms (FIFO, LRU, Optimal), and thrashing.",
                "topics": ["Paging & TLB", "LRU Page Replacement", "Demand Paging", "Thrashing Prevention"]
            },
            {
                "number": 5,
                "name": "File System & Secondary Storage",
                "description": "File concepts, directory structures, allocation methods, free-space management, and disk scheduling algorithms.",
                "topics": ["Disk Scheduling (SSTF/SCAN)", "File Allocation Tables", "Directory Structures", "RAID levels"]
            }
        ]
    },
    "CN": {
        "name": "Computer Networks",
        "code": "21CS44",
        "semester": 4,
        "branch": "Computer Science & Engineering",
        "modules": [
            {
                "number": 1,
                "name": "Application Layer Services",
                "description": "Principles of network apps, web and HTTP, FTP, electronic mail, DNS, and peer-to-peer applications.",
                "topics": ["HTTP Request/Response", "DNS Name Resolution", "SMTP Mail Protocol", "P2P Architecture"]
            },
            {
                "number": 2,
                "name": "Transport Layer Protocols",
                "description": "Multiplexing, connectionless transport (UDP), reliable data transfer, TCP segment, flow control, and congestion control.",
                "topics": ["TCP 3-Way Handshake", "UDP Checksum", "TCP Congestion Window", "Go-Back-N Protocol"]
            },
            {
                "number": 3,
                "name": "Network Layer Routing & IP",
                "description": "Virtual circuit and datagram networks, IP addressing, IPv4, IPv6, routing algorithms (Link State, Distance Vector).",
                "topics": ["IPv4 CIDR Masking", "Dijkstra Link-State", "Distance Vector Routing", "BGP & OSPF"]
            },
            {
                "number": 4,
                "name": "Data Link Layer & LANs",
                "description": "Error-detection/correction (CRC), multiple access protocols (CSMA/CD, CSMA/CA), Ethernet, and wireless LANs.",
                "topics": ["CRC Error Checking", "CSMA/CD Protocol", "ARP Resolution", "Ethernet Frame Structure"]
            },
            {
                "number": 5,
                "name": "Network Security",
                "description": "Principles of cryptography, symmetric/asymmetric keys, message integrity, digital signatures, and firewalls.",
                "topics": ["Symmetric vs Asymmetric Key", "Digital Signatures", "SSL/TLS Handshake", "Firewall Access Lists"]
            }
        ]
    },
    "ML": {
        "name": "Machine Learning",
        "code": "21CS71",
        "semester": 7,
        "branch": "Computer Science & Engineering",
        "modules": [
            {
                "number": 1,
                "name": "Introduction & Concept Learning",
                "description": "Designing a learning system, perspective and issues, concept learning task, Find-S, and Candidate Elimination.",
                "topics": ["Concept Learning", "Find-S Algorithm", "Candidate Elimination", "Inductive Bias"]
            },
            {
                "number": 2,
                "name": "Decision Trees & Neural Networks",
                "description": "Decision tree representation, ID3 algorithm, entropy, information gain, neural net representation, and Backpropagation.",
                "topics": ["Entropy & Information Gain", "Backpropagation Algorithm", "ID3 Decision Trees", "Activation Functions"]
            },
            {
                "number": 3,
                "name": "Bayesian Learning",
                "description": "Bayes theorem, Maximum Likelihood hypothesis, Minimum Description Length, Naive Bayes classifier, and Bayesian belief networks.",
                "topics": ["Bayes Theorem", "Naive Bayes Classifier", "Maximum Likelihood", "EM Algorithm"]
            },
            {
                "number": 4,
                "name": "Instance-Based Learning & SVM",
                "description": "k-Nearest Neighbor learning, locally weighted regression, radial basis functions, and Support Vector Machines.",
                "topics": ["k-Nearest Neighbor (k-NN)", "Support Vector Machines", "Kernel Trick", "Lazy vs Eager Learning"]
            },
            {
                "number": 5,
                "name": "Reinforcement Learning & Clustering",
                "description": "Learning task, Q-learning, K-Means clustering, and hierarchical clustering algorithms.",
                "topics": ["Q-Learning", "K-Means Clustering", "Hierarchical Clustering", "Markov Decision Process"]
            }
        ]
    },
    "SE": {
        "name": "Software Engineering",
        "code": "21CS51",
        "semester": 5,
        "branch": "Computer Science & Engineering",
        "modules": [
            {
                "number": 1,
                "name": "Software Processes & Agile Development",
                "description": "Software process models, waterfall, incremental, spiral, agile methods, extreme programming, and Scrum.",
                "topics": ["Waterfall vs Incremental", "Agile Manifesto", "Scrum Framework", "Requirements Analysis"]
            },
            {
                "number": 2,
                "name": "Requirements Engineering & System Modeling",
                "description": "Functional/non-functional requirements, software requirements document, context models, interaction models, and structural models.",
                "topics": ["Functional Requirements", "Use Case Diagrams", "System Modeling", "Sequence Diagrams"]
            },
            {
                "number": 3,
                "name": "Software Design & Architecture",
                "description": "Design patterns, architectural designs, MVC pattern, repository pattern, and object-oriented design.",
                "topics": ["Architectural Patterns (MVC)", "Design Patterns", "Object-Oriented Design", "Coupling & Cohesion"]
            },
            {
                "number": 4,
                "name": "Software Testing & Evolution",
                "description": "Development testing, release testing, user testing, test-driven development, and software maintenance.",
                "topics": ["Unit & Integration Testing", "Test-Driven Development (TDD)", "Black-Box vs White-Box", "Refactoring"]
            },
            {
                "number": 5,
                "name": "Software Management & Quality",
                "description": "Software pricing, project planning, COCOMO model, risk management, and software standards.",
                "topics": ["COCOMO Estimation Model", "Risk Management", "Software Quality Metrics", "Configuration Management"]
            }
        ]
    }
}

async def seed_vtu_subjects():
    async with SessionLocal() as db:
        print("Checking if University 'VTU' exists...")
        # Check if VTU already exists
        q_uni = await db.execute(select(University).filter_by(short_code="VTU"))
        vtu = q_uni.scalars().first()

        if not vtu:
            print("Creating University 'VTU'...")
            vtu = University(
                name="Visvesvaraya Technological University",
                short_code="VTU",
                website="https://vtu.ac.in",
                is_active=True
            )
            db.add(vtu)
            await db.flush() # Flush to get the generated UUID
        else:
            print("University 'VTU' already exists.")

        for key, value in SYLLABUS_DATA.items():
            print(f"Checking if Subject '{value['code']}' ({key}) exists...")
            q_sub = await db.execute(select(Subject).filter_by(code=value['code']))
            subject = q_sub.scalars().first()

            if not subject:
                print(f"Creating Subject '{value['name']}'...")
                subject = Subject(
                    name=value['name'],
                    code=value['code'],
                    university_id=vtu.id,
                    semester=value['semester'],
                    branch=value['branch'],
                    is_active=True
                )
                db.add(subject)
                await db.flush()
            else:
                print(f"Subject '{value['code']}' already exists.")

            # Create Modules and Topics for each subject
            for m_data in value['modules']:
                # Check if module exists for this subject
                q_mod = await db.execute(
                    select(Module).filter_by(subject_id=subject.id, number=m_data['number'])
                )
                module = q_mod.scalars().first()

                if not module:
                    print(f"  Creating Module {m_data['number']}: {m_data['name']}...")
                    module = Module(
                        subject_id=subject.id,
                        number=m_data['number'],
                        name=m_data['name'],
                        description=m_data['description'],
                        weightage_percent=20.0
                    )
                    db.add(module)
                    await db.flush()
                else:
                    print(f"  Module {m_data['number']} already exists.")

                # Create SyllabusTopics for each module
                for idx, t_name in enumerate(m_data['topics'], 1):
                    # Check if topic exists
                    q_top = await db.execute(
                        select(SyllabusTopic).filter_by(module_id=module.id, name=t_name)
                    )
                    topic = q_top.scalars().first()

                    if not topic:
                        print(f"    Creating Topic {idx}: {t_name}...")
                        topic = SyllabusTopic(
                            module_id=module.id,
                            name=t_name,
                            description=f"Detailed syllabus topic: {t_name}",
                            order_index=idx
                        )
                        db.add(topic)
                    else:
                        print(f"    Topic '{t_name}' already exists.")

        await db.commit()
        print("Successfully seeded all VTU subjects and modules!")

if __name__ == "__main__":
    print("Initializing Database Seeding...")
    asyncio.run(seed_vtu_subjects())
