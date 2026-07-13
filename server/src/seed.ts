import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { StudentProfile } from './models/StudentProfile.js';
import { Company } from './models/Company.js';
import { Drive } from './models/Drive.js';
import { Notification } from './models/Notification.js';
import { ActivityLog } from './models/ActivityLog.js';
import { hashPassword } from './utils/auth.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placepilot';

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Clear existing data
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await Company.deleteMany({});
    await Drive.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Cleared.');

    const defaultPassword = 'Password123';
    const hashed = await hashPassword(defaultPassword);

    console.log('Creating system admin...');
    const admin = new User({
      name: 'System Admin',
      email: 'admin@placepilot.com',
      passwordHash: hashed,
      role: 'admin',
      isEmailVerified: true,
    });
    await admin.save();

    console.log('Creating placement officers...');
    const officer1 = new User({
      name: 'Officer Dave',
      email: 'officer@placepilot.com',
      passwordHash: hashed,
      role: 'placement_officer',
      isEmailVerified: true,
    });
    await officer1.save();

    const officer2 = new User({
      name: 'Officer Sarah',
      email: 'officer2@placepilot.com',
      passwordHash: hashed,
      role: 'placement_officer',
      isEmailVerified: true,
    });
    await officer2.save();

    console.log('Creating corporate partner companies...');
    const google = new Company({
      name: 'Google LLC',
      website: 'https://google.com',
      industry: 'Technology & Internet Services',
      description: 'Search engine, cloud computing, and AI systems development organization.',
      logoUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=200',
    });
    await google.save();

    const stripe = new Company({
      name: 'Stripe Inc.',
      website: 'https://stripe.com',
      industry: 'Financial Technology',
      description: 'Financial infrastructure platforms and online checkout integrations.',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200',
    });
    await stripe.save();

    const microsoft = new Company({
      name: 'Microsoft Corporation',
      website: 'https://microsoft.com',
      industry: 'Technology & Software',
      description: 'Personal computers, enterprise cloud, and software operating frameworks.',
      logoUrl: 'https://images.unsplash.com/photo-1625014020991-1a22b274299b?auto=format&fit=crop&q=80&w=200',
    });
    await microsoft.save();

    console.log('Creating recruiters...');
    const recruiter1 = new User({
      name: 'Recruiter Alice',
      email: 'recruiter@placepilot.com',
      passwordHash: hashed,
      role: 'recruiter',
      companyId: google._id,
      isEmailVerified: true,
    });
    await recruiter1.save();

    const recruiter2 = new User({
      name: 'Recruiter Bob',
      email: 'recruiter2@placepilot.com',
      passwordHash: hashed,
      role: 'recruiter',
      companyId: stripe._id,
      isEmailVerified: true,
    });
    await recruiter2.save();

    const recruiter3 = new User({
      name: 'Recruiter Charlie',
      email: 'recruiter3@placepilot.com',
      passwordHash: hashed,
      role: 'recruiter',
      companyId: microsoft._id,
      isEmailVerified: true,
    });
    await recruiter3.save();

    console.log('Creating student accounts & student profiles...');
    // Array to keep track of students we seed
    const studentsList: any[] = [];
    const departments = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering'];
    
    const firstNames = ['John', 'Liam', 'Olivia', 'Emma', 'Oliver', 'Ava', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Mia', 'Lucas', 'Mason', 'Ethan', 'Logan', 'Jacob', 'James', 'Aria', 'Ella', 'Jackson', 'Aiden', 'Grace', 'Harper', 'Lily', 'Evelyn', 'Zoe', 'Alexander'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright'];

    const skillsPool = [
      ['React', 'Node.js', 'TypeScript', 'Express', 'MongoDB', 'Python', 'Git'],
      ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'Kubernetes'],
      ['Python', 'Django', 'Machine Learning', 'TensorFlow', 'PostgreSQL', 'Git'],
      ['Angular', 'TypeScript', 'Node.js', 'Express', 'C#', 'SQL Server'],
      ['C++', 'System Design', 'Algorithms', 'Data Structures', 'Linux'],
      ['JavaScript', 'HTML/CSS', 'Tailwind', 'Vue.js', 'Firebase'],
      ['React Native', 'Swift', 'Kotlin', 'Firebase', 'TypeScript', 'GraphQL'],
      ['Go', 'Docker', 'AWS', 'Kubernetes', 'Linux', 'REST APIs', 'NoSQL']
    ];

    // Seed student@placepilot.com as the primary demo student (John Smith)
    const demoStudent = new User({
      name: 'Student John',
      email: 'student@placepilot.com',
      passwordHash: hashed,
      role: 'student',
      isEmailVerified: true,
    });
    await demoStudent.save();

    const demoProfile = new StudentProfile({
      userId: demoStudent._id,
      department: 'Computer Science',
      batch: '2026',
      CGPA: 8.5,
      backlogs: 0,
      skills: ['React', 'Node.js', 'TypeScript', 'Express', 'MongoDB', 'Python', 'AWS', 'Git'],
      certifications: [
        {
          name: 'AWS Certified Cloud Practitioner',
          organization: 'Amazon Web Services',
          issueDate: new Date('2025-01-15'),
        },
      ],
      projects: [
        {
          title: 'E-Commerce Platform',
          description: 'A full-stack online store with shopping cart and payment integration.',
          technologiesUsed: ['React', 'Node.js', 'Express', 'MongoDB'],
          link: 'https://github.com/student/ecommerce',
        },
      ],
      education: [
        {
          institution: 'State Engineering College',
          degree: 'Bachelor of Technology',
          fieldOfStudy: 'Computer Science & Engineering',
          startDate: new Date('2022-08-01'),
          percentageOrCGPA: 8.5,
        },
      ],
      experience: [
        {
          company: 'Tech Solutions Inc.',
          role: 'Web Development Intern',
          description: 'Developed and maintained responsive web applications using React and Tailwind CSS.',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-07-01'),
          isCurrent: false,
        },
      ],
      profileCompletion: 90,
    });
    await demoProfile.save();
    studentsList.push({ user: demoStudent, profile: demoProfile });

    // Seed 26 more students to hit 27 total students
    for (let i = 1; i <= 26; i++) {
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
      const email = `student${i}@placepilot.com`;
      const dept = departments[i % departments.length];
      const cgpa = parseFloat((7.0 + (i % 3) * 0.9 + (i % 2) * 0.25).toFixed(2));
      const backlogs = i % 13 === 0 ? 1 : 0;
      const skills = skillsPool[i % skillsPool.length];

      const studentUser = new User({
        name,
        email,
        passwordHash: hashed,
        role: 'student',
        isEmailVerified: true,
      });
      await studentUser.save();

      const studentProfile = new StudentProfile({
        userId: studentUser._id,
        department: dept,
        batch: '2026',
        CGPA: cgpa,
        backlogs,
        skills,
        profileCompletion: 70 + (i % 4) * 7,
      });
      await studentProfile.save();
      studentsList.push({ user: studentUser, profile: studentProfile });
    }
    console.log(`Seeded ${studentsList.length} student records.`);

    console.log('Seeding Placement Drives...');
    // Drive 1: Google Software Engineer
    const drive1 = new Drive({
      companyId: google._id,
      role: 'Associate Software Engineer Intern',
      packageLPA: 18,
      cgpaCutoff: 8.0,
      backlogCutoff: 0,
      allowedDepartments: ['Computer Science', 'Information Technology'],
      jobDescription: 'Work alongside core engineering teams developing next-gen tools and systems in React, Node, or Go. Build systems pipelines, API interfaces, and write tests.',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days out
      status: 'Active',
      applicants: [],
    });

    // Drive 2: Google Product Manager
    const drive2 = new Drive({
      companyId: google._id,
      role: 'Associate Product Manager',
      packageLPA: 16,
      cgpaCutoff: 7.5,
      backlogCutoff: 0,
      allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
      jobDescription: 'Define product visions, write PRDs, manage cross-functional roadmap schedules, and coordinate feature launches with software engineering architects.',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'Active',
      applicants: [],
    });

    // Drive 3: Stripe Developer
    const drive3 = new Drive({
      companyId: stripe._id,
      role: 'Full-Stack Developer',
      packageLPA: 22,
      cgpaCutoff: 8.5,
      backlogCutoff: 0,
      allowedDepartments: ['Computer Science', 'Information Technology'],
      jobDescription: 'Scale checkout payment processors, build intuitive merchant dashboards with React and Tailwind, and write clean, typed Node.js backend infrastructure.',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'Active',
      applicants: [],
    });

    // Drive 4: Microsoft DevOps
    const drive4 = new Drive({
      companyId: microsoft._id,
      role: 'Azure Systems Engineer',
      packageLPA: 15,
      cgpaCutoff: 7.0,
      backlogCutoff: 1,
      allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering'],
      jobDescription: 'Interface with Azure cloud deployments, troubleshoot virtualization networks using Docker/Kubernetes, and build telemetry monitoring pipelines.',
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: 'Active',
      applicants: [],
    });

    // Drive 5: Microsoft Support (Closed)
    const drive5 = new Drive({
      companyId: microsoft._id,
      role: 'Support Systems Engineer',
      packageLPA: 12,
      cgpaCutoff: 6.5,
      backlogCutoff: 2,
      allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering'],
      jobDescription: 'Troubleshoot virtualization networks, deploy patch rollouts, and support IT infrastructure.',
      deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Ended 3 days ago
      status: 'Closed',
      applicants: [],
    });

    await drive1.save();
    await drive2.save();
    await drive3.save();
    await drive4.save();
    await drive5.save();

    console.log('Seeding student applications & statuses...');
    const allDrives = [drive1, drive2, drive3, drive4, drive5];

    // Helper to calculate eligibility
    const checkEligibility = (studentProfile: any, drive: any) => {
      if (studentProfile.CGPA < drive.cgpaCutoff) return false;
      if (studentProfile.backlogs > drive.backlogCutoff) return false;
      if (!drive.allowedDepartments.includes(studentProfile.department)) return false;
      return true;
    };

    let appsCount = 0;
    // Map applications
    for (const studentData of studentsList) {
      const { user, profile } = studentData;
      
      for (const drive of allDrives) {
        // Random chance of applying (60% chance) if eligible
        if (checkEligibility(profile, drive) && Math.random() < 0.6) {
          let status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Selected' = 'Applied';
          let interviewDate = undefined;
          let interviewTime = undefined;
          let feedback = undefined;

          // Assign deterministic statuses to make the dashboard look populated
          const seedIndex = appsCount;
          if (seedIndex % 5 === 0) {
            status = 'Selected';
            feedback = 'Outstanding performance in both DSA and system design rounds. Highly recommended!';
          } else if (seedIndex % 5 === 1) {
            status = 'Shortlisted';
            interviewDate = '2026-07-25';
            interviewTime = '11:00 AM';
          } else if (seedIndex % 5 === 2) {
            status = 'Rejected';
            feedback = 'Good programming skills but lacked deep understanding of database index performance.';
          }

          drive.applicants.push({
            studentId: user._id,
            appliedAt: new Date(Date.now() - (seedIndex % 6) * 24 * 60 * 60 * 1000),
            status,
            resumeUrl: '/uploads/resumes/sample-resume.pdf',
            feedback,
            interviewDate,
            interviewTime
          });

          // Generate some notifications for the user
          if (status === 'Selected') {
            const notif = new Notification({
              recipient: user._id,
              sender: recruiter1._id,
              title: 'Offer Extended!',
              message: `Congratulations! ${drive.companyId === google._id ? 'Google LLC' : 'Our team'} has offered you the role of ${drive.role}.`,
              type: 'offer_issued',
              isRead: seedIndex % 2 === 0
            });
            await notif.save();
          } else if (status === 'Shortlisted') {
            const notif = new Notification({
              recipient: user._id,
              sender: recruiter1._id,
              title: 'Interview Scheduled',
              message: `You have been shortlisted for ${drive.role} at ${drive.companyId === google._id ? 'Google LLC' : 'Stripe/Microsoft'}. Interview set for ${interviewDate} @ ${interviewTime}.`,
              type: 'interview_scheduled',
              isRead: seedIndex % 2 === 0
            });
            await notif.save();
          }

          appsCount++;
        }
      }
    }

    // Save all drives with new applicants
    for (const drive of allDrives) {
      await drive.save();
    }
    console.log(`Seeded ${appsCount} applications across different drives.`);

    console.log('Seeding global notifications and activity logs...');
    // Seed some announcements/notifications
    for (let i = 0; i < 5; i++) {
      const officerNotif = new Notification({
        recipient: studentsList[i]._id || studentsList[i].user._id,
        sender: officer1._id,
        title: 'New Recruitment Drive Published!',
        message: `Google LLC has announced drive for ${drive1.role} with a package of 18 LPA. Check eligibility now!`,
        type: 'drive_published',
        isRead: false
      });
      await officerNotif.save();
    }

    // Seed Activity Logs
    const logActions = [
      { action: 'USER_LOGIN', target: 'Auth session created successfully' },
      { action: 'DRIVE_CREATE', target: 'Created recruitment drive: Associate Software Engineer' },
      { action: 'PROFILE_UPDATE', target: 'Updated academic CGPA score to 8.5' },
      { action: 'APPLICATION_SUBMIT', target: 'Submitted application for Google Software Engineer' }
    ];

    for (let i = 0; i < 15; i++) {
      const randomStudent = studentsList[i % studentsList.length].user;
      const log = new ActivityLog({
        userId: randomStudent._id,
        userName: randomStudent.name,
        userRole: randomStudent.role,
        action: logActions[i % logActions.length].action,
        target: logActions[i % logActions.length].target,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { timestamp: new Date(Date.now() - i * 60 * 60 * 1000) }
      });
      await log.save();
    }
    console.log('Activity logs seeded.');

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
