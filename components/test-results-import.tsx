"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { importTestResults } from "@/app/actions/test-results"
import { CharacterIcon } from "./character-icon"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Calendar } from "lucide-react"
import Papa from "papaparse"

interface TestResultsImportProps {
  onSuccess?: () => void
  onImportSuccess?: () => void
}

export default function TestResultsImport({ onSuccess, onImportSuccess }: TestResultsImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [testName, setTestName] = useState("AMT模擬試験")
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0])
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setUploadSuccess(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "エラー",
        description: "ファイルを選択してください",
        variant: "destructive",
      })
      return
    }

    if (!testName.trim()) {
      toast({
        title: "エラー",
        description: "テスト名を入力してください",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadSuccess(false)

    try {
      // CSVファイルを読み込む
      const text = await file.text()

      // CSVをパース
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            console.log("パース結果:", results.data)

            // カラム名のマッピング
            const mappedData = results.data.map((row: any) => {
              // 日本語カラム名を英語カラム名にマッピング
              const mappedRow: Record<string, any> = {}

              // 学生情報
              mappedRow.student_id = row["番号"] || row["学生ID"] || row["student_id"] || ""
              mappedRow.student_name = row["氏名"] || row["学生名"] || row["student_name"] || ""

              // テスト情報 - 入力されたテスト名と日付を使用
              mappedRow.test_name = testName
              mappedRow.test_date = testDate

              // 科目別スコア
              mappedRow.medical_overview = row["医療概論"] || row["medical_overview"] || 0
              mappedRow.public_health = row["衛生・公衆衛生学"] || row["public_health"] || 0
              mappedRow.related_laws = row["関係法規"] || row["related_laws"] || 0
              mappedRow.anatomy = row["解剖学"] || row["anatomy"] || 0
              mappedRow.physiology = row["生理学"] || row["physiology"] || 0
              mappedRow.pathology = row["病理学"] || row["pathology"] || 0
              mappedRow.clinical_medicine_overview = row["臨床医学総論"] || row["clinical_medicine_overview"] || 0
              mappedRow.clinical_medicine_detail = row["臨床医学各論"] || row["clinical_medicine_detail"] || 0
              mappedRow.rehabilitation = row["リハビリテーション医学"] || row["rehabilitation"] || 0
              mappedRow.oriental_medicine_overview = row["東洋医学概論"] || row["oriental_medicine_overview"] || 0
              mappedRow.meridian_points = row["経絡経穴概論"] || row["meridian_points"] || 0
              mappedRow.oriental_medicine_clinical = row["東洋医学臨床論"] || row["oriental_medicine_clinical"] || 0
              mappedRow.oriental_medicine_clinical_general =
                row["東洋医学臨床論（総合）"] || row["oriental_medicine_clinical_general"] || 0
              mappedRow.acupuncture_theory = row["はり理論"] || row["acupuncture_theory"] || 0
              mappedRow.moxibustion_theory = row["きゅう理論"] || row["moxibustion_theory"] || 0

              return mappedRow
            })

            console.log("マッピング後のデータ:", mappedData)

            // 学生IDが空のデータを除外
            const validData = mappedData.filter((row: any) => row.student_id)

            if (validData.length === 0) {
              throw new Error("有効なデータがありません。CSVファイルの形式を確認してください。")
            }

            // サーバーアクションを呼び出してデータをインポート
            const response = await importTestResults(validData)

            if (response.success) {
              setUploadSuccess(true)
              toast({
                title: "成功",
                description: `${response.count}件のテスト結果をインポートしました`,
                variant: "default",
              })

              // 成功コールバックを呼び出す
              if (onSuccess) onSuccess()
              if (onImportSuccess) onImportSuccess()
            } else {
              throw new Error(response.error || "インポートに失敗しました")
            }
          } catch (error) {
            console.error("インポートエラー:", error)
            toast({
              title: "エラー",
              description: error instanceof Error ? error.message : "インポートに失敗しました",
              variant: "destructive",
            })
          } finally {
            setIsUploading(false)
          }
        },
        error: (error) => {
          console.error("CSVパースエラー:", error)
          toast({
            title: "エラー",
            description: "CSVファイルの解析に失敗しました",
            variant: "destructive",
          })
          setIsUploading(false)
        },
      })
    } catch (error) {
      console.error("ファイル読み込みエラー:", error)
      toast({
        title: "エラー",
        description: "ファイルの読み込みに失敗しました",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CharacterIcon size={40} />
          <div>
            <CardTitle>テスト結果のインポート</CardTitle>
            <CardDescription>CSVファイルからテスト結果をインポートします</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="test-name">テスト名</Label>
            <Input
              id="test-name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="例: AMT模擬試験"
              className="mb-2"
            />

            <Label htmlFor="test-date">テスト実施日</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Input
                id="test-date"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="mb-4"
              />
            </div>

            <Label htmlFor="csv-file">CSVファイル</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4 animate-spin" />
                    インポート中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    インポート
                  </>
                )}
              </Button>
            </div>
          </div>

          {uploadSuccess && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
              <CheckCircle className="h-4 w-4" />
              <span>テスト結果のインポートが完了しました</span>
            </div>
          )}

          <div className="bg-amber-50 p-3 rounded border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">CSVファイルの形式</h4>
                <p className="text-sm text-amber-700 mt-1">
                  CSVファイルには以下の列が必要です：「番号」（学生ID）、「氏名」、「医療概論」、「衛生・公衆衛生学」、「関係法規」、「解剖学」、「生理学」、「病理学」、「臨床医学総論」、「臨床医学各論」、「リハビリテーション医学」、「東洋医学概論」、「経絡経穴概論」、「東洋医学臨床論」、「東洋医学臨床論（総合）」、「はり理論」、「きゅう理論」
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
