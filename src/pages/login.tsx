import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { useAppContext } from '../contexts/AppContext';

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { selectedCountry } = useAppContext();

    // Redirect to country selection if no country is selected
    React.useEffect(() => {
        if (!selectedCountry) {
            router.push('/select-country');
        }
    }, [selectedCountry, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const result = await signIn('credentials', {
                redirect: false,
                phoneNumber,
                password,
                isAdmin: isAdmin.toString(),
                countryId: selectedCountry?.id,
            });

            if (result?.error) {
                setError('Invalid credentials');
                return;
            }

            // Redirect to the appropriate page based on user role
            if (isAdmin) {
                router.push('/admin/dashboard');
            } else {
                router.push('/catalog');
            }
        } catch (error) {
            setError('An error occurred during login');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedCountry) {
        return null; // Will redirect to country selection
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--primary-light)]">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-[var(--primary)]">Login</h1>
                <div className="mb-4 text-center text-gray-600">
                    Country: {selectedCountry.name}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block text-gray-700 mb-2">
                            {isAdmin ? 'Username' : 'Phone Number'}
                        </label>
                        <input
                            type="text"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder={isAdmin ? 'Enter username' : 'Enter phone number'}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={isAdmin}
                                onChange={() => setIsAdmin(!isAdmin)}
                                className="mr-2 accent-[var(--primary)]"
                            />
                            <span className="text-gray-700">Login as Admin</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-md text-white font-medium ${loading
                            ? 'bg-[var(--primary-light)] text-[var(--primary)] cursor-not-allowed'
                            : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)]'
                            }`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => router.push('/select-country')}
                        className="text-[var(--primary)] hover:underline"
                    >
                        Change Country
                    </button>
                </div>
            </div>
        </div>
    );
} 