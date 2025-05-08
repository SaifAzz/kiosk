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
    
    // All authenticated users can access country info
    
    const { countryId } = session.user;
    
    // Ensure countryId is not null
    if (!countryId) {
      console.error('countryId is null in the session', session);
      return res.status(400).json({ message: 'Invalid country ID' });
    }
    
    if (req.method === 'GET') {
      try {
        // First check if the country exists
        const country = await prisma.country.findUnique({
          where: { id: countryId },
          select: {
            id: true,
            name: true,
            pettyCash: true,
            _count: {
              select: {
                users: true,
                products: true,
                transactions: true,
              },
            },
          },
        });
        
        // If country exists, return it
        if (country) {
          return res.status(200).json(country);
        }
        
        // If the country doesn't exist, create a default one
        console.log("Country not found, creating a default country");
        
        // Get the country name from session if available, otherwise use "Default Country"
        const countryName = session.user.countryName || "Iraq";
        
        // Create a new country with the user's ID
        const newCountry = await prisma.country.create({
          data: {
            id: countryId,
            name: countryName,
            pettyCash: 0,
          },
          select: {
            id: true,
            name: true,
            pettyCash: true,
            _count: {
              select: {
                users: true,
                products: true,
                transactions: true,
              },
            },
          },
        });
        
        return res.status(200).json(newCountry);
      } catch (error) {
        console.error('Error handling country info:', error);
        
        // Return a fallback country object to prevent UI errors
        const fallbackCountry = {
          id: countryId || 'default',
          name: 'Iraq',
          pettyCash: 0,
          _count: {
            users: 0,
            products: 0,
            transactions: 0,
          }
        };
        
        return res.status(200).json(fallbackCountry);
      }
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Unhandled error in country-info API:', error);
    return res.status(500).json({ message: 'Server error, please try again later' });
  }
} 