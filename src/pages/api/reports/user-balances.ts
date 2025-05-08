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
  
  // Only admins can export reports
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const { countryId } = session.user;
  
  if (req.method === 'GET') {
    try {
      // If countryId is null for admin, ask them to select a country
      if (!countryId) {
        return res.status(400).json({ 
          message: 'Please select a country to generate the report.'
        });
      }
      
      const country = await prisma.country.findUnique({
        where: { id: countryId },
      });
      
      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }
      
      const users = await prisma.user.findMany({
        where: {
          countryId,
        },
        include: {
          transactions: {
            where: {
              settled: false,
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
        orderBy: {
          balance: 'desc',
        },
      });
      
      // Generate CSV data
      let csvContent = 'Phone Number,Balance,Unsettled Transactions,Last Purchase Date\n';
      
      for (const user of users) {
        const lastPurchaseDate = user.transactions.length > 0
          ? new Date(Math.max(...user.transactions.map(t => t.createdAt.getTime()))).toLocaleDateString()
          : 'N/A';
        
        csvContent += `${user.phoneNumber},${user.balance.toFixed(2)},${user.transactions.length},${lastPurchaseDate}\n`;
      }
      
      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user-balances-${country.name}-${new Date().toISOString().slice(0, 10)}.csv`);
      
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('Error generating report:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 