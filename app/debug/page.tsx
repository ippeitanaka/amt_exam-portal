"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { checkDatabase, checkEnvironment, testStudentLogin } from "@/app/actions/debug"
import { Header } from "@/components/header"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState("")
  const [studentId, setStudentId] = useState("222056")
  const [password, setPassword] = useState("2056")
  const [loginTestResults, setLoginTestResults] = useState<any>(null)
  const [loginTestLoading, setLoginTestLoading] = useState(false)
  const [loginTestError, setLoginTestError] = useState("")
  const [envVars, setEnvVars] = useState<any>(null)

  const handleDatabaseCheck = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await checkDatabase()
      setResults(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleLoginTest = async () => {
    setLoginTestLoading(true)
    setLoginTestError("")
    try {
      const result = await testStudentLogin(studentId, password)
      setLoginTestResults(result)
    } catch (err) {
      setLoginTestError(err instanceof Error ? err.message : "不明なエラーが発生しました")
    } finally {
      setLoginTestLoading(false)
    }
  }

  const handleCheckEnvironment = async () => {
    try {
      const result = await checkEnvironment()
      setEnvVars(result.envVars)
    } catch (err) {
      setError(err instanceof Error ? err.message : "環境変数確認に失敗しました")
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Header subtitle="システム診断" />
      <div className="grid gap-6 mb-6">
        <h1 className="text-2xl font-bold">システム診断ページ</h1>
        <p className="text-muted-foreground">
          システムの診断情報を確認します。データベース接続の問題やログインの問題を解決するのに役立ちます。
        </p>

        <Card>
          <CardHeader>
            <CardTitle>環境変数確認</CardTitle>
            <CardDescription>環境変数の設定状況を確認します</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button onClick={handleCheckEnvironment} disabled={loading}>
                環境変数を確認
              </Button>

              {envVars && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">環境変数の状態:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(envVars).map(([key, value]) => (
                      <li key={key}>
                        {key}: <span className={value === "設定済み" ? "text-green-600" : "text-red-600"}>{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>データベース接続確認</CardTitle>
            <CardDescription>データベースの接続状態とテーブルの存在を確認します</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button onClick={handleDatabaseCheck} disabled={loading}>
                {loading ? "確認中..." : "データベース接続を確認"}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {results && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">接続状態:</h3>
                    {results.success ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> 正常
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> 失敗
                      </span>
                    )}
                  </div>

                  {results.success && results.tableResults && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">テーブル状態:</h3>
                      {Object.entries(results.tableResults).map(([tableName, tableInfo]: [string, any]) => (
                        <div key={tableName} className="pl-4 border-l-2 border-gray-200">
                          <div className="flex items-center gap-2">
                            <h4>{tableName}:</h4>
                            {tableInfo.exists ? (
                              <span className="text-green-600 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" /> 存在する
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center">
                                <XCircle className="h-4 w-4 mr-1" /> 存在しない
                              </span>
                            )}
                          </div>

                          {tableInfo.exists && (
                            <div className="mt-2 pl-4">
                              <p>サンプル数: {tableInfo.sampleCount || 0}</p>
                              {tableInfo.columns && (
                                <div>
                                  <p>カラム:</p>
                                  <ul className="list-disc pl-5">
                                    {tableInfo.columns.map((column) => (
                                      <li key={column}>{column}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {tableInfo.error && (
                            <div className="mt-2 pl-4 text-red-600">
                              <p>エラー: {tableInfo.error}</p>
                              {tableInfo.details && (
                                <p>
                                  コード: {tableInfo.details.code}
                                  {tableInfo.details.hint && <>, ヒント: {tableInfo.details.hint}</>}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {results.authResults && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">テスト認証結果:</h3>
                      {results.authResults.map((result, index) => (
                        <div key={index} className="pl-4 border-l-2 border-gray-200">
                          <div className="flex items-center gap-2">
                            <h4>{result.method}:</h4>
                            {result.success ? (
                              <span className="text-green-600 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" /> 成功
                              </span>
                            ) : (
                              <span className="text-yellow-600 flex items-center">
                                <Info className="h-4 w-4 mr-1" /> 失敗
                              </span>
                            )}
                          </div>

                          {result.data && (
                            <div className="mt-1 pl-4">
                              <p>学生ID: {result.data.student_id}</p>
                              <p>名前: {result.data.name}</p>
                              <p>パスワード一致: {result.data.password_matches ? "一致" : "不一致"}</p>
                            </div>
                          )}

                          {result.error && (
                            <div className="mt-1 pl-4 text-red-600">
                              <p>エラー: {result.error}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {results.environment && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">環境変数:</h3>
                      <ul className="list-disc pl-5">
                        <li>
                          NEXT_PUBLIC_SUPABASE_URL:{" "}
                          {results.environment.url_set ? (
                            <span className="text-green-600">設定済み</span>
                          ) : (
                            <span className="text-red-600">未設定</span>
                          )}
                        </li>
                        <li>
                          NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
                          {results.environment.anon_key_set ? (
                            <span className="text-green-600">設定済み</span>
                          ) : (
                            <span className="text-red-600">未設定</span>
                          )}
                        </li>
                        <li>
                          SUPABASE_SERVICE_ROLE_KEY:{" "}
                          {results.environment.key_set ? (
                            <span className="text-green-600">設定済み</span>
                          ) : (
                            <span className="text-red-600">未設定</span>
                          )}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>学生ログインテスト</CardTitle>
            <CardDescription>特定の学生IDとパスワードでのログインをテストします</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="student-id">学生ID</Label>
                <Input
                  id="student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="例: 222056"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="例: 2056"
                />
              </div>
              <Button onClick={handleLoginTest} disabled={loginTestLoading}>
                {loginTestLoading ? "テスト中..." : "ログインをテスト"}
              </Button>

              {loginTestError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginTestError}</AlertDescription>
                </Alert>
              )}

              {loginTestResults && (
                <div className="mt-4 space-y-4">
                  {loginTestResults.recommendation && (
                    <Alert
                      variant={
                        loginTestResults.recommendation.includes("成功")
                          ? "default"
                          : loginTestResults.recommendation.includes("パスワード")
                            ? "warning"
                            : "destructive"
                      }
                    >
                      <AlertTitle>診断結果</AlertTitle>
                      <AlertDescription>{loginTestResults.recommendation}</AlertDescription>
                    </Alert>
                  )}

                  {loginTestResults.queryResults && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">テスト結果:</h3>
                      {loginTestResults.queryResults.map((result, index) => (
                        <div key={index} className="pl-4 border-l-2 border-gray-200">
                          <div className="flex items-center gap-2">
                            <h4>{result.method}:</h4>
                            {result.success ? (
                              <span className="text-green-600 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1" /> 成功
                              </span>
                            ) : (
                              <span className="text-yellow-600 flex items-center">
                                <Info className="h-4 w-4 mr-1" /> 失敗
                              </span>
                            )}
                          </div>

                          {result.data && (
                            <div className="mt-1 pl-4">
                              <p>学生ID: {result.data.student_id}</p>
                              <p>名前: {result.data.name}</p>
                              <p>
                                パスワード一致:{" "}
                                {result.data.password_matches ? (
                                  <span className="text-green-600">一致</span>
                                ) : (
                                  <span className="text-red-600">不一致</span>
                                )}
                              </p>
                            </div>
                          )}

                          {result.error && (
                            <div className="mt-1 pl-4 text-red-600">
                              <p>エラー: {result.error}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {loginTestResults.allData && loginTestResults.allData.sample && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">データベース内の学生データ:</h3>
                      <p>登録数: {loginTestResults.allData.count}件</p>
                      {loginTestResults.allData.sample.length > 0 && (
                        <div>
                          <p>サンプルデータ:</p>
                          <ul className="list-disc pl-5">
                            {loginTestResults.allData.sample.map((student, index) => (
                              <li key={index}>
                                ID: {student.student_id}, 名前: {student.name}, パスワード: {student.password}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>診断結果と解決策</CardTitle>
            <CardDescription>問題が特定された場合の解決策を提案します</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold">可能な問題と解決策:</h3>

              <div>
                <h4 className="font-medium">1. データベース接続の問題</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>環境変数が正しく設定されていることを確認してください</li>
                  <li>Supabaseプロジェクトが正常に動作していることを確認してください</li>
                  <li>ネットワーク接続に問題がないことを確認してください</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">2. テーブル構造の問題</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>必要なテーブルが存在することを確認してください</li>
                  <li>テーブルの構造（カラム名や型）が正しいことを確認してください</li>
                  <li>セットアップページで初期データベーススキーマを作成してください</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">3. 学生データの問題</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>学生データが正しくインポートされていることを確認してください</li>
                  <li>学生IDとパスワードの型が一致していることを確認してください（数値型vs文字列型）</li>
                  <li>CSVインポート時にデータ変換が正しく行われたことを確認してください</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium">問題が解決しない場合:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>「テストログイン」ボタンを使用して、一時的にアクセスできます</li>
                  <li>データベースのセットアップを再実行して、スキーマとデータを再作成してみてください</li>
                  <li>CSVファイルの形式を確認し、適切な形式でデータをインポートし直してください</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              戻る
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
