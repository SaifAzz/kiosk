import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useAppContext } from '../contexts/AppContext';
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { selectedCountry } = useAppContext();

  useEffect(() => {
    // Always check for country selection first
    if (!selectedCountry) {
      console.log("No country selected, redirecting to country selection");
      router.push('/select-country');
      return;
    }

    // Then check authentication status
    if (status === 'unauthenticated') {
      console.log("User not authenticated, redirecting to login");
      router.push('/login');
      return;
    }

    // Only if both checks pass, redirect to the appropriate dashboard
    if (status === 'authenticated') {
      console.log("User authenticated, redirecting to appropriate dashboard");
      if (session?.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/catalog');
      }
    }
  }, [router, session, status, selectedCountry]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/products/wonder.webp"
            alt="Wonder Beauties Logo"
            width={150}
            height={150}
            className="mb-4"
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Wonder Beauties Kiosk</h1>
        <p className="mt-2 text-gray-600">Please wait while we redirect you.</p>
        <div className="mt-6">
          <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
