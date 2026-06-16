import React from 'react';
import './globals.css';

export const metadata = {
  title: 'PawGuard Enterprise',
  description: 'Continuous Intelligent Pet Health Monitoring Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}