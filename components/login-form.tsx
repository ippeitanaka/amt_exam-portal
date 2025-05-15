"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, User, Lock } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginForm() {
  const [studentId, setStudentId] = useState("")
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
      console.log("ログイン試行:", { studentId }) // パスワードはログに出力しない

      // まず学生データを取得
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("student_id", studentId)

      if (studentError) {
        throw studentError
      }

      // デバッグ情報を設定
      setDebugInfo({
        method: "学生データ検索",
        hasData: studentData && studentData.length > 0,
        passwordType:
          studentData && studentData.length > 0
            ? studentData[0].password.startsWith("$2a$")
              ? "ハッシュ化"
              : "平文"
            : "不明",
        error: studentError ? studentError.message : null,
      })

      if (!studentData || studentData.length === 0) {
        setError("学生IDが見つかりません。")
        return
      }

      const student = studentData[0]

      // パスワードの検証
      let authenticated = false

      // 平文パスワードの場合は直接比較
      if (!student.password.startsWith("$2a$")) {
        authenticated = student.password === password
      } else {
        // ハッシュ化されたパスワードの場合はRPCを使用
        const { data: verifyData, error: verifyError } = await supabase.rpc("verify_password", {
          stored_hash: student.password,
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
        verificationMethod: !student.password.startsWith("$2a$") ? "直接比較" : "ハッシュ検証",
      }))

      if (authenticated) {
        // 認証成功：学生情報を保存（パスワードは保存しない）
        const studentDataToStore = {
          ...student,
          password: undefined, // パスワードは保存しない
        }
        localStorage.setItem("currentStudent", JSON.stringify(studentDataToStore))

        // ダッシュボードにリダイレクト
        router.push(`/dashboard/${student.id}`)
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
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="studentId" className="flex items-center gap-2">
            <User size={16} className="text-primary" />
            <span>学生ID</span>
          </Label>
          <div className="relative">
            <Input
              id="studentId"
              type="text"
              placeholder=""
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="pl-10 rounded-full border-primary/30 focus:border-primary"
              required
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <User size={16} className="text-primary/50" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock size={16} className="text-primary" />
            <span>パスワード</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
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
            "ログイン"
          )}
        </Button>
      </form>
    </div>
  )
}
