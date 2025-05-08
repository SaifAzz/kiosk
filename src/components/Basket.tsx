import React from 'react';
import Image from 'next/image';
import { useAppContext } from '../contexts/AppContext';

const Basket: React.FC = () => {
    const { basket, removeFromBasket, basketTotal, clearBasket } = useAppContext();

    if (basket.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Your Basket</h2>
                <p className="text-gray-500">Your basket is empty.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">Your Basket</h2>

            <div className="space-y-4">
                {basket.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="relative h-12 w-12 mr-4">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover rounded"
                                />
                            </div>
                            <div>
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-gray-500">
                                    ${item.price.toFixed(2)} x {item.quantity}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <span className="mr-4 font-medium">
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                                onClick={() => removeFromBasket(item.productId)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Total:</span>
                    <span className="font-semibold text-lg text-[var(--primary)]">${basketTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                    <button
                        onClick={clearBasket}
                        className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Clear Basket
                    </button>

                    <button
                        className="py-2 px-6 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-dark)]"
                    >
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Basket; 