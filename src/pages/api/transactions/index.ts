import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';
import { sendPaymentReminder } from '../../../lib/mailtrap';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const { countryId, id: userId, role } = session.user;
  
  if (req.method === 'GET') {
    try {
      let transactions;
      
      if (role === 'admin') {
        // Admins can see all transactions for their country, or all transactions if countryId is null
        const whereClause = countryId ? { countryId } : {};
        
        transactions = await prisma.transaction.findMany({
          where: whereClause,
          include: {
            user: true,
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        // Users can only see their own transactions
        const whereClause = {
          userId,
          ...(countryId ? { countryId } : {}),
        };
        
        transactions = await prisma.transaction.findMany({
          where: whereClause,
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }
      
      return res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  if (req.method === 'POST') {
    // Creating a new transaction (purchase)
    try {
      const { items, userId: requestUserId } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Invalid or missing items' });
      }
      
      // Use provided userId if available, otherwise use session userId
      const userId = requestUserId || session.user.id;
      
      // Calculate total
      let total = 0;
      
      // Verify all products exist and have sufficient stock
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        
        if (!product) {
          return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
        }
        
        total += product.sellingPrice * item.quantity;
      }
      
      // Create transaction data with required relations
      const transactionData = {
        total,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
        },
        user: {
          connect: {
            id: userId
          }
        }
      };
      
      // Add country relation if countryId exists
      if (countryId) {
        transactionData.country = {
          connect: {
            id: countryId
          }
        };
      } else {
        // If no countryId is provided, first verify the user exists
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, countryId: true }
        });
        
        // If user doesn't exist in DB, return an error
        if (!userExists) {
          return res.status(404).json({ message: 'User not found. Please log in again.' });
        }
        
        if (userExists.countryId) {
          // User has a country, use it
          transactionData.country = {
            connect: {
              id: userExists.countryId
            }
          };
        } else {
          // User exists but doesn't have a country, find or create one
          const defaultCountry = await prisma.country.findFirst({
            select: { id: true }
          });
          
          let countryId;
          
          if (!defaultCountry) {
            // No country exists, create a default one
            const newCountry = await prisma.country.create({
              data: {
                name: "Default Country",
                pettyCash: 0
              }
            });
            countryId = newCountry.id;
          } else {
            countryId = defaultCountry.id;
          }
          
          // Connect transaction to the country
          transactionData.country = {
            connect: {
              id: countryId
            }
          };
          
          try {
            // Update user's countryId - wrap in try/catch to handle potential errors
            await prisma.user.update({
              where: { id: userId },
              data: { countryId: countryId }
            });
          } catch (error) {
            console.error('Failed to update user country, but continuing with transaction:', error);
            // Continue without failing the entire transaction
          }
        }
      }
      
      // Create  in a transaction to ensure consistency
      const transaction = await prisma.$transaction(async (tx) => {
        // Create the transaction
        const newTransaction = await tx.transaction.create({
          data: transactionData,
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });
        
        // Update product stock
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
        
        // Update user balance
        await tx.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: total,
            },
          },
        });
        
        return newTransaction;
      });
      
      // Send email notification (asynchronously)
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (user && user.phoneNumber.includes('@')) { // Check if phone number is actually an email
        sendPaymentReminder(user.phoneNumber, total, transaction.items);
      }
      
      return res.status(201).json(transaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 