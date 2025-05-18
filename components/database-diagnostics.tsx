"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Database, Loader2, RefreshCw, Key, Globe, Search, Info, ExternalLink, Eye } from "lucide-react"
import { diagnoseStudentsTable, testApiKey, findAlternativeTables } from "@/app/actions/diagnose-db"
import { setStudentsTableName, checkEnvironmentVariables, resetApiKeyStatus } from "@/app/actions/students-actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function DatabaseDiagnostics() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [tableFixed, setTableFixed] = useState(false)
  const [envVars, setEnvVars] = useState<any>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState<any>(null)
  const [alternativeTables, setAlternativeTables] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(false)

  // プレビュー環境の検出
  useEffect(() => {
    const checkIfPreview = () => {
      const hostname = window.location.hostname
      const isV0Preview = hostname.includes("v0.dev") || hostname.includes("localhost")
      const isVercelPreview =
        window.location.hostname.includes("vercel.app") &&
        (window.location.hostname.includes("preview") || window.location.hostname.includes("pr"))

      console.log("環境検出 (診断ツール):", {
        hostname,
        isV0Preview,
        isVercelPreview,
      })

      return isV0Preview || isVercelPreview
    }

    const isPreview = checkIfPreview()
    setIsPreviewEnvironment(isPreview)

    if (isPreview) {
      console.log("プレビュー環境を検出しました。診断ツールの機能を制限します。")
      setActiveTab("help")
    }
  }, [])

  const checkEnvVariables = async () => {
    try {
      const vars = await checkEnvironmentVariables()
      setEnvVars(vars)
      setIsPreviewEnvironment(!!vars.isPreviewEnvironment)
      return vars
    } catch (err) {
      console.error("環境変数チェックエラー:", err)
      return null
    }
  }

  const testSupabaseApiKey = async () => {
    // プレビュー環境ではテストをスキップ
    if (isPreviewEnvironment) {
      setApiKeyStatus({
        success: false,
        message: "プレビュー環境ではAPIキーをテストできません",
        isPreviewEnvironment: true,
      })
      return null
    }

    try {
      setApiKeyStatus({ testing: true })
      const result = await testApiKey()
      setApiKeyStatus(result)

      // プレビュー環境の場合
      if (result.isPreviewEnvironment) {
        setIsPreviewEnvironment(true)
        return result
      }

      // APIキーが無効な場合は警告を表示
      if (!result.success && result.isAuthError) {
        setError("APIキーが無効です。診断結果を確認してください。")
      }

      return result
    } catch (err) {
      console.error("APIキーテストエラー:", err)
      setApiKeyStatus({
        success: false,
        message: err instanceof Error ? err.message : "APIキーのテスト中にエラーが発生しました",
      })
      return null
    }
  }

  const searchAlternativeTables = async () => {
    // プレビュー環境では検索をスキップ
    if (isPreviewEnvironment) {
      setAlternativeTables({
        success: false,
        message: "プレビュー環境ではテーブル検索を実行できません",
        isPreviewEnvironment: true,
        tables: [],
      })
      return null
    }

    try {
      setAlternativeTables({ searching: true })
      const result = await findAlternativeTables()
      setAlternativeTables(result)
      return result
    } catch (err) {
      console.error("テーブル検索エラー:", err)
      setAlternativeTables({
        success: false,
        message: err instanceof Error ? err.message : "テーブル検索中にエラーが発生しました",
      })
      return null
    }
  }

  const runDiagnostics = async () => {
    // プレビュー環境では診断をスキップ
    if (isPreviewEnvironment) {
      setError("プレビュー環境では診断を実行できません")
      return
    }

    try {
      setIsRunning(true)
      setError(null)
      setTableFixed(false)
      setApiKeyStatus(null)

      // 環境変数をチェック
      const vars = await checkEnvVariables()

      // プレビュー環境の場合
      if (vars.isPreviewEnvironment) {
        setIsPreviewEnvironment(true)
        setError("プレビュー環境では診断を実行できません")
        return
      }

      // 環境変数が設定されていない場合は診断を中止
      if (!vars.isSupabaseConfigured) {
        setError("Supabase環境変数が設定されていないため、診断を実行できません。")
        return
      }

      // APIキーをテスト
      const keyTest = await testSupabaseApiKey()

      // APIキーが無効な場合は診断を中止
      if (!keyTest || (!keyTest.success && keyTest.isAuthError)) {
        setError("APIキーが無効なため、診断を実行できません。")
        setActiveTab("api-key") // APIキータブに自動的に切り替え
        return
      }

      const diagnosticResult = await diagnoseStudentsTable()
      setResult(diagnosticResult)

      if (diagnosticResult.correctTableName && diagnosticResult.correctTableName !== "students") {
        // 正しいテーブル名を設定
        await setStudentsTableName(diagnosticResult.correctTableName)
        setTableFixed(true)
      }

      // 代替テーブルを検索
      await searchAlternativeTables()
    } catch (err) {
      console.error("診断実行エラー:", err)
      setError(err instanceof Error ? err.message : "診断の実行中にエラーが発生しました")
    } finally {
      setIsRunning(false)
    }
  }

  const resetAndRetry = async () => {
    // プレビュー環境ではリセットをスキップ
    if (isPreviewEnvironment) {
      setError("プレビュー環境ではリセットを実行できません")
      return
    }

    try {
      setIsRunning(true)
      setError(null)
      setResult(null)
      setTableFixed(false)
      setApiKeyStatus(null)
      setAlternativeTables(null)

      // APIキーの状態をリセット
      await resetApiKeyStatus()

      // 環境変数を再チェック
      await checkEnvVariables()

      // APIキーを再テスト
      await testSupabaseApiKey()
    } catch (err) {
      console.error("リセットエラー:", err)
    } finally {
      setIsRunning(false)
    }
  }

  // コンポーネントマウント時に環境変数をチェック
  useEffect(() => {
    checkEnvVariables().then((vars) => {
      // プレビュー環境の場合
      if (vars && vars.isPreviewEnvironment) {
        setIsPreviewEnvironment(true)
        setActiveTab("help")
        return
      }

      // APIキーエラーがある場合は自動的にAPIキータブを表示
      if (vars && !vars.isApiKeyValid) {
        setActiveTab("api-key")
        // APIキーのテストも自動的に実行
        testSupabaseApiKey()
      }
    })
  }, [])

  return (
    <Card className="border-brown-200 dark:border-brown-800">
      <CardHeader className="bg-brown-100 dark:bg-brown-900 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-brown-700 dark:text-brown-200" />
          <div>
            <CardTitle className="text-brown-800 dark:text-brown-100">データベース診断</CardTitle>
            <CardDescription className="text-brown-600 dark:text-brown-300">
              Supabaseとの接続とstudentsテーブルの状態を診断します
              {isPreviewEnvironment && <span className="ml-2 text-blue-600">（プレビュー環境）</span>}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 bg-white dark:bg-brown-900">
        {isPreviewEnvironment && (
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800">
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">プレビュー環境</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              現在、プレビュー環境で実行されているため、診断機能は制限されています。
              実際のデプロイ環境では、すべての診断機能が利用可能になります。
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">一般診断</TabsTrigger>
            <TabsTrigger value="api-key">APIキー</TabsTrigger>
            <TabsTrigger value="tables">テーブル</TabsTrigger>
            <TabsTrigger value="help">ヘルプ</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            {/* 環境変数の状態 */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 text-brown-700 dark:text-brown-200">環境変数の状態:</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-brown-600" />
                  <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL:</span>
                  {envVars ? (
                    <Badge variant={envVars.supabaseUrl.defined ? "default" : "destructive"}>
                      {envVars.supabaseUrl.defined ? "設定済み" : "未設定"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">確認中...</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-brown-600" />
                  <span className="text-sm">SUPABASE_SERVICE_ROLE_KEY:</span>
                  {envVars ? (
                    <Badge variant={envVars.supabaseServiceRoleKey.defined ? "default" : "destructive"}>
                      {envVars.supabaseServiceRoleKey.defined ? "設定済み" : "未設定"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">確認中...</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 環境情報 */}
            {envVars && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 text-brown-700 dark:text-brown-200">環境情報:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">環境:</span>
                    <Badge variant="outline">
                      {envVars.isPreviewEnvironment ? "プレビュー" : envVars.environment || "不明"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">モード:</span>
                    <Badge variant={envVars.isPreviewEnvironment ? "secondary" : "default"}>
                      {envVars.isPreviewEnvironment ? "プレビュー" : "本番"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* APIキーのステータス */}
            {apiKeyStatus && (
              <Alert
                variant={apiKeyStatus.success ? "default" : "destructive"}
                className={
                  apiKeyStatus.success
                    ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800"
                }
              >
                <AlertDescription>
                  <div className="font-medium">{apiKeyStatus.message}</div>
                  {apiKeyStatus.error && (
                    <div className="mt-2 text-sm">{JSON.stringify(apiKeyStatus.error, null, 2)}</div>
                  )}
                  {!apiKeyStatus.success && !apiKeyStatus.isPreviewEnvironment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("api-key")}
                      className="mt-2 bg-red-100 text-red-800 border-red-300 hover:bg-red-200"
                    >
                      APIキーの問題を解決
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert
                variant={result.success ? "default" : "destructive"}
                className={
                  result.success
                    ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-800"
                }
              >
                <AlertDescription>
                  <div className="font-medium">{result.message}</div>
                  {result.error && <div className="mt-2 text-sm">{JSON.stringify(result.error, null, 2)}</div>}
                </AlertDescription>
              </Alert>
            )}

            {tableFixed && (
              <Alert className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800">
                <AlertDescription>
                  テーブル名を「{result?.correctTableName}
                  」に設定しました。ページを再読み込みして変更を適用してください。
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="api-key">
            <div className="space-y-4">
              {isPreviewEnvironment ? (
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">プレビュー環境</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    プレビュー環境では、APIキーのテストは実行できません。
                    実際のデプロイ環境では、この機能が利用可能になります。
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">APIキーエラー</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      <p>現在、APIキーが無効であるため、Supabaseとの接続ができません。以下の解決策を試してください。</p>
                    </AlertDescription>
                  </Alert>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-brown-700 dark:text-brown-200">
                        APIキーの問題とは？
                      </AccordionTrigger>
                      <AccordionContent className="text-brown-600 dark:text-brown-300">
                        <p>
                          「Invalid API
                          key」エラーは、Supabaseに接続するために使用しているAPIキー（SUPABASE_SERVICE_ROLE_KEY）が無効であることを示しています。
                          これは以下の理由で発生する可能性があります：
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>APIキーが間違っている</li>
                          <li>APIキーの形式が正しくない</li>
                          <li>APIキーが期限切れまたは無効化されている</li>
                          <li>anon/publicキーを使用している（service_roleキーが必要）</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-brown-700 dark:text-brown-200">解決方法</AccordionTrigger>
                      <AccordionContent className="text-brown-600 dark:text-brown-300">
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Supabaseダッシュボードで正しいキーを確認：</strong>
                            <p>
                              Supabaseプロジェクトダッシュボードの「Project Settings」→「API」セクションに移動し、
                              <strong>service_role secret</strong>（または<strong>service_role key</strong>
                              ）をコピーします。
                            </p>
                          </li>
                          <li>
                            <strong>環境変数を更新：</strong>
                            <p>
                              Vercelダッシュボードの「Settings」→「Environment Variables」で、
                              <code>SUPABASE_SERVICE_ROLE_KEY</code>の値を更新します。
                            </p>
                          </li>
                          <li>
                            <strong>プロジェクトを再デプロイ：</strong>
                            <p>環境変数を更新した後、プロジェクトを再デプロイして変更を適用します。</p>
                          </li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-brown-700 dark:text-brown-200">一時的な対処法</AccordionTrigger>
                      <AccordionContent className="text-brown-600 dark:text-brown-300">
                        <p>
                          APIキーの問題が解決するまで、アプリケーションはオフラインモードで動作します。
                          この間は以下の機能が制限されます：
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>サーバーからの学生データの取得ができません</li>
                          <li>サンプルデータまたはローカルに保存されたデータのみが表示されます</li>
                          <li>データの変更はローカルにのみ保存され、サーバーには反映されません</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tables">
            <div className="space-y-4">
              {alternativeTables && alternativeTables.tables && alternativeTables.tables.length > 0 ? (
                <>
                  <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
                    <AlertDescription>
                      <div className="font-medium">
                        「students」テーブルが見つかりませんでした。代替テーブルが見つかりました。
                      </div>
                      <div className="mt-2 text-sm">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>テーブル名</TableHead>
                              <TableHead>カラム数</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {alternativeTables.tables.map((table: any) => (
                              <TableRow key={table.name}>
                                <TableCell>{table.name}</TableCell>
                                <TableCell>{table.columnCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <>
                  {alternativeTables && alternativeTables.searching ? (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800">
                      <AlertDescription>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        代替テーブルを検索中...
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:text-red-100 dark:border-red-800">
                      <AlertDescription>
                        <Info className="mr-2 h-4 w-4" />
                        「students」テーブルが見つかりませんでした。
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="help">
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800">
                <AlertTitle>データベース診断ツールについて</AlertTitle>
                <AlertDescription>
                  このツールは、Supabaseデータベースとの接続と、必要なテーブル（studentsテーブル）の状態を診断します。
                  環境変数の設定、APIキーの有効性、テーブルの存在などをチェックし、問題があれば解決策を提案します。
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-brown-700 dark:text-brown-200">環境変数の設定</AccordionTrigger>
                  <AccordionContent className="text-brown-600 dark:text-brown-300">
                    <p>Supabaseとの接続には、以下の環境変数が必要です：</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>
                        <code>NEXT_PUBLIC_SUPABASE_URL</code>: SupabaseプロジェクトのURL
                      </li>
                      <li>
                        <code>SUPABASE_SERVICE_ROLE_KEY</code>: Supabaseプロジェクトのservice_roleキー
                      </li>
                    </ul>
                    <p>これらの変数は、Vercelダッシュボードの「Settings」→「Environment Variables」で設定できます。</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-brown-700 dark:text-brown-200">APIキーの確認</AccordionTrigger>
                  <AccordionContent className="text-brown-600 dark:text-brown-300">
                    <p>
                      APIキー（<code>SUPABASE_SERVICE_ROLE_KEY</code>）が有効であることを確認してください。
                      無効なAPIキーは、データベースへの接続を妨げます。
                    </p>
                    <p>
                      Supabaseプロジェクトダッシュボードの「Project
                      Settings」→「API」セクションで、正しいキーを確認できます。
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-brown-700 dark:text-brown-200">テーブルの確認</AccordionTrigger>
                  <AccordionContent className="text-brown-600 dark:text-brown-300">
                    <p>
                      必要なテーブル（<code>students</code>テーブル）がデータベースに存在することを確認してください。
                      テーブルが存在しない場合、アプリケーションは正常に動作しません。
                    </p>
                    <p>Supabaseダッシュボードの「Table Editor」で、テーブルの存在を確認できます。</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-brown-700 dark:text-brown-200">
                    プレビュー環境での制限
                  </AccordionTrigger>
                  <AccordionContent className="text-brown-600 dark:text-brown-300">
                    <p>
                      プレビュー環境では、診断機能が制限されている場合があります。
                      これは、プレビュー環境が本番環境とは異なる設定を持っている可能性があるためです。
                    </p>
                    <p>実際のデプロイ環境では、すべての診断機能が利用可能になります。</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Alert className="bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800">
                <AlertTitle>サポート</AlertTitle>
                <AlertDescription>
                  問題が解決しない場合は、
                  <a
                    href="https://github.com/your-repo/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    GitHubリポジトリ
                    <ExternalLink className="inline-block ml-1 h-4 w-4" />
                  </a>
                  で問題を報告してください。
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-brown-100 dark:bg-brown-900 rounded-b-lg">
        <Button
          variant="outline"
          onClick={runDiagnostics}
          disabled={isRunning || isPreviewEnvironment}
          className="bg-brown-200 text-brown-800 hover:bg-brown-300 dark:bg-brown-700 dark:text-brown-200 dark:hover:bg-brown-600"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              診断中...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              診断を実行
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={resetAndRetry}
          disabled={isRunning || isPreviewEnvironment}
          className="bg-brown-200 text-brown-800 hover:bg-brown-300 dark:bg-brown-700 dark:text-brown-200 dark:hover:bg-brown-600"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          リセットして再試行
        </Button>
      </CardFooter>
    </Card>
  )
}
