"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, FileSpreadsheet, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ParamedicMascot } from "./paramedic-mascot"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface TestResultsImportProps {
  onImportSuccess?: () => void
}

export default function TestResultsImport({ onImportSuccess }: TestResultsImportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // CSVファイルをプレビュー表示する関数
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setCsvPreview([])
      return
    }

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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const fileInput = document.getElementById("csvFile") as HTMLInputElement
    const file = fileInput.files?.[0]

    if (!file) {
      setError("ファイルを選択してください")
      return
    }

    setIsImporting(true)
    setError("")
    setSuccess("")

    try {
      const reader = new FileReader()

      reader.onload = async (event) => {
        const csvData = event.target?.result as string
        const rows = csvData.split("\n")

        // ヘッダー行を取得
        const headers = rows[0].split(",").map((h) => h.trim())

        // 必須フィールドの確認
        const requiredFields = ["学生ID", "テスト名", "テスト日", "合計"]
        const missingFields = requiredFields.filter((field) => !headers.includes(field))

        if (missingFields.length > 0) {
          setError(`CSVファイルに必須フィールドがありません: ${missingFields.join(", ")}`)
          setIsImporting(false)
          return
        }

        // データ行の処理
        const dataRows = rows.slice(1).filter((row) => row.trim() !== "")
        const results = []

        for (const row of dataRows) {
          const values = row.split(",").map((v) => v.trim())

          // 各フィールドのインデックスを取得
          const studentIdIndex = headers.indexOf("学生ID")
          const studentNameIndex = headers.indexOf("氏名")
          const testNameIndex = headers.indexOf("テスト名")
          const testDateIndex = headers.indexOf("テスト日")
          const generalMorningIndex = headers.indexOf("一般問題午前")
          const generalAfternoonIndex = headers.indexOf("一般問題午後")
          const acupuncturistIndex = headers.indexOf("鍼師問題")
          const moxibustionIndex = headers.indexOf("灸師問題")
          const totalScoreIndex = headers.indexOf("合計")

          // 必須フィールドの値が空でないことを確認
          if (!values[studentIdIndex] || !values[testNameIndex] || !values[testDateIndex] || !values[totalScoreIndex]) {
            continue
          }

          // データオブジェクトを作成
          const rowData: any = {
            student_id: values[studentIdIndex],
            test_name: values[testNameIndex],
            test_date: values[testDateIndex],
            total_score: Number.parseInt(values[totalScoreIndex]) || 0,
          }

          // オプションフィールド
          // student_nameカラムが存在しない場合は、このフィールドをスキップ
          // 以下のコードをコメントアウトまたは削除
          /*
          if (studentNameIndex >= 0 && values[studentNameIndex]) {
            rowData.student_name = values[studentNameIndex];
          }
          */

          if (generalMorningIndex >= 0 && values[generalMorningIndex]) {
            rowData.general_morning = Number.parseInt(values[generalMorningIndex]) || null
          }

          if (generalAfternoonIndex >= 0 && values[generalAfternoonIndex]) {
            rowData.general_afternoon = Number.parseInt(values[generalAfternoonIndex]) || null
          }

          if (acupuncturistIndex >= 0 && values[acupuncturistIndex]) {
            rowData.acupuncturist = Number.parseInt(values[acupuncturistIndex]) || null
          }

          if (moxibustionIndex >= 0 && values[moxibustionIndex]) {
            rowData.moxibustion = Number.parseInt(values[moxibustionIndex]) || null
          }

          // デフォルト値
          rowData.max_score = 300

          results.push(rowData)
        }

        if (results.length === 0) {
          setError("有効なデータ行がありません")
          setIsImporting(false)
          return
        }

        try {
          // テーブル構造を確認
          const { data: tableInfo, error: tableError } = await supabase.from("test_scores").select("*").limit(1)

          if (tableError) {
            throw new Error(`テーブル構造の確認に失敗しました: ${tableError.message}`)
          }

          // データベースのカラム名を取得
          const dbColumns = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : []
          console.log("利用可能なカラム:", dbColumns)

          // 各結果をテーブル構造に合わせて整形
          const formattedResults = results.map((result) => {
            const formattedResult: Record<string, any> = {}

            // 基本項目を追加（必須項目）
            formattedResult.student_id = result.student_id
            formattedResult.test_name = result.test_name
            formattedResult.test_date = result.test_date
            formattedResult.total_score = result.total_score

            // 存在するカラムのみ追加
            if (dbColumns.includes("student_name") && result.student_name !== undefined) {
              formattedResult.student_name = result.student_name
            }

            if (dbColumns.includes("general_morning") && result.general_morning !== undefined) {
              formattedResult.general_morning = result.general_morning
            }

            if (dbColumns.includes("general_afternoon") && result.general_afternoon !== undefined) {
              formattedResult.general_afternoon = result.general_afternoon
            }

            if (dbColumns.includes("acupuncturist") && result.acupuncturist !== undefined) {
              formattedResult.acupuncturist = result.acupuncturist
            }

            if (dbColumns.includes("moxibustion") && result.moxibustion !== undefined) {
              formattedResult.moxibustion = result.moxibustion
            }

            if (dbColumns.includes("max_score")) {
              formattedResult.max_score = result.max_score || 300 // デフォルト値
            }

            return formattedResult
          })

          // データをインポート
          const { error: insertError } = await supabase.from("test_scores").insert(formattedResults)

          if (insertError) {
            throw new Error(insertError.message)
          }

          setSuccess(`${results.length}件のテスト結果をインポートしました`)
          toast({
            title: "インポート成功",
            description: `${results.length}件のテスト結果をインポートしました`,
          })

          // フォームをリセット
          fileInput.value = ""
          setCsvPreview([])

          // インポート成功時にコールバックを呼び出す
          if (onImportSuccess) {
            onImportSuccess()
          }
        } catch (error) {
          console.error("テスト結果インポートエラー:", error)
          setError(error instanceof Error ? error.message : "テスト結果のインポートに失敗しました")
          toast({
            title: "インポートエラー",
            description: error instanceof Error ? error.message : "テスト結果のインポートに失敗しました",
            variant: "destructive",
          })
        }
      }

      reader.onerror = () => {
        setError("ファイルの読み込み中にエラーが発生しました")
      }

      reader.readAsText(file)
    } catch (error) {
      console.error("Import error:", error)
      setError(error instanceof Error ? error.message : "不明なエラーが発生しました")
      toast({
        title: "インポートエラー",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      "学生ID",
      "氏名",
      "テスト名",
      "テスト日",
      "一般問題午前",
      "一般問題午後",
      "鍼師問題",
      "灸師問題",
      "合計",
    ]

    const csvContent = headers.join(",")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "test_scores_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ParamedicMascot width={40} height={40} type="acupuncturist" />
          <div>
            <CardTitle>テスト結果インポート</CardTitle>
            <CardDescription>CSVファイルから鍼灸師学科の模擬試験結果をインポートします</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleFileUpload}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="csvFile">CSVファイル</Label>
            <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} required />
            <p className="text-sm text-gray-500">
              CSVファイルは以下の列を含む必要があります: 学生ID, 氏名, テスト名, テスト日, 合計
              <br />
              その他の列（一般問題午前, 一般問題午後, 鍼師問題, 灸師問題）はオプションです
            </p>
          </div>

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
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                インポート
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            テンプレートをダウンロード
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
