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
  
  // Only admins can manage petty cash
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  // Ensure countryId exists
  if (!countryId) {
    return res.status(400).json({ message: 'Country ID is required' });
  }
  
  if (req.method === 'GET') {
    try {
      const country = await prisma.country.findUnique({
        where: { id: countryId },
        select: {
          id: true,
          name: true,
          pettyCash: true,
        },
      });
      
      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }
      
      return res.status(200).json(country);
    } catch (error) {
      console.error('Error fetching petty cash info:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { amount, operation, description } = req.body;
      
      if (!amount || !operation || !['add', 'subtract'].includes(operation)) {
        return res.status(400).json({ 
          message: 'Invalid request. Amount and operation (add/subtract) are required.' 
        });
      }
      
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
      }
      
      // Get current country data
      const country = await prisma.country.findUnique({
        where: { id: countryId },
      });
      
      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }
      
      // Calculate new petty cash value
      const newPettyCash = operation === 'add' 
        ? country.pettyCash + parsedAmount 
        : country.pettyCash - parsedAmount;
      
      // Ensure petty cash doesn't go negative
      if (newPettyCash < 0) {
        return res.status(400).json({ 
          message: 'Insufficient petty cash. Cannot subtract more than available balance.' 
        });
      }
      
      // Update petty cash
      const updatedCountry = await prisma.country.update({
        where: { id: countryId },
        data: {
          pettyCash: newPettyCash,
        },
      });
      
      // Log the petty cash transaction
      await prisma.pettyCashLog.create({
        data: {
          amount: parsedAmount,
          operation,
          description: description || '',
          countryId,
          userId: session.user.id,
        },
      });
      
      return res.status(200).json({
        success: true,
        pettyCash: updatedCountry.pettyCash,
        message: `Petty cash ${operation === 'add' ? 'increased' : 'decreased'} by $${parsedAmount.toFixed(2)}`
      });
    } catch (error) {
      console.error('Error updating petty cash:', error);
      return res.status(500).json({ message: 'Failed to update petty cash' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 