"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { ParamedicMascot } from "@/components/paramedic-mascot"

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState(false)
  const { toast } = useToast()

  // 環境変数のチェック
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setConfigError(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // 環境変数が設定されていない場合はエラーを表示
    if (configError) {
      setError("Supabase環境変数が設定されていません。管理者に連絡してください。")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("管理者ログイン試行:", { username }) // パスワードはログに出力しない

      // Supabaseクライアントの初期化
      const supabase = createClientComponentClient()

      // まず管理者データを取得
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", username)

      if (adminError) {
        throw adminError
      }

      if (!adminData || adminData.length === 0) {
        setError("ユーザー名が見つかりません。")
        return
      }

      const admin = adminData[0]

      // パスワードの検証
      let authenticated = false

      // 平文パスワードの場合は直接比較
      if (!admin.password.startsWith("$2a$")) {
        authenticated = admin.password === password
      } else {
        // ハッシュ化されたパスワードの場合はRPCを使用
        const { data: verifyData, error: verifyError } = await supabase.rpc("verify_password", {
          stored_hash: admin.password,
          password: password,
        })

        if (verifyError) {
          throw verifyError
        }

        authenticated = verifyData
      }

      if (authenticated) {
        // 認証成功
        localStorage.setItem("adminAuthenticated", "true")
        toast({
          title: "ログイン成功",
          description: "管理者ページにアクセスできます",
        })
        onLogin()
      } else {
        setError("パスワードが正しくありません。")
      }
    } catch (error) {
      console.error("ログインエラー:", error)
      setError("ログインに失敗しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <ParamedicMascot width={60} height={60} type="firefighter" />
        </div>
        <CardTitle>管理者ログイン</CardTitle>
        <CardDescription>管理者アカウントでログインしてください</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {configError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Supabase環境変数が設定されていません。管理者に連絡してください。</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              required
              disabled={configError}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              required
              disabled={configError}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading || configError}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ログイン中...
              </>
            ) : (
              "ログイン"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
