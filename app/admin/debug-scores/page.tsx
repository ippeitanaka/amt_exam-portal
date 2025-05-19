"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { debugTestScores, getTestScoresCount } from "@/app/actions/debug-test-scores"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function DebugScoresPage() {
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)

  const fetchScores = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await debugTestScores()
      if (result.success) {
        setScores(result.data)
      } else {
        setError(result.error || "Unknown error occurred")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchCount = async () => {
    setCountLoading(true)
    try {
      const result = await getTestScoresCount()
      if (result.success) {
        setTotalCount(result.count)
      } else {
        console.error("Error fetching count:", result.error)
      }
    } catch (err) {
      console.error("Error fetching count:", err)
    } finally {
      setCountLoading(false)
    }
  }

  useEffect(() => {
    fetchCount()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">テストスコアデバッグ</h1>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>テストスコア総数</CardTitle>
            <CardDescription>データベース内のテストスコアの総数</CardDescription>
          </CardHeader>
          <CardContent>
            {countLoading ? (
              <p>読み込み中...</p>
            ) : totalCount !== null ? (
              <div className="text-2xl font-bold">{totalCount} 件</div>
            ) : (
              <p>エラーが発生しました</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fetchCount} disabled={countLoading}>
              再読み込み
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">テストスコアサンプル (最大10件)</h2>
        <Button onClick={fetchScores} disabled={loading}>
          {loading ? "読み込み中..." : "データを取得"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scores && scores.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    学生ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    テスト名
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    テスト日
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    合計点
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {scores.map((score) => (
                  <tr key={score.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{score.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{score.student_id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{score.test_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{score.test_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{score.total_score || "未計算"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : scores && scores.length === 0 ? (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>データなし</AlertTitle>
          <AlertDescription>テストスコアが見つかりませんでした。</AlertDescription>
        </Alert>
      ) : null}

      {scores && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">生データ</h3>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(scores, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
