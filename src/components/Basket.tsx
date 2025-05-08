import React, { useState } from 'react';
import Image from 'next/image';
import { useAppContext } from '../contexts/AppContext';

type BasketProps = {
    onCheckout?: () => void;
    isCheckoutLoading?: boolean;
    isUserSelected?: boolean;
};

const Basket: React.FC<BasketProps> = ({
    onCheckout,
    isCheckoutLoading = false,
    isUserSelected = true
}) => {
    const { basket, removeFromBasket, updateBasketQuantity, basketTotal, clearBasket } = useAppContext();
    const [isCollapsedOnMobile, setIsCollapsedOnMobile] = useState(true);

    const toggleBasketOnMobile = () => {
        setIsCollapsedOnMobile(!isCollapsedOnMobile);
    };

    // Empty basket view
    if (basket.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">Your Basket</h2>
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-gray-300">
                            <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                        </svg>
                    </div>
                    <p className="text-xl text-gray-500">Your basket is empty</p>
                    <p className="text-gray-400 mt-2">Add some items to get started</p>
                </div>
            </div>
        );
    }

    const isCheckoutDisabled = !onCheckout || isCheckoutLoading || !isUserSelected;

    return (
        <div className="relative">
            {/* Mobile basket toggle */}
            <div className="md:hidden sticky top-4 z-20 flex justify-between items-center mb-4">
                <button
                    onClick={toggleBasketOnMobile}
                    className="bg-white p-3 rounded-full shadow-lg text-[var(--primary)] flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                    </svg>
                    <span className="ml-2 font-bold">{basket.length}</span>
                </button>

                {/* Always visible checkout button on mobile when basket is collapsed */}
                <button
                    onClick={onCheckout}
                    disabled={isCheckoutDisabled}
                    className={`md:hidden ${isCollapsedOnMobile ? 'flex' : 'hidden'} items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 px-4 py-3 rounded-full text-white font-bold shadow-md hover:shadow-lg transition-all
                        ${isCheckoutDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>${basketTotal.toFixed(2)}</span>
                </button>
            </div>

            {/* Basket content */}
            <div className={`bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 transition-all duration-300 
                ${isCollapsedOnMobile ? 'max-h-0 md:max-h-none overflow-hidden p-0 md:p-8 opacity-0 md:opacity-100' : 'max-h-[80vh] overflow-y-auto opacity-100'}`}>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-[var(--primary)]">Your Basket</h2>
                    <span className="bg-[var(--primary-light)] text-[var(--primary)] px-3 py-1 rounded-full font-bold">
                        {basket.length} {basket.length === 1 ? 'item' : 'items'}
                    </span>
                </div>

                <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                    {basket.map((item) => (
                        <div key={item.productId} className="flex flex-col bg-gray-50 rounded-xl p-3 transition-all hover:shadow-md">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center">
                                    <div className="relative h-16 w-16 mr-4 bg-white rounded-lg shadow-sm overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-gray-500 text-sm">
                                            ${item.price.toFixed(2)} each
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeFromBasket(item.productId)}
                                    className="text-rose-400 hover:text-rose-500 p-2 transition-colors"
                                    aria-label={`Remove ${item.name} from basket`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex justify-between items-center ml-20 bg-white rounded-lg p-2 shadow-sm">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => updateBasketQuantity(item.productId, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center text-[var(--primary)] font-bold text-xl rounded-full hover:bg-[var(--primary-light)] transition-colors"
                                        disabled={item.quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span className="mx-3 text-lg font-semibold">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => updateBasketQuantity(item.productId, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center text-[var(--primary)] font-bold text-xl rounded-full hover:bg-[var(--primary-light)] transition-colors"
                                        disabled={item.quantity >= item.stock}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="font-bold text-lg text-[var(--primary)]">
                                    ${(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-bold text-xl text-gray-700">Total:</span>
                        <span className="font-bold text-2xl text-[var(--primary)]">${basketTotal.toFixed(2)}</span>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={clearBasket}
                            className="w-full py-3 border-2 border-rose-400 rounded-xl text-rose-500 font-bold text-lg hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                            </svg>
                            CLEAR BASKET
                        </button>

                        <button
                            onClick={onCheckout}
                            disabled={isCheckoutDisabled}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg 
                            ${isCheckoutDisabled
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-md hover:shadow-lg'
                                } transition-all flex items-center justify-center gap-2`}
                        >
                            {isCheckoutLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : !isUserSelected ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>SELECT USER FIRST</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <span>CHECKOUT ${basketTotal.toFixed(2)}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Basket; 