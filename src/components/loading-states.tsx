"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"

export function CardPreviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Skeleton className="w-full h-[300px] md:h-[400px]" />
      </div>
      <div className="text-center">
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AIGenerationProgress({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-purple-500 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Generation in Progress</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{status}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        This may take a few seconds...
      </div>
    </div>
  )
}

export function QuickGenerationLoader() {
  return (
    <div className="flex items-center justify-center p-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border">
      <div className="text-center space-y-3">
        <div className="relative mx-auto w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
          <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-green-600 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Quick Generation</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Generating instant data...</p>
        </div>
      </div>
    </div>
  )
}

export function TemplateLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  )
}
