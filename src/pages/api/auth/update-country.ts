import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Get the current session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { countryId } = req.body;

    if (!countryId) {
      return res.status(400).json({ message: 'Country ID is required' });
    }

    // Verify the country exists
    const country = await prisma.country.findUnique({
      where: { id: countryId },
    });

    if (!country) {
      return res.status(404).json({ message: 'Country not found' });
    }

    // Get the JWT token from the request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return res.status(401).json({ message: 'Session token not found' });
    }

    // Update the user's country in the database
    if (session.user.role === 'admin') {
      await prisma.admin.update({
        where: { id: session.user.id },
        data: { lastSelectedCountryId: countryId },
      });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { countryId },
      });
    }

    // The token will need to be refreshed on the client side by redirecting or reloading the page
    
    return res.status(200).json({ 
      success: true, 
      message: 'Country updated successfully',
      countryId,
      countryName: country.name
    });
  } catch (error: any) {
    console.error('Update country error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 