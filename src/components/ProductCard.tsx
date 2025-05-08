import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAppContext } from '../contexts/AppContext';

type Product = {
    id: string;
    name: string;
    image: string;
    sellingPrice: number;
    purchaseCost: number;
    stock: number;
    category?: string;
};

type ProductProps = {
    product: Product;
};

const ProductCard: React.FC<ProductProps> = ({ product }) => {
    const { id, name, image, sellingPrice: price, stock } = product;
    const { addToBasket } = useAppContext();
    const [quantity, setQuantity] = useState(1);
    const [showNotification, setShowNotification] = useState(false);
    const [addingToBasket, setAddingToBasket] = useState(false);

    const handleAddToBasket = () => {
        if (quantity <= 0 || stock <= 0) return;

        setAddingToBasket(true);

        // Add items to basket
        for (let i = 0; i < quantity; i++) {
            addToBasket(product);
        }

        // Reset quantity after adding
        setQuantity(1);

        // Show notification
        setShowNotification(true);

        // Hide notification after 2 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 2000);

        // Reset the adding state after animation completes
        setTimeout(() => {
            setAddingToBasket(false);
        }, 300);
    };

    const incrementQuantity = () => {
        if (quantity < stock) {
            setQuantity(prev => prev + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    return (
        <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 transform ${addingToBasket ? 'scale-95' : 'hover:scale-102'} hover:shadow-xl border border-transparent ${stock > 0 ? 'hover:border-[var(--primary)]' : ''}`}>
            {/* Stock badge */}
            {stock > 0 && stock <= 5 && (
                <div className="absolute top-3 right-3 bg-amber-500 text-white py-1 px-3 rounded-full text-sm font-bold z-10">
                    Only {stock} left
                </div>
            )}

            {/* Out of stock overlay */}
            {stock <= 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
                    <div className="bg-gray-800 text-white px-6 py-3 rounded-lg font-bold text-xl transform -rotate-12">
                        OUT OF STOCK
                    </div>
                </div>
            )}

            {/* Product image with gradient overlay at bottom */}
            <div className="relative h-48 w-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain p-4"
                />
            </div>

            {/* Product info */}
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-xl text-gray-800 mb-2">{name}</h3>

                {/* Price tag */}
                <div className="mt-auto">
                    <div className="text-[var(--primary)] font-bold text-2xl mb-4">
                        ${price.toFixed(2)}
                    </div>

                    {/* Quantity controls and Add button */}
                    {stock > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-600 font-medium">Quantity:</span>
                                <div className="flex items-center border-2 border-[var(--primary)] rounded-full overflow-hidden">
                                    <button
                                        onClick={decrementQuantity}
                                        className="w-12 h-10 bg-[var(--primary-light)] text-[var(--primary)] font-bold text-xl transition-colors hover:bg-[var(--primary)] hover:text-white"
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <span className="w-10 h-10 flex items-center justify-center font-bold text-lg">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={incrementQuantity}
                                        className="w-12 h-10 bg-[var(--primary-light)] text-[var(--primary)] font-bold text-xl transition-colors hover:bg-[var(--primary)] hover:text-white"
                                        aria-label="Increase quantity"
                                        disabled={quantity >= stock}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={handleAddToBasket}
                                    className="w-full py-4 rounded-xl text-white font-bold text-lg 
                                    bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 
                                    shadow-md hover:shadow-lg transition-all
                                    active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                        <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25z" />
                                    </svg>
                                    ADD TO BASKET
                                </button>

                                {/* Notification with animation */}
                                {showNotification && (
                                    <div
                                        className="absolute left-0 right-0 -top-16 mx-auto w-max transform"
                                        style={{
                                            animation: "fadeUpAndOut 2s ease-out forwards"
                                        }}
                                    >
                                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                            </svg>
                                            Yummy choice! 😋
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button
                            disabled
                            className="w-full py-4 mt-auto rounded-xl text-white font-bold text-lg bg-gray-400 cursor-not-allowed"
                        >
                            OUT OF STOCK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard; 