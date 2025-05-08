import React, { ReactNode, useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

type KioskLayoutProps = {
    children: ReactNode;
    title?: string;
};

const KioskLayout: React.FC<KioskLayoutProps> = ({
    children,
    title = 'Kiosk Self-Service',
}) => {
    const { selectedCountry } = useAppContext();

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            {/* Top header with minimal info */}
            <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="relative h-10 w-40 mr-2">
                        <Image
                            src="/products/wonder.webp"
                            alt="Wonder Beauties Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {selectedCountry && (
                        <span className="text-sm font-medium text-[var(--primary-dark)] bg-[var(--primary-light)] px-3 py-1 rounded-full">
                            {selectedCountry.name}
                        </span>
                    )}
                </div>
            </header>

            {/* Page content */}
            <main className="p-4 md:p-6 max-w-7xl mx-auto">
                {children}
            </main>

            {/* Optional bottom action bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex justify-between items-center">
                <Link href="/catalog" className="text-gray-500 hover:text-[var(--primary)] transition-colors">
                    <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                        </svg>
                        <span className="text-xs">Catalog</span>
                    </div>
                </Link>

                <Link href="/balance" className="text-gray-500 hover:text-[var(--primary)] transition-colors">
                    <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                            <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
                            <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                        </svg>
                        <span className="text-xs">My Balance</span>
                    </div>
                </Link>

                <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-[var(--primary)] transition-colors"
                >
                    <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs">Logout</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default KioskLayout; 