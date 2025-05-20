"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Database, Check, X } from "lucide-react"
import { checkDatabaseConnection, getTableInfo } from "@/app/actions/database-debug"

export default function DatabaseDebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "success" | "error">("checking")
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [studentId, setStudentId] = useState("")
  const [testName, setTestName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setConnectionStatus("checking")
      const result = await checkDatabaseConnection()
      if (result.success) {
        setConnectionStatus("success")
        setConnectionError(null)
      } else {
        setConnectionStatus("error")
        setConnectionError(result.error || "不明なエラーが発生しました")
      }
    } catch (error) {
      setConnectionStatus("error")
      setConnectionError(error instanceof Error ? error.message : "不明なエラーが発生しました")
    }
  }

  const handleGetTableInfo = async () => {
    try {
      setIsLoading(true)
      const result = await getTableInfo(studentId, testName)
      setTableInfo(result)
    } catch (error) {
      console.error("テーブル情報取得エラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">データベース接続デバッグ</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>データベース接続ステータス</CardTitle>
            <CardDescription>Supabaseデータベースへの接続状態を確認します</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  connectionStatus === "checking"
                    ? "bg-gray-100"
                    : connectionStatus === "success"
                      ? "bg-green-100"
                      : "bg-red-100"
                }`}
              >
                {connectionStatus === "checking" ? (
                  <Database className="h-6 w-6 text-gray-500" />
                ) : connectionStatus === "success" ? (
                  <Check className="h-6 w-6 text-green-600" />
                ) : (
                  <X className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {connectionStatus === "checking"
                    ? "接続を確認中..."
                    : connectionStatus === "success"
                      ? "接続成功"
                      : "接続エラー"}
                </p>
                {connectionError && <p className="text-sm text-red-600 mt-1">{connectionError}</p>}
              </div>
            </div>

            <Button onClick={checkConnection} className="mt-4" variant="outline" size="sm">
              接続を再確認
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>テーブル情報の確認</CardTitle>
            <CardDescription>test_scoresテーブルの情報を確認します</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">学生ID（オプション）</Label>
                  <Input
                    id="studentId"
                    placeholder="例: 222026"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testName">テスト名（オプション）</Label>
                  <Input
                    id="testName"
                    placeholder="例: AMT模擬試験"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleGetTableInfo} disabled={isLoading}>
                {isLoading ? "取得中..." : "テーブル情報を取得"}
              </Button>

              {tableInfo && (
                <div className="mt-4 space-y-6">
                  {tableInfo.structure && tableInfo.structure.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">テーブル構造</h3>
                      <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">カラム名</th>
                              <th className="text-left py-2 px-3">データ型</th>
                              <th className="text-left py-2 px-3">NULL許可</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableInfo.structure.map((column: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 px-3">{column.column_name}</td>
                                <td className="py-2 px-3">{column.data_type}</td>
                                <td className="py-2 px-3">{column.is_nullable}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium mb-2">テストデータ</h3>
                    {tableInfo.data && tableInfo.data.length > 0 ? (
                      <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">ID</th>
                              <th className="text-left py-2 px-3">学生ID</th>
                              <th className="text-left py-2 px-3">テスト名</th>
                              <th className="text-left py-2 px-3">テスト日</th>
                              <th className="text-left py-2 px-3">その他</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableInfo.data.map((row: any, index: number) => (
                              <tr key={index} className="border-b">
                                <td className="py-2 px-3">{row.id}</td>
                                <td className="py-2 px-3">{row.student_id}</td>
                                <td className="py-2 px-3">{row.test_name}</td>
                                <td className="py-2 px-3">{row.test_date}</td>
                                <td className="py-2 px-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      alert(JSON.stringify(row, null, 2))
                                    }}
                                  >
                                    詳細
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-4 rounded-md flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-amber-800 font-medium">データが見つかりません</p>
                          <p className="text-amber-700 text-sm mt-1">
                            {studentId && testName
                              ? `学生ID "${studentId}" とテスト名 "${testName}" に一致するデータはありません。`
                              : studentId
                                ? `学生ID "${studentId}" に一致するデータはありません。`
                                : testName
                                  ? `テスト名 "${testName}" に一致するデータはありません。`
                                  : "テーブルにデータがないか、検索条件に一致するデータがありません。"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">テスト名一覧</h3>
                    {tableInfo.testNames && tableInfo.testNames.length > 0 ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <ul className="list-disc list-inside space-y-1">
                          {tableInfo.testNames.map((name: string, index: number) => (
                            <li key={index}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-500">テスト名が見つかりません</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">学生ID一覧</h3>
                    {tableInfo.studentIds && tableInfo.studentIds.length > 0 ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <ul className="list-disc list-inside space-y-1">
                          {tableInfo.studentIds.map((id: string, index: number) => (
                            <li key={index}>{id}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-500">学生IDが見つかりません</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
