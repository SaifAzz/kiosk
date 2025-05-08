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
    const [activeTab, setActiveTab] = useState('history'); // 'unsettled' or 'history'

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

    // Calculate total paid overall (for all time)
    const totalPaidAllTime = settledTransactions
        .reduce((sum, t) => sum + t.total, 0);

    return (
        <KioskLayout title="My Balance">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-[#F9F0F5] p-4 text-center">
                        <h2 className="text-2xl font-bold text-[var(--primary)]">Transaction History</h2>
                    </div>

                    <div className="grid grid-cols-2 text-center font-medium">
                        <button
                            onClick={() => setActiveTab('unsettled')}
                            className={`py-3 ${activeTab === 'unsettled' ? 'bg-[#F9F0F5] text-[var(--primary)]' : 'bg-[#EEEEEE] text-black'}`}
                        >
                            Unsettled
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`py-3 ${activeTab === 'history' ? 'bg-[#E1F1FE] text-blue-600' : 'bg-[#EEEEEE] text-black'}`}
                        >
                            History
                        </button>
                    </div>

                    <div className="p-4">
                        {activeTab === 'unsettled' ? (
                            unsettledTransactions.length === 0 ? (
                                <div className="text-center py-12 text-black">
                                    No unsettled transactions
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {unsettledTransactions.map(transaction => (
                                        <div key={transaction.id} className="flex justify-between items-center py-3 border-b">
                                            <div>
                                                <div className="text-black">
                                                    {transaction.items.map(item =>
                                                        `${item.product.name} x${item.quantity}`
                                                    ).join(', ')}
                                                </div>
                                                <div className="text-sm text-black">{formatDate(transaction.createdAt)}</div>
                                            </div>
                                            <div className="font-bold text-[var(--primary)]">
                                                ${transaction.total.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-6 pt-4 border-t border-gray-300">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-xl text-black">Total Balance Due</span>
                                            <span className="font-bold text-xl text-[var(--primary)]">${balance.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            settledTransactions.length === 0 ? (
                                <div className="text-center py-12 text-black">
                                    No transaction history
                                </div>
                            ) : (
                                <div>
                                    {settledTransactions.map(transaction => (
                                        <div key={transaction.id} className="flex justify-between items-center py-3 border-b">
                                            <div>
                                                <div className="text-black">
                                                    {transaction.items.map(item =>
                                                        `${item.product.name} x${item.quantity}`
                                                    ).join(', ')}
                                                </div>
                                                <div className="text-sm text-black">{formatDate(transaction.createdAt)}</div>
                                                <div className="mt-1">
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                                        PAID
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="font-bold text-[var(--primary)]">
                                                ${transaction.total.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-6 py-4 border-t border-gray-300">
                                        <div className="flex justify-between items-center">
                                            <span className="text-black font-medium">Total paid:</span>
                                            <span className="font-bold text-green-600">${totalPaidAllTime.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </KioskLayout>
    );
} 