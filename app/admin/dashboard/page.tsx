"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import TestResultsImport from "@/components/test-results-import"
import TestResultsList from "@/components/test-results-list"
import { useToast } from "@/hooks/use-toast"
import { Users, FileSpreadsheet, LogOut, AlertCircle, RefreshCw, Bug } from "lucide-react"
import { Header } from "@/components/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getDashboardData } from "@/app/actions/dashboard" // サーバーアクションをインポート

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [adminName, setAdminName] = useState("")
  const [testResults, setTestResults] = useState<any[]>([])
  const [studentCount, setStudentCount] = useState<number | null>(null)
  const [testCount, setTestCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // 管理者ログイン状態を確認
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")
    const storedAdminName = localStorage.getItem("adminName")

    if (adminLoggedIn !== "true") {
      router.push("/admin")
      return
    }

    setAdminName(storedAdminName || "管理者")

    // クライアントサイドでデータを取得
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // サーバーアクションを使用してダッシュボードデータを取得
      const result = await getDashboardData()

      if (result.success) {
        // データを設定
        setTestResults(result.data.testResults || [])
        setStudentCount(result.data.studentCount || 0)
        setTestCount(result.data.testCount || 0)

        console.log("ダッシュボードデータを取得しました:", {
          testResults: result.data.testResults.length,
          studentCount: result.data.studentCount,
          testCount: result.data.testCount,
        })
      } else {
        console.error("データ取得エラー:", result.error)
        setError(result.error || "データの取得に失敗しました")
        toast({
          title: "エラー",
          description: "データの取得に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "データの取得に失敗しました")
      toast({
        title: "エラー",
        description: "データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn")
    localStorage.removeItem("adminId")
    localStorage.removeItem("adminName")
    localStorage.removeItem("adminRole")
    router.push("/admin")
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brown-50 dark:bg-brown-950">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-brown-600 dark:text-brown-300">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle={`管理者ダッシュボード - ${adminName}さん`} />
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    データを更新
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                asChild
                className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
              >
                <Link href="/admin/debug/data">
                  <Bug className="mr-2 h-4 w-4" />
                  データデバッグ
                </Link>
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <div className="flex flex-row items-center gap-3">
                  <CharacterIcon size={40} />
                  <div>
                    <CardTitle className="text-brown-800 dark:text-brown-100">テスト結果</CardTitle>
                    <CardDescription className="text-brown-600 dark:text-brown-300">
                      登録されたテスト結果の数
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900">
                <p className="text-3xl font-bold text-brown-800 dark:text-brown-100">{testResults.length}</p>
              </CardContent>
              <CardFooter className="bg-white dark:bg-brown-900 rounded-b-lg">
                <Button
                  variant="ghost"
                  className="w-full text-brown-700 hover:bg-brown-100 dark:text-brown-200 dark:hover:bg-brown-800"
                  asChild
                >
                  <Link href="/admin/results">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    テスト結果を管理
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <div className="flex flex-row items-center gap-3">
                  <CharacterIcon size={40} />
                  <div>
                    <CardTitle className="text-brown-800 dark:text-brown-100">学生</CardTitle>
                    <CardDescription className="text-brown-600 dark:text-brown-300">登録された学生の数</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900">
                <p className="text-3xl font-bold text-brown-800 dark:text-brown-100">
                  {studentCount !== null ? studentCount : "-"}
                </p>
              </CardContent>
              <CardFooter className="bg-white dark:bg-brown-900 rounded-b-lg">
                <Button
                  variant="ghost"
                  className="w-full text-brown-700 hover:bg-brown-100 dark:text-brown-200 dark:hover:bg-brown-800"
                  asChild
                >
                  <Link href="/admin/students">
                    <Users className="mr-2 h-4 w-4" />
                    学生を管理
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <div className="flex flex-row items-center gap-3">
                  <CharacterIcon size={40} />
                  <div>
                    <CardTitle className="text-brown-800 dark:text-brown-100">テスト</CardTitle>
                    <CardDescription className="text-brown-600 dark:text-brown-300">
                      実施されたテストの数
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900">
                <p className="text-3xl font-bold text-brown-800 dark:text-brown-100">
                  {testCount !== null ? testCount : "-"}
                </p>
              </CardContent>
              <CardFooter className="bg-white dark:bg-brown-900 rounded-b-lg">
                <p className="w-full text-center text-brown-600 dark:text-brown-300 text-sm">実施されたテストの総数</p>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <TestResultsImport onImportSuccess={handleRefresh} />

            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900">
                <div className="flex items-center gap-3">
                  <CharacterIcon size={40} />
                  <div>
                    <CardTitle className="text-brown-800 dark:text-brown-100">テスト結果一覧</CardTitle>
                    <CardDescription className="text-brown-600 dark:text-brown-300">
                      登録されているすべてのテスト結果
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900">
                {testResults.length > 0 ? (
                  <TestResultsList scores={testResults} isDashboard={true} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-brown-600 dark:text-brown-300">テスト結果がありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
