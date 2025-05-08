import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import Link from 'next/link';
import { useAppContext } from '../../../contexts/AppContext';

type Country = {
    id: string;
    name: string;
};

export default function Reports() {
    const { data: session, status } = useSession();
    const { selectedCountry, setSelectedCountry } = useAppContext();
    const router = useRouter();
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [sessionInfo, setSessionInfo] = useState<any>({});

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

    // Fetch countries on component mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('/api/countries');
                if (response.ok) {
                    const data = await response.json();
                    setCountries(data);
                } else {
                    setError('Failed to fetch countries');
                }
            } catch (err) {
                setError('An error occurred while fetching countries');
            }
        };

        fetchCountries();
    }, []);

    // Get session debug info
    useEffect(() => {
        const getSessionInfo = async () => {
            try {
                const response = await fetch('/api/session-debug');
                if (response.ok) {
                    const data = await response.json();
                    setSessionInfo(data);
                }
            } catch (error) {
                console.error('Error fetching session info:', error);
            }
        };

        if (session) {
            getSessionInfo();
        }
    }, [session]);

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

    const downloadReport = async (reportType: string) => {
        setLoading(true);
        setError('');

        try {
            // Use window.location to trigger a file download
            window.location.href = `/api/reports/${reportType}`;
        } catch (err) {
            setError(`Failed to download ${reportType} report`);
            setLoading(false);
        }
    };

    const updateUserCountry = async (countryId: string) => {
        try {
            const response = await fetch('/api/auth/update-country', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ countryId }),
            });

            if (response.ok) {
                // Find the selected country object from our list
                const country = countries.find(c => c.id === countryId);
                if (country) {
                    setSelectedCountry(country);
                }

                // Reload the page to refresh the session
                window.location.reload();
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to update country');
            }
        } catch (error) {
            setError('An error occurred while updating country');
            console.error('Error updating country:', error);
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

            {session && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold mb-6 text-[var(--primary)]">Reports</h2>

                    {/* Debug Information */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-2">Session Debug Info</h3>
                        <p><strong>Selected Country in Context:</strong> {selectedCountry ? `${selectedCountry.name} (${selectedCountry.id})` : 'None'}</p>
                        <p><strong>Country ID in Session:</strong> {session?.user?.countryId || 'None'}</p>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(sessionInfo, null, 2)}
                        </pre>
                    </div>

                    {/* Country Selection */}
                    {(!session.user.countryId || !selectedCountry) && (
                        <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                            <h3 className="text-lg font-semibold mb-2">Select a Country</h3>
                            <p className="mb-4">You need to select a country to use the reports feature.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {countries.map((country) => (
                                    <button
                                        key={country.id}
                                        onClick={() => updateUserCountry(country.id)}
                                        className="p-3 border border-gray-300 rounded-lg hover:bg-[var(--primary-light)] hover:border-[var(--primary)] transition-colors text-left"
                                    >
                                        {country.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
            )}
        </Layout>
    );
} 