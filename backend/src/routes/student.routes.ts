import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { upload } from '../utils/upload';

const router = Router();

// Dashboard Stats
router.get('/dashboard', authenticate, authorize(['STUDENT']), async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user?.id },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Calculate Attendance
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id }
    });
    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const attendancePercent = attendances.length > 0 ? (presentCount / attendances.length) * 100 : 100;

    // Pending Assignments
    const now = new Date();
    const pendingAssignments = await prisma.assignment.count({
      where: {
        dueDate: { gt: now },
        subject: { courseId: student.courseId }
      }
    });

    res.json({
      attendancePercent: parseFloat(attendancePercent.toFixed(1)),
      cgpa: student.cgpa || 0.0,
      pendingAssignments,
      todaysClasses: 3,
      feeDue: 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile
router.get('/profile', authenticate, authorize(['STUDENT']), async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user?.id },
      include: { 
        department: true, 
        course: true,
        section: true,
        user: { select: { email: true } }
      }
    });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assignments
router.get('/assignments', authenticate, authorize(['STUDENT']), async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user?.id },
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Fetch assignments for the student's enrolled courses/subjects
    const assignments = await prisma.assignment.findMany({
      where: {
        subject: { courseId: student.courseId }
      },
      include: {
        subject: true,
        submissions: {
          where: { studentId: student.id }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
    
    // Map data for frontend
    const mapped = assignments.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      subjectName: a.subject.name,
      status: a.submissions.length > 0 ? a.submissions[0].status : 'PENDING',
      fileUrl: a.submissions.length > 0 ? a.submissions[0].fileUrl : null,
      marks: a.submissions.length > 0 ? a.submissions[0].marks : null
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit Assignment
router.post('/assignments/:id/submit', authenticate, authorize(['STUDENT']), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user?.id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Upsert submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        studentId_assignmentId: {
          studentId: student.id,
          assignmentId: assignment.id
        }
      },
      update: {
        fileUrl,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      },
      create: {
        fileUrl,
        status: 'SUBMITTED',
        studentId: student.id,
        assignmentId: assignment.id
      }
    });

    res.json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Attendance Details
router.get('/attendance', authenticate, authorize(['STUDENT']), async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user?.id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const attendance = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { subject: true },
      orderBy: { date: 'desc' }
    });
    
    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      medical: attendance.filter(a => a.status === 'MEDICAL').length,
      duty: attendance.filter(a => a.status === 'DUTY').length,
    };
    
    // Group by subject
    const subjectWise: any = {};
    attendance.forEach(a => {
      if (!subjectWise[a.subject.name]) {
        subjectWise[a.subject.name] = { total: 0, present: 0 };
      }
      subjectWise[a.subject.name].total++;
      if (a.status === 'PRESENT') subjectWise[a.subject.name].present++;
    });

    const subjectStats = Object.keys(subjectWise).map(name => ({
      name,
      percentage: (subjectWise[name].present / subjectWise[name].total) * 100
    }));

    res.json({
      logs: attendance,
      summary,
      subjectStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Timetable
router.get('/timetable', authenticate, authorize(['STUDENT']), async (req: AuthRequest, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user?.id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Get timetable for student's section
    const timetable = await prisma.timetable.findMany({
      where: { sectionId: student.sectionId },
      include: { 
        subject: true,
        // Wait, faculty is in subject or direct. I didn't include faculty relation on Timetable in schema to return faculty details directly?
        // Let's check schema. Timetable has subject, section.
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
