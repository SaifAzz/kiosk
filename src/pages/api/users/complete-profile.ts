import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (session.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can complete their profile' });
    }

    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber,
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Phone number already in use' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneNumber,
        password: req.body.password || Math.random().toString(36).slice(-8)
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        countryId: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Complete profile error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}