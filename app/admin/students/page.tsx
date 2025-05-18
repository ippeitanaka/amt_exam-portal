"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, RefreshCw, Upload, UserPlus, WifiOff, Eye } from "lucide-react"
import { getStudentsWithFallback } from "@/app/actions/students-actions"
import StudentImport from "@/components/student-import"
import DatabaseDiagnostics from "@/components/database-diagnostics"

// サンプルデータ（ローカルフォールバック用）
const sampleStudents = [
  {
    student_id: "1001",
    name: "サンプル学生1",
    password: "password",
    created_at: new Date().toISOString(),
    source: "sample",
  },
  {
    student_id: "1002",
    name: "サンプル学生2",
    password: "password",
    created_at: new Date().toISOString(),
    source: "sample",
  },
  {
    student_id: "1003",
    name: "サンプル学生3",
    password: "password",
    created_at: new Date().toISOString(),
    source: "sample",
  },
]

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [dataSource, setDataSource] = useState<string>("loading")
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)

  // プレビュー環境の検出
  useEffect(() => {
    const checkIfPreview = () => {
      const hostname = window.location.hostname
      const isV0Preview = hostname.includes("v0.dev") || hostname.includes("localhost")
      const isVercelPreview =
        window.location.hostname.includes("vercel.app") &&
        (window.location.hostname.includes("preview") || window.location.hostname.includes("pr"))

      console.log("環境検出 (クライアント):", {
        hostname,
        isV0Preview,
        isVercelPreview,
      })

      return isV0Preview || isVercelPreview
    }

    const isPreview = checkIfPreview()
    setIsPreviewEnvironment(isPreview)

    if (isPreview) {
      console.log("プレビュー環境を検出しました。オフラインモードで動作します。")
      setIsOfflineMode(true)
      // プレビュー環境ではサンプルデータを即時表示
      setStudents(sampleStudents)
      setFilteredStudents(sampleStudents)
      setDataSource("preview_sample")
      setIsLoading(false)
    }
  }, [])

  // ローカルストレージから学生データを読み込む
  useEffect(() => {
    const loadLocalData = () => {
      try {
        const cachedData = localStorage.getItem("cachedStudents")
        if (cachedData) {
          const parsedData = JSON.parse(cachedData)
          setStudents(parsedData)
          setFilteredStudents(parsedData)
          console.log("ローカルストレージから学生データを読み込みました:", parsedData.length, "件")
        } else {
          // ローカルデータがない場合はサンプルデータを使用
          setStudents(sampleStudents)
          setFilteredStudents(sampleStudents)
          console.log("サンプルデータを使用します")
        }
      } catch (error) {
        console.error("ローカルストレージからの読み込みエラー:", error)
        // エラーが発生した場合もサンプルデータを使用
        setStudents(sampleStudents)
        setFilteredStudents(sampleStudents)
      }
    }

    // まずローカルデータを読み込む（即時表示のため）
    loadLocalData()

    // プレビュー環境でなければサーバーからデータを取得
    if (!isPreviewEnvironment) {
      fetchStudents().catch((err) => {
        console.error("学生データ取得エラー:", err)
        setError(err instanceof Error ? err.message : "学生データの取得に失敗しました")
        setIsLoading(false)
        setIsOfflineMode(true)

        // エラーが発生した場合もサンプルデータを表示
        setStudents(sampleStudents)
        setFilteredStudents(sampleStudents)
      })
    }
  }, [isPreviewEnvironment])

  // 検索フィルター
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(
        (student) =>
          student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.student_id?.toString().includes(searchTerm),
      )
      setFilteredStudents(filtered)
    }
  }, [searchTerm, students])

  // サーバーとローカルの学生データをマージする関数
  const mergeStudentData = (localStudents: any[], serverStudents: any[]) => {
    const studentMap = new Map()

    // ローカルデータをマップに追加
    localStudents.forEach((student) => {
      if (student.student_id) {
        studentMap.set(student.student_id.toString(), { ...student, source: "local" })
      }
    })

    // サーバーデータをマージ（優先）
    serverStudents.forEach((student) => {
      if (student.student_id) {
        const existingStudent = studentMap.get(student.student_id.toString())
        if (existingStudent) {
          studentMap.set(student.student_id.toString(), { ...existingStudent, ...student, source: "server" })
        } else {
          studentMap.set(student.student_id.toString(), { ...student, source: "server" })
        }
      }
    })

    return Array.from(studentMap.values())
  }

  const fetchStudents = async () => {
    try {
      console.log("学生データ取得を開始します")
      setIsLoading(true)

      // プレビュー環境ではサンプルデータを返す
      if (isPreviewEnvironment) {
        console.log("プレビュー環境のため、サンプルデータを使用します")
        setStudents(sampleStudents)
        setFilteredStudents(sampleStudents)
        setDataSource("preview_sample")
        setIsOfflineMode(true)
        setIsLoading(false)
        return
      }

      // Server Actionを使用してサーバーサイドから学生データを取得
      const result = await getStudentsWithFallback().catch((error) => {
        // エラーをキャッチしてサンプルデータを返す
        console.error("getStudentsWithFallback エラー:", error)
        return {
          success: true,
          data: sampleStudents,
          source: "error_fallback",
          error: error instanceof Error ? error.message : "データ取得中にエラーが発生しました",
          isOfflineMode: true,
        }
      })

      // 結果が成功でも失敗でも、ローディング状態を解除
      setIsLoading(false)

      // プレビュー環境の判定
      if (result.isPreviewEnvironment) {
        setIsPreviewEnvironment(true)
      }

      // オフラインモードの判定
      setIsOfflineMode(!!result.isOfflineMode)

      // サーバーから取得したデータとローカルデータをマージ
      const mergedStudents = mergeStudentData(students, result.data)
      setStudents(mergedStudents)
      setFilteredStudents(mergedStudents)
      setDataSource(result.source || "server")

      // 取得したデータをローカルストレージにもキャッシュ
      try {
        localStorage.setItem("cachedStudents", JSON.stringify(mergedStudents))
      } catch (storageError) {
        console.error("ローカルストレージへの保存エラー:", storageError)
      }

      console.log("学生データを取得しました:", mergedStudents.length, "件")

      // エラーメッセージがある場合は表示
      if (result.error) {
        setError(result.error)
        // 自動的に診断ツールを表示
        setShowDiagnostics(true)
      } else {
        setError(null)
      }
    } catch (error) {
      console.error("学生データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "学生データの取得に失敗しました")
      // エラーが発生した場合も診断ツールを表示
      setShowDiagnostics(true)
      setIsOfflineMode(true)

      // エラーが発生した場合もローディング状態を解除
      setIsLoading(false)

      // サンプルデータを設定
      setStudents(sampleStudents)
      setFilteredStudents(sampleStudents)
      setDataSource("error_fallback")
    }
  }

  const handleRefresh = () => {
    fetchStudents()
  }

  const handleImportComplete = (importedStudents: any[]) => {
    setShowImport(false)
    if (importedStudents.length > 0) {
      // インポートされた学生データを既存のデータとマージ
      const mergedStudents = mergeStudentData(students, importedStudents)
      setStudents(mergedStudents)
      setFilteredStudents(mergedStudents)
      localStorage.setItem("cachedStudents", JSON.stringify(mergedStudents))
    }
  }

  const exportStudents = () => {
    if (students.length === 0) return

    // CSVヘッダー
    const headers = ["student_id", "name", "password"]
    const csvContent =
      headers.join(",") +
      "\n" +
      students
        .map((student) => {
          return headers.map((header) => student[header] || "").join(",")
        })
        .join("\n")

    // CSVファイルをダウンロード
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `students_export_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">学生管理</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowImport(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            インポート
          </Button>
          <Button onClick={exportStudents} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            エクスポート
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                読み込み中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                更新
              </>
            )}
          </Button>
        </div>
      </div>

      {isPreviewEnvironment && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800">
          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">プレビュー環境</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            現在、プレビュー環境で実行されているため、Supabaseとの接続は無効化されています。サンプルデータを表示しています。
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="mt-2 border-blue-300 text-blue-700"
            >
              {showDiagnostics ? "診断ツールを隠す" : "診断ツールを表示"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isOfflineMode && !isPreviewEnvironment && (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900 dark:border-amber-800">
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">オフラインモード</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            現在、ローカルデータを表示しています。Supabaseとの接続が確立されていません。
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="mt-2 border-amber-300 text-amber-700"
            >
              {showDiagnostics ? "診断ツールを隠す" : "診断ツールを表示"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && !isPreviewEnvironment && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" onClick={() => setShowDiagnostics(!showDiagnostics)} className="mt-2">
            {showDiagnostics ? "診断ツールを隠す" : "診断ツールを表示"}
          </Button>
        </Alert>
      )}

      {showDiagnostics && <DatabaseDiagnostics />}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>学生一覧</CardTitle>
              <CardDescription>
                登録されている学生の一覧です。{filteredStudents.length}人の学生が表示されています。
                {isPreviewEnvironment && <span className="ml-2 text-blue-600 font-medium">（プレビューモード）</span>}
                {isOfflineMode && !isPreviewEnvironment && (
                  <span className="ml-2 text-amber-600 font-medium">（オフラインモード）</span>
                )}
              </CardDescription>
            </div>
            {isPreviewEnvironment ? (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 px-2 py-1"
              >
                <Eye className="h-3 w-3" />
                プレビュー
              </Badge>
            ) : isOfflineMode ? (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 px-2 py-1"
              >
                <WifiOff className="h-3 w-3" />
                オフライン
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="学生名または学生IDで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              新規登録
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生ID</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>パスワード</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead>データソース</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                      <span className="mt-2 block">データを読み込み中...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      学生データがありません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow key={student.id || student.student_id || index}>
                      <TableCell>{student.student_id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.password}</TableCell>
                      <TableCell>
                        {student.created_at ? new Date(student.created_at).toLocaleDateString("ja-JP") : "不明"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            student.source === "server"
                              ? "bg-green-100 text-green-800"
                              : student.source === "sample"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {student.source === "server"
                            ? "サーバー"
                            : student.source === "sample"
                              ? "サンプル"
                              : "ローカル"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showImport && <StudentImport onClose={() => setShowImport(false)} onComplete={handleImportComplete} />}
    </div>
  )
}
