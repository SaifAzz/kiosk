import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import Link from 'next/link';

type User = {
    id: string;
    phoneNumber: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
    transactions: {
        id: string;
        total: number;
        createdAt: string;
    }[];
};

export default function UserManagement() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [settlementLoading, setSettlementLoading] = useState(false);
    const [settlementSuccess, setSettlementSuccess] = useState(false);
    const [settlementError, setSettlementError] = useState('');

    // Check if user is authenticated and is an admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.push('/catalog');
        }
    }, [status, session, router]);

    // Load users
    useEffect(() => {
        const fetchUsers = async () => {
            if (!session) return;

            try {
                setLoading(true);
                const response = await fetch('/api/users');

                if (!response.ok) {
                    throw new Error('Failed to fetch users');
                }

                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to load users');
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === 'admin') {
            fetchUsers();
        }
    }, [session]);

    const handleSettleBalance = async (userId: string) => {
        try {
            setSettlementLoading(true);
            setSettlementError('');

            const response = await fetch('/api/settlements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to settle balance');
            }

            // Show success message
            setSettlementSuccess(true);

            // Reload users to update data
            const usersResponse = await fetch('/api/users');
            const usersData = await usersResponse.json();
            setUsers(usersData);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSettlementSuccess(false);
            }, 3000);
        } catch (err) {
            if (err instanceof Error) {
                setSettlementError(err.message);
            } else {
                setSettlementError('An error occurred during settlement');
            }
            console.error('Settlement error:', err);
        } finally {
            setSettlementLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Show loading state
    if (status === 'loading' || (loading && !error)) {
        return (
            <Layout title="User Management">
                <div className="text-center py-10">
                    <p className="text-xl">Loading...</p>
                </div>
            </Layout>
        );
    }

    // If not authenticated or not an admin, return null (will redirect)
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
        return null;
    }

    return (
        <Layout title="User Management">
            <div className="mb-6">
                <Link href="/admin/dashboard">
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors">
                        ← Back to Dashboard
                    </button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {settlementSuccess && (
                <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
                    User balance settled successfully!
                </div>
            )}

            {settlementError && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {settlementError}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">User List</h2>

                    {users.length === 0 ? (
                        <p className="text-gray-500">No users found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone Number
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unsettled Transactions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Activity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => {
                                        const lastActivity = user.transactions.length > 0
                                            ? new Date(Math.max(...user.transactions.map(t => new Date(t.createdAt).getTime())))
                                            : null;

                                        return (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.phoneNumber}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm font-medium ${user.balance > 0 ? 'text-red-600' : 'text-gray-500'
                                                        }`}>
                                                        ${user.balance.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.transactions.length}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {lastActivity ? formatDate(lastActivity.toISOString()) : 'No activity'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {user.balance > 0 ? (
                                                        <button
                                                            onClick={() => handleSettleBalance(user.id)}
                                                            disabled={settlementLoading}
                                                            className={`text-white py-1 px-3 rounded ${settlementLoading
                                                                    ? 'bg-blue-300 cursor-not-allowed'
                                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                                }`}
                                                        >
                                                            {settlementLoading ? 'Processing...' : 'Settle Balance'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-green-600">No balance due</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
} 