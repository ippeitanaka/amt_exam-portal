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
import { CharacterIcon } from "./character-icon"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { importStudents } from "@/app/actions/students" // サーバーアクションをインポート

interface StudentImportProps {
  onImportSuccess?: (students: any[]) => void
}

export default function StudentImport({ onImportSuccess }: StudentImportProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [csvPreview, setCsvPreview] = useState<string[][]>([])
  const { toast } = useToast()

  // CSVファイルをプレビュー表示する関数
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setCsvPreview([])
      return
    }

    try {
      const text = await file.text()
      console.log("CSVプレビュー:", text.substring(0, 100) + "...")

      // CSVデータを行に分割
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

      console.log(`CSVプレビュー: ${rows.length}行`)
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
        console.log("CSVデータ読み込み完了:", csvData.substring(0, 100) + "...")

        // CSVデータを行に分割
        const rows = csvData.split("\n")
        console.log(`CSVデータ: ${rows.length}行`)

        // ヘッダー行を取得
        const headers = rows[0].split(",").map((h) => h.trim())
        console.log("ヘッダー:", headers)

        // 必須フィールドの確認
        const requiredFields = ["name", "student_id", "password"]
        const missingFields = requiredFields.filter((field) => !headers.includes(field))

        if (missingFields.length > 0) {
          setError(`CSVファイルに必須フィールドがありません: ${missingFields.join(", ")}`)
          setIsImporting(false)
          return
        }

        // データ行の処理
        const dataRows = rows.slice(1).filter((row) => row.trim() !== "")
        console.log(`有効なデータ行: ${dataRows.length}行`)
        const students = []

        for (const row of dataRows) {
          // 簡易的なCSV解析（より複雑なケースでは改善が必要）
          const values = []
          let current = ""
          let inQuotes = false

          for (let i = 0; i < row.length; i++) {
            const char = row[i]

            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              values.push(current)
              current = ""
            } else {
              current += char
            }
          }
          // 最後のフィールドを追加
          values.push(current)

          // 各フィールドのインデックスを取得
          const idIndex = headers.indexOf("id")
          const nameIndex = headers.indexOf("name")
          const studentIdIndex = headers.indexOf("student_id")
          const passwordIndex = headers.indexOf("password")
          const createdAtIndex = headers.indexOf("created_at")

          // 必須フィールドの値が空でないことを確認
          if (!values[nameIndex] || !values[studentIdIndex] || !values[passwordIndex]) {
            console.log("必須フィールドが空の行をスキップ:", values)
            continue
          }

          // student_idを数値に変換
          const studentIdValue = values[studentIdIndex].trim()
          const studentId = Number.parseInt(studentIdValue, 10)

          if (isNaN(studentId)) {
            console.log(`無効な学生ID "${studentIdValue}" をスキップします`)
            continue
          }

          // データオブジェクトを作成
          const studentData: any = {
            name: values[nameIndex].trim(),
            student_id: studentId,
            password: values[passwordIndex].trim(),
          }

          // オプションフィールド
          if (idIndex >= 0 && values[idIndex] && values[idIndex].trim() !== "") {
            const idValue = Number.parseInt(values[idIndex].trim(), 10)
            if (!isNaN(idValue)) {
              studentData.id = idValue
            }
          }

          if (createdAtIndex >= 0 && values[createdAtIndex] && values[createdAtIndex].trim() !== "") {
            studentData.created_at = values[createdAtIndex].trim()
          } else {
            studentData.created_at = new Date().toISOString()
          }

          console.log("学生データを追加:", studentData)
          students.push(studentData)
        }

        if (students.length === 0) {
          setError("有効なデータ行がありません")
          setIsImporting(false)
          return
        }

        console.log(`インポート準備完了: ${students.length}件の学生データ`)

        try {
          // サーバーアクションを使用して学生データをインポート
          const result = await importStudents(students)

          if (result.success) {
            setSuccess(result.message || `${students.length}件の学生情報をインポートしました`)

            toast({
              title: "インポート完了",
              description: result.message || `${students.length}件の学生情報をインポートしました`,
            })

            // インポート成功をコンポーネントに通知
            if (onImportSuccess) {
              onImportSuccess(students)
            }

            // フォームをリセット
            fileInput.value = ""
            setCsvPreview([])
          } else {
            console.error("インポートエラー:", result.error)
            setError(result.error || "インポートに失敗しました")
            toast({
              title: "インポートエラー",
              description: result.error || "インポートに失敗しました",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Import error:", error)
          setError(error instanceof Error ? error.message : "不明なエラーが発生しました")
          toast({
            title: "インポートエラー",
            description: error instanceof Error ? error.message : "不明なエラーが発生しました",
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
    const headers = ["id", "name", "student_id", "password", "created_at"]
    const exampleRow = ["", "山田太郎", "123456", "password123", ""]
    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "students_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="border-brown-200 dark:border-brown-800">
      <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
        <div className="flex items-center gap-3">
          <CharacterIcon size={40} />
          <div>
            <CardTitle className="text-brown-800 dark:text-brown-100">学生情報インポート</CardTitle>
            <CardDescription className="text-brown-600 dark:text-brown-300">
              CSVファイルから学生情報をインポートします
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleFileUpload}>
        <CardContent className="space-y-4 pt-6 bg-white dark:bg-brown-900">
          {error && (
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert
              variant="default"
              className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
            >
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="csvFile" className="text-brown-700 dark:text-brown-200">
              CSVファイル
            </Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
              className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
            />
            <p className="text-sm text-brown-600 dark:text-brown-300">
              CSVファイルは以下の列を含む必要があります: id (オプション), name, student_id, password, created_at
              (オプション)
            </p>
          </div>

          {csvPreview.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-sm font-medium mb-2 text-brown-700 dark:text-brown-200">CSVプレビュー（最初の5行）:</p>
              <div className="border rounded-md overflow-x-auto border-brown-200 dark:border-brown-800">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brown-50 dark:bg-brown-900">
                      {csvPreview[0].map((header, i) => (
                        <TableHead key={i} className="whitespace-nowrap text-brown-700 dark:text-brown-200">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.slice(1).map((row, i) => (
                      <TableRow key={i} className="border-brown-200 dark:border-brown-800">
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-brown-700 dark:text-brown-200">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between bg-white dark:bg-brown-900 rounded-b-lg">
          <Button type="submit" disabled={isImporting} className="bg-brown-600 hover:bg-brown-700 text-white">
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
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            className="border-brown-300 text-brown-700 hover:bg-brown-100 dark:border-brown-700 dark:text-brown-200 dark:hover:bg-brown-800"
          >
            <Download className="mr-2 h-4 w-4" />
            テンプレートをダウンロード
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
