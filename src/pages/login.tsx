import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { useAppContext } from '../contexts/AppContext';
import Image from 'next/image';

export default function Login() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [showProfileCompletion, setShowProfileCompletion] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [authToken, setAuthToken] = useState('');
    const [isNewUserFlow, setIsNewUserFlow] = useState(false);
    const router = useRouter();
    const { selectedCountry } = useAppContext();

    // Redirect to country selection if no country is selected
    React.useEffect(() => {
        if (!selectedCountry) {
            router.push('/select-country');
        }
    }, [selectedCountry, router]);

    const toggleUserFlow = () => {
        // Toggle between new and existing user flows
        setIsNewUserFlow(!isNewUserFlow);
        // Reset form state
        setEmail('');
        setOtp('');
        setPhoneNumber('');
        setShowOtpInput(false);
        setShowProfileCompletion(false);
        setError('');
        setOtpSent(false);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    isAdmin: isAdmin.toString(),
                    countryId: selectedCountry?.id,
                    isNewUser: isNewUserFlow.toString(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setOtpSent(true);
                setShowOtpInput(true);
                setError('');

                // For development only: Show the OTP in the UI to make testing easier
                if (process.env.NODE_ENV === 'development' && data.otp) {
                    setError(`Development mode: Your OTP is ${data.otp}`);
                }
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
            console.error('OTP request error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !otp) {
            setError('Please enter both email and OTP');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    otp,
                    isAdmin: isAdmin.toString(),
                    countryId: selectedCountry?.id,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store the token for later use
                setAuthToken(data.token);

                // Check if this is a new user that needs to complete their profile
                if (data.isNewUser || isNewUserFlow) {
                    // Show the profile completion form
                    setShowProfileCompletion(true);
                    setLoading(false);
                    return;
                }

                // Use Next-Auth to create a session
                const result = await signIn('credentials', {
                    redirect: false,
                    email,
                    token: data.token,
                    isAdmin: isAdmin.toString(),
                    countryId: selectedCountry?.id,
                });

                if (result?.error) {
                    setError('Authentication failed');
                    return;
                }

                // Redirect to the appropriate page based on user role
                if (isAdmin) {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/catalog');
                }
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch (error) {
            setError('An error occurred during verification');
            console.error('OTP verification error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber) {
            setError('Please enter your phone number');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Create a success message element
            const successDiv = document.createElement('div');
            successDiv.className = 'mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100';
            successDiv.textContent = 'Profile completed successfully! Redirecting to catalog...';

            // First sign in to get the session using the saved token
            const signInResult = await signIn('credentials', {
                redirect: false,
                email,
                token: authToken, // Use the saved auth token instead of OTP
                isAdmin: isAdmin.toString(),
                countryId: selectedCountry?.id,
            });

            if (signInResult?.error) {
                setError('Authentication failed');
                return;
            }

            // Then complete the profile
            const response = await fetch('/api/users/complete-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Create a success message
                setError('');
                // Show a success message
                document.querySelector('form')?.prepend(successDiv);

                // Make sure the session is established and then redirect
                // Wait a short period to ensure session is set up properly
                setTimeout(() => {
                    // Sign in one more time to make sure session is established
                    signIn('credentials', {
                        redirect: true,
                        callbackUrl: '/catalog',
                        email,
                        token: authToken,
                        isAdmin: isAdmin.toString(),
                        countryId: selectedCountry?.id,
                    });
                }, 1000);
            } else {
                setError(data.message || 'Failed to complete profile');
            }
        } catch (error) {
            setError('An error occurred during profile completion');
            console.error('Profile completion error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!selectedCountry) {
        return null; // Will redirect to country selection
    }

    return (
        <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
                <div className="text-center mb-8">
                    <div className="flex justify-center">
                        <Image
                            src="/products/wonder.webp"
                            alt="Wonder Beauties Logo"
                            width={100}
                            height={100}
                            className="mb-4"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {showProfileCompletion
                            ? 'Complete Your Profile'
                            : (showOtpInput ? 'Enter OTP' : (isNewUserFlow ? 'Create Account' : 'Sign In'))}
                    </h2>
                    <p className="text-gray-600 mt-2">
                        {showProfileCompletion
                            ? 'Please provide your phone number to complete your profile'
                            : (showOtpInput ? 'Enter the OTP sent to your email' : 'Enter your email to receive an OTP')}
                    </p>
                </div>

                {/* User flow toggle */}
                {!showOtpInput && !showProfileCompletion && (
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex bg-gray-100 rounded-lg p-1">
                            <button
                                className={`px-4 py-2 rounded-md text-sm font-medium ${!isNewUserFlow ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-gray-500'}`}
                                onClick={() => setIsNewUserFlow(false)}
                            >
                                Existing User
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md text-sm font-medium ${isNewUserFlow ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-gray-500'}`}
                                onClick={() => setIsNewUserFlow(true)}
                            >
                                New User
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                {otpSent && !error && (
                    <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
                        <p>An OTP has been sent to your email.</p>
                        <p className="text-xs mt-1">(In dev mode, the OTP is shown below for convenience)</p>
                    </div>
                )}

                {!showProfileCompletion ? (
                    <form onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900"
                                placeholder="Enter your email address"
                                required
                                disabled={showOtpInput}
                            />
                        </div>

                        {showOtpInput && (
                            <div>
                                <label htmlFor="otp" className="block text-gray-700 mb-2 font-medium">
                                    One-Time Password
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900"
                                    placeholder="Enter the OTP sent to your email"
                                    required
                                />
                            </div>
                        )}

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isAdmin"
                                checked={isAdmin}
                                onChange={(e) => setIsAdmin(e.target.checked)}
                                className="h-4 w-4 text-[var(--primary)] rounded border-gray-300 focus:ring-[var(--primary)]"
                                disabled={showOtpInput}
                            />
                            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700">
                                I am an administrator
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : (showOtpInput
                                ? 'Verify OTP'
                                : (isNewUserFlow ? 'Create Account' : 'Send OTP'))}
                        </button>

                        {showOtpInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowOtpInput(false);
                                    setOtp('');
                                    setError('');
                                }}
                                className="w-full py-2 text-[var(--primary)] hover:text-[var(--primary-dark)] bg-transparent border-none text-sm"
                            >
                                Back to email entry
                            </button>
                        )}
                    </form>
                ) : (
                    <form onSubmit={handleCompleteProfile} className="space-y-6">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-gray-700 mb-2 font-medium">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900"
                                placeholder="Enter your phone number"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Please wait...' : 'Complete Profile'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
} 