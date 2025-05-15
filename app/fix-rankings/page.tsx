"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function FixRankingsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const fixRankings = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fix-rankings")
      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message || "総合ランキング関数を修正しました" })
      } else {
        setResult({ success: false, message: data.error || "総合ランキング関数の修正に失敗しました" })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `総合ランキング関数の修正中にエラーが発生しました: ${(error as Error).message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>総合ランキング関数の修正</CardTitle>
          <CardDescription>
            総合ランキングの計算方法を修正します。各学生のすべてのテスト結果の平均点に基づいて順位を計算します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            この操作により、総合ランキングの計算方法が修正されます。各学生のすべてのテスト結果の平均点に基づいて順位が計算されるようになります。
          </p>

          <div className="flex justify-center">
            <Button onClick={fixRankings} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  修正中...
                </>
              ) : (
                "総合ランキング関数を修正する"
              )}
            </Button>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "成功" : "エラー"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
