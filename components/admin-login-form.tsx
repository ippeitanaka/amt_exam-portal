"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, User, Lock } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { motion } from "framer-motion"
import { ParamedicMascot } from "@/components/paramedic-mascot"

export default function AdminLoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setDebugInfo(null)

    try {
      console.log("管理者ログイン試行:", { username }) // パスワードはログに出力しない

      // まず管理者データを取得
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", username)

      if (adminError) {
        throw adminError
      }

      // デバッグ情報を設定
      setDebugInfo({
        method: "管理者データ検索",
        hasData: adminData && adminData.length > 0,
        passwordType:
          adminData && adminData.length > 0
            ? adminData[0].password.startsWith("$2a$")
              ? "ハッシュ化"
              : "平文"
            : "不明",
        error: adminError ? adminError.message : null,
      })

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

      // 認証結果を更新
      setDebugInfo((prev) => ({
        ...prev,
        authenticated,
        verificationMethod: !admin.password.startsWith("$2a$") ? "直接比較" : "ハッシュ検証",
      }))

      if (authenticated) {
        // 認証成功：管理者情報を保存（パスワードは保存しない）
        const adminDataToStore = {
          ...admin,
          password: undefined, // パスワードは保存しない
        }
        localStorage.setItem("adminAuthenticated", "true")
        localStorage.setItem("adminUser", JSON.stringify(adminDataToStore))

        // 管理者ページにリダイレクト
        router.push("/admin")
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
    <div className="space-y-4">
      <div className="flex justify-center mb-4">
        <ParamedicMascot width={60} height={60} type="firefighter" />
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="adminUsername" className="flex items-center gap-2">
            <User size={16} className="text-primary" />
            <span>ユーザー名</span>
          </Label>
          <div className="relative">
            <Input
              id="adminUsername"
              type="text"
              placeholder=""
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 rounded-full border-primary/30 focus:border-primary"
              required
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <User size={16} className="text-primary/50" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminPassword" className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            <span>パスワード</span>
          </Label>
          <div className="relative">
            <Input
              id="adminPassword"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 rounded-full border-primary/30 focus:border-primary"
              required
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Lock size={16} className="text-primary/50" />
            </div>
          </div>
        </div>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
        <Button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ログイン中...
            </>
          ) : (
            "管理者ログイン"
          )}
        </Button>
      </form>
    </div>
  )
}
