import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with premium data...');

  // Clean up in reverse order
  await prisma.attendance.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.internalMark.deleteMany();
  await prisma.result.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.timetable.deleteMany();
  
  await prisma.alumni.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.admin.deleteMany();
  
  await prisma.subject.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const commonPass = await bcrypt.hash('123', 10);

  // 1. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin',
      password: commonPass,
      role: 'ADMIN',
      admin: {
        create: { name: 'System Administrator' }
      }
    }
  });

  // Create Departments & Courses
  const cseDept = await prisma.department.create({
    data: { name: 'Computer Science and Engineering', code: 'CSE' }
  });

  const btechCse = await prisma.course.create({
    data: { name: 'B.Tech in Computer Science', code: 'BTECH-CSE', departmentId: cseDept.id }
  });

  const sectionA = await prisma.section.create({
    data: { name: 'Section A', courseId: btechCse.id }
  });

  // Create Subjects
  const dbms = await prisma.subject.create({
    data: { name: 'Database Management Systems', code: 'CS301', credits: 4, courseId: btechCse.id }
  });

  const ai = await prisma.subject.create({
    data: { name: 'Artificial Intelligence', code: 'CS401', credits: 4, courseId: btechCse.id }
  });

  // Create Faculty
  const facultyUser = await prisma.user.create({
    data: {
      email: 'fac',
      password: commonPass,
      role: 'FACULTY',
      faculty: {
        create: {
          employeeId: 'FAC001',
          firstName: 'Sarah',
          lastName: 'Smith',
          departmentId: cseDept.id,
          subjects: { connect: [{ id: dbms.id }, { id: ai.id }] }
        }
      }
    }
  });

  // Create Student
  const studentUser = await prisma.user.create({
    data: {
      email: 'stu',
      password: commonPass,
      role: 'STUDENT',
      student: {
        create: {
          rollNumber: 'STU001',
          registrationNo: 'REG2023001',
          firstName: 'John',
          lastName: 'Doe',
          departmentId: cseDept.id,
          courseId: btechCse.id,
          sectionId: sectionA.id,
          currentSemester: 5,
          branch: 'CSE',
          cgpa: 8.5
        }
      }
    }
  });

  // Create Alumni
  const alumniUser = await prisma.user.create({
    data: {
      email: 'alumni',
      password: commonPass,
      role: 'ALUMNI',
      alumni: {
        create: {
          firstName: 'John',
          lastName: 'Alumni',
          graduationYear: 2022,
          department: 'Computer Science and Engineering',
          companyName: 'Tech Corp',
          currentPosition: 'Software Engineer',
          linkedinProfile: 'https://linkedin.com/in/johnalumni',
          contactNumber: '+1234567890'
        }
      }
    }
  });

  const facultyRecord = await prisma.faculty.findUnique({ where: { userId: facultyUser.id } });

  // Seed Timetables for Section A
  await prisma.timetable.createMany({
    data: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'Room 301', type: 'LECTURE', subjectId: dbms.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 1, startTime: '10:00', endTime: '11:00', room: 'Room 301', type: 'LECTURE', subjectId: ai.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 1, startTime: '11:00', endTime: '11:30', room: 'Cafeteria', type: 'BREAK' },
      { dayOfWeek: 1, startTime: '11:30', endTime: '13:30', room: 'Lab 4A', type: 'LAB', subjectId: dbms.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      
      { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', room: 'Room 301', type: 'LECTURE', subjectId: ai.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 2, startTime: '10:00', endTime: '11:00', room: 'Room 301', type: 'LECTURE', subjectId: dbms.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 2, startTime: '11:00', endTime: '11:30', room: 'Cafeteria', type: 'BREAK' },
      { dayOfWeek: 2, startTime: '11:30', endTime: '12:30', room: 'Room 301', type: 'LECTURE', subjectId: dbms.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },

      { dayOfWeek: 3, startTime: '09:00', endTime: '11:00', room: 'Lab 4B', type: 'LAB', subjectId: ai.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 3, startTime: '11:00', endTime: '11:30', room: 'Cafeteria', type: 'BREAK' },
      { dayOfWeek: 3, startTime: '11:30', endTime: '12:30', room: 'Room 301', type: 'LECTURE', subjectId: dbms.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },

      { dayOfWeek: 4, startTime: '09:00', endTime: '10:00', room: 'Room 301', type: 'LECTURE', subjectId: dbms.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 4, startTime: '10:00', endTime: '11:00', room: 'Room 301', type: 'LECTURE', subjectId: ai.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 4, startTime: '11:00', endTime: '11:30', room: 'Cafeteria', type: 'BREAK' },
      
      { dayOfWeek: 5, startTime: '09:00', endTime: '10:00', room: 'Room 301', type: 'LECTURE', subjectId: ai.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 5, startTime: '10:00', endTime: '12:00', room: 'Lab 4A', type: 'LAB', subjectId: dbms.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 5, startTime: '12:00', endTime: '13:00', room: 'Cafeteria', type: 'BREAK' },
      
      { dayOfWeek: 6, startTime: '09:00', endTime: '11:00', room: 'Seminar Hall', type: 'LECTURE', subjectId: ai.id, sectionId: sectionA.id, facultyId: facultyRecord?.id },
      { dayOfWeek: 6, startTime: '11:00', endTime: '11:30', room: 'Cafeteria', type: 'BREAK' },
    ]
  });

  // Seed Assignments for DBMS
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'ER Diagrams and Normalization',
      description: 'Draw ER diagrams for a university system and normalize to 3NF.',
      dueDate: nextWeek,
      subjectId: dbms.id
    }
  });

  const studentRecord = await prisma.student.findUnique({ where: { userId: studentUser.id } });

  // Submission for the assignment
  await prisma.assignmentSubmission.create({
    data: {
      fileUrl: '/uploads/sample.pdf',
      status: 'GRADED',
      marks: 9,
      remarks: 'Excellent work, diagrams are very clear.',
      studentId: studentRecord?.id || '',
      assignmentId: assignment1.id,
      submittedAt: new Date()
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
