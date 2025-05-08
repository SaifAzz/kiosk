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
  
  // Only admins can perform settlements
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const { countryId } = session.user;
  
  if (req.method === 'POST') {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      // Get user and check if they belong to the admin's country
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          countryId,
        },
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get all unsettled transactions for the user
      const unsettledTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          settled: false,
        },
      });
      
      if (unsettledTransactions.length === 0) {
        return res.status(400).json({ message: 'No unsettled transactions found for this user' });
      }
      
      // Calculate total settlement amount
      const totalSettlement = unsettledTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
      
      // Update transactions and user balance in a transaction
      await prisma.$transaction(async (tx) => {
        // Mark all transactions as settled
        await tx.transaction.updateMany({
          where: {
            id: {
              in: unsettledTransactions.map(t => t.id),
            },
          },
          data: {
            settled: true,
          },
        });
        
        // Update user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: 0,
          },
        });
        
        // Update petty cash
        await tx.country.update({
          where: { id: countryId },
          data: {
            pettyCash: {
              increment: totalSettlement,
            },
          },
        });
      });
      
      return res.status(200).json({
        message: 'Settlement successful',
        userId,
        settledAmount: totalSettlement,
        transactionCount: unsettledTransactions.length,
      });
    } catch (error) {
      console.error('Error settling balance:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 