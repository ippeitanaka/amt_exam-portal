"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertCircle, FileText } from "lucide-react"

export default function CsvInspector() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvContent, setCsvContent] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [rawBytes, setRawBytes] = useState<string[]>([])

  const fetchCsv = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/24%E6%9C%9F%E7%94%9FID-UZj37SYowlEWDNiqVa2ARXrax14Cv5.csv",
      )

      if (!response.ok) {
        throw new Error(`CSVファイルの取得に失敗しました: ${response.status}`)
      }

      // テキストとしてCSVを取得
      const text = await response.text()
      setCsvContent(text)

      // バイト配列としても取得（エンコーディング確認用）
      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const hexBytes = Array.from(bytes.slice(0, 100))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ")
      setRawBytes([hexBytes])

      // CSVをパース
      const lines = text.split("\n")
      const headers = lines[0].split(",")

      const data = []
      for (let i = 1; i < Math.min(lines.length, 10); i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",")
          const row: Record<string, string> = {}

          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || ""
          })

          data.push(row)
        }
      }

      setParsedData(data)
    } catch (err) {
      console.error("CSV取得エラー:", err)
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCsv()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>CSVファイル検査ツール</CardTitle>
            <CardDescription>CSVファイルの内容とエンコーディングを確認します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-2">バイナリデータ（最初の100バイト）</h3>
                  <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs">{rawBytes}</pre>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    これはCSVファイルの最初の100バイトの16進数表現です。エンコーディングの問題を特定するのに役立ちます。
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">生のCSVデータ（最初の500文字）</h3>
                  <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                    <pre className="text-xs">{csvContent?.substring(0, 500)}...</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">パースされたデータ（最初の10行）</h3>
                  {parsedData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(parsedData[0]).map((header) => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, i) => (
                                <TableCell key={i}>{value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p>データがありません</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fetchCsv} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  読み込み中...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  CSVを再読み込み
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>インポート問題の解決方法</CardTitle>
            <CardDescription>CSVデータとテーブル構造の不一致を解決します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-medium">考えられる問題点</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>文字エンコーディングの問題（日本語が正しく処理されていない）</li>
              <li>CSVの列名とテーブルの列名の不一致</li>
              <li>データ型の不一致（例：数値が期待されるところに文字列がある）</li>
              <li>必須フィールドに値がない</li>
            </ol>

            <h3 className="text-lg font-medium mt-4">解決策</h3>
            <p>
              以下の改善されたインポートAPIを使用して、CSVデータを正しくインポートします。
              このAPIは文字エンコーディングを適切に処理し、データを検証してから挿入します。
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
