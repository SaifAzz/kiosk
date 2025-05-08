import React, { ReactNode, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useAppContext } from '../contexts/AppContext';
import Link from 'next/link';
import Image from 'next/image';

type LayoutProps = {
    children: ReactNode;
    title?: string;
};

const Layout: React.FC<LayoutProps> = ({ children, title = 'Self-Service Kiosk' }) => {
    const { data: session } = useSession();
    const router = useRouter();
    const { selectedCountry } = useAppContext();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check window size for mobile detection
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/login');
    };

    const isActive = (path: string) => {
        return router.pathname === path || router.pathname.startsWith(`${path}/`);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="min-h-screen flex bg-[var(--primary-light)]">
            {/* Mobile overlay */}
            {sidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <div
                className={`${isMobile
                    ? `fixed top-0 left-0 h-full z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`
                    : 'relative'
                    } w-64 bg-white border-r border-[#fde8f0] shadow-lg`}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center mb-8">
                        <div className="relative w-44 h-12 mr-2">
                            <Image
                                src="/products/wonder.webp"
                                alt="Wonder Beauties Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        {isMobile && (
                            <button
                                onClick={toggleSidebar}
                                className="ml-auto text-gray-500 p-2"
                                aria-label="Close menu"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <nav className="space-y-2 flex-grow">
                        {session?.user?.role === 'admin' && (
                            <>
                                <Link href="/admin/dashboard">
                                    <div
                                        className={`flex items-center p-4 rounded-lg transition-colors ${isActive('/admin/dashboard')
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'hover:bg-[var(--primary-light)] text-[#333]'
                                            }`}
                                        onClick={isMobile ? toggleSidebar : undefined}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-3">
                                            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                                        </svg>
                                        Dashboard
                                    </div>
                                </Link>

                                <Link href="/admin/inventory">
                                    <div
                                        className={`flex items-center p-4 rounded-lg transition-colors ${isActive('/admin/inventory')
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'hover:bg-[var(--primary-light)] text-[#333]'
                                            }`}
                                        onClick={isMobile ? toggleSidebar : undefined}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-3">
                                            <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                                            <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                        </svg>
                                        Inventory
                                    </div>
                                </Link>

                                <Link href="/admin/reports">
                                    <div
                                        className={`flex items-center p-4 rounded-lg transition-colors ${isActive('/admin/reports')
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'hover:bg-[var(--primary-light)] text-[#333]'
                                            }`}
                                        onClick={isMobile ? toggleSidebar : undefined}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-3">
                                            <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                                            <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                                        </svg>
                                        Reports
                                    </div>
                                </Link>
                            </>
                        )}

                        {/* Users link for all users */}
                        <Link href="/admin/users">
                            <div
                                className={`flex items-center p-4 rounded-lg transition-colors ${isActive('/admin/users')
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'hover:bg-[var(--primary-light)] text-[#333]'
                                    }`}
                                onClick={() => {
                                    console.log("Navigating to /admin/users");
                                    if (isMobile) toggleSidebar();
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-3">
                                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                                </svg>
                                Users
                            </div>
                        </Link>
                    </nav>

                    <div className="mt-6">
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors p-4 font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-3">
                                <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1">
                {/* Header */}
                <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="p-2 mr-2 text-[var(--primary)]"
                            aria-label="Open menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}

                    <h1 className="text-2xl font-bold text-[var(--primary)]">{title}</h1>

                    <div className="flex items-center space-x-4">
                        {selectedCountry && (
                            <span className="hidden md:inline-block text-sm font-medium text-[var(--primary-dark)]">
                                Country: {selectedCountry.name}
                            </span>
                        )}
                        {session && (
                            <div className="flex items-center bg-[var(--primary-light)] rounded-full px-4 py-1">
                                <span className="hidden md:inline-block text-sm font-medium text-[var(--primary)]">
                                    {session.user.name}
                                </span>
                                <span className="ml-0 md:ml-2 bg-[var(--primary)] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout; 