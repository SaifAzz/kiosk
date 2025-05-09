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
    category?: string;
};

type BasketItem = {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
    stock: number;
};

type AppContextType = {
    selectedCountry: Country | null;
    setSelectedCountry: (country: Country | null) => void;
    products: Product[];
    loadProducts: () => Promise<void>;
    basket: BasketItem[];
    addToBasket: (product: Product) => void;
    removeFromBasket: (productId: string) => void;
    updateBasketQuantity: (productId: string, quantity: number) => void;
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

        // First priority: use country from localStorage
        if (storedCountry) {
            try {
                setSelectedCountry(JSON.parse(storedCountry));
                console.log("Setting country from localStorage:", JSON.parse(storedCountry).name);
            } catch (error) {
                console.error('Failed to parse stored country:', error);
                localStorage.removeItem('selectedCountry');
            }
        }
        // Don't auto-fetch from session to ensure users go through login flow
    }, []);

    // Function to fetch country details by ID - but don't call automatically
    const fetchCountryById = async (countryId: string) => {
        try {
            const response = await fetch(`/api/countries/${countryId}`);
            if (response.ok) {
                const country = await response.json();
                setSelectedCountry(country);
                console.log("Fetched country by ID:", country.name);
            }
        } catch (error) {
            console.error('Error fetching country:', error);
        }
    };

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
        if (!session) {
            console.log('No session available, cannot load products');
            return;
        }

        if (!selectedCountry) {
            console.log('No country selected, cannot load products');
            return;
        }

        // Throttle requests - only allow one every 5 seconds
        const now = Date.now();
        if (isLoading.current) {
            console.log('Already loading products, skipping request');
            return;
        }

        if (now - lastLoadTime.current < 5000 && products.length > 0) {
            console.log('Products recently loaded, using cached data');
            return;
        }

        console.log('Fetching products from database...');
        isLoading.current = true;
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                console.log(`Successfully loaded ${data.length} products from database`);
                setProducts(data);
                lastLoadTime.current = Date.now();
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to fetch products:', response.status, errorData.message);
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
                    stock: product.stock,
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

    // Update basket item quantity directly
    const updateBasketQuantity = (productId: string, quantity: number) => {
        setBasket(prev => {
            const existingItemIndex = prev.findIndex(item => item.productId === productId);

            if (existingItemIndex === -1) return prev;

            // If quantity is 0 or less, remove the item
            if (quantity <= 0) {
                return prev.filter(item => item.productId !== productId);
            }

            // Otherwise, update the quantity
            const updatedBasket = [...prev];
            updatedBasket[existingItemIndex].quantity = quantity;
            return updatedBasket;
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
            updateBasketQuantity,
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