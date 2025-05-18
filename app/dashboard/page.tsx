"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, FileText, BookOpen } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function DashboardPage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // ローカルストレージから学生情報を取得
    const storedStudentId = localStorage.getItem("studentId")
    const storedStudentName = localStorage.getItem("studentName")

    if (!storedStudentId) {
      router.push("/login")
      return
    }

    setStudentId(storedStudentId)
    setStudentName(storedStudentName || "")

    // 学生情報をデータベースから再取得して最新の情報を表示
    fetchStudentInfo(storedStudentId)
  }, [router])

  // fetchStudentInfo関数を修正して、studentsテーブルから直接データを取得するようにします
  const fetchStudentInfo = async (id: string) => {
    setIsLoading(true)
    try {
      // studentsテーブルから学生情報を取得
      const { data, error } = await supabase.from("students").select("*").eq("student_id", id).single()

      if (error) {
        console.error("学生情報取得エラー:", error)

        // studentsテーブルからの取得に失敗した場合、test_scoresテーブルで学生IDの存在確認を試みる
        const { data: testScoresData, error: testScoresError } = await supabase
          .from("test_scores")
          .select("student_id")
          .eq("student_id", id)
          .limit(1)

        if (testScoresError || !testScoresData || testScoresData.length === 0) {
          // 学生IDが存在しない場合
          console.error("学生IDが存在しません:", id)
          toast({
            title: "エラー",
            description: "学生情報が見つかりません",
            variant: "destructive",
          })
          // ログアウト処理
          handleLogout()
          return
        }

        // test_scoresテーブルに学生IDが存在する場合は、ローカルストレージの情報を使用
      } else if (data) {
        // 学生情報が見つかった場合、ローカルストレージを更新
        setStudentName(data.name || "")
        localStorage.setItem("studentName", data.name || "")
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("studentId")
    localStorage.removeItem("studentName")
    router.push("/login")
    toast({
      title: "ログアウト",
      description: "ログアウトしました",
    })
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
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="学生ダッシュボード" />
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CharacterIcon size={40} />
                  <div>
                    <CardTitle className="text-brown-800 dark:text-brown-100">ようこそ、{studentName}さん</CardTitle>
                    <CardDescription className="text-brown-600 dark:text-brown-300">
                      学生ID: {studentId}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">成績確認</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      あなたの模擬試験の成績を確認できます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link href="/results">
                        <FileText className="mr-2 h-4 w-4" />
                        成績を見る
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">テスト一覧</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      実施された模擬試験の一覧を確認できます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link href="/tests">
                        <BookOpen className="mr-2 h-4 w-4" />
                        テスト一覧
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-brown-200 dark:border-brown-800">
                  <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg pb-2">
                    <CardTitle className="text-lg text-brown-800 dark:text-brown-100">プロフィール</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white dark:bg-brown-900 pt-4">
                    <p className="text-sm text-brown-600 dark:text-brown-300 mb-4">
                      あなたのプロフィール情報を確認できます。
                    </p>
                    <Button asChild className="w-full bg-brown-600 hover:bg-brown-700 text-white">
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        プロフィール
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">お知らせ</CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 rounded-b-lg">
              <div className="space-y-4">
                <div className="border-b border-brown-200 dark:border-brown-800 pb-4">
                  <h3 className="font-medium text-brown-800 dark:text-brown-100">模擬試験結果の確認方法</h3>
                  <p className="text-sm text-brown-600 dark:text-brown-300 mt-1">
                    「成績を見る」ボタンから、これまでに受験した模擬試験の結果を確認できます。合格基準や得点分布も確認できます。
                  </p>
                </div>
                <div className="border-b border-brown-200 dark:border-brown-800 pb-4">
                  <h3 className="font-medium text-brown-800 dark:text-brown-100">次回の模擬試験について</h3>
                  <p className="text-sm text-brown-600 dark:text-brown-300 mt-1">
                    次回の模擬試験は2023年12月15日に実施予定です。試験範囲や詳細については別途お知らせします。
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-brown-800 dark:text-brown-100">システムの使い方</h3>
                  <p className="text-sm text-brown-600 dark:text-brown-300 mt-1">
                    このシステムでは、模擬試験の結果確認や過去の試験履歴を閲覧できます。ご不明な点があれば担当教員にお問い合わせください。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
