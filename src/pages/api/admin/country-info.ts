import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const { countryId } = session.user;
  
  if (req.method === 'GET') {
    try {
      const country = await prisma.country.findUnique({
        where: { id: countryId },
        select: {
          id: true,
          name: true,
          pettyCash: true,
          _count: {
            select: {
              users: true,
              products: true,
              transactions: true,
            },
          },
        },
      });
      
      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }
      
      return res.status(200).json(country);
    } catch (error) {
      console.error('Error fetching country info:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 