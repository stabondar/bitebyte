import { ScreenshotAnalyzer } from "@/components/screenshot-analyzer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-primary">Bite</span>
            <span className="text-blue-500">Byte</span>
          </h1>
          <p className="text-xl">AI-Powered Food Calorie Counter</p>
          <p className="text-muted-foreground">Take a photo of your meal and get instant nutritional insights</p>
        </div>

        <ScreenshotAnalyzer />

        <footer className="text-center text-sm text-muted-foreground mt-8">
          <p>© {new Date().getFullYear()} BiteByte. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}