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
import { Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DeleteTestDialogProps {
  testName: string
  testDate: string
  onDeleted: () => void
}

export function DeleteTestDialog({ testName, testDate, onDeleted }: DeleteTestDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/delete-test-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testName, testDate }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "削除に失敗しました")
      }

      toast({
        title: "削除成功",
        description: result.message,
      })

      setOpen(false)
      onDeleted()
    } catch (error) {
      console.error("削除エラー:", error)
      toast({
        title: "削除エラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1" />
        削除
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>テスト結果の削除</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="mb-2">以下のテスト結果を削除しようとしています：</div>
              <div className="font-medium">
                {testName} ({new Date(testDate).toLocaleDateString("ja-JP")})
              </div>
              <div className="mt-4 text-red-500">
                この操作は取り消せません。すべての学生のこのテストの結果が削除されます。
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : (
                "削除する"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
