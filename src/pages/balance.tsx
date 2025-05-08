import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import KioskLayout from '../components/KioskLayout';

type Transaction = {
    id: string;
    total: number;
    createdAt: string;
    settled: boolean;
    items: {
        id: string;
        quantity: number;
        price: number;
        product: {
            name: string;
        };
    }[];
};

export default function Balance() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Check if user is authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Load user transactions and balance
    useEffect(() => {
        const fetchData = async () => {
            if (!session) return;

            try {
                setLoading(true);

                // Fetch transactions
                const transactionsResponse = await fetch('/api/transactions');

                if (!transactionsResponse.ok) {
                    throw new Error('Failed to fetch transactions');
                }

                const transactionsData = await transactionsResponse.json();
                setTransactions(transactionsData);

                // Calculate total balance from unsettled transactions
                const totalBalance = transactionsData
                    .filter((t: Transaction) => !t.settled)
                    .reduce((sum: number, t: Transaction) => sum + t.total, 0);

                setBalance(totalBalance);
            } catch (err) {
                console.error('Error fetching balance data:', err);
                setError('Failed to load your balance information');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session]);

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Show loading state
    if (status === 'loading' || (loading && !error)) {
        return (
            <KioskLayout title="My Balance">
                <div className="text-center py-10">
                    <p className="text-xl">Loading...</p>
                </div>
            </KioskLayout>
        );
    }

    // If not authenticated, return null (will redirect)
    if (status === 'unauthenticated') {
        return null;
    }

    // Split transactions into unsettled and settled
    const unsettledTransactions = transactions.filter(t => !t.settled);
    const settledTransactions = transactions.filter(t => t.settled);

    // Calculate total paid this month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const totalPaidThisMonth = settledTransactions
        .filter(t => new Date(t.createdAt) >= firstDayOfMonth)
        .reduce((sum, t) => sum + t.total, 0);

    return (
        <KioskLayout title="My Balance">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* My Balance Panel */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 bg-gray-100 border-b">
                        <h2 className="text-xl font-bold text-center">My Balance</h2>
                        <div className="flex mt-2">
                            <div className="w-1/2 text-center">
                                <div className="bg-blue-100 py-2 px-4 mx-2 rounded-t-lg">
                                    <span className="text-blue-800 font-bold">Unsettled</span>
                                </div>
                            </div>
                            <div className="w-1/2 text-center">
                                <div className="bg-gray-200 py-2 px-4 mx-2 rounded-t-lg">
                                    <span className="text-gray-600">History</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        {unsettledTransactions.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                No unsettled transactions
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {unsettledTransactions.map(transaction => (
                                    <div key={transaction.id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between">
                                            <div className="font-medium">
                                                {transaction.items.map(item =>
                                                    `${item.product.name} x${item.quantity}`
                                                ).join(', ')}
                                            </div>
                                            <div className="text-gray-500">
                                                {formatDate(transaction.createdAt)}
                                            </div>
                                        </div>
                                        <div className="text-right font-bold mt-2 text-[var(--primary)]">
                                            ${transaction.total.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-4 py-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-xl">Total Balance Due</span>
                                        <span className="font-bold text-xl text-[var(--primary)]">${balance.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transaction History Panel */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 bg-gray-100 border-b">
                        <h2 className="text-xl font-bold text-center">Transaction History</h2>
                        <div className="flex mt-2">
                            <div className="w-1/2 text-center">
                                <div className="bg-gray-200 py-2 px-4 mx-2 rounded-t-lg">
                                    <span className="text-gray-600">Unsettled</span>
                                </div>
                            </div>
                            <div className="w-1/2 text-center">
                                <div className="bg-blue-100 py-2 px-4 mx-2 rounded-t-lg">
                                    <span className="text-blue-800 font-bold">History</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4">
                        {settledTransactions.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                No transaction history
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {settledTransactions.map(transaction => (
                                    <div key={transaction.id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between">
                                            <div className="font-medium">
                                                {transaction.items.map(item =>
                                                    `${item.product.name} x${item.quantity}`
                                                ).join(', ')}
                                            </div>
                                            <div className="text-gray-500">
                                                {formatDate(transaction.createdAt)}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                                PAID
                                            </div>
                                            <div className="font-bold">
                                                ${transaction.total.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-4 py-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total paid this month:</span>
                                        <span className="font-bold text-green-600">${totalPaidThisMonth.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </KioskLayout>
    );
} 