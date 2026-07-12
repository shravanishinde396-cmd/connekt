import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { StudentProfile } from './models/StudentProfile.js';
import { Company } from './models/Company.js';
import { Drive } from './models/Drive.js';
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
    console.log('Cleared.');

    const defaultPassword = 'Password123';
    const hashed = await hashPassword(defaultPassword);

    console.log('Creating seed users...');

    // 1. Admin
    const admin = new User({
      name: 'System Admin',
      email: 'admin@placepilot.com',
      passwordHash: hashed,
      role: 'admin',
      isEmailVerified: true,
    });
    await admin.save();
    console.log('Admin created: admin@placepilot.com / Password123');

    // 2. Placement Officer
    const officer = new User({
      name: 'Officer Dave',
      email: 'officer@placepilot.com',
      passwordHash: hashed,
      role: 'placement_officer',
      isEmailVerified: true,
    });
    await officer.save();
    console.log('Officer created: officer@placepilot.com / Password123');

    // 3. Recruiter
    const recruiter = new User({
      name: 'Recruiter Alice',
      email: 'recruiter@placepilot.com',
      passwordHash: hashed,
      role: 'recruiter',
      isEmailVerified: true,
    });
    await recruiter.save();
    console.log('Recruiter created: recruiter@placepilot.com / Password123');

    // 4. Student
    const student = new User({
      name: 'Student John',
      email: 'student@placepilot.com',
      passwordHash: hashed,
      role: 'student',
      isEmailVerified: true,
    });
    await student.save();

    // Student Profile
    const studentProfile = new StudentProfile({
      userId: student._id,
      department: 'Computer Science',
      batch: '2026',
      CGPA: 8.5,
      backlogs: 0,
      skills: ['React', 'Node.js', 'TypeScript', 'Express', 'MongoDB', 'Python'],
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
      profileCompletion: 85,
    });
    await studentProfile.save();
    console.log('Student created: student@placepilot.com / Password123');

    // Seed Companies
    console.log('Seeding Companies...');
    const google = new Company({
      name: 'Google LLC',
      website: 'https://google.com',
      industry: 'Technology & Internet Services',
      description: 'Search engine, cloud computing, and AI systems development organization.',
      logoUrl: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=200',
    });
    await google.save();

    // Map recruiter to Google LLC
    recruiter.companyId = google._id;
    await recruiter.save();

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
    console.log('Companies seeded.');

    // Seed Drives
    console.log('Seeding Placement Drives...');
    
    // Drive 1: Google
    const googleDrive = new Drive({
      companyId: google._id,
      role: 'Associate Software Engineer Intern',
      packageLPA: 18,
      cgpaCutoff: 8.0,
      backlogCutoff: 0,
      allowedDepartments: ['Computer Science', 'Information Technology'],
      jobDescription: 'Work alongside core engineering teams developing next-gen tools and systems in C++ or Go. Build systems pipelines, API interfaces, and write tests.',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      status: 'Active',
      applicants: [],
    });
    await googleDrive.save();

    // Drive 2: Stripe
    const stripeDrive = new Drive({
      companyId: stripe._id,
      role: 'Full-Stack Developer',
      packageLPA: 22,
      cgpaCutoff: 8.7, // Higher cutoff, Student John (8.5) is ineligible
      backlogCutoff: 0,
      allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
      jobDescription: 'Scale checkout payment processors, build intuitive merchant dashboards, and write clean, typed Node.js/Ruby code.',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'Active',
      applicants: [],
    });
    await stripeDrive.save();

    // Drive 3: Microsoft
    const microsoftDrive = new Drive({
      companyId: microsoft._id,
      role: 'Support Systems Engineer',
      packageLPA: 12,
      cgpaCutoff: 7.0, // Low cutoff, Student John is eligible
      backlogCutoff: 2, // Allows up to 2 backlogs
      allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Electrical Engineering'],
      jobDescription: 'Interface with Azure cloud deployments, troubleshoot virtualization networks, and build telemetry monitoring pipelines.',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Ended 2 days ago
      status: 'Closed',
      applicants: [],
    });
    await microsoftDrive.save();
    console.log('Placement Drives seeded.');

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
