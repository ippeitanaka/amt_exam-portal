"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, AlertCircle, Database, Plus } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { debugStudentData, addTestDataForStudent } from "@/app/actions/debug-student-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudentDebugPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [debugData, setDebugData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAddingData, setIsAddingData] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await debugStudentData(params.id)
      setDebugData(data)
      if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "デバッグデータの取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTestData = async () => {
    setIsAddingData(true)
    try {
      const result = await addTestDataForStudent(params.id)
      if (result.success) {
        toast({
          title: "テストデータを追加しました",
          description: "ページを更新して、新しいデータを確認してください。",
        })
        fetchDebugData()
      } else {
        toast({
          title: "エラー",
          description: result.error || "テストデータの追加に失敗しました",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "テストデータの追加に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsAddingData(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Database className="h-16 w-16 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-500">データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button onClick={fetchDebugData} variant="outline" size="sm">
              データを更新
            </Button>
            <Button onClick={handleAddTestData} disabled={isAddingData} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              テストデータを追加
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>学生ID: {params.id} のデバッグ情報</CardTitle>
            <CardDescription>データベース内の学生情報とテスト結果の詳細</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            <Tabs defaultValue="student">
              <TabsList className="mb-4">
                <TabsTrigger value="student">学生情報</TabsTrigger>
                <TabsTrigger value="tests">テスト結果</TabsTrigger>
                <TabsTrigger value="schema">テーブル構造</TabsTrigger>
                <TabsTrigger value="all-data">全データサンプル</TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <Card>
                  <CardHeader>
                    <CardTitle>学生情報</CardTitle>
                    <CardDescription>studentsテーブルのデータ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debugData?.studentError ? (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-800">{debugData.studentError}</p>
                      </div>
                    ) : debugData?.studentData && debugData.studentData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(debugData.studentData[0]).map((key) => (
                              <TableHead key={key}>{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {debugData.studentData.map((student: any, index: number) => (
                            <TableRow key={index}>
                              {Object.values(student).map((value: any, i: number) => (
                                <TableCell key={i}>
                                  {value !== null ? String(value) : <span className="text-gray-400">null</span>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">学生情報が見つかりませんでした</p>
                        <p className="text-sm text-gray-400 mt-2">
                          学生ID: {params.id} (数値変換: {debugData?.studentIdNum})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tests">
                <Card>
                  <CardHeader>
                    <CardTitle>テスト結果</CardTitle>
                    <CardDescription>test_scoresテーブルのデータ</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debugData?.testScoresError ? (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-800">{debugData.testScoresError}</p>
                      </div>
                    ) : debugData?.testScoresData && debugData.testScoresData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {Object.keys(debugData.testScoresData[0])
                                .filter((key) => !key.includes("created_at") && !key.includes("id"))
                                .map((key) => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {debugData.testScoresData.map((score: any, index: number) => (
                              <TableRow key={index}>
                                {Object.entries(score)
                                  .filter(([key]) => !key.includes("created_at") && !key.includes("id"))
                                  .map(([key, value]: [string, any], i: number) => (
                                    <TableCell key={i}>
                                      {value !== null ? String(value) : <span className="text-gray-400">null</span>}
                                    </TableCell>
                                  ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">テスト結果が見つかりませんでした</p>
                        <p className="text-sm text-gray-400 mt-2">
                          学生ID: {params.id} (数値変換: {debugData?.studentIdNum})
                        </p>
                        <Button onClick={handleAddTestData} className="mt-4" disabled={isAddingData}>
                          <Plus className="mr-1 h-4 w-4" />
                          テストデータを追加
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>studentsテーブル構造</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {debugData?.studentsColumnsError ? (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <p className="text-red-800">{debugData.studentsColumnsError}</p>
                        </div>
                      ) : debugData?.studentsColumns && debugData.studentsColumns.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>カラム名</TableHead>
                              <TableHead>データ型</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {debugData.studentsColumns.map((column: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{column.column_name}</TableCell>
                                <TableCell>{column.data_type}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">テーブル構造情報が取得できませんでした</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>test_scoresテーブル構造</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {debugData?.testScoresColumnsError ? (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <p className="text-red-800">{debugData.testScoresColumnsError}</p>
                        </div>
                      ) : debugData?.testScoresColumns && debugData.testScoresColumns.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>カラム名</TableHead>
                              <TableHead>データ型</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {debugData.testScoresColumns.map((column: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{column.column_name}</TableCell>
                                <TableCell>{column.data_type}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">テーブル構造情報が取得できませんでした</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="all-data">
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>最新の学生データ（最大10件）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {debugData?.allStudentsError ? (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <p className="text-red-800">{debugData.allStudentsError}</p>
                        </div>
                      ) : debugData?.allStudents && debugData.allStudents.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {Object.keys(debugData.allStudents[0]).map((key) => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {debugData.allStudents.map((student: any, index: number) => (
                                <TableRow key={index}>
                                  {Object.values(student).map((value: any, i: number) => (
                                    <TableCell key={i}>
                                      {value !== null ? String(value) : <span className="text-gray-400">null</span>}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">学生データが見つかりませんでした</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>最新のテスト結果（最大10件）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {debugData?.allTestScoresError ? (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <p className="text-red-800">{debugData.allTestScoresError}</p>
                        </div>
                      ) : debugData?.allTestScores && debugData.allTestScores.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {["id", "student_id", "test_name", "test_date"].map((key) => (
                                  <TableHead key={key}>{key}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {debugData.allTestScores.map((score: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{score.id}</TableCell>
                                  <TableCell>
                                    <strong>{score.student_id}</strong> (型: {typeof score.student_id})
                                  </TableCell>
                                  <TableCell>{score.test_name}</TableCell>
                                  <TableCell>{score.test_date}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">テスト結果が見つかりませんでした</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
