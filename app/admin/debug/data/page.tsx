"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fetchTestScores,
  fetchStudents,
  getTestScoresCount,
  getStudentsCount,
  checkEnvironmentVariables,
} from "@/app/actions/debug-data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DebugDataPage() {
  const [loading, setLoading] = useState(false)
  const [testScores, setTestScores] = useState<any[] | null>(null)
  const [students, setStudents] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testScoresCount, setTestScoresCount] = useState<number | null>(null)
  const [studentsCount, setStudentsCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(false)
  const [envVars, setEnvVars] = useState<any | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [testScoresResult, studentsResult] = await Promise.all([fetchTestScores(), fetchStudents()])

      if (testScoresResult.success) {
        setTestScores(testScoresResult.data)
      } else {
        console.error("テスト結果取得エラー:", testScoresResult.error)
      }

      if (studentsResult.success) {
        setStudents(studentsResult.data)
      } else {
        console.error("学生データ取得エラー:", studentsResult.error)
      }

      if (!testScoresResult.success || !studentsResult.success) {
        setError("データ取得中にエラーが発生しました。詳細はコンソールを確認してください。")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
      console.error("データ取得エラー:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCounts = async () => {
    setCountLoading(true)
    try {
      const [testScoresCountResult, studentsCountResult] = await Promise.all([getTestScoresCount(), getStudentsCount()])

      if (testScoresCountResult.success) {
        setTestScoresCount(testScoresCountResult.count)
      } else {
        console.error("テスト結果数取得エラー:", testScoresCountResult.error)
      }

      if (studentsCountResult.success) {
        setStudentsCount(studentsCountResult.count)
      } else {
        console.error("学生数取得エラー:", studentsCountResult.error)
      }
    } catch (err) {
      console.error("カウント取得エラー:", err)
    } finally {
      setCountLoading(false)
    }
  }

  const checkEnvVars = async () => {
    try {
      const result = await checkEnvironmentVariables()
      setEnvVars(result)
    } catch (err) {
      console.error("環境変数確認エラー:", err)
    }
  }

  useEffect(() => {
    fetchCounts()
    checkEnvVars()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button asChild variant="outline" size="sm" className="mr-4">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            ダッシュボードに戻る
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">データデバッグ</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>環境変数</CardTitle>
            <CardDescription>Supabase接続用の環境変数の状態</CardDescription>
          </CardHeader>
          <CardContent>
            {envVars ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>
                  <span>{envVars.supabaseUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                  <span>{envVars.supabaseAnonKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">SUPABASE_SERVICE_ROLE_KEY:</span>
                  <span>{envVars.supabaseServiceRoleKey}</span>
                </div>
              </div>
            ) : (
              <p>環境変数を確認中...</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>テスト結果総数</CardTitle>
              <CardDescription>データベース内のテスト結果の総数</CardDescription>
            </CardHeader>
            <CardContent>
              {countLoading ? (
                <p>読み込み中...</p>
              ) : testScoresCount !== null ? (
                <div className="text-2xl font-bold">{testScoresCount} 件</div>
              ) : (
                <p>エラーが発生しました</p>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchCounts} disabled={countLoading}>
                再読み込み
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>学生総数</CardTitle>
              <CardDescription>データベース内の学生の総数</CardDescription>
            </CardHeader>
            <CardContent>
              {countLoading ? (
                <p>読み込み中...</p>
              ) : studentsCount !== null ? (
                <div className="text-2xl font-bold">{studentsCount} 件</div>
              ) : (
                <p>エラーが発生しました</p>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchCounts} disabled={countLoading}>
                再読み込み
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">データサンプル (最大10件)</h2>
        <Button onClick={fetchData} disabled={loading}>
          {loading ? "読み込み中..." : "データを取得"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>テスト結果サンプル</CardTitle>
            <CardDescription>test_scoresテーブルから最大10件</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>読み込み中...</p>
            ) : testScores ? (
              testScores.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">学生ID</th>
                        <th className="text-left p-2">テスト名</th>
                        <th className="text-left p-2">テスト日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testScores.map((score) => (
                        <tr key={score.id} className="border-b">
                          <td className="p-2">{score.id}</td>
                          <td className="p-2">{score.student_id}</td>
                          <td className="p-2">{score.test_name}</td>
                          <td className="p-2">{score.test_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>テスト結果がありません</p>
              )
            ) : (
              <p>データを取得するには「データを取得」ボタンをクリックしてください</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>学生サンプル</CardTitle>
            <CardDescription>studentsテーブルから最大10件</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>読み込み中...</p>
            ) : students ? (
              students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">学生ID</th>
                        <th className="text-left p-2">氏名</th>
                        <th className="text-left p-2">登録日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b">
                          <td className="p-2">{student.student_id}</td>
                          <td className="p-2">{student.name}</td>
                          <td className="p-2">{new Date(student.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>学生データがありません</p>
              )
            ) : (
              <p>データを取得するには「データを取得」ボタンをクリックしてください</p>
            )}
          </CardContent>
        </Card>
      </div>

      {(testScores || students) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {testScores && (
            <div>
              <h3 className="text-xl font-bold mb-2">テスト結果生データ</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(testScores, null, 2)}</pre>
              </div>
            </div>
          )}

          {students && (
            <div>
              <h3 className="text-xl font-bold mb-2">学生生データ</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(students, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
