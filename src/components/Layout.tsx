import React, { ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useAppContext } from '../contexts/AppContext';

type LayoutProps = {
    children: ReactNode;
    title?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, title = 'Self-Service Kiosk' }) => {
    const { data: session } = useSession();
    const router = useRouter();
    const { selectedCountry } = useAppContext();

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-[var(--primary-light)]">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-[var(--primary)]">{title}</h1>

                    <div className="flex items-center space-x-4">
                        {selectedCountry && (
                            <span className="text-sm font-medium text-[var(--primary-dark)]">
                                Country: {selectedCountry.name}
                            </span>
                        )}

                        {session && (
                            <>
                                <span className="text-sm font-medium text-[var(--primary-dark)]">
                                    {session.user.role === 'admin' ? 'Admin' : 'User'}: {session.user.name}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)]"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>

            <footer className="bg-white shadow mt-8 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-[var(--primary)]">
                        &copy; {new Date().getFullYear()} Wonder Beauties. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout; 