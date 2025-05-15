"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { DeleteTestDialog } from "./delete-test-dialog"

export default function TestManagement() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tests, setTests] = useState<{ test_name: string; test_date: string; count: number }[]>([])
  const supabase = createClientComponentClient()

  const fetchTests = async () => {
    setLoading(true)
    setError(null)

    try {
      // テスト一覧を取得（テスト名、日付、および各テストの結果数）
      const { data, error } = await supabase.rpc("get_test_summary")

      if (error) throw error

      if (data) {
        setTests(data)
      } else {
        setTests([])
      }
    } catch (err) {
      console.error("テスト一覧取得エラー:", err)
      setError("テスト一覧の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>テスト結果管理</CardTitle>
          <CardDescription>テスト結果の一覧と削除</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          更新
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : tests.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>テスト名</TableHead>
                  <TableHead>実施日</TableHead>
                  <TableHead className="text-right">結果数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={`${test.test_name}_${test.test_date}`}>
                    <TableCell>{test.test_name}</TableCell>
                    <TableCell>{new Date(test.test_date).toLocaleDateString("ja-JP")}</TableCell>
                    <TableCell className="text-right">{test.count}件</TableCell>
                    <TableCell className="text-right">
                      <DeleteTestDialog testName={test.test_name} testDate={test.test_date} onDeleted={fetchTests} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>テストデータがありません</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
