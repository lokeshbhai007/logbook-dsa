// src/app/layout.js
import './globals.css';

export const metadata = {
  title: 'LeetCode Logbook',
  description: 'Track your LeetCode problem solving progress',
   icons: {
    icon: '/leetcode.svg', // relative to public/
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}