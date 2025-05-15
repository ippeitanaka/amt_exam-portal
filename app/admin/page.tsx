"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, FileText, Download, LogOut, User } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import AdminLogin from "@/components/admin-login"
import TestResultsImport from "@/components/test-results-import"
import TestManagement from "@/components/test-management"
import { PasswordResetDialog } from "@/components/password-reset-dialog"
import TestResultsList from "@/components/test-results-list"

interface TestResultsListProps {
  scores: any[]
}

export default function AdminPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [isAddingScore, setIsAddingScore] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("import")
  const [configError, setConfigError] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [scores, setScores] = useState<any[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [isLoadingScores, setIsLoadingScores] = useState(false)
  const { toast } = useToast()

  // Score form state
  const [studentId, setStudentId] = useState("")
  const [testName, setTestName] = useState("")
  const [testDate, setTestDate] = useState("")
  const [score, setScore] = useState("")
  const [maxScore, setMaxScore] = useState("100")

  // Check if Supabase environment variables are set and admin is authenticated
  useEffect(() => {
    // 環境変数のチェック
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setConfigError(true)
      return
    }

    // Check if admin is already authenticated
    const adminAuth = localStorage.getItem("adminAuthenticated")
    if (adminAuth === "true") {
      setIsAuthenticated(true)
    } else {
      // 認証されていない場合はホームページにリダイレクト
      window.location.href = "/"
    }
  }, [])

  const handleLogout = () => {
    // ローカルストレージから認証情報を削除
    localStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminUser")

    // ログインページにリダイレクト
    window.location.href = "/"

    // 状態も更新（リダイレクトされるので実際には不要だが念のため）
    setIsAuthenticated(false)
  }

  // 学生データを取得
  const fetchStudents = async () => {
    if (!isAuthenticated || configError) return

    setIsLoadingStudents(true)
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.from("students").select("*").order("student_id", { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error("学生データ取得エラー:", error)
      toast({
        title: "エラー",
        description: "学生データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStudents(false)
    }
  }

  // 成績データを取得
  const fetchScores = async () => {
    if (!isAuthenticated || configError) return

    setIsLoadingScores(true)
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.from("test_scores").select("*").order("test_date", { ascending: false })

      if (error) throw error
      setScores(data || [])
    } catch (error) {
      console.error("成績データ取得エラー:", error)
      toast({
        title: "エラー",
        description: "成績データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoadingScores(false)
    }
  }

  // 認証後にデータを取得
  useEffect(() => {
    if (isAuthenticated && !configError) {
      fetchStudents()
      fetchScores()
    }
  }, [isAuthenticated, configError])

  const handleAdminLogin = () => {
    setIsAuthenticated(true)
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const fileInput = document.getElementById("csvFile") as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) {
      toast({
        title: "エラー",
        description: "ファイルを選択してください",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import-students", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "インポート成功",
          description: result.message,
        })
        fileInput.value = ""
        fetchStudents() // 学生データを再取得
      } else {
        throw new Error(result.error || "インポートに失敗しました")
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "インポートエラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentId || !testName || !testDate || !score || !maxScore) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsAddingScore(true)

    try {
      const supabase = createClientComponentClient()

      // First, check if the student exists
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("student_id", studentId)
        .single()

      if (studentError || !student) {
        throw new Error("学生IDが見つかりません")
      }

      // Add the score
      const { error } = await supabase.from("test_scores").insert({
        student_id: studentId,
        test_name: testName,
        test_date: testDate,
        total_score: Number.parseInt(score),
        max_score: Number.parseInt(maxScore),
      })

      if (error) {
        throw error
      }

      toast({
        title: "成績追加成功",
        description: "テスト成績が正常に追加されました",
      })

      // Reset form
      setStudentId("")
      setTestName("")
      setTestDate("")
      setScore("")
      setMaxScore("100")

      // 成績データを再取得
      fetchScores()
    } catch (error) {
      console.error("Add score error:", error)
      toast({
        title: "成績追加エラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsAddingScore(false)
    }
  }

  // CSVエクスポート機能
  const exportStudentsCSV = () => {
    if (students.length === 0) return

    // CSVヘッダー
    const headers = ["名前", "学生ID", "パスワード"]

    // データ行の作成
    const rows = students.map((student) => [student.name || "", student.student_id, student.password])

    // CSVデータの作成
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // ダウンロード
    downloadCSV(csvContent, "students.csv")
  }

  const exportScoresCSV = () => {
    if (scores.length === 0) return

    // CSVヘッダー
    const headers = [
      "学生ID",
      "学生名",
      "テスト名",
      "テスト日",
      "A問題（一般）",
      "B問題（必修）",
      "C問題（必修症例）",
      "D問題（一般症例）",
      "AD問題（一般合計）",
      "BC問題（必修合計）",
      "合計",
    ]

    // データ行の作成
    const rows = scores.map((score) => [
      score.student_id,
      score.name || "",
      score.test_name,
      score.test_date,
      score.section_a || "",
      score.section_b || "",
      score.section_c || "",
      score.section_d || "",
      score.section_ad || "",
      score.section_bc || "",
      score.total_score || "",
    ])

    // CSVデータの作成
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // ダウンロード
    downloadCSV(csvContent, "test_scores.csv")
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (configError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>設定エラー</CardTitle>
            <CardDescription>システム設定が不足しています</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>環境変数エラー</AlertTitle>
              <AlertDescription>
                <p>Supabase環境変数が設定されていません。以下の環境変数を設定してください：</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
                <p className="mt-2">
                  これらの値はSupabaseダッシュボードの「Project Settings」→「API」から取得できます。
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/setup">セットアップページへ</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <AdminLogin onLogin={handleAdminLogin} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>管理者ページ</CardTitle>
              <CardDescription>学生データと成績の管理</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              ログアウト
            </Button>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/debug-tools" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                学生パスワード確認ツール
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="import" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="import">学生データインポート</TabsTrigger>
            <TabsTrigger value="scores">成績追加</TabsTrigger>
            <TabsTrigger value="test-results">テスト結果インポート</TabsTrigger>
            <TabsTrigger value="test-management">テスト管理</TabsTrigger>
            <TabsTrigger value="students">学生一覧</TabsTrigger>
            <TabsTrigger value="results">成績一覧</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>学生データインポート</CardTitle>
                <CardDescription>CSVファイルから学生データをインポートします</CardDescription>
              </CardHeader>
              <form onSubmit={handleFileUpload}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csvFile">CSVファイル</Label>
                    <Input id="csvFile" type="file" accept=".csv" required />
                    <p className="text-sm text-gray-500">
                      CSVファイルは「名前,学生ID,パスワード」の形式である必要があります
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="submit" disabled={isImporting}>
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        インポート中...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        インポート
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={exportStudentsCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    学生データをエクスポート
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="scores" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>成績追加</CardTitle>
                <CardDescription>学生の模擬試験成績を追加します</CardDescription>
              </CardHeader>
              <form onSubmit={handleAddScore}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">学生ID</Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="例: 233042"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testName">試験名</Label>
                    <Input
                      id="testName"
                      type="text"
                      placeholder="例: 第1回模擬試験"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testDate">試験日</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="score">点数</Label>
                      <Input
                        id="score"
                        type="number"
                        placeholder="例: 85"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxScore">満点</Label>
                      <Input
                        id="maxScore"
                        type="number"
                        placeholder="例: 100"
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isAddingScore} className="w-full">
                    {isAddingScore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        追加中...
                      </>
                    ) : (
                      "成績を追加"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="test-results" className="mt-4">
            <TestResultsImport />
          </TabsContent>

          <TabsContent value="test-management" className="mt-4">
            <TestManagement />
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>学生一覧</CardTitle>
                  <CardDescription>登録されている学生の一覧</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchStudents}>
                    更新
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>学生ID</TableHead>
                          <TableHead>名前</TableHead>
                          <TableHead>パスワード</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>{student.student_id}</TableCell>
                            <TableCell>{student.name || "名前なし"}</TableCell>
                            <TableCell>
                              {student.password.startsWith("$2a$") ? (
                                <span className="text-amber-600">ハッシュ化済み</span>
                              ) : (
                                student.password
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <PasswordResetDialog
                                studentId={student.student_id}
                                studentName={student.name}
                                onReset={fetchStudents}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>学生データがありません。CSVファイルからインポートしてください。</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>成績一覧</CardTitle>
                  <CardDescription>登録されている成績の一覧</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={fetchScores}>
                    更新
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportScoresCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    CSVエクスポート
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingScores ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : scores.length > 0 ? (
                  <TestResultsList scores={scores} />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      成績データがありません。「成績追加」タブから成績を追加してください。
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
