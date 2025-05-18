"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import Link from "next/link"
import { ChevronLeft, AlertCircle, Database, RefreshCw } from "lucide-react"
import StudentImport from "@/components/student-import"
import StudentList from "@/components/student-list"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function StudentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [dataSource, setDataSource] = useState<string>("loading")
  const [error, setError] = useState<string>("")
  const [dbStructure, setDbStructure] = useState<any>(null)
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // 管理者ログイン状態を確認
    const adminLoggedIn = localStorage.getItem("adminLoggedIn")

    if (adminLoggedIn !== "true") {
      router.push("/admin")
      return
    }

    // データを取得
    const loadData = async () => {
      try {
        // まずローカルストレージからデータを読み込む
        const hasLocalData = loadFromLocalStorage()
        setDataSource(hasLocalData ? "local_storage" : "loading")

        // サーバーからデータを取得
        await fetchStudents()
      } catch (error) {
        console.error("データ取得エラー:", error)
        setError("サーバーからの学生情報の取得に失敗しました。ローカルデータを表示しています。")
        toast({
          title: "警告",
          description: "サーバーからの学生情報の取得に失敗しました。ローカルデータを表示しています。",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadFromLocalStorage = () => {
    try {
      const cachedStudents = localStorage.getItem("cachedStudents")
      if (cachedStudents) {
        const parsedStudents = JSON.parse(cachedStudents)
        if (Array.isArray(parsedStudents) && parsedStudents.length > 0) {
          setStudents(parsedStudents)
          return true
        }
      }
      return false
    } catch (e) {
      console.error("キャッシュデータの解析エラー:", e)
      return false
    }
  }

  const fetchStudents = async () => {
    try {
      console.log("学生データ取得を開始します")

      // studentsテーブルへのアクセスを完全に避け、直接test_scoresテーブルから学生情報を取得
      console.log("test_scoresテーブルからデータを取得します")
      const testScoresResult = await supabase
        .from("test_scores")
        .select("student_id, student_name")
        .order("student_id", { ascending: true })

      if (testScoresResult.error) {
        console.error("テスト結果からの学生データ取得エラー:", testScoresResult.error)
        throw new Error(testScoresResult.error.message)
      }

      if (!testScoresResult.data || testScoresResult.data.length === 0) {
        console.log("test_scoresテーブルにデータがありません")
        setDataSource("no_data")
        return
      }

      // 一意の学生IDを抽出
      const uniqueStudentIds = new Map()

      for (const item of testScoresResult.data) {
        if (item.student_id && !uniqueStudentIds.has(item.student_id)) {
          uniqueStudentIds.set(item.student_id, {
            student_id: item.student_id,
            name: item.student_name || `学生${item.student_id}`,
            password: "password", // デフォルト値
            created_at: new Date().toISOString(),
          })
        }
      }

      const uniqueStudents = Array.from(uniqueStudentIds.values())
      console.log("test_scoresテーブルから", uniqueStudents.length, "件の学生データを抽出しました")

      // サーバーから取得したデータとローカルデータをマージ
      const mergedStudents = mergeStudentData(students, uniqueStudents)
      setStudents(mergedStudents)
      setDataSource("test_scores_table")

      // 取得したデータをローカルストレージにもキャッシュ
      localStorage.setItem("cachedStudents", JSON.stringify(mergedStudents))
    } catch (error) {
      console.error("学生データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "学生データの取得に失敗しました")
      throw error // 上位のエラーハンドラに再スロー
    }
  }

  // サーバーデータとローカルデータをマージする関数
  const mergeStudentData = (localStudents: any[], serverStudents: any[]) => {
    const studentMap = new Map()

    // ローカルデータを先にマップに追加
    localStudents.forEach((student) => {
      studentMap.set(student.student_id, student)
    })

    // サーバーデータで上書き
    serverStudents.forEach((student) => {
      if (studentMap.has(student.student_id)) {
        // 既存の学生情報がある場合、名前だけ更新（パスワードはローカルのものを保持）
        const existingStudent = studentMap.get(student.student_id)
        studentMap.set(student.student_id, {
          ...existingStudent,
          name: student.name || existingStudent.name,
        })
      } else {
        // 新しい学生情報
        studentMap.set(student.student_id, student)
      }
    })

    return Array.from(studentMap.values())
  }

  // 学生データ更新のためのハンドラ
  const handleStudentImportSuccess = (newStudents: any[]) => {
    try {
      // 新しい学生データを既存のデータと結合
      const updatedStudents = mergeStudentData(students, newStudents)
      setStudents(updatedStudents)

      // キャッシュを更新
      localStorage.setItem("cachedStudents", JSON.stringify(updatedStudents))

      // データ再取得
      fetchStudents().catch((err) => {
        console.error("データ再取得エラー:", err)
      })
    } catch (error) {
      console.error("データ更新エラー:", error)
      setError("学生情報の更新中にエラーが発生しました")
      toast({
        title: "警告",
        description: "学生情報の更新中にエラーが発生しました",
        variant: "destructive",
      })
    }
  }

  // データベース構造を確認する関数
  const handleCheckDbStructure = async () => {
    try {
      setIsCheckingDb(true)
      console.log("データベース構造を確認します")

      // test_scoresテーブルの構造を確認（studentsテーブルへのアクセスを避ける）
      const testScoresResult = await supabase.from("test_scores").select("*").limit(1)

      const dbStructureData = {
        success: true,
        studentsColumns: [], // studentsテーブルへのアクセスを避ける
        studentsError: "アクセスを避けるため確認していません",
        testScoresColumns:
          testScoresResult.data && testScoresResult.data.length > 0 ? Object.keys(testScoresResult.data[0]) : [],
        testScoresError: testScoresResult.error ? testScoresResult.error.message : null,
      }

      setDbStructure(dbStructureData)
      toast({
        title: "データベース構造確認",
        description: "データベース構造を確認しました",
      })
    } catch (error) {
      console.error("データベース構造確認エラー:", error)
      setError("データベース構造の確認に失敗しました")
      toast({
        title: "エラー",
        description: "データベース構造の確認に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsCheckingDb(false)
    }
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
      <Header subtitle="学生管理" />
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
            >
              <Link href="/admin/dashboard" className="flex items-center">
                <ChevronLeft className="mr-1 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckDbStructure}
              disabled={isCheckingDb}
              className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
            >
              {isCheckingDb ? (
                <>
                  <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                  確認中...
                </>
              ) : (
                <>
                  <Database className="mr-1 h-4 w-4" />
                  DB構造確認
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {dataSource && dataSource !== "loading" && (
            <Alert className="mb-4 bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100">
              <Database className="h-4 w-4" />
              <AlertDescription>
                データソース:{" "}
                {dataSource === "students_table"
                  ? "学生テーブル"
                  : dataSource === "test_scores_table"
                    ? "テスト結果テーブル"
                    : dataSource === "local_storage"
                      ? "ローカルストレージ"
                      : dataSource === "no_data"
                        ? "データなし"
                        : dataSource}
              </AlertDescription>
            </Alert>
          )}

          {dbStructure && (
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-100">
              <Database className="h-4 w-4" />
              <div className="flex flex-col">
                <p className="font-bold">データベース構造:</p>
                <p>studentsテーブル: {dbStructure.studentsError || "確認済み"}</p>
                <p>test_scoresテーブルのカラム: {dbStructure.testScoresColumns.join(", ") || "なし"}</p>
                {dbStructure.testScoresError && <p className="text-red-500">エラー: {dbStructure.testScoresError}</p>}
              </div>
            </Alert>
          )}

          <div className="space-y-6">
            <StudentImport onImportSuccess={handleStudentImportSuccess} />

            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <CharacterIcon size={40} />
                  <div>
                    <CardTitle className="text-brown-800 dark:text-brown-100">学生一覧</CardTitle>
                    <CardDescription className="text-brown-600 dark:text-brown-300">
                      登録されているすべての学生
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900">
                <StudentList students={students} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
