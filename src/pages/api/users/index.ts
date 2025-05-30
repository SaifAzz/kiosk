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
  
  const { countryId } = session.user;
  
  if (req.method === 'GET') {
    try {
      // Create a base query without the where clause
      const queryOptions = {
        select: {
          id: true,
          phoneNumber: true,
          balance: true,
          createdAt: true,
          updatedAt: true,
          transactions: {
            where: {
              settled: false,
            },
            select: {
              id: true,
              total: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          phoneNumber: 'asc',
        },
      };
      
      // Only add where filter if countryId is not null
      const users = await prisma.user.findMany(
        countryId 
          ? {
              ...queryOptions,
              where: { countryId },
            }
          : queryOptions
      );
      
      return res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 