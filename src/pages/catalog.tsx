import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import Basket from '../components/Basket';
import { useAppContext } from '../contexts/AppContext';

export default function Catalog() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { products, loadProducts, basket, basketTotal, clearBasket } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // Check if user is authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const handleCheckout = async () => {
        if (basket.length === 0) return;

        try {
            setCheckoutLoading(true);

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
                const data = await response.json();
                setError(data.message || 'Failed to process transaction');
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
            <Layout title="Product Catalog">
                <div className="text-center py-10">
                    <p className="text-xl">Loading...</p>
                </div>
            </Layout>
        );
    }

    // If not authenticated, return null (will redirect)
    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <Layout title="Product Catalog">
            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {error}
                    <button
                        onClick={() => {
                            setError('');
                            loadProducts();
                        }}
                        className="ml-2 underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {checkoutSuccess && (
                <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
                    Purchase successful! Your balance has been updated.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4">Available Products</h2>

                    {products.length === 0 ? (
                        <div className="text-gray-500">
                            <p>No products available.</p>
                            <button
                                onClick={loadProducts}
                                className="mt-2 text-blue-600 underline"
                            >
                                Refresh Products
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    image={product.image}
                                    price={product.sellingPrice}
                                    stock={product.stock}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="md:col-span-1">
                    <Basket />

                    {basket.length > 0 && (
                        <button
                            onClick={handleCheckout}
                            disabled={checkoutLoading}
                            className={`mt-4 w-full py-3 rounded-md text-white font-medium ${checkoutLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {checkoutLoading ? 'Processing...' : 'Confirm Purchase'}
                        </button>
                    )}
                </div>
            </div>
        </Layout>
    );
} 