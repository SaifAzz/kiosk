import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';

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
            <Layout title="My Balance">
                <div className="text-center py-10">
                    <p className="text-xl">Loading...</p>
                </div>
            </Layout>
        );
    }

    // If not authenticated, return null (will redirect)
    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <Layout title="My Balance">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-6">
                    <h2 className="text-2xl font-semibold">Current Balance</h2>
                    <p className="text-3xl font-bold mt-2">${balance.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <h2 className="text-2xl font-semibold mb-4">Transaction History</h2>

                    {transactions.length === 0 ? (
                        <p className="text-gray-500">No transactions yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(transaction.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {transaction.items.map((item, index) => (
                                                        <div key={item.id}>
                                                            {item.quantity} x {item.product.name}
                                                            {index < transaction.items.length - 1 ? ', ' : ''}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                ${transaction.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.settled
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                >
                                                    {transaction.settled ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
} 