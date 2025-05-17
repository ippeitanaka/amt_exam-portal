"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/header"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Image
                src="/images/character-icon-new.png"
                alt="キャラクターアイコン"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-brown-800 dark:text-brown-100">模擬試験確認システム</h1>
            <p className="text-brown-600 dark:text-brown-300">ログインタイプを選択してください</p>
          </div>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">ログイン選択</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                学生または管理者としてログインしてください
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-brown-900">
              <div className="text-center">
                <p className="mb-2 text-brown-700 dark:text-brown-200">あなたは？</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 bg-white dark:bg-brown-900 rounded-b-lg">
              <Button
                className="w-full bg-brown-600 hover:bg-brown-700 text-white"
                onClick={() => router.push("/login")}
              >
                学生ログイン
              </Button>
              <Button
                variant="outline"
                className="w-full border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
                onClick={() => router.push("/admin")}
              >
                管理者ログイン
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
