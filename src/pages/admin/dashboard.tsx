import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import Link from 'next/link';

type CountryInfo = {
    name: string;
    pettyCash: number;
};

function ArrowRightIcon() {
    return (
        <svg
            className="w-5 h-5 text-gray-400 group-hover:text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchCountryInfo = async () => {
            if (!session) return;

            try {
                setLoading(true);
                const response = await fetch('/api/admin/country-info');
                if (!response.ok) {
                    setCountryInfo({ name: 'Iraq', pettyCash: 0 });
                    setError('Unable to load country information. Using default values.');
                    return;
                }
                const data = await response.json();
                setCountryInfo(data);
                setError('');
            } catch (err) {
                setCountryInfo({ name: 'Iraq', pettyCash: 0 });
                setError('Failed to load country information. Using default values.');
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchCountryInfo();
        }
    }, [session]);

    if (status === 'loading' || (loading && !error)) {
        return (
            <Layout title="Dashboard">
                <div className="text-center py-10">
                    <p className="text-xl">Loading...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6 border border-red-300">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Financial Overview</h2>
                <p className="text-sm text-gray-500 mb-2">Current petty cash balance</p>
                <p className={`text-3xl font-bold ${countryInfo?.pettyCash < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${countryInfo?.pettyCash.toFixed(2) || '0.00'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Inventory Management */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Management</h2>
                    <div className="space-y-4">
                        <Link href="/admin/inventory">
                            <div className="group flex items-center justify-between p-4 rounded-lg border hover:shadow transition cursor-pointer">
                                <div>
                                    <h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">View Inventory</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage product stock and prices</p>
                                </div>
                                <ArrowRightIcon />
                            </div>
                        </Link>
                        <Link href="/admin/inventory/add">
                            <div className="group flex items-center justify-between p-4 rounded-lg border hover:shadow transition cursor-pointer">
                                <div>
                                    <h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">Add New Product</h3>
                                    <p className="text-sm text-gray-500 mt-1">Create a new product in the catalog</p>
                                </div>
                                <ArrowRightIcon />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* User Management */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">User Management</h2>
                    <div className="space-y-4">
                        <Link href="/admin/users">
                            <div className="group flex items-center justify-between p-4 rounded-lg border hover:shadow transition cursor-pointer">
                                <div>
                                    <h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">View Users</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage users and settle balances</p>
                                </div>
                                <ArrowRightIcon />
                            </div>
                        </Link>
                        <Link href="/admin/reports">
                            <div className="group flex items-center justify-between p-4 rounded-lg border hover:shadow transition cursor-pointer">
                                <div>
                                    <h3 className="text-base font-medium text-gray-900 group-hover:text-indigo-600">Export Reports</h3>
                                    <p className="text-sm text-gray-500 mt-1">Generate and download reports</p>
                                </div>
                                <ArrowRightIcon />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
