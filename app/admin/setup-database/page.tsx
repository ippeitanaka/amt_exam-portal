"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, Loader2, CheckCircle, XCircle, ChevronLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/header"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Textarea } from "@/components/ui/textarea"

export default function SetupDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sqlResult, setSqlResult] = useState<any>(null)
  const [sqlQuery, setSqlQuery] = useState<string>(`
-- 既存のtest_scoresテーブルを削除（存在する場合）
DROP TABLE IF EXISTS test_scores;

-- 新しいtest_scoresテーブルを作成
CREATE TABLE test_scores (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  test_name TEXT NOT NULL DEFAULT '模擬試験',
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- 基礎医学系
  medical_overview NUMERIC, -- 医療概論
  public_health NUMERIC, -- 衛生・公衆衛生学
  related_laws NUMERIC, -- 関係法規
  anatomy NUMERIC, -- 解剖学
  physiology NUMERIC, -- 生理学
  pathology NUMERIC, -- 病理学
  
  -- 臨床医学系
  clinical_medicine_overview NUMERIC, -- 臨床医学総論
  clinical_medicine_detail NUMERIC, -- 臨床医学各論
  rehabilitation NUMERIC, -- リハビリテーション医学
  
  -- 東洋医学系
  oriental_medicine_overview NUMERIC, -- 東洋医学概論
  meridian_points NUMERIC, -- 経絡経穴概論
  oriental_medicine_clinical NUMERIC, -- 東洋医学臨床論
  oriental_medicine_clinical_general NUMERIC, -- 東洋医学臨床論（総合）
  
  -- 専門系
  acupuncture_theory NUMERIC, -- はり理論
  moxibustion_theory NUMERIC, -- きゅう理論
  
  -- 合計点（自動計算用）
  total_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(medical_overview, 0) +
    COALESCE(public_health, 0) +
    COALESCE(related_laws, 0) +
    COALESCE(anatomy, 0) +
    COALESCE(physiology, 0) +
    COALESCE(pathology, 0) +
    COALESCE(clinical_medicine_overview, 0) +
    COALESCE(clinical_medicine_detail, 0) +
    COALESCE(rehabilitation, 0) +
    COALESCE(oriental_medicine_overview, 0) +
    COALESCE(meridian_points, 0) +
    COALESCE(oriental_medicine_clinical, 0) +
    COALESCE(oriental_medicine_clinical_general, 0) +
    COALESCE(acupuncture_theory, 0) +
    COALESCE(moxibustion_theory, 0)
  ) STORED,
  
  -- 基礎医学系合計
  basic_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(medical_overview, 0) +
    COALESCE(public_health, 0) +
    COALESCE(related_laws, 0) +
    COALESCE(anatomy, 0) +
    COALESCE(physiology, 0) +
    COALESCE(pathology, 0)
  ) STORED,
  
  -- 臨床医学系合計
  clinical_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(clinical_medicine_overview, 0) +
    COALESCE(clinical_medicine_detail, 0) +
    COALESCE(rehabilitation, 0)
  ) STORED,
  
  -- 東洋医学系合計
  oriental_medicine_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(oriental_medicine_overview, 0) +
    COALESCE(meridian_points, 0) +
    COALESCE(oriental_medicine_clinical, 0) +
    COALESCE(oriental_medicine_clinical_general, 0)
  ) STORED,
  
  -- 専門系合計
  specialized_score NUMERIC GENERATED ALWAYS AS (
    COALESCE(acupuncture_theory, 0) +
    COALESCE(moxibustion_theory, 0)
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE INDEX idx_test_scores_student_id ON test_scores(student_id);
CREATE INDEX idx_test_scores_test_date ON test_scores(test_date);
  `)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleExecuteSQL = async () => {
    setIsLoading(true)
    setSqlResult(null)

    try {
      console.log("SQLクエリを実行します")

      // SQLクエリを実行
      const { data, error } = await supabase.rpc("exec_sql", { sql_query: sqlQuery })

      if (error) {
        console.error("SQLクエリ実行エラー:", error)
        setSqlResult({
          success: false,
          error: error.message,
        })
        toast({
          title: "SQLクエリ実行エラー",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log("SQLクエリ実行成功:", data)
        setSqlResult({
          success: true,
          data,
        })
        toast({
          title: "SQLクエリ実行成功",
          description: "データベースが正常に設定されました",
        })
      }
    } catch (error) {
      console.error("SQLクエリ実行エラー:", error)
      setSqlResult({
        success: false,
        error: error instanceof Error ? error.message : "SQLクエリの実行に失敗しました",
      })
      toast({
        title: "エラー",
        description: "SQLクエリの実行に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="データベース設定" />
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/dashboard" className="flex items-center">
                <ChevronLeft className="mr-1 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>
          </div>

          <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              このページでは、データベースのテーブル構造を設定します。実行前に内容を確認してください。
            </AlertDescription>
          </Alert>

          <Card className="border-brown-200 dark:border-brown-800 mb-6">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">SQLクエリ実行</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                以下のSQLクエリを実行してテーブル構造を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 pt-4 space-y-4">
              <Textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="font-mono text-sm h-96 border-brown-300 dark:border-brown-700"
              />

              <Button
                onClick={handleExecuteSQL}
                disabled={isLoading}
                className="w-full bg-brown-600 hover:bg-brown-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    実行中...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    SQLクエリを実行
                  </>
                )}
              </Button>

              {sqlResult && (
                <div className="mt-4 p-4 border rounded-md">
                  <div className="flex items-center mb-2">
                    <span className="mr-2">実行結果:</span>
                    {sqlResult.success ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> 成功
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> 失敗
                      </span>
                    )}
                  </div>

                  {sqlResult.error && <p className="text-red-600">{sqlResult.error}</p>}
                  {sqlResult.data && (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                      {JSON.stringify(sqlResult.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">次のステップ</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                テーブル構造の設定後に行うこと
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 pt-4">
              <ol className="list-decimal list-inside space-y-2">
                <li>「テスト結果インポート」ページでCSVファイルをインポートします</li>
                <li>インポートされたデータが正しく表示されることを確認します</li>
                <li>学生ログインで自分のテスト結果が閲覧できることを確認します</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
