import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import Link from 'next/link';
import Image from 'next/image';

export default function AddProduct() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        purchaseCost: '',
        sellingPrice: '',
        stock: '',
        countryId: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [countries, setCountries] = useState<Array<{ id: string, name: string }>>([]);

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

    // Fetch countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('/api/countries');
                if (response.ok) {
                    const data = await response.json();
                    setCountries(data);
                    // Set default country if available
                    if (data.length > 0) {
                        setFormData(prev => ({ ...prev, countryId: data[0].id }));
                    }
                }
            } catch (err) {
                console.error('Error fetching countries:', err);
            }
        };

        if (status === 'authenticated') {
            fetchCountries();
        }
    }, [status]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a preview URL
        const imageUrl = URL.createObjectURL(file);
        setImagePreview(imageUrl);

        // In a real application, you would upload the file to a server/storage service
        // For now, we'll store the file name as if it would be saved to /products/
        setFormData(prev => ({
            ...prev,
            image: `/products/${file.name}`
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.name || !formData.image || !formData.purchaseCost || !formData.sellingPrice || !formData.stock || !formData.countryId) {
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
                countryId: countries.length > 0 ? countries[0].id : '',
            });
            setImagePreview(null);

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
                            className="w-full p-3 border border-gray-300 rounded text-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2" htmlFor="country">
                            Country
                        </label>
                        <select
                            id="countryId"
                            name="countryId"
                            value={formData.countryId}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded text-black"
                            required
                            aria-label="Select country"
                        >
                            <option value="" disabled>Select a country</option>
                            {countries.map(country => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2" htmlFor="imageUpload">
                            Product Image
                        </label>
                        <div className="flex flex-col space-y-3">
                            <input
                                type="file"
                                id="imageUpload"
                                name="imageUpload"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full p-2 border border-gray-300 rounded text-black"
                            />

                            {imagePreview && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
                                    <div className="relative h-40 w-40 border border-gray-300">
                                        <Image
                                            src={imagePreview}
                                            alt="Product preview"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <input
                                type="text"
                                id="image"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded text-black"
                                placeholder="/products/example.jpg"
                                required
                            />
                            <p className="text-sm text-gray-500">
                                Image path (automatically filled when uploading, or enter manually)
                            </p>
                        </div>
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
                                className="w-full p-3 border border-gray-300 rounded text-black"
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
                                className="w-full p-3 border border-gray-300 rounded text-black"
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
                                className="w-full p-3 border border-gray-300 rounded text-black"
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