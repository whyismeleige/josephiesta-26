import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Import the menu
import { StaggeredMenu } from "@/components/StaggeredMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Josephiesta 2K26",
  description: "Annual Techno-Cultural Fest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Define your menu items here
  const menuItems = [
    { label: 'Home', ariaLabel: 'Home', link: '/' },
    { label: 'Events', ariaLabel: 'View Events', link: '/events' },
    { label: 'Register', ariaLabel: 'Register for Fest', link: '/register' },
    { label: 'Team', ariaLabel: 'Coordinators', link: '/team' },
    { label: 'Contact', ariaLabel: 'Contact Us', link: '/contact' },
  ];

  const socialItems = [
    { label: 'Instagram', link: 'https://www.instagram.com/josephiesta2026/' },
    { label: 'LinkedIn', link: 'https://www.linkedin.com/school/sjchyd/posts/?feedView=all' },
  ];

  return (
    <html lang="en">
      <body className={inter.className}>
        
        {/* The Menu Overlay */}
        <StaggeredMenu 
            items={menuItems} 
            socialItems={socialItems} 
            isFixed={true}
            // Josephiesta Purple Colors
            colors={['#c084fc', '#9333ea', '#581c87']} 
        />
        
        {children}
      </body>
    </html>
  );
}