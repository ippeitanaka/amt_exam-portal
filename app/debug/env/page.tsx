"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { checkEnvironment } from "@/app/actions/debug"
import { Loader2 } from "lucide-react"

export default function EnvDebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, string> | null>(null)
  const [clientEnvVars, setClientEnvVars] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEnvVars() {
      try {
        setIsLoading(true)
        const result = await checkEnvironment()

        if (result.success) {
          setEnvVars(result.envVars)
        } else {
          setError("環境変数の取得に失敗しました")
        }

        // クライアント側の環境変数も確認
        setClientEnvVars({
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
      } finally {
        setIsLoading(false)
      }
    }

    loadEnvVars()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header subtitle="環境変数デバッグ" />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-gray-100 dark:bg-gray-800 rounded-t-lg">
              <CardTitle className="text-gray-800 dark:text-gray-100">環境変数ステータス</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                アプリケーションの環境変数設定状況
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-gray-800">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">{error}</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">サーバー側環境変数</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                      {envVars &&
                        Object.entries(envVars).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700"
                          >
                            <span className="font-mono text-sm">{key}</span>
                            <span
                              className={`font-medium ${value === "設定済み" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">クライアント側環境変数</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
                      {Object.entries(clientEnvVars).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700"
                        >
                          <span className="font-mono text-sm">{key}</span>
                          <span
                            className={`font-medium ${value === "設定済み" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded-md">
                    <p className="text-sm">
                      <strong>注意:</strong> NEXT_PUBLIC_で始まる環境変数のみがクライアント側で利用可能です。
                      サーバー側の環境変数（SUPABASE_SERVICE_ROLE_KEYなど）はクライアントからは見えません。
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => (window.location.href = "/debug")} className="mr-2">
              デバッグメニューに戻る
            </Button>
            <Button onClick={() => window.location.reload()}>再読み込み</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
