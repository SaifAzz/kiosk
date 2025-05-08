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
    // If the user is not authenticated and we have a selected country, redirect to login
    if (status === 'unauthenticated' && selectedCountry) {
      router.push('/login');
      return;
    }

    // If we don't have a selected country, redirect to country selection
    if (!selectedCountry) {
      router.push('/select-country');
      return;
    }

    // If the user is authenticated, redirect to the appropriate dashboard
    if (status === 'authenticated') {
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
        <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
        <p className="mt-2 text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
