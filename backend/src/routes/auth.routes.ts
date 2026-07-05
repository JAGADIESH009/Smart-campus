import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password, portalRole } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Role Enforcement Logic
    // Only Admin can log in through the FACULTY portal if their role is ADMIN
    if (portalRole) {
      if (portalRole === 'FACULTY' && user.role !== 'FACULTY' && user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Invalid credentials for this portal' });
      }
      if (portalRole === 'STUDENT' && user.role !== 'STUDENT') {
        return res.status(403).json({ message: 'Invalid credentials for this portal' });
      }
      if (portalRole === 'ALUMNI' && user.role !== 'ALUMNI') {
        return res.status(403).json({ message: 'Invalid credentials for this portal' });
      }
      // If Admin tries to login via any other portal except Faculty (where we explicitly allow it)
      if (user.role === 'ADMIN' && portalRole !== 'FACULTY') {
        return res.status(403).json({ message: 'Invalid credentials for this portal' });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        student: true,
        faculty: true,
        admin: true,
        alumni: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Exclude password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
