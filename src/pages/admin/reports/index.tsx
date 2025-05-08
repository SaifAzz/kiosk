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

    // Access protection
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (session && session.user?.role !== 'admin') {
            router.push('/catalog');
        }
    }, [status, session, router]);

    const handleExportUserBalances = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            window.open('/api/reports/user-balances', '_blank');
            setSuccess('User balances report generated successfully.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error exporting report:', err);
            setError('Failed to generate report.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <Layout title="Reports">
                <div className="text-center py-10">
                    <p className="text-xl">Loading...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Reports">
            <div className="mb-6">
                <Link href="/admin/dashboard">
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded">
                        ← Back to Dashboard
                    </button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6 border border-red-200">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 text-green-700 p-4 rounded mb-6 border border-green-200">
                    {success}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reports</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export User Balances */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">User Balances</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Export a CSV file containing user balances, unsettled transactions, and last purchase dates.
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

                    {/* Inventory Status Placeholder */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Inventory Status</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            A report summarizing current inventory levels, cost, and sale price (coming soon).
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
