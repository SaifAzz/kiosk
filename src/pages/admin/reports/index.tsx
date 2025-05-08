import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import Link from 'next/link';

export default function Reports() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    const handleExportUserBalances = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Using window.open to download the CSV file
            window.open('/api/reports/user-balances', '_blank');

            setSuccess('User balances report generated successfully.');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Error exporting user balances:', err);
            setError('Failed to generate user balances report');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (status === 'loading') {
        return (
            <Layout title="Reports">
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
        <Layout title="Reports">
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

            {success && (
                <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
                    {success}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Export Reports</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-3">User Balances</h3>
                        <p className="text-gray-600 mb-4">
                            Export a CSV file containing all user balances, unsettled transactions,
                            and last purchase dates.
                        </p>
                        <button
                            onClick={handleExportUserBalances}
                            disabled={loading}
                            className={`py-2 px-4 rounded text-white ${loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? 'Generating...' : 'Export User Balances'}
                        </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-3">Inventory Status</h3>
                        <p className="text-gray-600 mb-4">
                            Export a CSV file with current inventory levels, cost, and selling prices.
                        </p>
                        <button
                            disabled
                            className="py-2 px-4 rounded text-white bg-gray-400 cursor-not-allowed"
                        >
                            Coming Soon
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
} 