import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid country ID' });
  }

  if (req.method === 'GET') {
    try {
      const country = await prisma.country.findUnique({
        where: { id },
      });

      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }

      return res.status(200).json(country);
    } catch (error) {
      console.error('Error fetching country:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 