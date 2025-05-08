import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import Link from 'next/link';
import Image from 'next/image';

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

export default function UserSelectionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [settlingUser, setSettlingUser] = useState<string | null>(null);
    const [settleSuccess, setSettleSuccess] = useState(false);

    // Check if user is authenticated
    useEffect(() => {
        try {
            if (status === 'unauthenticated') {
                console.log("User is unauthenticated, redirecting to login");
                router.push('/login');
            }
        } catch (error) {
            console.error("Navigation error:", error);
        }
    }, [status, router]);

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

        if (session) {
            fetchUsers();
        }
    }, [session]);

    // Handle user selection
    const handleUserSelect = (userId: string) => {
        localStorage.setItem('selectedUserId', userId);
        router.push('/catalog');
    };

    // Handle settling user balance
    const handleSettleBalance = async (userId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent user selection when clicking the settle button

        try {
            setSettlingUser(userId);

            const response = await fetch('/api/settlements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to settle balance');
            }

            // Update the user in the local state
            setUsers(prev => prev.map(user => {
                if (user.id === userId) {
                    return { ...user, balance: 0 };
                }
                return user;
            }));

            setSettleSuccess(true);

            // Hide success message after 3 seconds
            setTimeout(() => {
                setSettleSuccess(false);
            }, 3000);

        } catch (err) {
            console.error('Error settling balance:', err);
            setError('Failed to settle user balance');
        } finally {
            setSettlingUser(null);
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter(user =>
        user.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Show loading state
    if (status === 'loading' || (loading && !error)) {
        return (
            <Layout title="Select User">
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
        <Layout title="Select User">
            {error && (
                <div className="bg-red-100 text-red-700 p-6 rounded-lg mb-6 text-xl">
                    <div>{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 text-lg font-bold mt-2"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {settleSuccess && (
                <div className="bg-green-100 text-green-700 p-6 rounded-xl mb-6 text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Balance settled successfully! Petty cash has been updated.
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* Search bar */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by phone number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[var(--primary)]"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 absolute right-4 top-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Users grid */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-3xl font-bold mb-6 text-[var(--primary)]">Select a User</h2>

                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-xl text-gray-500">No users found matching your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="bg-white border-2 border-gray-200 hover:border-[var(--primary)] rounded-xl p-6 shadow-md transition-all hover:shadow-lg cursor-pointer"
                                    onClick={() => handleUserSelect(user.id)}
                                >
                                    <div className="flex items-center mb-4">
                                        <div className="bg-[var(--primary-light)] rounded-full p-3 mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{user.phoneNumber}</h3>
                                            <p className="text-gray-600">Customer</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Current Balance:</span>
                                            <span className={user.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                                ${user.balance.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            <span className="text-gray-600">Transactions:</span>
                                            <span className="font-medium">{user.transactions.length}</span>
                                        </div>

                                        <div className="flex flex-col mt-4 gap-2">
                                            {user.balance > 0 && (
                                                <button
                                                    onClick={(e) => handleSettleBalance(user.id, e)}
                                                    disabled={settlingUser === user.id}
                                                    className="w-full py-3 rounded-lg bg-green-600 text-white font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                >
                                                    {settlingUser === user.id ? (
                                                        <span className="flex items-center justify-center">
                                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </span>
                                                    ) : (
                                                        "SETTLE BALANCE"
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
} 