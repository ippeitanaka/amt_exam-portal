"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import {
  ChevronLeft,
  User,
  School,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Bug,
  Database,
  AlertCircle,
  BarChart,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CharacterLoading } from "@/components/character-loading"
import { getStudentTestResults } from "@/app/actions/test-scores"
import { Badge } from "@/components/ui/badge"
import { BadgeDisplay } from "@/components/badge-display"
import { LevelDisplay } from "@/components/level-display"
import { OverallRankingDisplay } from "@/components/overall-ranking-display"
import { getStudentBadges, calculateStudentLevel, getStudentOverallRanking } from "@/app/actions/rankings"

export default function ProfilePage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentData, setStudentData] = useState<any>(null)
  const [testStats, setTestStats] = useState<any>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [levelInfo, setLevelInfo] = useState<any>(null)
  const [overallRanking, setOverallRanking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

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

    fetchStudentData(storedStudentId, storedStudentName)
    fetchTestStats(storedStudentId)
    fetchBadges(storedStudentId)
    fetchLevelInfo(storedStudentId)
    fetchOverallRanking(storedStudentId)
  }, [router])

  // 学生データを取得する関数
  const fetchStudentData = async (id: string, storedStudentName: string | null) => {
    try {
      console.log(`学生ID: ${id} のプロフィール情報を取得します`)

      // 学生IDを数値に変換
      const studentIdNum = Number.parseInt(id, 10)
      const isNumeric = !isNaN(studentIdNum)

      // OR条件を使用して両方の型で検索
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .or(`student_id.eq.${id},student_id.eq.${isNumeric ? studentIdNum : id}`)
        .maybeSingle()

      if (error) {
        console.error("学生データ取得エラー:", error)
        throw new Error(`学生データの取得に失敗しました: ${error.message}`)
      }

      if (data) {
        console.log("学生データを取得しました:", data)
        setStudentData(data)
        // 学生名をローカルストレージに保存（データベースから取得した最新の情報）
        if (data.name) {
          localStorage.setItem("studentName", data.name)
          setStudentName(data.name)
        }
      } else {
        console.log("学生データが見つかりませんでした")
        // 学生データが見つからない場合は、基本情報だけ表示
        setStudentData({
          student_id: id,
          name: storedStudentName || `学生ID: ${id}`,
        })
      }
    } catch (err) {
      console.error("プロフィール情報取得エラー:", err)
      setError(err instanceof Error ? err.message : "プロフィール情報の取得に失敗しました")
    }
  }

  // テスト統計情報を取得する関数
  const fetchTestStats = async (id: string) => {
    try {
      console.log(`学生ID: ${id} のテスト統計情報を取得します`)

      // サーバーアクションを使用してテスト結果を取得
      const result = await getStudentTestResults(id)

      if (!result.success) {
        console.error("テスト結果取得エラー:", result.error)
        setError(result.error || "テスト結果の取得に失敗しました")

        // デバッグ情報を取得
        try {
          const debugResponse = await fetch(`/api/debug-query?studentId=${encodeURIComponent(id)}`)
          if (debugResponse.ok) {
            const debugData = await debugResponse.json()
            setDebugInfo(debugData)
            console.log("デバッグ情報:", debugData)

            // デバッグクエリで結果が見つかった場合
            if (debugData.success && debugData.results && debugData.results.length > 0) {
              calculateTestStats(debugData.results)
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

        setTestStats({
          testCount: 0,
          uniqueTestCount: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          latestTest: null,
          passingCount: 0,
          passingRate: 0,
        })
        setTestResults([])
        return
      }

      if (result.data.length === 0) {
        console.log("テスト結果が見つかりませんでした")
        setTestStats({
          testCount: 0,
          uniqueTestCount: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          latestTest: null,
          passingCount: 0,
          passingRate: 0,
        })
        setTestResults([])
        return
      }

      console.log(`${result.data.length}件のテスト結果を取得しました`)
      setTestResults(result.data)
      calculateTestStats(result.data)
    } catch (err) {
      console.error("テスト統計情報取得エラー:", err)
      setError(err instanceof Error ? err.message : "テスト統計情報の取得に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  // バッジ情報を取得する関数
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

  // レベル情報を取得する関数
  const fetchLevelInfo = async (id: string) => {
    try {
      const result = await calculateStudentLevel(id)
      if (result.success) {
        setLevelInfo(result)
      } else {
        console.error("レベル計算エラー:", result.error)
      }
    } catch (err) {
      console.error("レベル計算エラー:", err)
    }
  }

  // 総合ランキング情報を取得する関数
  const fetchOverallRanking = async (id: string) => {
    try {
      const result = await getStudentOverallRanking(id)
      if (result.success) {
        setOverallRanking(result.data)
      } else {
        console.error("総合ランキング取得エラー:", result.error)
      }
    } catch (err) {
      console.error("総合ランキング取得エラー:", err)
    }
  }

  // テスト統計情報を計算する関数
  const calculateTestStats = (data: any[]) => {
    // テスト統計情報を計算
    const testCount = data.length
    const uniqueTestCount = new Set(data.map((test) => test.test_name)).size

    // 合計点の計算
    const totalScores = data.map((test) => {
      const total =
        (Number(test.medical_overview) || 0) +
        (Number(test.public_health) || 0) +
        (Number(test.related_laws) || 0) +
        (Number(test.anatomy) || 0) +
        (Number(test.physiology) || 0) +
        (Number(test.pathology) || 0) +
        (Number(test.clinical_medicine_overview) || 0) +
        (Number(test.clinical_medicine_detail) || 0) +
        (Number(test.rehabilitation) || 0) +
        (Number(test.oriental_medicine_overview) || 0) +
        (Number(test.meridian_points) || 0) +
        (Number(test.oriental_medicine_clinical) || 0) +
        (Number(test.oriental_medicine_clinical_general) || 0) +
        (Number(test.acupuncture_theory) || 0) +
        (Number(test.moxibustion_theory) || 0)
      return Math.round(total * 10) / 10 // 小数点第一位まで丸める
    })

    // 平均点、最高点、最低点を計算
    const averageScore = totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length
    const highestScore = Math.max(...totalScores)
    const lowestScore = Math.min(...totalScores)

    // 最新のテスト結果
    const latestTest = data[0]

    // 合格判定（共通問題満点+はり師問題満点の60%以上）
    const COMMON_MAX_SCORE = 180
    const ACUPUNCTURE_MAX_SCORE = 10
    const PASSING_PERCENTAGE = 0.6
    const passingScore = (COMMON_MAX_SCORE + ACUPUNCTURE_MAX_SCORE) * PASSING_PERCENTAGE

    // 合格回数をカウント
    const passingCount = totalScores.filter((score) => score >= passingScore).length

    setTestStats({
      testCount,
      uniqueTestCount,
      averageScore,
      highestScore,
      lowestScore,
      latestTest,
      passingCount,
      passingRate: (passingCount / testCount) * 100,
    })
  }

  // 昼間部・夜間部の判定
  const getDepartment = (studentId: string | number) => {
    const studentIdStr = String(studentId)
    if (studentIdStr.length >= 3) {
      const thirdDigit = studentIdStr.charAt(2)
      if (thirdDigit === "2") return "昼間部"
      if (thirdDigit === "3") return "夜間部"
    }
    return "その他"
  }

  // 入学年度の推定
  const getEnrollmentYear = (studentId: string | number) => {
    const studentIdStr = String(studentId)
    if (studentIdStr.length >= 2) {
      const firstTwoDigits = studentIdStr.substring(0, 2)
      return `20${firstTwoDigits}年度`
    }
    return "不明"
  }

  const runDebugQuery = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/debug-query?studentId=${encodeURIComponent(studentId)}`)
      const data = await response.json()
      setDebugInfo(data)

      if (data.success && data.results && data.results.length > 0) {
        calculateTestStats(data.results)
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

  // テスト結果の合計点を計算する関数
  const calculateTotalScore = (test: any) => {
    return (
      (Number(test.medical_overview) || 0) +
      (Number(test.public_health) || 0) +
      (Number(test.related_laws) || 0) +
      (Number(test.anatomy) || 0) +
      (Number(test.physiology) || 0) +
      (Number(test.pathology) || 0) +
      (Number(test.clinical_medicine_overview) || 0) +
      (Number(test.clinical_medicine_detail) || 0) +
      (Number(test.rehabilitation) || 0) +
      (Number(test.oriental_medicine_overview) || 0) +
      (Number(test.meridian_points) || 0) +
      (Number(test.oriental_medicine_clinical) || 0) +
      (Number(test.oriental_medicine_clinical_general) || 0) +
      (Number(test.acupuncture_theory) || 0) +
      (Number(test.moxibustion_theory) || 0)
    )
  }

  // 合格判定を行う関数
  const isTestPassing = (test: any) => {
    const commonScore =
      (Number(test.medical_overview) || 0) +
      (Number(test.public_health) || 0) +
      (Number(test.related_laws) || 0) +
      (Number(test.anatomy) || 0) +
      (Number(test.physiology) || 0) +
      (Number(test.pathology) || 0) +
      (Number(test.clinical_medicine_overview) || 0) +
      (Number(test.clinical_medicine_detail) || 0) +
      (Number(test.rehabilitation) || 0) +
      (Number(test.oriental_medicine_overview) || 0) +
      (Number(test.meridian_points) || 0) +
      (Number(test.oriental_medicine_clinical) || 0) +
      (Number(test.oriental_medicine_clinical_general) || 0)

    const acupuncturistScore = commonScore + (Number(test.acupuncture_theory) || 0)
    const moxibustionistScore = commonScore + (Number(test.moxibustion_theory) || 0)

    const COMMON_MAX_SCORE = 180
    const SPECIALIZED_MAX_SCORE = 10
    const PASSING_PERCENTAGE = 0.6
    const passingScore = (COMMON_MAX_SCORE + SPECIALIZED_MAX_SCORE) * PASSING_PERCENTAGE

    return {
      acupuncturist: acupuncturistScore >= passingScore,
      moxibustionist: moxibustionistScore >= passingScore,
      both: acupuncturistScore >= passingScore && moxibustionistScore >= passingScore,
    }
  }

  if (isLoading) {
    return <CharacterLoading message="プロフィール情報を読み込んでいます..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-center">
                  <div className="rounded-full bg-gray-100 p-6">
                    <User className="h-12 w-12 text-gray-600" />
                  </div>
                </div>
                <CardTitle className="text-center mt-2">{studentName || `学生ID: ${studentId}`}</CardTitle>
                <CardDescription className="text-center">学生ID: {studentId}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <School className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">所属</p>
                      <p className="font-medium">{getDepartment(studentId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">入学年度</p>
                      <p className="font-medium">{getEnrollmentYear(studentId)}</p>
                    </div>
                  </div>
                  {studentData?.email && (
                    <div className="flex items-center">
                      <div className="h-5 w-5 mr-3 flex items-center justify-center text-gray-500">@</div>
                      <div>
                        <p className="text-sm text-gray-500">メールアドレス</p>
                        <p className="font-medium">{studentData.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">ダッシュボードに戻る</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* レベル情報 */}
            {levelInfo && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    学習レベル
                  </CardTitle>
                  <CardDescription>テスト結果に基づく学習レベル</CardDescription>
                </CardHeader>
                <CardContent>
                  <LevelDisplay
                    level={levelInfo.level}
                    experience={levelInfo.experience}
                    nextLevel={levelInfo.nextLevel}
                    progress={levelInfo.progress}
                  />
                </CardContent>
              </Card>
            )}

            {/* バッジ一覧 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  獲得バッジ
                </CardTitle>
                <CardDescription>テスト結果に基づいて獲得したバッジ</CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeDisplay badges={badges} />
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/badges">バッジ一覧を見る</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-2">
            {/* 総合ランキング情報 */}
            {overallRanking && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <OverallRankingDisplay
                    averageRank={overallRanking.average_rank}
                    totalTests={overallRanking.total_tests}
                    bestRank={overallRanking.best_rank}
                    bestTest={overallRanking.best_test}
                    percentile={overallRanking.percentile}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  テスト成績概要
                </CardTitle>
                <CardDescription>これまでの模擬試験の成績概要</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-red-800">{error}</p>
                        <div className="mt-3 flex gap-2">
                          <Button asChild variant="outline" size="sm" className="text-red-600 border-red-300">
                            <Link href={`/debug/student/${studentId}`} className="flex items-center">
                              <Database className="mr-1 h-4 w-4" />
                              データベース情報を確認する
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

                {testStats?.testCount > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">受験回数</p>
                        <p className="text-2xl font-bold">{testStats.testCount}回</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">平均点</p>
                        <p className="text-2xl font-bold">{testStats.averageScore.toFixed(1)}点</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">最高点</p>
                        <p className="text-2xl font-bold">{testStats.highestScore}点</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500">合格率</p>
                        <p className="text-2xl font-bold">{testStats.passingRate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">最新の試験結果</h3>
                      {testStats.latestTest && (
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{testStats.latestTest.test_name}</CardTitle>
                                <CardDescription>実施日: {testStats.latestTest.test_date}</CardDescription>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  href={`/results/${encodeURIComponent(testStats.latestTest.test_name)}`}
                                  className="flex items-center"
                                >
                                  詳細を見る
                                </Link>
                              </Button>
                            </div>
                          </CardHeader>
                        </Card>
                      )}
                    </div>

                    {/* テスト結果一覧 */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">テスト結果一覧</h3>
                      <div className="space-y-3">
                        {testResults.map((test) => {
                          const totalScore = calculateTotalScore(test)
                          const passingStatus = isTestPassing(test)
                          return (
                            <Card key={test.id} className="overflow-hidden">
                              <div className="flex flex-col sm:flex-row">
                                <div className="flex-grow p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">{test.test_name}</h4>
                                      <p className="text-sm text-gray-500">実施日: {test.test_date}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="text-lg font-bold">{totalScore.toFixed(1)}点</span>
                                      <div className="flex gap-1 mt-1">
                                        {passingStatus.both ? (
                                          <Badge className="bg-green-500">両方合格</Badge>
                                        ) : passingStatus.acupuncturist ? (
                                          <Badge className="bg-amber-500">はり師のみ</Badge>
                                        ) : passingStatus.moxibustionist ? (
                                          <Badge className="bg-amber-500">きゅう師のみ</Badge>
                                        ) : (
                                          <Badge variant="destructive">不合格</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-4 flex items-center justify-center sm:w-32">
                                  <Button variant="outline" size="sm" asChild className="w-full">
                                    <Link
                                      href={`/results/${encodeURIComponent(test.test_name)}`}
                                      className="flex items-center justify-center"
                                    >
                                      <BarChart className="h-4 w-4 mr-1" />
                                      詳細分析
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <CharacterIcon size={64} />
                    </div>
                    <p className="text-gray-500">テスト結果がありません</p>
                    <div className="mt-4">
                      <Button asChild variant="outline">
                        <Link href="/tests">テスト一覧を見る</Link>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  学習状況
                </CardTitle>
                <CardDescription>模擬試験の学習状況と推奨アクション</CardDescription>
              </CardHeader>
              <CardContent>
                {testStats?.testCount > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-blue-800 font-medium mb-2">学習アドバイス</h3>
                      <p className="text-blue-700 text-sm">
                        {testStats.averageScore >= 114
                          ? "現在の成績は合格ラインを超えています。このまま学習を継続して、さらなる得点アップを目指しましょう。"
                          : "現在の成績は合格ラインに達していません。特に苦手科目を重点的に学習することをお勧めします。"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border p-4 rounded-lg">
                        <h3 className="font-medium mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          次回の模擬試験
                        </h3>
                        <p className="text-sm text-gray-600">2025年5月15日予定</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ※詳細は掲示板または担当教員からのお知らせをご確認ください
                        </p>
                      </div>

                      <div className="border p-4 rounded-lg">
                        <h3 className="font-medium mb-2">推奨学習項目</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>・ 東洋医学概論の復習</li>
                          <li>・ 経絡経穴の暗記</li>
                          <li>・ 臨床医学各論の要点整理</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">テスト結果がないため、学習状況を分析できません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
