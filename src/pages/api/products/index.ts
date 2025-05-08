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
    
    const { countryId, role } = session.user;
    
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
                name: session.user.countryName || "Iraq",
                pettyCash: 0,
              },
            });
          }
        }
        
        // If countryId is null (for admin), get all products, otherwise filter by countryId
        const products = await prisma.product.findMany({
          where: countryId ? { countryId } : {},
          orderBy: {
            name: 'asc',
          }
        });
        
        return res.status(200).json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ message: 'Unable to fetch products' });
      }
    }
    
    if (req.method === 'POST') {
      // For POST requests, we need a countryId to associate the product with
      if (!countryId) {
        return res.status(400).json({ 
          message: 'Country ID is required to create products. Please select a country first.' 
        });
      }
      
      try {
        const { name, image, purchaseCost, sellingPrice, stock } = req.body;
        
        if (!name || !image || !purchaseCost || !sellingPrice || !stock) {
          return res.status(400).json({ message: 'Missing required fields' });
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
        return res.status(500).json({ message: 'Failed to create product' });
      }
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error in products API:', error);
    return res.status(500).json({ message: 'Server error, please try again later' });
  }
} 