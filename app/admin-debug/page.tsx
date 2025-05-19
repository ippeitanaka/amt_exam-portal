"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, Loader2, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { checkAdminTables, testAdminLogin } from "@/app/actions/admin-debug"
import { Header } from "@/components/header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminDebugPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [tableStatus, setTableStatus] = useState<any>(null)
  const [testUsername, setTestUsername] = useState("")
  const [testPassword, setTestPassword] = useState("")
  const [loginTestResult, setLoginTestResult] = useState<any>(null)
  const { toast } = useToast()

  const handleCheckTables = async () => {
    setIsLoading(true)
    try {
      const result = await checkAdminTables()
      setTableStatus(result)

      toast({
        title: result.success ? "テーブル確認成功" : "テーブル確認失敗",
        description: result.success ? "管理者テーブルを確認できました" : result.error,
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
      const result = await testAdminLogin(testUsername, testPassword)
      setLoginTestResult(result)

      toast({
        title: result.success ? "ログインテスト完了" : "ログインテスト失敗",
        description: result.success
          ? result.passwordMatch
            ? "ログイン成功！"
            : "ユーザー名は存在しますが、パスワードが一致しません"
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
      <Header subtitle="管理者デバッグページ" />
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              このページは開発者向けのデバッグページです。本番環境では無効化してください。
            </AlertDescription>
          </Alert>

          <Card className="border-brown-200 dark:border-brown-800 mb-6">
            <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
              <CardTitle className="text-brown-800 dark:text-brown-100">管理者テーブル確認</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                admin_usersとadminsテーブルの構造とデータを確認します
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 pt-4">
              <Button
                onClick={handleCheckTables}
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
                  <div className="space-y-4">
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

                    {/* admin_usersテーブル情報 */}
                    {tableStatus.adminUsers && (
                      <div className="border p-4 rounded-md">
                        <h4 className="font-medium mb-2">admin_usersテーブル:</h4>
                        {tableStatus.adminUsers.error ? (
                          <p className="text-red-600">{tableStatus.adminUsers.error}</p>
                        ) : (
                          <>
                            <p>レコード数: {tableStatus.adminUsers.count}</p>
                            {tableStatus.adminUsers.data && tableStatus.adminUsers.data.length > 0 && (
                              <div className="overflow-x-auto mt-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {Object.keys(tableStatus.adminUsers.data[0]).map((column) => (
                                        <TableHead key={column}>{column}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {tableStatus.adminUsers.data.map((row: any, rowIndex: number) => (
                                      <TableRow key={rowIndex}>
                                        {Object.keys(row).map((column) => (
                                          <TableCell key={column}>{String(row[column] || "")}</TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* adminsテーブル情報 */}
                    {tableStatus.admins && (
                      <div className="border p-4 rounded-md">
                        <h4 className="font-medium mb-2">adminsテーブル:</h4>
                        {tableStatus.admins.error ? (
                          <p className="text-red-600">{tableStatus.admins.error}</p>
                        ) : (
                          <>
                            <p>レコード数: {tableStatus.admins.count}</p>
                            {tableStatus.admins.data && tableStatus.admins.data.length > 0 && (
                              <div className="overflow-x-auto mt-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {Object.keys(tableStatus.admins.data[0]).map((column) => (
                                        <TableHead key={column}>{column}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {tableStatus.admins.data.map((row: any, rowIndex: number) => (
                                      <TableRow key={rowIndex}>
                                        {Object.keys(row).map((column) => (
                                          <TableCell key={column}>{String(row[column] || "")}</TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </>
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
              <CardTitle className="text-brown-800 dark:text-brown-100">管理者ログインテスト</CardTitle>
              <CardDescription className="text-brown-600 dark:text-brown-300">
                ユーザー名とパスワードでログインをテストします
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white dark:bg-brown-900 pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testUsername">ユーザー名</Label>
                <Input
                  id="testUsername"
                  type="text"
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                  placeholder="例: amt"
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
                  placeholder="例: TOYOamt01"
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
                          <AlertCircle className="h-4 w-4 mr-1" /> ユーザー名は存在しますが、パスワードが一致しません
                        </span>
                      )
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> ログイン失敗
                      </span>
                    )}
                  </div>

                  {loginTestResult.error && <p className="text-red-600">{loginTestResult.error}</p>}
                  {loginTestResult.message && <p className="text-green-600">{loginTestResult.message}</p>}

                  {loginTestResult.data && (
                    <div>
                      <p className="font-medium">ユーザー情報:</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                        {JSON.stringify(loginTestResult.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {loginTestResult.adminData && (
                    <div>
                      <p className="font-medium">管理者情報:</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm overflow-x-auto">
                        {JSON.stringify(loginTestResult.adminData, null, 2)}
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
