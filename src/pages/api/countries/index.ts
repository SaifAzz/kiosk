import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const countries = await prisma.country.findMany({
        select: {
          id: true,
          name: true,
        }
      });
      
      return res.status(200).json(countries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 