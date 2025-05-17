"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import TestResultsImport from "@/components/test-results-import"
import TestResultsList from "@/components/test-results-list"
import { useToast } from "@/hooks/use-toast"
import { getTestResults } from "@/app/actions/test-results"

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [testScores, setTestScores] = useState<any[]>([])
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
    try {
      const result = await getTestResults()

      if (result.success) {
        setTestScores(result.data)
      } else {
        throw new Error(result.error || "テスト結果の取得に失敗しました")
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      toast({
        title: "エラー",
        description: "テスト結果の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          <TestResultsImport />

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
              <TestResultsList scores={testScores} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
