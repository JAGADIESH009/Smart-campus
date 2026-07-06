import { prisma } from '../src/lib/prisma';
import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Setup Supabase admin client for creating auth users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Clearing database...');
  // Be careful with this in production!
  await prisma.fee.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.section.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.student.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.alumni.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.admin.deleteMany();

  console.log('Seeding roles...');
  const roles = ['STUDENT', 'FACULTY', 'ADMIN', 'ALUMNI'];
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r },
      update: {},
      create: { name: r, description: `${r} Role` }
    });
  }

  const studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  const facultyRole = await prisma.role.findUnique({ where: { name: 'FACULTY' } });

  if (!studentRole || !facultyRole) throw new Error("Roles missing");

  console.log('Seeding departments & courses...');
  const deptsData = [
    { name: 'Computer Science and Engineering', code: 'CSE' },
    { name: 'Computer Science and Engineering (AI & ML)', code: 'CSE-AIML' },
    { name: 'Electronics and Communication Engineering', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Master of Business Administration', code: 'MBA' }
  ];

  const createdDepts = [];
  for (const d of deptsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: { name: d.name, code: d.code, description: `Department of ${d.name}` }
    });
    createdDepts.push(dept);
  }

  const coursesData = [
    { name: 'B.Tech Computer Science', code: 'BT-CSE', deptCode: 'CSE' },
    { name: 'B.Tech AI & ML', code: 'BT-AIML', deptCode: 'CSE-AIML' },
    { name: 'B.Tech ECE', code: 'BT-ECE', deptCode: 'ECE' },
    { name: 'M.Tech Software Engineering', code: 'MT-SE', deptCode: 'CSE' },
    { name: 'MBA General', code: 'MBA-GEN', deptCode: 'MBA' }
  ];

  const createdCourses = [];
  for (const c of coursesData) {
    const dept = createdDepts.find(d => d.code === c.deptCode);
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: { name: c.name, code: c.code, departmentId: dept!.id }
    });
    createdCourses.push(course);
  }

  console.log('Seeding semesters & sections...');
  const semester = await prisma.semester.create({
    data: {
      name: 'Fall 2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-15')
    }
  });

  const cseCourse = createdCourses.find(c => c.code === 'BT-CSE');
  const sectionA = await prisma.section.create({
    data: {
      name: 'Section A',
      courseId: cseCourse!.id
    }
  });

  console.log('Seeding subjects...');
  const subjectsData = [
    { name: 'Data Structures', code: 'CS201', credits: 4 },
    { name: 'Database Management Systems', code: 'CS301', credits: 4 },
    { name: 'Operating Systems', code: 'CS401', credits: 4 },
    { name: 'Computer Networks', code: 'CS501', credits: 3 },
    { name: 'Artificial Intelligence', code: 'CS601', credits: 4 }
  ];

  const createdSubjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: {
        name: s.name,
        code: s.code,
        credits: s.credits,
        courseId: cseCourse!.id,
        semesterId: semester.id
      }
    });
    createdSubjects.push(subject);
  }

  console.log('Seeding mock Faculty...');
  async function createFakeUser(roleName: string, roleId: string) {
    const email = faker.internet.email().toLowerCase();
    const password = 'Password123!';
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const { data: authData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName, role: roleName }
    });

    if (error) {
      console.error('Supabase user creation failed:', error.message);
      return null;
    }

    const userId = authData.user.id;

    await prisma.user.create({
      data: {
        id: userId,
        email,
        roleId,
        profile: {
          create: {
            firstName,
            lastName,
            contactNumber: faker.phone.number(),
            address: faker.location.streetAddress(),
            dateOfBirth: faker.date.birthdate({ mode: 'age', min: 18, max: 25 }),
            gender: faker.helpers.arrayElement(['Male', 'Female']),
            bloodGroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+'])
          }
        }
      }
    });

    return userId;
  }

  const createdFacultyIds = [];
  for (let i = 0; i < 5; i++) {
    const userId = await createFakeUser('FACULTY', facultyRole!.id);
    if (userId) {
      const faculty = await prisma.faculty.create({
        data: {
          userId,
          employeeId: `EMP${faker.string.numeric(4)}`,
          departmentId: createdDepts[0].id,
          designation: faker.helpers.arrayElement(['Assistant Professor', 'Associate Professor', 'Professor'])
        }
      });
      createdFacultyIds.push(faculty.id);
    }
  }

  for (let i = 0; i < createdSubjects.length; i++) {
    await prisma.subject.update({
      where: { id: createdSubjects[i].id },
      data: { facultyId: createdFacultyIds[i % createdFacultyIds.length] }
    });
  }

  console.log('Seeding Timetable...');
  for (let day = 1; day <= 5; day++) {
    await prisma.timetable.create({
      data: {
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '10:30',
        room: `Room ${faker.string.numeric(3)}`,
        building: 'Main Block',
        subjectId: createdSubjects[0].id,
        sectionId: sectionA.id,
        facultyId: createdFacultyIds[0]
      }
    });
    await prisma.timetable.create({
      data: {
        dayOfWeek: day,
        startTime: '11:00',
        endTime: '12:30',
        room: `Lab ${faker.string.numeric(2)}`,
        building: 'Science Block',
        subjectId: createdSubjects[1].id,
        sectionId: sectionA.id,
        facultyId: createdFacultyIds[1],
        type: 'LAB'
      }
    });
    // Add Lunch Break
    await prisma.timetable.create({
      data: {
        dayOfWeek: day,
        startTime: '12:30',
        endTime: '13:30',
        room: 'Cafeteria',
        building: 'Student Center',
        type: 'LUNCH',
        sectionId: sectionA.id
      }
    });
  }

  console.log('Seeding mock Students...');
  const studentIds = [];
  for (let i = 0; i < 10; i++) {
    const userId = await createFakeUser('STUDENT', studentRole!.id);
    if (userId) {
      const student = await prisma.student.create({
        data: {
          userId,
          registrationNo: `REG${faker.string.numeric(6)}`,
          rollNumber: `26CSE${faker.string.numeric(3)}`,
          departmentId: createdDepts[0].id,
          courseId: cseCourse!.id,
          sectionId: sectionA.id,
          semesterId: semester.id,
          cgpa: faker.number.float({ min: 6.0, max: 9.9, fractionDigits: 1 }),
          parentName: faker.person.fullName(),
          parentContact: faker.phone.number()
        }
      });
      studentIds.push(student.id);

      await prisma.fee.create({
        data: {
          title: 'Tuition Fee - Fall 2026',
          amount: 50000,
          dueDate: new Date('2026-09-01'),
          status: faker.helpers.arrayElement(['PAID', 'PENDING']),
          studentId: student.id,
          semesterId: semester.id
        }
      });
      await prisma.fee.create({
        data: {
          title: 'Library Fee - Fall 2026',
          amount: 2000,
          dueDate: new Date('2026-09-01'),
          status: 'PENDING',
          studentId: student.id,
          semesterId: semester.id
        }
      });
    }
  }

  console.log('Seeding Attendance & Assignments...');
  const pastDates: Date[] = [];
  for(let i=0; i<15; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if(d.getDay() > 0 && d.getDay() < 6) pastDates.push(d);
  }

  for (const subject of createdSubjects) {
    const assignment = await prisma.assignment.create({
      data: {
        title: `${subject.name} - Assignment 1`,
        description: 'Complete the theoretical questions listed in the attached document.',
        dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        subjectId: subject.id,
        maxMarks: 100,
        attachments: ['https://example.com/assignment-question.pdf']
      }
    });

    for (const studentId of studentIds) {
      if (faker.datatype.boolean()) {
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            studentId: studentId,
            fileUrl: 'https://placeholder.com/doc.pdf',
            attachments: ['https://placeholder.com/doc.pdf'],
            status: 'PENDING'
          }
        });
      }
    }

    for (const date of pastDates) {
      const attendance = await prisma.attendance.create({
        data: {
          date: date,
          subjectId: subject.id,
          hour: 1
        }
      });

      for (const studentId of studentIds) {
        await prisma.attendanceRecord.create({
          data: {
            attendanceId: attendance.id,
            studentId: studentId,
            status: faker.helpers.weightedArrayElement([
              { weight: 85, value: 'PRESENT' },
              { weight: 10, value: 'ABSENT' },
              { weight: 5, value: 'LATE' }
            ])
          }
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
