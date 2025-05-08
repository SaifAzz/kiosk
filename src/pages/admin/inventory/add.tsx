import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import Link from 'next/link';

export default function AddProduct() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        purchaseCost: '',
        sellingPrice: '',
        stock: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.image || !formData.purchaseCost || !formData.sellingPrice || !formData.stock) {
            setError('All fields are required');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create product');
            }

            // Show success and reset form
            setSuccess(true);
            setFormData({
                name: '',
                image: '',
                purchaseCost: '',
                sellingPrice: '',
                stock: '',
            });

            // Clear success after 3 seconds
            setTimeout(() => {
                setSuccess(false);
            }, 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An error occurred while creating the product');
            }
            console.error('Add product error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (status === 'loading') {
        return (
            <Layout title="Add Product">
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
        <Layout title="Add Product">
            <div className="mb-6">
                <Link href="/admin/inventory">
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors">
                        ← Back to Inventory
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-6">Add New Product</h2>

                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
                        Product added successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 mb-2" htmlFor="name">
                            Product Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2" htmlFor="image">
                            Image URL
                        </label>
                        <input
                            type="text"
                            id="image"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded"
                            placeholder="/products/example.jpg"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            For demo purposes, enter a URL (e.g., /products/snickers.jpg, /products/water.jpg)
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-2" htmlFor="purchaseCost">
                                Purchase Cost ($)
                            </label>
                            <input
                                type="number"
                                id="purchaseCost"
                                name="purchaseCost"
                                value={formData.purchaseCost}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2" htmlFor="sellingPrice">
                                Selling Price ($)
                            </label>
                            <input
                                type="number"
                                id="sellingPrice"
                                name="sellingPrice"
                                value={formData.sellingPrice}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2" htmlFor="stock">
                                Initial Stock
                            </label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`py-3 px-6 rounded text-white font-medium ${loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
} 