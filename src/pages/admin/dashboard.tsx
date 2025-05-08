import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import Link from 'next/link';

type CountryInfo = {
    name: string;
    pettyCash: number;
};

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    // Fetch country info
    useEffect(() => {
        const fetchCountryInfo = async () => {
            if (!session) return;

            try {
                setLoading(true);
                const response = await fetch('/api/admin/country-info');

                if (!response.ok) {
                    throw new Error('Failed to fetch country information');
                }

                const data = await response.json();
                setCountryInfo(data);
            } catch (err) {
                console.error('Error fetching country info:', err);
                setError('Failed to load country information');
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === 'admin') {
            fetchCountryInfo();
        }
    }, [session]);

    // Show loading state
    if (status === 'loading' || (loading && !error)) {
        return (
            <Layout title="Admin Dashboard">
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
        <Layout title="Admin Dashboard">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {countryInfo && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-[var(--primary)]">Country: {countryInfo.name}</h2>
                    <p className="text-lg">
                        Petty Cash Balance: <span className="font-bold text-[var(--primary)]">${countryInfo.pettyCash.toFixed(2)}</span>
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Inventory Management</h2>
                        <div className="space-y-4">
                            <Link href="/admin/inventory">
                                <div className="block w-full p-4 bg-[var(--primary-light)] hover:bg-[#fad5e5] rounded-lg transition-colors">
                                    <h3 className="font-medium text-[var(--primary-dark)]">View Inventory</h3>
                                    <p className="text-sm text-[var(--primary-dark)]">Manage product stock and prices</p>
                                </div>
                            </Link>

                            <Link href="/admin/inventory/add">
                                <div className="block w-full p-4 bg-[#f8e9f1] hover:bg-[var(--primary-light)] rounded-lg transition-colors">
                                    <h3 className="font-medium text-[var(--primary-dark)]">Add New Product</h3>
                                    <p className="text-sm text-[var(--primary-dark)]">Create a new product in the catalog</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">User Management</h2>
                        <div className="space-y-4">
                            <Link href="/admin/users">
                                <div className="block w-full p-4 bg-[#f8e9f1] hover:bg-[var(--primary-light)] rounded-lg transition-colors">
                                    <h3 className="font-medium text-[var(--primary-dark)]">View Users</h3>
                                    <p className="text-sm text-[var(--primary-dark)]">Manage users and settle balances</p>
                                </div>
                            </Link>

                            <Link href="/admin/reports">
                                <div className="block w-full p-4 bg-[var(--primary-light)] hover:bg-[#fad5e5] rounded-lg transition-colors">
                                    <h3 className="font-medium text-[var(--primary-dark)]">Export Reports</h3>
                                    <p className="text-sm text-[var(--primary-dark)]">Generate and download reports</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
} 