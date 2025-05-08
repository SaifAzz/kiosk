import React from 'react';
import Image from 'next/image';
import { useAppContext } from '../contexts/AppContext';

type ProductProps = {
    id: string;
    name: string;
    image: string;
    price: number;
    stock: number;
};

const ProductCard: React.FC<ProductProps> = ({ id, name, image, price, stock }) => {
    const { addToBasket } = useAppContext();

    const product = {
        id,
        name,
        image,
        sellingPrice: price,
        purchaseCost: 0, // Not relevant for display
        stock,
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative h-48 w-full">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-lg">{name}</h3>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-900 font-medium">${price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">Stock: {stock}</span>
                </div>
                <button
                    onClick={() => addToBasket(product)}
                    disabled={stock <= 0}
                    className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${stock > 0
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    {stock > 0 ? 'Add to Basket' : 'Out of Stock'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard; 