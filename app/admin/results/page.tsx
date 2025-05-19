"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { ChevronLeft, RefreshCw } from "lucide-react"
import TestResultsImport from "@/components/test-results-import"
import TestResultsList from "@/components/test-results-list"
import { useToast } from "@/hooks/use-toast"
import { getTestResults } from "@/app/actions/test-results"

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [testScores, setTestScores] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // 管理者ログイン状態を確認
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")

    if (adminLoggedIn !== "true") {
      router.push("/admin")
      return
    }

    fetchTestScores()
  }, [router])

  const fetchTestScores = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("テスト結果を取得中...")
      const result = await getTestResults()

      if (result.success) {
        console.log("テスト結果を取得しました:", result.data.length, "件")
        setTestScores(result.data)
      } else {
        console.error("テスト結果取得エラー:", result.error)
        setError(result.error || "テスト結果の取得に失敗しました")
        throw new Error(result.error || "テスト結果の取得に失敗しました")
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "テスト結果の取得に失敗しました")
      toast({
        title: "エラー",
        description: "テスト結果の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchTestScores()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            更新
          </Button>
        </div>

        <div className="space-y-6">
          <TestResultsImport onSuccess={fetchTestScores} />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CharacterIcon size={40} />
                <div>
                  <CardTitle>テスト結果一覧</CardTitle>
                  <CardDescription>登録されているすべてのテスト結果</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button variant="outline" onClick={handleRefresh}>
                    再読み込み
                  </Button>
                </div>
              ) : testScores.length > 0 ? (
                <>
                  <p className="mb-4 text-sm text-gray-500">テスト結果: {testScores.length}件</p>
                  <TestResultsList scores={testScores} onSuccess={fetchTestScores} />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">テスト結果がありません</p>
                  <p className="text-sm text-gray-400 mb-4">
                    テスト結果をインポートするか、データベース接続を確認してください
                  </p>
                  <Button variant="outline" onClick={handleRefresh}>
                    再読み込み
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
