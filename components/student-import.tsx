"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload, Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { importStudents } from "@/app/actions/students"
import Papa from "papaparse"

interface StudentImportProps {
  onSuccess?: () => void
}

export default function StudentImport({ onSuccess }: StudentImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setSuccess(null)

    // CSVファイルをプレビュー
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSVパースエラー: ${results.errors[0].message}`)
          setPreviewData(null)
          return
        }

        const data = results.data as any[]
        if (data.length === 0) {
          setError("CSVファイルにデータがありません")
          setPreviewData(null)
          return
        }

        // 必須フィールドの確認
        const firstRow = data[0]
        const hasStudentId = "student_id" in firstRow
        const hasName = "name" in firstRow
        const hasPassword = "password" in firstRow

        if (!hasStudentId || !hasName || !hasPassword) {
          setError("CSVファイルに必須フィールドがありません。student_id, name, passwordフィールドが必要です。")
          setPreviewData(null)
          return
        }

        // プレビューデータを設定（最大5件）
        setPreviewData(data.slice(0, 5))
        console.log("CSVデータプレビュー:", data.slice(0, 5))
      },
      error: (error) => {
        setError(`CSVパースエラー: ${error.message}`)
        setPreviewData(null)
      },
    })
  }

  const handleImport = async () => {
    if (!file) {
      setError("インポートするファイルを選択してください")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // CSVファイルを解析
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            setError(`CSVパースエラー: ${results.errors[0].message}`)
            setIsLoading(false)
            return
          }

          const data = results.data as any[]
          if (data.length === 0) {
            setError("CSVファイルにデータがありません")
            setIsLoading(false)
            return
          }

          console.log("インポート開始:", data.length, "件")

          try {
            // データ型の変換を行わずにそのままインポート
            const result = await importStudents(data)

            if (result.success) {
              setSuccess(result.message || `${result.successCount}件の学生情報をインポートしました`)
              toast({
                title: "インポート成功",
                description: result.message,
              })
              // ファイル選択をリセット
              if (fileInputRef.current) {
                fileInputRef.current.value = ""
              }
              setFile(null)
              setPreviewData(null)

              // 成功コールバックを呼び出し
              if (onSuccess) {
                onSuccess()
              }
            } else {
              setError(result.error || "インポートに失敗しました")
              toast({
                title: "インポートエラー",
                description: result.error,
                variant: "destructive",
              })
            }
          } catch (err) {
            console.error("インポートエラー:", err)
            setError(err instanceof Error ? err.message : "インポート処理中にエラーが発生しました")
            toast({
              title: "インポートエラー",
              description: "インポート処理中にエラーが発生しました",
              variant: "destructive",
            })
          } finally {
            setIsLoading(false)
          }
        },
        error: (error) => {
          setError(`CSVパースエラー: ${error.message}`)
          setIsLoading(false)
        },
      })
    } catch (err) {
      console.error("ファイル処理エラー:", err)
      setError(err instanceof Error ? err.message : "ファイル処理中にエラーが発生しました")
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-brown-200 dark:border-brown-800">
      <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
        <CardTitle className="text-brown-800 dark:text-brown-100">学生データインポート</CardTitle>
        <CardDescription className="text-brown-600 dark:text-brown-300">
          CSVファイルから学生データをインポートします
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 bg-white dark:bg-brown-900">
        {error && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
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
            ref={fileInputRef}
            onChange={handleFileChange}
            className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
          />
          <p className="text-sm text-brown-500 dark:text-brown-400">
            CSVファイルは、student_id, name, passwordの列を含む必要があります
          </p>
        </div>

        {previewData && previewData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-brown-700 dark:text-brown-200">プレビュー（最初の5件）</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brown-200 dark:divide-brown-700">
                <thead className="bg-brown-50 dark:bg-brown-800">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left text-xs font-medium text-brown-700 dark:text-brown-300 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-brown-900 divide-y divide-brown-200 dark:divide-brown-700">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(previewData[0]).map((key) => (
                        <td key={`${rowIndex}-${key}`} className="px-3 py-2 text-sm text-brown-800 dark:text-brown-200">
                          {key === "password" ? "********" : row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-white dark:bg-brown-900 rounded-b-lg">
        <Button
          onClick={handleImport}
          disabled={!file || isLoading}
          className="w-full bg-brown-600 hover:bg-brown-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              インポート中...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              インポート実行
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
