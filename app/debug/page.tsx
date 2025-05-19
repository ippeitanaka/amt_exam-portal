"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, Loader2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { checkDatabaseConnection, checkStudentsTable, testStudentLogin } from "@/app/actions/debug"
import { Header } from "@/components/header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [tableStatus, setTableStatus] = useState<any>(null)
  const [testStudentId, setTestStudentId] = useState("")
  const [testPassword, setTestPassword] = useState("")
  const [loginTestResult, setLoginTestResult] = useState<any>(null)
  const { toast } = useToast()

  const handleCheckDatabase = async () => {
    setIsLoading(true)
    try {
      const result = await checkDatabaseConnection()
      setDbStatus(result)

      toast({
        title: result.success ? "接続テスト成功" : "接続テスト失敗",
        description: result.success ? "データベースに接続できました" : result.error,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("接続テストエラー:", error)
      toast({
        title: "エラー",
        description: "接続テスト中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStudentsTable = async () => {
    setIsLoading(true)
    try {
      const result = await checkStudentsTable()
      setTableStatus(result)

      toast({
        title: result.success ? "テーブル確認成功" : "テーブル確認失敗",
        description: result.success ? "studentsテーブルを確認できました" : result.error,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("テーブル確認エラー:", error)
      toast({
        title: "エラー",
        description: "テーブル確認中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestLogin = async () => {
    setIsLoading(true)
    try {
      const studentIdNum = Number.parseInt(testStudentId, 10)

      if (isNaN(studentIdNum)) {
        throw new Error("有効な学生IDを入力してください（数字のみ）")
      }

      const result = await testStudentLogin(studentIdNum, testPassword)
      setLoginTestResult(result)

      toast({
        title: result.success ? "ログインテスト完了" : "ログインテスト失敗",
        description: result.success
          ? result.passwordMatch
            ? "ログイン成功！"
            : "学生IDは存在しますが、パスワードが一致しません"
          : result.error,
        variant: result.success && result.passwordMatch ? "default" : "destructive",
      })
    } catch (error) {
      console.error("ログインテストエラー:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ログインテスト中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brown-50 dark:bg-brown-950">
      <Header subtitle="デバッグページ" />
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              このページは開発者向けのデバッグページです。本番環境では無効化してください。
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <CardTitle className="text-brown-800 dark:text-brown-100">データベース接続テスト</CardTitle>
                <CardDescription className="text-brown-600 dark:text-brown-300">
                  Supabaseへの接続をテストします
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900 pt-4">
                <Button
                  onClick={handleCheckDatabase}
                  disabled={isLoading}
                  className="w-full bg-brown-600 hover:bg-brown-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      テスト中...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      接続テスト実行
                    </>
                  )}
                </Button>

                {dbStatus && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">テスト結果:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="mr-2">接続状態:</span>
                        {dbStatus.success ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> 成功
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <XCircle className="h-4 w-4 mr-1" /> 失敗
                          </span>
                        )}
                      </div>

                      {dbStatus.normalClient && (
                        <div>
                          <p className="font-medium">通常クライアント:</p>
                          <p className="text-sm">
                            {dbStatus.normalClient.error ? (
                              <span className="text-red-600">{dbStatus.normalClient.error}</span>
                            ) : (
                              <span className="text-green-600">接続成功</span>
                            )}
                          </p>
                        </div>
                      )}

                      {dbStatus.adminClient && (
                        <div>
                          <p className="font-medium">管理者クライアント:</p>
                          <p className="text-sm">
                            {dbStatus.adminClient.error ? (
                              <span className="text-red-600">{dbStatus.adminClient.error}</span>
                            ) : (
                              <span className="text-green-600">接続成功</span>
                            )}
                          </p>
                        </div>
                      )}

                      {dbStatus.tables && (
                        <div>
                          <p className="font-medium">テーブル一覧:</p>
                          {dbStatus.tablesError ? (
                            <p className="text-sm text-red-600">{dbStatus.tablesError}</p>
                          ) : (
                            <ul className="text-sm list-disc list-inside">
                              {dbStatus.tables.map((table: string, index: number) => (
                                <li key={index}>{table}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <CardTitle className="text-brown-800 dark:text-brown-100">studentsテーブル確認</CardTitle>
                <CardDescription className="text-brown-600 dark:text-brown-300">
                  studentsテーブルの構造とデータを確認します
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900 pt-4">
                <Button
                  onClick={handleCheckStudentsTable}
                  disabled={isLoading}
                  className="w-full bg-brown-600 hover:bg-brown-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      確認中...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      テーブル確認実行
                    </>
                  )}
                </Button>

                {tableStatus && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">確認結果:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="mr-2">テーブル状態:</span>
                        {tableStatus.success ? (
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> 確認成功
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <XCircle className="h-4 w-4 mr-1" /> 確認失敗
                          </span>
                        )}
                      </div>

                      {tableStatus.error && <p className="text-red-600">{tableStatus.error}</p>}

                      {tableStatus.structure && (
                        <div>
                          <p className="font-medium">テーブル構造:</p>
                          <ul className="text-sm list-disc list-inside">
                            {tableStatus.structure.map((column: string, index: number) => (
                              <li key={index}>{column}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {tableStatus.count !== undefined && (
                        <p>
                          <span className="font-medium">レコード数:</span> {tableStatus.count}
                        </p>
                      )}

                      {tableStatus.sampleData && tableStatus.sampleData.length > 0 && (
                        <div>
                          <p className="font-medium">サンプルデータ:</p>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {tableStatus.structure.map((column: string) => (
                                    <TableHead key={column}>{column}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tableStatus.sampleData.map((row: any, rowIndex: number) => (
                                  <TableRow key={rowIndex}>
                                    {tableStatus.structure.map((column: string) => (
                                      <TableCell key={column}>
                                        {column === "password" ? "********" : String(row[column] || "")}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-brown-200 dark:border-brown-800">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">学生ログインテスト</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                学生IDとパスワードでログインをテストします
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testStudentId">学生ID</Label>
                <Input
                  id="testStudentId"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={testStudentId}
                  onChange={(e) => setTestStudentId(e.target.value)}
                  placeholder="例: 299010"
                  className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testPassword">パスワード</Label>
                <Input
                  id="testPassword"
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="例: 9010"
                  className="border-brown-300 dark:border-brown-700 focus:ring-brown-500"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-white dark:bg-brown-900 rounded-b-lg">
              <Button
                onClick={handleTestLogin}
                disabled={isLoading}
                className="w-full bg-brown-600 hover:bg-brown-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    テスト中...
                  </>
                ) : (
                  "ログインテスト実行"
                )}
              </Button>
            </CardFooter>
          </Card>

          {loginTestResult && (
            <Card className="mt-4 border-brown-200 dark:border-brown-800">
              <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
                <CardTitle className="text-brown-800 dark:text-brown-100">ログインテスト結果</CardTitle>
              </CardHeader>
              <CardContent className="bg-white dark:bg-brown-900 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="mr-2">テスト結果:</span>
                    {loginTestResult.success ? (
                      loginTestResult.passwordMatch ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" /> ログイン成功
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" /> 学生IDは存在しますが、パスワードが一致しません
                        </span>
                      )
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> ログイン失敗
                      </span>
                    )}
                  </div>

                  {loginTestResult.error && <p className="text-red-600">{loginTestResult.error}</p>}

                  {loginTestResult.data && (
                    <div>
                      <p className="font-medium">学生情報:</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                        {JSON.stringify(loginTestResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
