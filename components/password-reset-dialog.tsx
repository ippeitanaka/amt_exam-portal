"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PasswordResetDialogProps {
  studentId: string
  studentName: string
  onReset: () => void
}

export function PasswordResetDialog({ studentId, studentName, onReset }: PasswordResetDialogProps) {
  const [open, setOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleReset = async () => {
    // バリデーション
    if (!newPassword) {
      setError("新しいパスワードを入力してください")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    setIsResetting(true)
    setError(null)

    try {
      // パスワードリセット関数を呼び出し
      const { data, error } = await supabase.rpc("reset_student_password", {
        p_student_id: studentId,
        p_new_password: newPassword,
      })

      if (error) throw error

      if (data) {
        toast({
          title: "パスワードリセット成功",
          description: `${studentName || studentId}のパスワードがリセットされました`,
        })
        setOpen(false)
        onReset()
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setError("パスワードのリセットに失敗しました")
      }
    } catch (error) {
      console.error("パスワードリセットエラー:", error)
      setError(error instanceof Error ? error.message : "不明なエラーが発生しました")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RefreshCw className="h-4 w-4 mr-1" />
        パスワード
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>学生パスワードのリセット</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-2">以下の学生のパスワードをリセットします：</div>
              <div className="font-medium">
                {studentName || "名前なし"} (ID: {studentId})
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認</Label>
              <Input
                id="confirmPassword"
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="パスワードを再入力"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleReset()
              }}
              disabled={isResetting}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  リセット中...
                </>
              ) : (
                "パスワードをリセット"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
