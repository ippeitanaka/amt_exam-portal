"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle, InfoIcon, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { authenticateStudent } from "@/app/actions/auth"
import { checkDatabaseConnection } from "@/app/actions/database"

export default function LoginPage() {
  const [studentId, setStudentId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ message: string; details?: string }>({ message: "" })
  const [dbStatus, setDbStatus] = useState<{ checked: boolean; connected: boolean; students: number; error?: string }>({
    checked: false,
    connected: false,
    students: 0,
  })
  const [envStatus, setEnvStatus] = useState<{
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  }>({
    NEXT_PUBLIC_SUPABASE_URL: "確認中...",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "確認中...",
  })
  const router = useRouter()
  const { toast } = useToast()

  // 環境変数の確認
  useEffect(() => {
    setEnvStatus({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
    })
  }, [])

  // ページロード時にデータベース接続を確認
  useEffect(() => {
    async function checkDatabase() {
      try {
        console.log("データベース接続を確認中...")

        // 環境変数が設定されていない場合は早期リターン
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error("環境変数が設定されていません")
          setDbStatus({
            checked: true,
            connected: false,
            students: 0,
            error: "環境変数が設定されていません",
          })
          return
        }

        // サーバーサイドアクションを使用してデータベース接続を確認
        const result = await checkDatabaseConnection()

        if (result.success) {
          setDbStatus({
            checked: true,
            connected: true,
            students: result.studentCount || 0,
          })
        } else {
          setDbStatus({
            checked: true,
            connected: false,
            students: 0,
            error: result.error || "データベース接続に失敗しました",
          })
        }
      } catch (err) {
        console.error("データベース確認エラー:", err)
        setDbStatus({
          checked: true,
          connected: false,
          students: 0,
          error: err instanceof Error ? err.message : "不明なエラー",
        })
      }
    }

    checkDatabase()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError({ message: "" })
    setIsLoading(true)

    try {
      console.log("学生ログイン処理を開始します - ID:", studentId)

      if (!studentId) {
        throw new Error("学生IDを入力してください")
      }

      // 新しいサーバーアクションを使用して認証
      const authResult = await authenticateStudent(studentId, password)

      if (!authResult.success) {
        throw new Error(authResult.error || "認証に失敗しました")
      }

      // ログイン成功
      localStorage.setItem("studentId", authResult.student.student_id)
      localStorage.setItem("studentName", authResult.student.name)

      // 通知を表示
      toast({
        title: "ログイン成功",
        description: `${authResult.student.name}さん、ようこそ！${authResult.emergency ? "（緊急モード）" : ""}`,
        variant: authResult.emergency ? "default" : "default",
      })

      // ダッシュボードへ移動
      router.push("/dashboard")
    } catch (err) {
      console.error("ログインエラー:", err)
      if (err instanceof Error) {
        setError({
          message: err.message,
          details: err.cause ? String(err.cause) : undefined,
        })
      } else {
        setError({ message: "ログインに失敗しました" })
      }
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
            <h1 className="text-2xl font-bold text-brown-800 dark:text-brown-100">AMT模擬試験確認システム</h1>
            <p className="text-brown-600 dark:text-brown-300">学生IDとパスワードでログインしてください</p>
          </div>

          {/* 環境変数ステータス表示 */}
          <div className="mb-4">
            <Alert className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <div className="flex flex-col">
                  <span>環境変数ステータス:</span>
                  <span>SUPABASE_URL: {envStatus.NEXT_PUBLIC_SUPABASE_URL}</span>
                  <span>SUPABASE_ANON_KEY: {envStatus.NEXT_PUBLIC_SUPABASE_ANON_KEY}</span>
                </div>
              </AlertDescription>
            </Alert>
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
                {/* データベース接続ステータス */}
                {dbStatus.checked && (
                  <div className="flex items-center mb-2 text-sm">
                    <div className="flex items-center">
                      {dbStatus.connected ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                      )}
                      <span className={dbStatus.connected ? "text-green-700" : "text-orange-700"}>
                        データベース: {dbStatus.connected ? "接続済み" : "未接続"}
                      </span>
                    </div>

                    {dbStatus.connected && (
                      <div className="ml-4 flex items-center">
                        <InfoIcon className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="text-blue-700">学生数: {dbStatus.students}</span>
                      </div>
                    )}
                  </div>
                )}

                {error.message && (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div>
                        <p>{error.message}</p>
                        {error.details && (
                          <p className="text-xs mt-1 text-red-600 dark:text-red-300">{error.details}</p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {dbStatus.checked && !dbStatus.connected && (
                  <Alert
                    variant="destructive"
                    className="bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-800"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div>
                        <p>データベース接続に問題があります。テストログインを使用してください。</p>
                        {dbStatus.error && (
                          <p className="text-xs mt-1 text-orange-600 dark:text-orange-300">{dbStatus.error}</p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {dbStatus.checked && dbStatus.connected && dbStatus.students === 0 && (
                  <Alert className="bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>学生データがありません。テストログインを使用してください。</AlertDescription>
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
                    placeholder="例: 222056"
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
                    placeholder="例: 2056"
                  />
                </div>
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    学生IDとパスワードは提供されたCSVファイルに基づいています。
                    <br />
                    例: 学生ID「222056」、パスワード「2056」
                    <br />
                    例: 学生ID「222020」、パスワード「2020」
                  </AlertDescription>
                </Alert>
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

                {/* デバッグ用のテストログインボタン */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
                  onClick={() => {
                    // テスト用の学生情報をセット
                    localStorage.setItem("studentId", "222056")
                    localStorage.setItem("studentName", "テスト学生")

                    toast({
                      title: "テストログイン成功",
                      description: "テストモードでログインしました",
                    })

                    router.push("/dashboard")
                  }}
                >
                  テストログイン (デバッグ用)
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

          {/* デバッグ情報へのリンク */}
          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-xs text-brown-400 hover:text-brown-600 dark:text-brown-500 dark:hover:text-brown-300"
              onClick={() => router.push("/debug")}
            >
              システム診断
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
