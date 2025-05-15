"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, FileText, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function TestResultsImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [importResults, setImportResults] = useState<any>(null)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const [fileName, setFileName] = useState("")
  const { toast } = useToast()

  // CSVファイルをプレビュー表示する関数
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    try {
      const text = await file.text()
      const rows = text
        .split("\n")
        .filter((row) => row.trim() !== "") // 空行を削除
        .map((row) => {
          // 簡易的なCSV解析（より複雑なケースでは改善が必要）
          const result = []
          let current = ""
          let inQuotes = false

          for (let i = 0; i < row.length; i++) {
            const char = row[i]

            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              result.push(current)
              current = ""
            } else {
              current += char
            }
          }

          // 最後のフィールドを追加
          result.push(current)

          return result
        })

      setCsvPreview(rows.slice(0, 5)) // 最初の5行だけ表示
    } catch (error) {
      console.error("CSVプレビューエラー:", error)
      setCsvPreview([])
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()

    const fileInput = document.getElementById("csvFile") as HTMLInputElement
    const file = fileInput.files?.[0]
    const testNameInput = document.getElementById("testName") as HTMLInputElement
    const testDateInput = document.getElementById("testDate") as HTMLInputElement

    if (!file || !testNameInput.value || !testDateInput.value) {
      toast({
        title: "エラー",
        description: "ファイル、テスト名、日付をすべて指定してください",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setSuccess(false)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("testName", testNameInput.value)
      formData.append("testDate", testDateInput.value)

      const response = await fetch("/api/import-test-results", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      console.log("インポート結果:", result) // デバッグ用

      if (response.ok) {
        setSuccess(true)
        setImportResults(result)
        toast({
          title: "インポート結果",
          description: `${result.results.length}件成功、${result.errors ? result.errors.length : 0}件エラー`,
          variant: result.errors && result.errors.length > 0 ? "destructive" : "default",
        })

        if (!result.errors || result.errors.length === 0) {
          fileInput.value = ""
          testNameInput.value = ""
          testDateInput.value = ""
          setCsvPreview([])
          setFileName("")
        }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>テスト結果インポート</CardTitle>
        <CardDescription>CSVファイルからテスト結果を一括でインポートします</CardDescription>
      </CardHeader>
      <form onSubmit={handleImport}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSVファイル</Label>
            <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} required />
            <p className="text-sm text-gray-500">
              CSVファイルは「student_id, name, section_a, section_b, section_c, section_d, section_ad, section_bc,
              total_score」の形式である必要があります
            </p>
          </div>

          {fileName && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTitle className="text-blue-800">選択されたファイル: {fileName}</AlertTitle>
            </Alert>
          )}

          {csvPreview.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-sm font-medium mb-2">CSVプレビュー（最初の5行）:</p>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {csvPreview[0].map((header, i) => (
                        <TableHead key={i} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.slice(1).map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="testName">テスト名</Label>
            <Input id="testName" type="text" placeholder="例: 第1回模擬試験" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="testDate">テスト日</Label>
            <Input id="testDate" type="date" required />
          </div>

          {importResults && importResults.errors && importResults.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>インポートエラー ({importResults.errors.length}件)</AlertTitle>
              <AlertDescription>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-5 space-y-1">
                    {importResults.errors.map((error: string, index: number) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importResults &&
            importResults.errors &&
            importResults.errors.some((error) => error.includes("既に存在する")) && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>既存データのスキップ</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    同じ学生ID、テスト名、テスト日の組み合わせのデータは既に存在するためスキップしました。
                  </p>
                  <p className="text-sm">
                    既存データを更新したい場合は、先に該当するテストデータを削除してから再インポートしてください。
                  </p>
                </AlertDescription>
              </Alert>
            )}

          {importResults && importResults.results && importResults.results.length > 0 && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>インポート成功 ({importResults.results.length}件)</AlertTitle>
              <AlertDescription>テスト結果が正常にインポートされました。</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
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
        </CardFooter>
      </form>
    </Card>
  )
}
