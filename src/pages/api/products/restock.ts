import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // All authenticated users can restock products now
    
    // Ensure countryId is not null
    const { countryId } = session.user;
    if (!countryId) {
      console.error('countryId is null in the session', session);
      return res.status(400).json({ message: 'Invalid country ID' });
    }
    
    if (req.method === 'POST') {
      try {
        const { productId, quantity, newCost } = req.body;
        
        if (!productId || !quantity || quantity <= 0) {
          return res.status(400).json({ message: 'Invalid request data' });
        }
        
        // Check if the country exists
        const country = await prisma.country.findUnique({
          where: { id: countryId },
          select: { id: true }
        });
        
        // If country doesn't exist, create it first
        if (!country) {
          await prisma.country.create({
            data: {
              id: countryId,
              name: session.user.countryName || "Iraq",
              pettyCash: 0,
            },
          });
        }
        
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });
        
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
        
        // Update product stock and possibly cost
        const updatedProduct = await prisma.product.update({
          where: { id: productId },
          data: {
            stock: { increment: parseInt(quantity) },
            ...(newCost ? { purchaseCost: parseFloat(newCost) } : {}),
          },
        });
        
        // Update petty cash
        const costPerUnit = newCost ? parseFloat(newCost) : product.purchaseCost;
        await prisma.country.update({
          where: { id: product.countryId },
          data: {
            pettyCash: {
              decrement: costPerUnit * parseInt(quantity),
            },
          },
        });
        
        return res.status(200).json(updatedProduct);
      } catch (error) {
        console.error('Error restocking product:', error);
        return res.status(500).json({ message: 'Failed to restock product. Please try again.' });
      }
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error in restock API:', error);
    return res.status(500).json({ message: 'Server error, please try again later' });
  }
} 