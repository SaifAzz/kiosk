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
      const products = await prisma.product.findMany({
        where: {
          countryId,
        },
        orderBy: {
          name: 'asc',
        }
      });
      
      return res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  if (req.method === 'POST') {
    // Only admins can create products
    if (session.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    try {
      const { name, image, purchaseCost, sellingPrice, stock } = req.body;
      
      if (!name || !image || !purchaseCost || !sellingPrice || !stock) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const product = await prisma.product.create({
        data: {
          name,
          image,
          purchaseCost: parseFloat(purchaseCost),
          sellingPrice: parseFloat(sellingPrice),
          stock: parseInt(stock),
          countryId,
        }
      });
      
      // Update petty cash
      await prisma.country.update({
        where: { id: countryId },
        data: {
          pettyCash: {
            decrement: parseFloat(purchaseCost) * parseInt(stock),
          }
        }
      });
      
      return res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 