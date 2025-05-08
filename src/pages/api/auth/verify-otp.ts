import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, otp, isAdmin, countryId } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find the user based on email
    let user = null;
    if (isAdmin === 'true') {
      user = await prisma.admin.findFirst({ 
        where: { 
          email: email
        }
      });
    } else {
      user = await prisma.user.findFirst({ 
        where: { 
          email: email,
          countryId: countryId || undefined 
        } 
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if OTP matches and is not expired
    if (user.otpCode !== otp || !user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Clear the OTP after successful verification
    if (isAdmin === 'true') {
      await prisma.admin.update({
        where: { id: user.id },
        data: {
          otpCode: null,
          otpExpiry: null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: null,
          otpExpiry: null,
        },
      });
    }

    // Check if this is a newly created user (has a temporary phone number)
    const isNewUser = isAdmin !== 'true' && 
      'phoneNumber' in user && 
      user.phoneNumber && 
      user.phoneNumber.startsWith('temp_');

    // Create a session token
    const token = sign(
      {
        id: user.id,
        name: isAdmin === 'true' ? (user as any).username : (user as any).phoneNumber,
        email: user.email || '',
        role: isAdmin === 'true' ? 'admin' : 'user',
        countryId: countryId // Always include the countryId for both admin and regular users
      },
      process.env.NEXTAUTH_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: isAdmin === 'true' ? (user as any).username : (user as any).phoneNumber,
        email: user.email || '',
        role: isAdmin === 'true' ? 'admin' : 'user',
        countryId: countryId
      },
      isNewUser: isNewUser // Flag to indicate if this is a newly created user
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
} 