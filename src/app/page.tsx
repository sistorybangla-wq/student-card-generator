"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// Dynamically import StudentCardGenerator with no SSR
const StudentCardGenerator = dynamic(
  () => import("@/components/StudentCardGenerator").then(mod => ({ default: mod.StudentCardGenerator })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading card generator...</p>
        </div>
      </div>
    )
  }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center py-8 relative">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Multi-University Student ID Card Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Generate realistic student ID cards for multiple Indian universities
          </p>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-2 border-blue-200 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Advanced Card Generator
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create customizable student ID cards with multiple templates and AI-generated data
                  </p>
                  <div className="text-xs text-gray-500 mb-4">
                    ✨ Multiple Templates • 🤖 AI Generated Data • 📱 Responsive Design
                  </div>
                  <p className="text-sm font-medium text-blue-600">
                    Current Page - You&apos;re here!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-2 border-green-200 bg-white/80 backdrop-blur-sm hover:border-green-400">
              <CardContent className="p-6">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Quick Card Generator
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Fast and simple student ID card generation with one-click creation
                  </p>
                  <div className="text-xs text-gray-500 mb-4">
                    ⚡ One-Click Generation • 🎲 Random Data • 💾 Instant Download
                  </div>
                  <Link href="/card-generator">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Try Quick Generator
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>
        <StudentCardGenerator />
      </div>
    </div>
  );
}
