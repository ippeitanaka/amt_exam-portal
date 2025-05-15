"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, AlertCircle, Search, User } from "lucide-react"

export default function StudentPasswordTool() {
  const [studentId, setStudentId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentData, setStudentData] = useState<any>(null)
  const supabase = createClientComponentClient()

  const searchStudent = async () => {
    if (!studentId) {
      setError("学生IDを入力してください")
      return
    }

    setLoading(true)
    setError(null)
    setStudentData(null)

    try {
      // 学生データを検索
      const { data, error } = await supabase.from("students").select("*").eq("student_id", studentId).single()

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error(`学生ID「${studentId}」は見つかりませんでした`)
        }
        throw error
      }

      if (data) {
        console.log("取得した学生データ:", data)
        setStudentData(data)
      } else {
        setError(`学生ID「${studentId}」は見つかりませんでした`)
      }
    } catch (err) {
      console.error("検索エラー:", err)
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
            <CardTitle>学生パスワード確認ツール</CardTitle>
            <CardDescription>学生のパスワード情報を確認できます</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="学生ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      searchStudent()
                    }
                  }}
                />
              </div>
              <Button onClick={searchStudent} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">検索</span>
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {studentData && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium text-lg mb-2 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  学生情報
                </h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableHead>学生ID</TableHead>
                      <TableCell>{studentData.student_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableCell>{studentData.name || "名前なし"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>パスワード</TableHead>
                      <TableCell>
                        <span className="text-green-600">{studentData.password}</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>作成日時</TableHead>
                      <TableCell>{new Date(studentData.created_at).toLocaleString("ja-JP")}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              戻る
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
