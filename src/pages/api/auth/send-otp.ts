import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { sendOTPEmail } from '../../../lib/mailtrap';

const prisma = new PrismaClient();
const OTP_EXPIRY_MINUTES = 10;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, isAdmin, countryId, isNewUser } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Received OTP request for email:', email, 'isAdmin:', isAdmin, 'countryId:', countryId, 'isNewUser:', isNewUser);

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

    // If this is explicitly a new user request and the user exists, inform the client
    if (isNewUser === 'true' && user) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email address already exists. Please sign in as an existing user.'
      });
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + OTP_EXPIRY_MINUTES);

    if (!user) {
      console.log('User not found with email:', email);
      
      // Create new user if it's not an admin request
      if ((isAdmin !== 'true' && countryId) || isNewUser === 'true') {
        // Generate a temporary unique phone number based on email with additional randomness
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const tempPhoneNumber = `temp_${timestamp}_${randomStr}_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        // Create a new user
        user = await prisma.user.create({
          data: {
            email: email,
            phoneNumber: tempPhoneNumber,
            password: 'temporary_password', // Will be updated later when user completes registration
            countryId: countryId,
            otpCode: otp,
            otpExpiry: expiryTime,
          }
        });
        
        console.log('Created new user with email:', email);
      } else {
        // Don't create admins automatically for security reasons
        return res.status(200).json({ 
          success: true, 
          message: 'If the account exists, an OTP has been sent' 
        });
      }
    } else {
      // Store OTP in database for existing user
      if (isAdmin === 'true') {
        await prisma.admin.update({
          where: { id: user.id },
          data: {
            otpCode: otp,
            otpExpiry: expiryTime,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpCode: otp,
            otpExpiry: expiryTime,
          },
        });
      }
    }

    // Log the OTP for testing
    console.log(`Generated OTP for ${email}: ${otp}`);
    
    try {
      // Send OTP via email
      console.log('Attempting to send email to:', email);
      const emailResult = await sendOTPEmail(email, otp);
      console.log('Email send result:', emailResult);
      
      if (!emailResult.success) {
        console.error('Failed to send OTP email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'If the account exists, an OTP has been sent',
      // Include OTP in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
} 