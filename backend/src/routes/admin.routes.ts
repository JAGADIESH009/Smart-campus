import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// Global Analytics Dashboard
router.get('/analytics', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const students = await prisma.student.count();
    const faculty = await prisma.faculty.count();
    const departments = await prisma.department.count();
    const courses = await prisma.course.count();
    
    // Calculate global attendance percentage
    const allAtt = await prisma.attendance.findMany();
    let globalAttendance = 100;
    if (allAtt.length > 0) {
      const pres = allAtt.filter(a => a.status === 'PRESENT').length;
      globalAttendance = parseFloat(((pres / allAtt.length) * 100).toFixed(1));
    }

    const revenue = students * 125000; // Simulated tuition fee

    res.json({ students, faculty, departments, courses, revenue, globalAttendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Students List (Comprehensive)
router.get('/students', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { department: true, course: true, section: true, user: { select: { email: true } } }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Faculty List (Comprehensive)
router.get('/faculty', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: { department: true, subjects: true, user: { select: { email: true } } }
    });
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Course & Section Management (Hierarchy)
router.get('/courses', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { 
        department: true,
        sections: { include: { _count: { select: { students: true } } } },
        subjects: true
      }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Departments List
router.get('/departments', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const depts = await prisma.department.findMany();
    res.json(depts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Examination Results (List all internal marks)
router.get('/examinations', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const marks = await prisma.internalMark.findMany({
      include: {
        student: { include: { course: true, section: true } },
        subject: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
