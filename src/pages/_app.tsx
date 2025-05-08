import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '../contexts/AppContext';
import { Metadata } from 'next';
import Head from 'next/head';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <Head>
        <title>Wonder Beauties</title>
        <meta name="description" content="Wonder Beauties self-service kiosk" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SessionProvider session={session}>
        <AppProvider>
          <Component {...pageProps} />
        </AppProvider>
      </SessionProvider>
    </>
  );
}
