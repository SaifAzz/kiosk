import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppContext } from '../contexts/AppContext';

type Country = {
    id: string;
    name: string;
};

export default function SelectCountry() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const { setSelectedCountry } = useAppContext();

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
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const handleSelectCountry = (country: Country) => {
        setSelectedCountry(country);
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--primary-light)]">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-[var(--primary)]">Loading...</h1>
                    <p className="mt-2 text-gray-600">Please wait while we load countries.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--primary-light)]">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-red-500">Error</h1>
                    <p className="mt-2 text-gray-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[var(--primary)] text-white py-2 px-4 rounded hover:bg-[var(--primary-dark)]"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--primary-light)]">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-[var(--primary)]">Select Country</h1>

                <div className="space-y-4">
                    {countries.map((country) => (
                        <button
                            key={country.id}
                            onClick={() => handleSelectCountry(country)}
                            className="w-full p-4 border border-gray-300 rounded-lg hover:bg-[var(--primary-light)] hover:border-[var(--primary)] transition-colors text-left"
                        >
                            {country.name}
                        </button>
                    ))}

                    {countries.length === 0 && (
                        <p className="text-center text-gray-500">No countries available.</p>
                    )}
                </div>
            </div>
        </div>
    );
} 