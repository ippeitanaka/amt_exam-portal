"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2, Info } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentCount, setStudentCount] = useState(0)
  const [configError, setConfigError] = useState(false)

  // Check if Supabase environment variables are set
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setConfigError(true)
    }
  }, [])

  const importStudents = async () => {
    if (configError) {
      setError("Supabase環境変数が設定されていません。先に環境変数を設定してください。")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/import-csv")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "インポートに失敗しました")
      }

      setSuccess(true)
      setStudentCount(data.students?.length || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>セットアップ</CardTitle>
          <CardDescription>救急救命士学科の国家試験模擬試験システムのセットアップを行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>環境変数エラー</AlertTitle>
              <AlertDescription>
                <p>Supabase環境変数が設定されていません。以下の環境変数を設定してください：</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
                <p className="mt-2">
                  これらの値はSupabaseダッシュボードの「Project Settings」→「API」から取得できます。
                </p>
              </AlertDescription>
            </Alert>
          )}

          {!configError && success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>インポート成功</AlertTitle>
              <AlertDescription>
                {studentCount}人の学生データをインポートしました。システムの準備が整いました。
              </AlertDescription>
            </Alert>
          )}

          {!configError && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!configError && !success && !error && (
            <p>CSVファイルから学生データをインポートします。このプロセスは一度だけ実行する必要があります。</p>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>データベース設定</AlertTitle>
            <AlertDescription>
              <p>Supabaseで以下のテーブルを作成してください：</p>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
                {`-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test_scores table
CREATE TABLE test_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL REFERENCES students(student_id),
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_test_scores_student_id ON test_scores(student_id);`}
              </pre>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={importStudents} disabled={loading || success || configError} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                インポート中...
              </>
            ) : success ? (
              "インポート完了"
            ) : (
              "学生データをインポート"
            )}
          </Button>

          {success && (
            <div className="flex w-full space-x-2 pt-2">
              <Button asChild variant="outline" className="w-1/2">
                <Link href="/">ログインページ</Link>
              </Button>
              <Button asChild className="w-1/2">
                <Link href="/admin">管理者ページ</Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
