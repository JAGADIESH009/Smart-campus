import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Dashboard Stats
router.get('/dashboard', authenticate, authorize(['FACULTY']), async (req: AuthRequest, res) => {
  try {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: req.user?.id },
      include: { subjects: { include: { course: { include: { sections: true } } } } }
    });
    if (!faculty) return res.status(404).json({ message: 'Faculty profile not found' });

    const courseIds = faculty.subjects.map(sub => sub.courseId);
    const totalStudents = await prisma.student.count({
      where: { courseId: { in: courseIds } }
    });

    const pendingReviews = await prisma.assignmentSubmission.count({
      where: {
        status: 'SUBMITTED',
        assignment: { subject: { facultyId: faculty.id } }
      }
    });

    res.json({
      totalStudents,
      subjectsTeaching: faculty.subjects.length,
      pendingReviews,
      todaysClasses: 2
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Hierarchy: Subjects -> Sections
router.get('/hierarchy', authenticate, authorize(['FACULTY']), async (req: AuthRequest, res) => {
  try {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: req.user?.id },
      include: {
        subjects: {
          include: {
            course: {
              include: { sections: true }
            }
          }
        }
      }
    });
    
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    
    // Structure: Subject -> Sections
    const hierarchy = faculty.subjects.map(sub => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      sections: sub.course.sections.map(sec => ({
        id: sec.id,
        name: sec.name
      }))
    }));

    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Students List by Subject & Section
router.get('/subjects/:subjectId/sections/:sectionId/students', authenticate, authorize(['FACULTY']), async (req: AuthRequest, res) => {
  try {
    const { sectionId, subjectId } = req.params;
    
    const students = await prisma.student.findMany({
      where: { sectionId },
      include: {
        user: { select: { email: true } },
        attendances: { where: { subjectId } },
        submissions: { where: { assignment: { subjectId } } }
      }
    });

    // Compute stats for each student
    const formatted = students.map(st => {
      const totalAtt = st.attendances.length;
      const presentAtt = st.attendances.filter(a => a.status === 'PRESENT').length;
      const attPercent = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 100;
      
      return {
        id: st.id,
        name: `${st.firstName} ${st.lastName}`,
        rollNumber: st.rollNumber,
        registrationNo: st.registrationNo,
        email: st.user.email,
        contactNumber: st.contactNumber,
        attendancePercent: attPercent.toFixed(1),
        submissionsCount: st.submissions.length,
        profilePhoto: st.profilePhoto
      }
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk Attendance Marking
router.post('/attendance/bulk', authenticate, authorize(['FACULTY']), async (req: AuthRequest, res) => {
  try {
    const { date, hour, subjectId, attendanceList } = req.body; 
    // attendanceList = [{ studentId, status, remarks }]
    
    const faculty = await prisma.faculty.findUnique({ where: { userId: req.user?.id } });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    const attendanceDate = new Date(date);
    
    const ops = attendanceList.map((record: any) => 
      prisma.attendance.upsert({
        where: {
          date_hour_studentId_subjectId: {
            date: attendanceDate,
            hour: parseInt(hour),
            studentId: record.studentId,
            subjectId
          }
        },
        update: {
          status: record.status,
          remarks: record.remarks,
          facultyId: faculty.id
        },
        create: {
          date: attendanceDate,
          hour: parseInt(hour),
          status: record.status,
          remarks: record.remarks,
          studentId: record.studentId,
          subjectId,
          facultyId: faculty.id
        }
      })
    );

    await prisma.$transaction(ops);
    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assignments (View all submissions for faculty)
router.get('/assignments', authenticate, authorize(['FACULTY']), async (req: AuthRequest, res) => {
  try {
    const faculty = await prisma.faculty.findUnique({ where: { userId: req.user?.id } });
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });

    const assignments = await prisma.assignment.findMany({
      where: { subject: { facultyId: faculty.id } },
      include: {
        subject: true,
        submissions: { include: { student: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Grade Assignment
router.post('/assignments/:assignmentId/grade/:studentId', authenticate, authorize(['FACULTY']), async (req: AuthRequest, res) => {
  try {
    const { marks, remarks } = req.body;
    const { assignmentId, studentId } = req.params;

    const submission = await prisma.assignmentSubmission.update({
      where: {
        studentId_assignmentId: { studentId, assignmentId }
      },
      data: {
        marks: parseFloat(marks),
        remarks,
        status: 'GRADED'
      }
    });

    res.json({ message: 'Graded successfully', submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
