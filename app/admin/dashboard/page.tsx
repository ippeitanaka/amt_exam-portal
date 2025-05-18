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
import { Users, FileSpreadsheet, BarChart, LogOut, AlertCircle, RefreshCw } from "lucide-react"
import { Header } from "@/components/header"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [adminName, setAdminName] = useState("")
  const [testScores, setTestScores] = useState<any[]>([])
  const [studentCount, setStudentCount] = useState<number | null>(null)
  const [testCount, setTestCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

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

      // 並行してデータを取得
      const [testScoresResult, studentsResult, uniqueTestsResult] = await Promise.all([
        getTestScores(),
        getStudentCount(),
        getUniqueTests(),
      ])

      // テスト結果を設定
      if (testScoresResult.success) {
        setTestScores(testScoresResult.data)
      } else {
        console.error("テスト結果取得エラー:", testScoresResult.error)
        // エラーがあっても続行
      }

      // 学生数を設定
      if (studentsResult.success) {
        setStudentCount(studentsResult.count)
      } else {
        console.error("学生数取得エラー:", studentsResult.error)
        // エラーがあっても続行
      }

      // テスト数を設定
      if (uniqueTestsResult.success) {
        setTestCount(uniqueTestsResult.uniqueCount)
      } else {
        console.error("テスト数取得エラー:", uniqueTestsResult.error)
        // エラーがあっても続行
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

  // テスト結果を取得する関数
  const getTestScores = async () => {
    try {
      console.log("テスト結果取得を開始します")
      const { data, error } = await supabase
        .from("test_scores")
        .select("*")
        .order("test_date", { ascending: false })
        .limit(10) // パフォーマンス向上のため最新10件のみ取得

      if (error) {
        console.error("テスト結果取得エラー:", error)
        return { success: false, error: error.message, data: [] }
      }

      console.log("テスト結果を取得しました:", data?.length || 0, "件")
      return { success: true, data: data || [] }
    } catch (error) {
      console.error("テスト結果取得エラー:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
        data: [],
      }
    }
  }

  // 学生数を取得する関数 - 修正版
  const getStudentCount = async () => {
    try {
      console.log("学生数取得を開始します")

      // 直接test_scoresテーブルから一意の学生IDを数える
      return getStudentCountFromTestScores()
    } catch (error) {
      console.error("学生数取得エラー:", error)
      return { success: false, error: "学生数の取得に失敗しました", count: 0 }
    }
  }

  // test_scoresテーブルから学生数を取得するヘルパー関数
  const getStudentCountFromTestScores = async () => {
    try {
      console.log("test_scoresテーブルから学生数を取得します")

      // 一意の学生IDを取得するクエリ
      const { data, error } = await supabase.from("test_scores").select("student_id")

      if (error) {
        console.error("テスト結果からの学生数取得エラー:", error)
        return { success: false, error: error.message, count: 0 }
      }

      // 一意の学生IDを数える
      const uniqueStudentIds = new Set(data?.map((item) => item.student_id) || [])
      const count = uniqueStudentIds.size
      console.log("テスト結果から学生数を取得しました:", count, "件")

      return { success: true, count }
    } catch (error) {
      console.error("テスト結果からの学生数取得エラー:", error)
      return { success: false, error: "学生数の取得に失敗しました", count: 0 }
    }
  }

  // ユニークなテスト数を取得する関数
  const getUniqueTests = async () => {
    try {
      console.log("テスト数取得を開始します")

      // 一意のテスト名を取得するクエリ
      const { data, error } = await supabase.from("test_scores").select("test_name")

      if (error) {
        console.error("テスト数取得エラー:", error)
        return { success: false, error: error.message, uniqueCount: 0 }
      }

      // ユニークなテスト名の数を計算
      const uniqueTests = new Set(data?.map((item) => item.test_name) || [])
      console.log("テスト数を取得しました:", uniqueTests.size, "件")

      return { success: true, uniqueCount: uniqueTests.size }
    } catch (error) {
      console.error("テスト数取得エラー:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "テスト数の取得に失敗しました",
        uniqueCount: 0,
      }
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
                <p className="text-3xl font-bold text-brown-800 dark:text-brown-100">{testScores.length}</p>
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
                <Button
                  variant="ghost"
                  className="w-full text-brown-700 hover:bg-brown-100 dark:text-brown-200 dark:hover:bg-brown-800"
                  asChild
                >
                  <Link href="/admin/analytics">
                    <BarChart className="mr-2 h-4 w-4" />
                    分析を表示
                  </Link>
                </Button>
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
                {testScores.length > 0 ? (
                  <TestResultsList scores={testScores} />
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
