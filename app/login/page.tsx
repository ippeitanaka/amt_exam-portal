"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"

export default function LoginPage() {
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Supabaseから学生情報を取得
      const { data, error } = await supabase.from("students").select("*").eq("student_id", studentId).single()

      if (error || !data) {
        throw new Error("学生IDが見つかりません")
      }

      // パスワード検証（実際のプロダクションでは適切な検証方法を使用すべき）
      // ハッシュ化されている場合は、verify_password関数などを使用する
      if (data.password !== password) {
        throw new Error("パスワードが正しくありません")
      }

      // ログイン成功
      localStorage.setItem("studentId", studentId)
      localStorage.setItem("studentName", data.name)

      toast({
        title: "ログイン成功",
        description: "ダッシュボードにリダイレクトします",
      })

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="学生ログイン" />
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
            <p className="text-brown-600 dark:text-brown-300">学生IDとパスワードでログインしてください</p>
          </div>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">学生ログイン</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                成績を確認するにはログインしてください
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6 bg-white dark:bg-brown-900">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-brown-700 dark:text-brown-200">
                    学生ID
                  </Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-brown-700 dark:text-brown-200">
                    パスワード
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 bg-white dark:bg-brown-900 rounded-b-lg">
                <Button
                  type="submit"
                  className="w-full bg-brown-600 hover:bg-brown-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ログイン中...
                    </>
                  ) : (
                    "ログイン"
                  )}
                </Button>
                <div className="text-center w-full">
                  <Button
                    variant="link"
                    className="text-sm text-brown-600 hover:text-brown-800 dark:text-brown-300 dark:hover:text-brown-100"
                    onClick={() => router.push("/admin")}
                  >
                    管理者の方はこちら
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
