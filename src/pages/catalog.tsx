import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import KioskLayout from '../components/KioskLayout';
import ProductCard from '../components/ProductCard';
import Basket from '../components/Basket';
import { useAppContext } from '../contexts/AppContext';

export default function Catalog() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { products, loadProducts, basket, basketTotal, clearBasket, selectedCountry } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Check if user is authenticated
    useEffect(() => {
        // First check if there's a selected country
        if (!selectedCountry) {
            console.log("No country selected, redirecting to country selection");
            router.replace('/select-country');
            return;
        }

        // Then check authentication status
        if (status === 'unauthenticated') {
            console.log("User not authenticated, redirecting to login");
            router.replace('/login');
            return;
        }

        // Load products when authenticated
        if (status === 'authenticated') {
            setLoading(true);
            loadProducts()
                .then(() => {
                    setLoading(false);
                    setError('');
                })
                .catch(err => {
                    console.error("Error loading products:", err);
                    setError('Failed to load products. Please refresh the page.');
                    setLoading(false);
                });
        }
    }, [status, router, loadProducts, selectedCountry]);

    // Extract unique categories
    useEffect(() => {
        if (products.length > 0) {
            const uniqueCategories = Array.from(new Set(products.map(p => p.category || 'Uncategorized')));
            setCategories(uniqueCategories);
            if (!activeCategory) {
                setActiveCategory(uniqueCategories[0]);
            }
        }
    }, [products, activeCategory]);

    const handleCheckout = async () => {
        if (basket.length === 0) return;

        try {
            setCheckoutLoading(true);
            setError('');

            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: basket.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                clearBasket();
                setCheckoutSuccess(true);

                // Reset success message after 3 seconds
                setTimeout(() => {
                    setCheckoutSuccess(false);
                }, 3000);

                // Reload products to update stock
                await loadProducts();
            } else {
                // Show a more detailed error message
                setError(data.message || 'Failed to process transaction');

                // If it's a stock error, reload products to show updated stock levels
                if (data.message && data.message.includes('Insufficient stock')) {
                    await loadProducts();
                }
            }
        } catch (err) {
            setError('An error occurred during checkout');
            console.error('Checkout error:', err);
        } finally {
            setCheckoutLoading(false);
        }
    };

    // Show loading state
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl font-medium text-[var(--primary)]">Loading...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, return null (will redirect)
    if (status === 'unauthenticated') {
        return null;
    }

    // Filter products by active category and search query
    const filteredProducts = products
        .filter(p => !activeCategory || (p.category || 'Uncategorized') === activeCategory)
        .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <KioskLayout title="Kiosk Self-Service">
            {error && (
                <div className="bg-red-100 text-red-700 p-6 rounded-2xl mb-6 text-xl flex items-center justify-between">
                    <div>{error}</div>
                    <button
                        onClick={() => {
                            setError('');
                            loadProducts();
                        }}
                        className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 text-lg font-bold transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {checkoutSuccess && (
                <div className="bg-green-100 text-green-700 p-6 rounded-2xl mb-6 text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Purchase successful! Your balance has been updated.
                </div>
            )}

            <div className="flex flex-col-reverse md:flex-row gap-8">
                {/* Main product area - takes 2/3 of the width on desktop */}
                <div className="md:w-2/3">
                    {/* Search bar and category selector */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-3 px-4 pl-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] text-lg"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {categories.length > 0 && (
                            <div className="relative">
                                <select
                                    value={activeCategory || ''}
                                    onChange={(e) => setActiveCategory(e.target.value)}
                                    className="appearance-none py-3 px-4 pr-10 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] w-full md:w-44 text-lg"
                                    aria-label="Select product category"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Products */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-3xl font-bold mb-6 text-[var(--primary)]">
                            {activeCategory || 'All Products'}
                            {searchQuery && <span className="text-gray-500 text-xl ml-2">searching for "{searchQuery}"</span>}
                        </h2>

                        {/* No products message */}
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-10">
                                <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-gray-300">
                                        <path d="M12 .75a8.25 8.25 0 00-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 00.577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.75 6.75 0 1110.5 0v4.661c0 .326.277.585.6.544.364-.047.722-.112 1.074-.195a.75.75 0 00.577-.706c.019-.615.448-1.225 1.134-1.623A8.25 8.25 0 0012 .75z" />
                                        <path fillRule="evenodd" d="M9.75 15.75a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V16.5a.75.75 0 01.75-.75zm4.5 0a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-2xl text-gray-400 mb-2">No products found</p>
                                {searchQuery ? (
                                    <p className="text-gray-400">Try a different search term or category</p>
                                ) : (
                                    <p className="text-gray-400">No products are available in this category</p>
                                )}
                            </div>
                        )}

                        {/* Products grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Basket - takes 1/3 of the width on desktop */}
                <div className="md:w-1/3">
                    <Basket
                        onCheckout={handleCheckout}
                        isCheckoutLoading={checkoutLoading}
                        isUserSelected={true} // Always enable checkout
                    />
                </div>
            </div>
        </KioskLayout>
    );
} 