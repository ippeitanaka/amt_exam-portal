"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { CharacterLoading } from "@/components/character-loading"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, AlertCircle, Database, Bug } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getStudentTestResults } from "@/app/actions/test-scores"

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [testResults, setTestResults] = useState<any[]>([])
  const [filteredResults, setFilteredResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const testParam = searchParams.get("test")

  useEffect(() => {
    // ローカルストレージから学生情報を取得
    const storedStudentId = localStorage.getItem("studentId")
    const storedStudentName = localStorage.getItem("studentName")

    if (!storedStudentId) {
      router.push("/login")
      return
    }

    setStudentId(storedStudentId)
    setStudentName(storedStudentName || "")

    fetchTestResults(storedStudentId)
  }, [router])

  useEffect(() => {
    if (testResults.length > 0 && testParam) {
      // テスト名でフィルタリング
      const filtered = testResults.filter((result) => result.test_name === testParam)
      setFilteredResults(filtered)
    } else {
      setFilteredResults(testResults)
    }
  }, [testResults, testParam])

  const fetchTestResults = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log(`学生ID: ${id} のテスト結果を取得します`)

      // サーバーアクションを使用してテスト結果を取得
      const result = await getStudentTestResults(id)

      if (!result.success) {
        console.error("テスト結果取得エラー:", result.error)
        setError(result.error || "テスト結果の取得に失敗しました")
        setTestResults([])

        // デバッグ情報を取得
        try {
          const debugResponse = await fetch(`/api/debug-query?studentId=${encodeURIComponent(id)}`)
          if (debugResponse.ok) {
            const debugData = await debugResponse.json()
            setDebugInfo(debugData)
            console.log("デバッグ情報:", debugData)

            // デバッグクエリで結果が見つかった場合
            if (debugData.success && debugData.results && debugData.results.length > 0) {
              setTestResults(debugData.results)
              setError(
                `サーバーアクションでは結果が見つかりませんでしたが、デバッグクエリで ${debugData.results.length} 件の結果が見つかりました。`,
              )
              return
            }
          }
        } catch (debugError) {
          console.error("デバッグ情報取得エラー:", debugError)
        }

        return
      }

      if (result.data.length === 0) {
        console.log("テスト結果が見つかりませんでした")
        setError("テスト結果が見つかりませんでした")
        setTestResults([])
        return
      }

      console.log(`取得した成績データ: ${result.data.length}件`)
      setTestResults(result.data)
    } catch (error) {
      console.error("データ取得エラー:", error)
      setError(error instanceof Error ? error.message : "テスト結果の取得に失敗しました")
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const runDebugQuery = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/debug-query?studentId=${encodeURIComponent(studentId)}`)
      const data = await response.json()
      setDebugInfo(data)

      if (data.success && data.results && data.results.length > 0) {
        setTestResults(data.results)
        setError(`デバッグクエリで ${data.results.length} 件の結果が見つかりました。`)
      } else {
        setError("デバッグクエリでもテスト結果が見つかりませんでした。")
      }

      toast({
        title: "デバッグ情報取得完了",
        description: `${data.resultCount || 0}件のテスト結果が見つかりました`,
      })
    } catch (error) {
      console.error("デバッグクエリエラー:", error)
      toast({
        title: "デバッグエラー",
        description: error instanceof Error ? error.message : "デバッグ情報の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 科目グループごとの合計点を計算
  const calculateGroupScores = (result: any) => {
    const basicMedicineScore =
      (Number(result.medical_overview) || 0) +
      (Number(result.public_health) || 0) +
      (Number(result.related_laws) || 0) +
      (Number(result.anatomy) || 0) +
      (Number(result.physiology) || 0) +
      (Number(result.pathology) || 0)

    const clinicalMedicineScore =
      (Number(result.clinical_medicine_overview) || 0) +
      (Number(result.clinical_medicine_detail) || 0) +
      (Number(result.rehabilitation) || 0)

    const orientalMedicineScore =
      (Number(result.oriental_medicine_overview) || 0) +
      (Number(result.meridian_points) || 0) +
      (Number(result.oriental_medicine_clinical) || 0) +
      (Number(result.oriental_medicine_clinical_general) || 0)

    const specializedScore = (Number(result.acupuncture_theory) || 0) + (Number(result.moxibustion_theory) || 0)

    const totalScore = basicMedicineScore + clinicalMedicineScore + orientalMedicineScore + specializedScore

    return {
      basicMedicineScore,
      clinicalMedicineScore,
      orientalMedicineScore,
      specializedScore,
      totalScore,
    }
  }

  if (isLoading) {
    return <CharacterLoading message="テスト結果を読み込んでいます..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <CharacterIcon size={40} />
            <div>
              <CardTitle>{testParam ? `${testParam}の結果` : `${studentName || studentId}さんのテスト結果`}</CardTitle>
              <CardDescription>
                {testParam ? "選択したテストの詳細結果" : "あなたが受験した模擬試験の結果一覧"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-red-800">{error}</p>
                    <p className="text-sm text-red-600 mt-2">
                      学生ID: {studentId} でテスト結果を検索しましたが、結果が見つかりませんでした。
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/debug/student/${studentId}`} className="flex items-center">
                          <Database className="mr-1 h-4 w-4" />
                          データベースを確認する
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={runDebugQuery} className="flex items-center">
                        <Bug className="mr-1 h-4 w-4" />
                        デバッグクエリを実行
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filteredResults.length > 0 ? (
              filteredResults.map((result, index) => {
                const scores = calculateGroupScores(result)
                return (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{result.test_name}</CardTitle>
                          <CardDescription>実施日: {result.test_date}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/results/${encodeURIComponent(result.test_name)}`}>詳細分析を見る</Link>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">総合得点</h3>
                          <p className="text-xl font-bold">{scores.totalScore}点</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2">基礎医学系</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>医療概論</span>
                                <span>{result.medical_overview || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>衛生・公衆衛生学</span>
                                <span>{result.public_health || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>関係法規</span>
                                <span>{result.related_laws || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>解剖学</span>
                                <span>{result.anatomy || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>生理学</span>
                                <span>{result.physiology || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>病理学</span>
                                <span>{result.pathology || 0}点</span>
                              </div>
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{scores.basicMedicineScore}点</span>
                              </div>
                            </div>
                          </div>

                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2">臨床医学系</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>臨床医学総論</span>
                                <span>{result.clinical_medicine_overview || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>臨床医学各論</span>
                                <span>{result.clinical_medicine_detail || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>リハビリテーション医学</span>
                                <span>{result.rehabilitation || 0}点</span>
                              </div>
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{scores.clinicalMedicineScore}点</span>
                              </div>
                            </div>
                          </div>

                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2">東洋医学系</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>東洋医学概論</span>
                                <span>{result.oriental_medicine_overview || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>経絡経穴概論</span>
                                <span>{result.meridian_points || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>東洋医学臨床論</span>
                                <span>{result.oriental_medicine_clinical || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>東洋医学臨床論（総合）</span>
                                <span>{result.oriental_medicine_clinical_general || 0}点</span>
                              </div>
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{scores.orientalMedicineScore}点</span>
                              </div>
                            </div>
                          </div>

                          <div className="border p-3 rounded-md">
                            <h4 className="text-sm font-medium mb-2">専門系</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>はり理論</span>
                                <span>{result.acupuncture_theory || 0}点</span>
                              </div>
                              <div className="flex justify-between">
                                <span>きゅう理論</span>
                                <span>{result.moxibustion_theory || 0}点</span>
                              </div>
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span>小計</span>
                                <span>{scores.specializedScore}点</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-md">
                          <div className="flex justify-between items-center">
                            <h3 className="text-blue-800 font-medium">合格判定</h3>
                            <div
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                scores.totalScore >= 114 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {scores.totalScore >= 114 ? "合格" : "不合格"}
                            </div>
                          </div>
                          <p className="text-sm text-blue-700 mt-2">合格基準: 190点満点中114点以上（60%以上）</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <CharacterIcon size={64} />
                </div>
                <p className="text-gray-500">テスト結果がありません</p>
                <p className="text-sm text-gray-400 mt-2">学生ID: {studentId}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/debug/student/${studentId}`} className="flex items-center">
                      <Database className="mr-1 h-4 w-4" />
                      データベースを確認する
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={runDebugQuery} className="flex items-center">
                    <Bug className="mr-1 h-4 w-4" />
                    デバッグクエリを実行
                  </Button>
                </div>
              </div>
            )}

            {debugInfo && (
              <div className="mt-6 border-t pt-4">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700">デバッグ情報</summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md overflow-auto max-h-96">
                    <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
