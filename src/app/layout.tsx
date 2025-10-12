import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; // Import AuthProvider
import { LessonCacheProvider } from "@/context/LessonCacheContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chinese Learning Admin",
  description: "Manage your learning content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LessonCacheProvider>
            {children}
          </LessonCacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}