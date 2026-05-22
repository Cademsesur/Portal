import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

const mulish = localFont({
  src: [
    { path: '../../public/fonts/Mulish-ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: '../../public/fonts/Mulish-ExtraLightItalic.ttf', weight: '200', style: 'italic' },
    { path: '../../public/fonts/Mulish-Light.ttf', weight: '300', style: 'normal' },
    { path: '../../public/fonts/Mulish-LightItalic.ttf', weight: '300', style: 'italic' },
    { path: '../../public/fonts/Mulish-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Mulish-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../../public/fonts/Mulish-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Mulish-MediumItalic.ttf', weight: '500', style: 'italic' },
    { path: '../../public/fonts/Mulish-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/Mulish-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: '../../public/fonts/Mulish-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../../public/fonts/Mulish-BoldItalic.ttf', weight: '700', style: 'italic' },
    { path: '../../public/fonts/Mulish-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../../public/fonts/Mulish-ExtraBoldItalic.ttf', weight: '800', style: 'italic' },
    { path: '../../public/fonts/Mulish-Black.ttf', weight: '900', style: 'normal' },
    { path: '../../public/fonts/Mulish-BlackItalic.ttf', weight: '900', style: 'italic' },
  ],
  variable: '--font-mulish',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Portal',
  description: "Plateforme interne SESUR de gestion des demandes d'achat",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={mulish.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
