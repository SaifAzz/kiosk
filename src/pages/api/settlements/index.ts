import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only allow admin users to access this endpoint
    if (session.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Handle POST request for settling a user's balance
    if (req.method === 'POST') {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            // Get the user and their unsettled transactions
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    transactions: {
                        where: { settled: false },
                        include: { items: true },
                    },
                },
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Make sure the user belongs to the admin's country
            if (user.countryId !== session.user.countryId) {
                return res.status(403).json({ message: 'You can only settle balances for users in your country' });
            }

            // Get the admin's country
            const country = await prisma.country.findUnique({
                where: { id: session.user.countryId },
            });

            if (!country) {
                return res.status(404).json({ message: 'Country not found' });
            }

            // Calculate the amount to add to petty cash
            const totalBalance = user.balance;

            // Update all unsettled transactions
            const transactionIds = user.transactions.map(t => t.id);

            // Use Prisma transaction to ensure all updates happen atomically
            const result = await prisma.$transaction([
                // Mark all transactions as settled
                prisma.transaction.updateMany({
                    where: { 
                        id: { in: transactionIds },
                        settled: false
                    },
                    data: { settled: true },
                }),

                // Reset the user's balance to zero
                prisma.user.update({
                    where: { id: userId },
                    data: { balance: 0 },
                }),

                // Update the country's petty cash balance
                prisma.country.update({
                    where: { id: session.user.countryId },
                    data: {
                        pettyCash: {
                            increment: totalBalance,
                        },
                    },
                }),
            ]);

            return res.status(200).json({ 
                message: 'Balance settled successfully',
                updatedBalance: 0,
                updatedPettyCash: country.pettyCash + totalBalance
            });

        } catch (error) {
            console.error('Error settling balance:', error);
            return res.status(500).json({ message: 'An error occurred while settling the balance' });
        }
    }

    // Method not allowed for other HTTP methods
    return res.status(405).json({ message: 'Method not allowed' });
} 