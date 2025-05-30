import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

// Extended session user type to include countryName
interface SessionUser {
  id: string;
  name: string;
  role: string;
  countryId: string | null;
  countryName?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { countryId, role } = session.user as SessionUser;
    const sessionUser = session.user as SessionUser;
    
    // For admin users, we'll allow them to proceed even with null countryId
    if (!countryId && role !== 'admin') {
      console.error('countryId is null in the session', session);
      return res.status(400).json({ message: 'Invalid country ID' });
    }
    
    if (req.method === 'GET') {
      try {
        // Only attempt to check country if countryId is provided
        if (countryId) {
          // Check if the country exists first
          const country = await prisma.country.findUnique({
            where: { id: countryId },
            select: { id: true }
          });
          
          // If country doesn't exist, create it first
          if (!country) {
            console.log("Country not found, creating a default country for products API");
            
            // Create a new country with the user's ID
            await prisma.country.create({
              data: {
                id: countryId,
                name: sessionUser.countryName || "Iraq",
                pettyCash: 0,
              },
            });
          }
        }
        
        console.log(`Fetching products for ${countryId ? `country: ${countryId}` : 'all countries (admin)'}`);
        
        // If countryId is null (for admin), get all products, otherwise filter by countryId
        const products = await prisma.product.findMany({
          where: countryId ? { countryId } : {},
          orderBy: {
            name: 'asc',
          }
        });
        
        console.log(`Successfully fetched ${products.length} products`);
        
        return res.status(200).json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ message: 'Unable to fetch products' });
      }
    }
    
    if (req.method === 'POST') {
      try {
        const { name, image, purchaseCost, sellingPrice, stock, countryId: requestCountryId } = req.body;
        
        if (!name || !image || !purchaseCost || !sellingPrice || !stock) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // For admin users, allow them to specify a countryId in the request
        // For regular users, use their session countryId
        const productCountryId = role === 'admin' && requestCountryId ? requestCountryId : countryId;
        
        if (!productCountryId) {
          return res.status(400).json({ 
            message: 'Country ID is required to create products. Please select a country first.' 
          });
        }
        
        // Check if the country exists
        const country = await prisma.country.findUnique({
          where: { id: productCountryId },
          select: { id: true }
        });
        
        // If country doesn't exist, create it first
        if (!country) {
          await prisma.country.create({
            data: {
              id: productCountryId,
              name: sessionUser.countryName || "Iraq",
              pettyCash: 0,
            },
          });
        }
        
        const product = await prisma.product.create({
          data: {
            name,
            image,
            purchaseCost: parseFloat(purchaseCost),
            sellingPrice: parseFloat(sellingPrice),
            stock: parseInt(stock),
            countryId: productCountryId,
          }
        });
        
        // Update petty cash
        await prisma.country.update({
          where: { id: productCountryId },
          data: {
            pettyCash: {
              decrement: parseFloat(purchaseCost) * parseInt(stock),
            }
          }
        });
        
        return res.status(201).json(product);
      } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ message: 'Failed to create product' });
      }
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error in products API:', error);
    return res.status(500).json({ message: 'Server error, please try again later' });
  }
} 