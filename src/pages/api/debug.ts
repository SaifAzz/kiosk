import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get session details
    const sessionInfo = {
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        countryId: session.user.countryId,
        countryName: session.user.countryName,
      }
    };
    
    // Get all countries
    const countries = await prisma.country.findMany();
    
    // Get products by country ID
    const products = await prisma.product.findMany({
      where: session.user.countryId ? { countryId: session.user.countryId } : {},
    });
    
    // Check if image files exist in the public directory
    const productImages = products.map(p => p.image);
    
    return res.status(200).json({
      session: sessionInfo,
      countries,
      productCount: products.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        countryId: p.countryId,
        image: p.image
      })),
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    return res.status(500).json({ message: 'Server error', error: String(error) });
  }
} 