import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

type Country = {
    id: string;
    name: string;
};

type Product = {
    id: string;
    name: string;
    image: string;
    purchaseCost: number;
    sellingPrice: number;
    stock: number;
};

type BasketItem = {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
};

type AppContextType = {
    selectedCountry: Country | null;
    setSelectedCountry: (country: Country | null) => void;
    products: Product[];
    loadProducts: () => Promise<void>;
    basket: BasketItem[];
    addToBasket: (product: Product) => void;
    removeFromBasket: (productId: string) => void;
    clearBasket: () => void;
    basketTotal: number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [basket, setBasket] = useState<BasketItem[]>([]);
    const router = useRouter();
    const { data: session } = useSession();
    const lastLoadTime = useRef<number>(0);
    const isLoading = useRef<boolean>(false);

    // Load selected country from localStorage on component mount
    useEffect(() => {
        const storedCountry = localStorage.getItem('selectedCountry');
        if (storedCountry) {
            try {
                setSelectedCountry(JSON.parse(storedCountry));
            } catch (error) {
                console.error('Failed to parse stored country:', error);
                localStorage.removeItem('selectedCountry');
            }
        }
    }, []);

    // Save selected country to localStorage whenever it changes
    useEffect(() => {
        if (selectedCountry) {
            localStorage.setItem('selectedCountry', JSON.stringify(selectedCountry));
        } else {
            localStorage.removeItem('selectedCountry');
        }
    }, [selectedCountry]);

    // Auto-load products when session is available
    useEffect(() => {
        if (session) {
            loadProducts();
        }
    }, [session]);

    // Load products with throttling to prevent excessive API calls
    const loadProducts = async () => {
        if (!session) return;

        // Throttle requests - only allow one every 5 seconds
        const now = Date.now();
        if (isLoading.current || (now - lastLoadTime.current < 5000 && products.length > 0)) {
            return;
        }

        isLoading.current = true;
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
                lastLoadTime.current = Date.now();
            } else {
                console.error('Failed to fetch products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            isLoading.current = false;
        }
    };

    // Calculate basket total
    const basketTotal = basket.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Add a product to the basket
    const addToBasket = (product: Product) => {
        setBasket(prev => {
            const existingItemIndex = prev.findIndex(item => item.productId === product.id);

            if (existingItemIndex !== -1) {
                // Update quantity of existing item
                const updatedBasket = [...prev];
                updatedBasket[existingItemIndex].quantity += 1;
                return updatedBasket;
            } else {
                // Add new item
                return [...prev, {
                    productId: product.id,
                    quantity: 1,
                    price: product.sellingPrice,
                    name: product.name,
                    image: product.image,
                }];
            }
        });
    };

    // Remove a product from the basket
    const removeFromBasket = (productId: string) => {
        setBasket(prev => {
            const existingItemIndex = prev.findIndex(item => item.productId === productId);

            if (existingItemIndex !== -1) {
                // If quantity is 1, remove the item
                if (prev[existingItemIndex].quantity === 1) {
                    return prev.filter(item => item.productId !== productId);
                } else {
                    // Otherwise, decrease the quantity
                    const updatedBasket = [...prev];
                    updatedBasket[existingItemIndex].quantity -= 1;
                    return updatedBasket;
                }
            }

            return prev;
        });
    };

    // Clear the basket
    const clearBasket = () => {
        setBasket([]);
    };

    return (
        <AppContext.Provider value={{
            selectedCountry,
            setSelectedCountry,
            products,
            loadProducts,
            basket,
            addToBasket,
            removeFromBasket,
            clearBasket,
            basketTotal,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}; 