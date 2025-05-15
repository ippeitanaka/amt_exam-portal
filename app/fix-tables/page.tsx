"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function FixTables() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)
  const supabase = createClientComponentClient()

  const createTables = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // テーブルを削除して再作成
      const { data, error } = await supabase.rpc("recreate_student_tables")

      if (error) {
        throw error
      }

      setSuccess(true)
      setResult(data)
    } catch (err) {
      console.error("テーブル作成エラー:", err)
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>テーブル構造の修正</CardTitle>
            <CardDescription>CSVデータに合わせてテーブル構造を修正します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>成功</AlertTitle>
                <AlertDescription>テーブル構造が正常に修正されました。</AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-100 p-3 rounded-md">
              <p className="text-sm">このボタンをクリックすると、以下の処理が実行されます：</p>
              <ol className="list-decimal pl-5 text-sm mt-2">
                <li>既存のテーブルを削除（存在する場合）</li>
                <li>CSVデータに合わせた新しいテーブル構造を作成</li>
                <li>適切なインデックスとセキュリティポリシーを設定</li>
              </ol>
              <p className="text-sm mt-2 text-red-500 font-medium">注意: この操作は既存のデータをすべて削除します。</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={createTables} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : (
                "テーブル構造を修正"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
