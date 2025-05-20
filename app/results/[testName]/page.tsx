"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, Trophy, Medal, Award, BarChart2, Share2, AlertCircle, Database } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { TestAnalysis } from "@/components/test-analysis"
import { CharacterLoading } from "@/components/character-loading"
import { RankingDisplay } from "@/components/ranking-display"
import { BadgeDisplay } from "@/components/badge-display"
import { getTestRanking, getStudentBadges } from "@/app/actions/rankings"

export default function TestResultDetailPage({ params }: { params: { testName: string } }) {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const [rankings, setRankings] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("analysis")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  // URLデコード
  const decodedTestName = decodeURIComponent(params.testName)

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

    fetchTestResult(storedStudentId, decodedTestName)
    fetchRankings(decodedTestName)
    fetchBadges(storedStudentId)
  }, [router, decodedTestName])

  const fetchTestResult = async (id: string, testName: string) => {
    try {
      console.log(`学生ID: ${id} のテスト "${testName}" の結果を取得します`)
      setDebugInfo(null)

      // 学生IDを数値に変換
      const studentIdNum = Number.parseInt(id, 10)
      const isNumeric = !isNaN(studentIdNum)

      // まず、完全一致で検索
      let query = supabase
        .from("test_scores")
        .select("*")
        .or(`student_id.eq.${id},student_id.eq.${isNumeric ? studentIdNum : id}`)
        .eq("test_name", testName)
        .order("test_date", { ascending: false })

      let { data, error } = await query.maybeSingle()

      // デバッグ情報を保存
      setDebugInfo({
        query: "完全一致検索",
        studentId: id,
        numericId: isNumeric ? studentIdNum : "変換不可",
        testName: testName,
        result: data ? "データあり" : "データなし",
        error: error ? error.message : null,
      })

      // 完全一致で見つからない場合、部分一致で検索
      if (!data && !error) {
        console.log("完全一致で見つからないため、部分一致で検索します")

        // 部分一致検索（ilike演算子を使用）
        query = supabase
          .from("test_scores")
          .select("*")
          .or(`student_id.eq.${id},student_id.eq.${isNumeric ? studentIdNum : id}`)
          .ilike("test_name", `%${testName}%`)
          .order("test_date", { ascending: false })

        const partialResult = await query.maybeSingle()
        data = partialResult.data
        error = partialResult.error

        // デバッグ情報を更新
        setDebugInfo((prev) => ({
          ...prev,
          partialQuery: "部分一致検索",
          partialResult: data ? "データあり" : "データなし",
          partialError: error ? error.message : null,
        }))
      }

      // それでも見つからない場合、すべてのテスト結果を取得して確認
      if (!data && !error) {
        console.log("部分一致でも見つからないため、すべてのテスト結果を確認します")

        // すべてのテスト結果を取得
        query = supabase
          .from("test_scores")
          .select("*")
          .or(`student_id.eq.${id},student_id.eq.${isNumeric ? studentIdNum : id}`)
          .order("test_date", { ascending: false })

        const allResult = await query
        const allData = allResult.data || []
        error = allResult.error

        // デバッグ情報を更新
        setDebugInfo((prev) => ({
          ...prev,
          allQuery: "すべてのテスト結果検索",
          allResultCount: allData.length,
          allTestNames: allData.map((item) => item.test_name),
          allError: error ? error.message : null,
        }))

        // テスト名が類似しているものを探す
        if (allData.length > 0) {
          // 最も新しいテスト結果を使用
          data = allData[0]
          console.log(`最新のテスト結果を使用します: ${data.test_name}`)
        }
      }

      if (error) {
        console.error("テスト結果取得エラー:", error)
        throw new Error(`テスト結果の取得に失敗しました: ${error.message}`)
      }

      if (data) {
        console.log("テスト結果を取得しました:", data)

        // 合計点の計算
        const totalScore =
          (Number(data.medical_overview) || 0) +
          (Number(data.public_health) || 0) +
          (Number(data.related_laws) || 0) +
          (Number(data.anatomy) || 0) +
          (Number(data.physiology) || 0) +
          (Number(data.pathology) || 0) +
          (Number(data.clinical_medicine_overview) || 0) +
          (Number(data.clinical_medicine_detail) || 0) +
          (Number(data.rehabilitation) || 0) +
          (Number(data.oriental_medicine_overview) || 0) +
          (Number(data.meridian_points) || 0) +
          (Number(data.oriental_medicine_clinical) || 0) +
          (Number(data.oriental_medicine_clinical_general) || 0) +
          (Number(data.acupuncture_theory) || 0) +
          (Number(data.moxibustion_theory) || 0)

        // 基礎医学系の合計点
        const basicMedicineScore =
          (Number(data.medical_overview) || 0) +
          (Number(data.public_health) || 0) +
          (Number(data.related_laws) || 0) +
          (Number(data.anatomy) || 0) +
          (Number(data.physiology) || 0) +
          (Number(data.pathology) || 0)

        // 臨床医学系の合計点
        const clinicalMedicineScore =
          (Number(data.clinical_medicine_overview) || 0) +
          (Number(data.clinical_medicine_detail) || 0) +
          (Number(data.rehabilitation) || 0)

        // 東洋医学系の合計点
        const orientalMedicineScore =
          (Number(data.oriental_medicine_overview) || 0) +
          (Number(data.meridian_points) || 0) +
          (Number(data.oriental_medicine_clinical) || 0) +
          (Number(data.oriental_medicine_clinical_general) || 0)

        setTestResult({
          ...data,
          student_name: studentName,
          total_score: Math.round(totalScore * 10) / 10, // 小数点第一位まで丸める
          basic_medicine_score: basicMedicineScore,
          clinical_medicine_score: clinicalMedicineScore,
          oriental_medicine_score: orientalMedicineScore,
        })
      } else {
        console.log("テスト結果が見つかりませんでした")
        setError("テスト結果が見つかりませんでした。")
      }
    } catch (err) {
      console.error("テスト結果取得エラー:", err)
      setError(err instanceof Error ? err.message : "テスト結果の取得に失敗しました")
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "テスト結果の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRankings = async (testName: string) => {
    try {
      const result = await getTestRanking(testName)
      if (result.success) {
        setRankings(result.data)
      } else {
        console.error("ランキング取得エラー:", result.error)
      }
    } catch (err) {
      console.error("ランキング取得エラー:", err)
    }
  }

  const fetchBadges = async (id: string) => {
    try {
      const result = await getStudentBadges(id)
      if (result.success) {
        setBadges(result.badges)
      } else {
        console.error("バッジ取得エラー:", result.error)
      }
    } catch (err) {
      console.error("バッジ取得エラー:", err)
    }
  }

  // 現在の学生のランキング情報を取得
  const getCurrentRanking = () => {
    return rankings.find((r) => String(r.student_id) === String(studentId))
  }

  // 結果をシェアする機能
  const shareResults = () => {
    const currentRanking = getCurrentRanking()
    const rankText = currentRanking ? `${currentRanking.rank}位 / ${rankings.length}人中` : ""

    const shareText = `${decodedTestName}の結果: ${testResult?.total_score}点 ${rankText}\n#国家試験模擬試験`

    if (navigator.share) {
      navigator
        .share({
          title: `${decodedTestName}の結果`,
          text: shareText,
        })
        .catch((err) => {
          console.error("シェアエラー:", err)
        })
    } else {
      // クリップボードにコピー
      navigator.clipboard
        .writeText(shareText)
        .then(() => {
          toast({
            title: "コピーしました",
            description: "テスト結果をクリップボードにコピーしました",
          })
        })
        .catch((err) => {
          console.error("コピーエラー:", err)
        })
    }
  }

  if (isLoading) {
    return <CharacterLoading message="テスト結果を読み込んでいます..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/tests" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              テスト一覧に戻る
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex items-center gap-3">
                <CharacterIcon size={40} />
                <div>
                  <CardTitle>{decodedTestName}</CardTitle>
                  <CardDescription>
                    {testResult?.test_date ? `実施日: ${testResult.test_date}` : ""}
                    {studentName ? ` / 学生: ${studentName}` : ""}
                  </CardDescription>
                </div>
              </div>

              {getCurrentRanking() && (
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-gray-600">あなたの順位</p>
                    <p className="font-bold text-lg">
                      {getCurrentRanking()?.rank}位 / {rankings.length}人中
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis" className="flex items-center gap-1">
                  <BarChart2 className="h-4 w-4" />
                  <span>詳細分析</span>
                </TabsTrigger>
                <TabsTrigger value="ranking" className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  <span>ランキング</span>
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>実績</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="analysis">
              <CardContent>
                {error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-red-500 mt-1" />
                      <div>
                        <p className="text-red-800 font-medium">{error}</p>
                        <p className="text-sm text-red-600 mt-1">
                          テスト「{decodedTestName}」の結果が見つかりませんでした。
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4">
                      <div className="bg-amber-50 p-3 rounded-md">
                        <h3 className="text-amber-800 font-medium flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          データが見つからない理由
                        </h3>
                        <ul className="mt-2 text-sm text-amber-700 space-y-1 list-disc list-inside">
                          <li>テスト名が正確に一致していない可能性があります</li>
                          <li>このテストを受験していない可能性があります</li>
                          <li>データベースに結果が登録されていない可能性があります</li>
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/tests" className="flex items-center">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            テスト一覧に戻る
                          </Link>
                        </Button>

                        <Button asChild variant="outline" size="sm" className="flex items-center gap-1">
                          <Link
                            href={`/debug/database?studentId=${studentId}&testName=${encodeURIComponent(decodedTestName)}`}
                          >
                            <Database className="mr-1 h-4 w-4" />
                            データベースを確認
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* デバッグ情報表示 */}
                    {debugInfo && (
                      <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
                        <details>
                          <summary className="cursor-pointer font-medium">デバッグ情報</summary>
                          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
                        </details>
                      </div>
                    )}
                  </div>
                ) : testResult ? (
                  <TestAnalysis testScore={testResult} />
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">テスト結果が見つかりませんでした</p>
                    <p className="text-gray-500 mt-2">
                      テスト「{decodedTestName}」の結果がデータベースに存在しないか、アクセス権限がありません。
                    </p>

                    <div className="mt-6 flex justify-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href="/tests" className="flex items-center">
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          テスト一覧に戻る
                        </Link>
                      </Button>

                      <Button asChild variant="outline" size="sm" className="flex items-center gap-1">
                        <Link
                          href={`/debug/database?studentId=${studentId}&testName=${encodeURIComponent(decodedTestName)}`}
                        >
                          <Database className="mr-1 h-4 w-4" />
                          データベースを確認
                        </Link>
                      </Button>
                    </div>

                    {/* デバッグ情報表示 */}
                    {debugInfo && (
                      <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-w-md mx-auto">
                        <details>
                          <summary className="cursor-pointer font-medium">デバッグ情報</summary>
                          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="ranking">
              <CardContent>
                {rankings.length > 0 ? (
                  <RankingDisplay
                    rankings={rankings}
                    currentStudentId={studentId}
                    title={`${decodedTestName}のランキング`}
                    description="得点に基づく順位表"
                    showDate={true}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium">ランキングデータがありません</p>
                    <p className="text-gray-500 mt-2">このテストのランキングデータがまだ登録されていません。</p>

                    <div className="mt-6 flex justify-center">
                      <Button asChild variant="outline" size="sm" className="flex items-center gap-1">
                        <Link href={`/debug/database?testName=${encodeURIComponent(decodedTestName)}`}>
                          <Database className="mr-1 h-4 w-4" />
                          データベースを確認
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="achievements">
              <CardContent>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-500" />
                        獲得バッジ
                      </CardTitle>
                      <CardDescription>テスト結果に基づいて獲得したバッジ</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BadgeDisplay badges={badges} showAll={true} />
                    </CardContent>
                  </Card>

                  {testResult && (
                    <Card>
                      <CardHeader>
                        <CardTitle>このテストの実績</CardTitle>
                        <CardDescription>テスト結果から獲得した実績</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {testResult.total_score >= 114 && (
                            <div className="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
                              <Trophy className="h-6 w-6 text-green-500 mt-1" />
                              <div>
                                <h3 className="font-medium text-green-800">合格達成！</h3>
                                <p className="text-green-700 text-sm">
                                  合格ラインの114点を超える{testResult.total_score}点を獲得しました。
                                </p>
                              </div>
                            </div>
                          )}

                          {getCurrentRanking()?.rank <= 3 && (
                            <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-lg">
                              <Medal className="h-6 w-6 text-amber-500 mt-1" />
                              <div>
                                <h3 className="font-medium text-amber-800">トップ3入賞！</h3>
                                <p className="text-amber-700 text-sm">
                                  {getCurrentRanking()?.rank}位 / {rankings.length}人中の優秀な成績を収めました。
                                </p>
                              </div>
                            </div>
                          )}

                          {testResult.anatomy >= 12 && (
                            <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                              <Award className="h-6 w-6 text-blue-500 mt-1" />
                              <div>
                                <h3 className="font-medium text-blue-800">解剖学マスター</h3>
                                <p className="text-blue-700 text-sm">
                                  解剖学で高得点（{testResult.anatomy}点）を獲得しました。
                                </p>
                              </div>
                            </div>
                          )}

                          {testResult.oriental_medicine_overview >= 16 && (
                            <div className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
                              <Award className="h-6 w-6 text-purple-500 mt-1" />
                              <div>
                                <h3 className="font-medium text-purple-800">東洋医学マスター</h3>
                                <p className="text-purple-700 text-sm">
                                  東洋医学概論で高得点（{testResult.oriental_medicine_overview}点）を獲得しました。
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 実績がない場合 */}
                          {testResult.total_score < 114 &&
                            (getCurrentRanking()?.rank > 3 || !getCurrentRanking()) &&
                            testResult.anatomy < 12 &&
                            testResult.oriental_medicine_overview < 16 && (
                              <p className="text-center py-4 text-gray-500">
                                このテストではまだ特別な実績を獲得していません。次回のテストで頑張りましょう！
                              </p>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>

          <CardFooter className="flex justify-end">
            <Button variant="outline" size="sm" onClick={shareResults} className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              結果をシェア
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
