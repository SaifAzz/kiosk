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
  
  const { countryId, role } = session.user;
  
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  if (req.method === 'GET') {
    try {
      const whereClause = countryId ? { countryId } : {};
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          phoneNumber: true,
          balance: true,
          createdAt: true,
          updatedAt: true,
          countryId: true,
          country: {
            select: {
              name: true,
            },
          },
          transactions: {
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              total: true,
              createdAt: true,
              settled: true,
              items: {
                select: {
                  quantity: true,
                  price: true,
                  product: {
                    select: {
                      name: true,
                    }
                  }
                }
              }
            },
          },
        },
        orderBy: {
          phoneNumber: 'asc',
        },
      });
      
      const enhancedUsers = users.map(user => {
        const totalTransactions = user.transactions.length;
        const totalSpent = user.transactions.reduce((sum, tx) => sum + tx.total, 0);
        const settledTransactions = user.transactions.filter(tx => tx.settled).length;
        const unsettledTransactions = user.transactions.filter(tx => !tx.settled).length;
        
        const productCounts = {};
        user.transactions.forEach(tx => {
          tx.items.forEach(item => {
            const productName = item.product.name;
            if (!productCounts[productName]) {
              productCounts[productName] = 0;
            }
            productCounts[productName] += item.quantity;
          });
        });
        
        const mostPurchasedProducts = Object.entries(productCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 products
        
        return {
          id: user.id,
          phoneNumber: user.phoneNumber,
          balance: user.balance,
          countryName: user.country?.name || 'Unknown',
          createdAt: user.createdAt,
          totalTransactions,
          totalSpent,
          settledTransactions,
          unsettledTransactions,
          currentBalance: user.balance,
          mostPurchasedProducts,
          transactions: user.transactions,
        };
      });
      
      return res.status(200).json(enhancedUsers);
    } catch (error) {
      console.error('Error generating user report:', error);
      return res.status(500).json({ message: 'Failed to generate report' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 