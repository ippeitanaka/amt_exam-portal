"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { testStudentLogin } from "@/app/actions/debug"

export default function LoginDebugPage() {
  const [studentId, setStudentId] = useState("222056")
  const [password, setPassword] = useState("2056")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTest = async () => {
    setIsLoading(true)
    try {
      const testResult = await testStudentLogin(studentId, password)
      setResult(testResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "エラーが発生しました",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header subtitle="ログインデバッグ" />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-gray-100 dark:bg-gray-800 rounded-t-lg">
              <CardTitle className="text-gray-800 dark:text-gray-100">学生ログインテスト</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                特定の学生IDとパスワードの組み合わせをテストします
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 bg-white dark:bg-gray-800">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="studentId" className="text-gray-700 dark:text-gray-200">
                    学生ID
                  </Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">
                    パスワード
                  </Label>
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-white dark:bg-gray-800 rounded-b-lg">
              <Button onClick={handleTest} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    テスト中...
                  </>
                ) : (
                  "ログインをテスト"
                )}
              </Button>
            </CardFooter>
          </Card>

          {result && (
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                <CardTitle className="text-gray-800 dark:text-gray-100">テスト結果</CardTitle>
              </CardHeader>
              <CardContent className="bg-white dark:bg-gray-800 max-h-[500px] overflow-y-auto">
                {result.recommendation && (
                  <div className="p-3 mb-4 rounded bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-medium">
                    {result.recommendation}
                  </div>
                )}
                <pre className="text-xs p-4 rounded bg-gray-50 dark:bg-gray-900 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
