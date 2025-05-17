"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // ハードコードされた認証（バックアップとして残す）
      if (username === "amt" && password === "TOYOamt01") {
        localStorage.setItem("adminLoggedIn", "true")
        localStorage.setItem("adminId", "1")
        localStorage.setItem("adminName", "管理者")
        localStorage.setItem("adminRole", "super_admin")

        toast({
          title: "ログイン成功",
          description: "管理者ダッシュボードにリダイレクトします",
        })

        router.push("/admin/dashboard")
        return
      }

      // Supabaseからの認証を試みる
      try {
        console.log("Supabaseクエリを実行中...")
        const { data, error: queryError } = await supabase
          .from("admin_users")
          .select("id, username, password")
          .eq("username", username)
          .single()

        console.log("Supabaseクエリ結果:", data, queryError)

        if (queryError) {
          console.error("Supabaseクエリエラー:", queryError)
          throw new Error("データベースからユーザー情報を取得できませんでした")
        }

        if (!data) {
          throw new Error("ユーザー名が見つかりません")
        }

        // パスワード検証
        if (data.password !== password) {
          throw new Error("パスワードが正しくありません")
        }

        // 管理者情報を取得
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("admin_user_id", data.id)
          .single()

        if (adminError) {
          console.error("管理者情報取得エラー:", adminError)
        }

        // ログイン成功
        localStorage.setItem("adminLoggedIn", "true")
        localStorage.setItem("adminId", data.id.toString())
        localStorage.setItem("adminName", adminData?.name || username)
        localStorage.setItem("adminRole", adminData?.role || "admin")

        toast({
          title: "ログイン成功",
          description: "管理者ダッシュボードにリダイレクトします",
        })

        router.push("/admin/dashboard")
      } catch (supabaseError) {
        console.error("Supabase認証エラー:", supabaseError)

        // ハードコードされた認証でも失敗した場合はエラーを表示
        if (username !== "amt" || password !== "TOYOamt01") {
          setError(supabaseError instanceof Error ? supabaseError.message : "ログインに失敗しました")
        }
      }
    } catch (err) {
      console.error("ログインエラー:", err)
      setError(err instanceof Error ? err.message : "ログインに失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="管理者ログイン" />
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
            <p className="text-brown-600 dark:text-brown-300">管理者ログイン</p>
          </div>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">管理者ログイン</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                管理者機能にアクセスするにはログインしてください
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
                  <Label htmlFor="username" className="text-brown-700 dark:text-brown-200">
                    ユーザー名
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    onClick={() => router.push("/login")}
                  >
                    学生の方はこちら
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
