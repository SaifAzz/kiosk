import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import Image from 'next/image';
import Link from 'next/link';

type Product = {
    id: string;
    name: string;
    image: string;
    purchaseCost: number;
    sellingPrice: number;
    stock: number;
    createdAt: string;
    updatedAt: string;
};

export default function InventoryManagement() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [restockProductId, setRestockProductId] = useState<string | null>(null);
    const [restockQuantity, setRestockQuantity] = useState('');
    const [newCost, setNewCost] = useState('');
    const [restockLoading, setRestockLoading] = useState(false);
    const [restockError, setRestockError] = useState('');
    const [restockSuccess, setRestockSuccess] = useState(false);

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

    // Load products
    useEffect(() => {
        const fetchProducts = async () => {
            if (!session) return;

            try {
                setLoading(true);
                const response = await fetch('/api/products');

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const data = await response.json();
                setProducts(data);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === 'admin') {
            fetchProducts();
        }
    }, [session]);

    const handleRestock = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!restockProductId || !restockQuantity || parseInt(restockQuantity) <= 0) {
            setRestockError('Please enter a valid quantity');
            return;
        }

        try {
            setRestockLoading(true);
            setRestockError('');

            const response = await fetch('/api/products/restock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: restockProductId,
                    quantity: parseInt(restockQuantity),
                    ...(newCost ? { newCost: parseFloat(newCost) } : {}),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to restock product');
            }

            // Reset form and show success message
            setRestockSuccess(true);
            setRestockProductId(null);
            setRestockQuantity('');
            setNewCost('');

            // Reload products
            const productsResponse = await fetch('/api/products');
            const productsData = await productsResponse.json();
            setProducts(productsData);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setRestockSuccess(false);
            }, 3000);
        } catch (err) {
            if (err instanceof Error) {
                setRestockError(err.message);
            } else {
                setRestockError('An error occurred during restocking');
            }
            console.error('Restock error:', err);
        } finally {
            setRestockLoading(false);
        }
    };

    // Show loading state
    if (status === 'loading' || (loading && !error)) {
        return (
            <Layout title="Inventory Management">
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
        <Layout title="Inventory Management">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/admin/dashboard">
                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition-colors">
                        ← Back to Dashboard
                    </button>
                </Link>

                <Link href="/admin/inventory/add">
                    <button className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors">
                        Add New Product
                    </button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {restockSuccess && (
                <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
                    Product restocked successfully!
                </div>
            )}

            {restockProductId && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        Restock {products.find(p => p.id === restockProductId)?.name}
                    </h2>

                    {restockError && (
                        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                            {restockError}
                        </div>
                    )}

                    <form onSubmit={handleRestock} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-2" htmlFor="quantity">
                                Quantity to Add
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                value={restockQuantity}
                                onChange={(e) => setRestockQuantity(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2" htmlFor="newCost">
                                New Cost Price (optional)
                            </label>
                            <input
                                type="number"
                                id="newCost"
                                value={newCost}
                                onChange={(e) => setNewCost(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                min="0.01"
                                step="0.01"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={restockLoading}
                                className={`py-2 px-4 rounded text-white ${restockLoading
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {restockLoading ? 'Processing...' : 'Confirm Restock'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setRestockProductId(null)}
                                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>

                    {products.length === 0 ? (
                        <p className="text-gray-500">No products available.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cost
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 relative mr-3">
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover rounded"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${product.purchaseCost.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${product.sellingPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 10
                                                        ? 'bg-green-100 text-green-800'
                                                        : product.stock > 0
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => setRestockProductId(product.id)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                >
                                                    Restock
                                                </button>
                                                <Link href={`/admin/inventory/${product.id}`}>
                                                    <span className="text-indigo-600 hover:text-indigo-900">
                                                        Edit
                                                    </span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
} 