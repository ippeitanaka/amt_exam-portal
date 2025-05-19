"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

export default function ResultsPage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTest, setExpandedTest] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const testParam = searchParams.get("test")
  const supabase = createClientComponentClient()

  // 科目ごとの満点
  const MAX_SCORES = {
    medical_overview: 2, // 医療概論
    public_health: 10, // 衛生・公衆衛生学
    related_laws: 4, // 関係法規
    anatomy: 15, // 解剖学
    physiology: 15, // 生理学
    pathology: 6, // 病理学
    clinical_medicine_overview: 20, // 臨床医学総論
    clinical_medicine_detail: 30, // 臨床医学各論
    rehabilitation: 8, // リハビリテーション医学
    oriental_medicine_overview: 20, // 東洋医学概論
    meridian_points: 20, // 経絡経穴概論
    oriental_medicine_clinical: 20, // 東洋医学臨床論
    oriental_medicine_clinical_general: 10, // 東洋医学臨床論（総合）
    acupuncture_theory: 10, // はり理論
    moxibustion_theory: 10, // きゅう理論
  }

  // 共通問題の満点（はり師・きゅう師問題を除く）
  const COMMON_MAX_SCORE = 180

  // 合格基準（60%）
  const PASSING_PERCENTAGE = 0.6

  // 合格判定関数（はり師）
  const isAcupuncturistPassing = (score: any) => {
    // 共通問題の合計を計算
    const commonScore = calculateCommonScore(score)

    // はり師問題の点数
    const acupunctureScore = score.acupuncture_theory || 0

    // 合計点
    const totalScore = commonScore + acupunctureScore

    // 合格基準点（共通問題満点+はり師問題満点の60%）
    const passingScore = (COMMON_MAX_SCORE + MAX_SCORES.acupuncture_theory) * PASSING_PERCENTAGE

    return totalScore >= passingScore
  }

  // 合格判定関数（きゅう師）
  const isMoxibustionistPassing = (score: any) => {
    // 共通問題の合計を計算
    const commonScore = calculateCommonScore(score)

    // きゅう師問題の点数
    const moxibustionScore = score.moxibustion_theory || 0

    // 合計点
    const totalScore = commonScore + moxibustionScore

    // 合格基準点（共通問題満点+きゅう師問題満点の60%）
    const passingScore = (COMMON_MAX_SCORE + MAX_SCORES.moxibustion_theory) * PASSING_PERCENTAGE

    return totalScore >= passingScore
  }

  // 共通問題の合計点を計算する関数
  const calculateCommonScore = (score: any) => {
    return (
      (score.medical_overview || 0) +
      (score.public_health || 0) +
      (score.related_laws || 0) +
      (score.anatomy || 0) +
      (score.physiology || 0) +
      (score.pathology || 0) +
      (score.clinical_medicine_overview || 0) +
      (score.clinical_medicine_detail || 0) +
      (score.rehabilitation || 0) +
      (score.oriental_medicine_overview || 0) +
      (score.meridian_points || 0) +
      (score.oriental_medicine_clinical || 0) +
      (score.oriental_medicine_clinical_general || 0)
    )
  }

  // 昼間部・夜間部の判定
  const getDepartment = (studentId: number) => {
    const studentIdStr = studentId.toString()
    if (studentIdStr.length >= 3) {
      const thirdDigit = studentIdStr.charAt(2)
      if (thirdDigit === "2") return "昼間部"
      if (thirdDigit === "3") return "夜間部"
    }
    return "その他"
  }

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

    fetchResults(storedStudentId)
  }, [router])

  const fetchResults = async (id: string) => {
    setIsLoading(true)
    try {
      // 学生IDを数値に変換
      const studentIdNum = Number.parseInt(id, 10)

      if (isNaN(studentIdNum)) {
        throw new Error("有効な学生IDではありません")
      }

      // テスト結果を取得
      const { data, error } = await supabase
        .from("test_scores")
        .select("*")
        .eq("student_id", studentIdNum)
        .order("test_date", { ascending: false })

      if (error) throw error
      setResults(data || [])

      // URLパラメータでテストが指定されている場合、そのテストを展開
      if (testParam && data) {
        const matchingTest = data.find((test) => test.test_name === testParam)
        if (matchingTest) {
          setExpandedTest(`${matchingTest.test_name}_${matchingTest.test_date}`)
        }
      }
    } catch (error) {
      console.error("データ取得エラー:", error)
      toast({
        title: "エラー",
        description: "成績データの取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // テスト結果をテスト名と日付でグループ化
  const groupedTests = useMemo(() => {
    const grouped: Record<string, any> = {}

    results.forEach((score) => {
      const key = `${score.test_name}_${score.test_date}`
      if (!grouped[key]) {
        grouped[key] = {
          test_name: score.test_name,
          test_date: score.test_date,
          scores: [],
        }
      }

      grouped[key].scores.push(score)
    })

    // 日付の新しい順にソート
    return Object.values(grouped).sort((a: any, b: any) => {
      return new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
    })
  }, [results])

  // 科目名の日本語表示
  const subjectNames: Record<string, string> = {
    medical_overview: "医療概論",
    public_health: "衛生・公衆衛生学",
    related_laws: "関係法規",
    anatomy: "解剖学",
    physiology: "生理学",
    pathology: "病理学",
    clinical_medicine_overview: "臨床医学総論",
    clinical_medicine_detail: "臨床医学各論",
    rehabilitation: "リハビリテーション医学",
    oriental_medicine_overview: "東洋医学概論",
    meridian_points: "経絡経穴概論",
    oriental_medicine_clinical: "東洋医学臨床論",
    oriental_medicine_clinical_general: "東洋医学臨床論（総合）",
    acupuncture_theory: "はり理論",
    moxibustion_theory: "きゅう理論",
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
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

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <CharacterIcon size={40} />
            <div>
              <CardTitle>{studentName}さんの成績一覧</CardTitle>
              <CardDescription>
                学生ID: {studentId} / 所属: {getDepartment(Number(studentId))}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {groupedTests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">テスト結果がありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedTests.map((test, index) => (
                  <Collapsible
                    key={index}
                    open={expandedTest === `${test.test_name}_${test.test_date}`}
                    onOpenChange={(open) => {
                      setExpandedTest(open ? `${test.test_name}_${test.test_date}` : null)
                    }}
                    className="border rounded-lg overflow-hidden"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                        <div>
                          <h3 className="text-lg font-medium">{test.test_name}</h3>
                          <p className="text-sm text-gray-500">実施日: {test.test_date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          {test.scores.map((score: any) => {
                            const acupuncturistPassing = isAcupuncturistPassing(score)
                            const moxibustionistPassing = isMoxibustionistPassing(score)

                            return (
                              <div key={score.id} className="text-right">
                                <p className="text-sm">合計点: {score.total_score}点</p>
                                <div className="flex gap-1 mt-1">
                                  {acupuncturistPassing ? (
                                    <Badge className="bg-green-500">はり師合格</Badge>
                                  ) : (
                                    <Badge variant="destructive">はり師不合格</Badge>
                                  )}
                                  {moxibustionistPassing ? (
                                    <Badge className="bg-green-500">きゅう師合格</Badge>
                                  ) : (
                                    <Badge variant="destructive">きゅう師不合格</Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          {expandedTest === `${test.test_name}_${test.test_date}` ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-4">
                        {test.scores.map((score: any, scoreIndex: number) => (
                          <div key={scoreIndex}>
                            <Tabs defaultValue="summary">
                              <TabsList className="mb-4">
                                <TabsTrigger value="summary">成績概要</TabsTrigger>
                                <TabsTrigger value="detail">科目別詳細</TabsTrigger>
                              </TabsList>

                              <TabsContent value="summary">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                  <Card>
                                    <CardContent className="pt-6">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-500">合計点</p>
                                        <p className="text-3xl font-bold">{score.total_score}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="pt-6">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-500">基礎医学系</p>
                                        <p className="text-3xl font-bold">{score.basic_medicine_score}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="pt-6">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-500">臨床医学系</p>
                                        <p className="text-3xl font-bold">{score.clinical_medicine_score}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="pt-6">
                                      <div className="text-center">
                                        <p className="text-sm text-gray-500">東洋医学系</p>
                                        <p className="text-3xl font-bold">{score.oriental_medicine_score}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>はり師試験</CardTitle>
                                      <CardDescription>
                                        {isAcupuncturistPassing(score) ? (
                                          <span className="text-green-600">合格</span>
                                        ) : (
                                          <span className="text-red-600">不合格</span>
                                        )}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>共通問題</span>
                                          <span>{calculateCommonScore(score)}点</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>はり理論</span>
                                          <span>{score.acupuncture_theory || 0}点</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                          <span>合計</span>
                                          <span>{calculateCommonScore(score) + (score.acupuncture_theory || 0)}点</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500">
                                          <span>合格基準点</span>
                                          <span>
                                            {Math.round(
                                              (COMMON_MAX_SCORE + MAX_SCORES.acupuncture_theory) * PASSING_PERCENTAGE,
                                            )}
                                            点以上
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle>きゅう師試験</CardTitle>
                                      <CardDescription>
                                        {isMoxibustionistPassing(score) ? (
                                          <span className="text-green-600">合格</span>
                                        ) : (
                                          <span className="text-red-600">不合格</span>
                                        )}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>共通問題</span>
                                          <span>{calculateCommonScore(score)}点</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>きゅう理論</span>
                                          <span>{score.moxibustion_theory || 0}点</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                          <span>合計</span>
                                          <span>{calculateCommonScore(score) + (score.moxibustion_theory || 0)}点</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500">
                                          <span>合格基準点</span>
                                          <span>
                                            {Math.round(
                                              (COMMON_MAX_SCORE + MAX_SCORES.moxibustion_theory) * PASSING_PERCENTAGE,
                                            )}
                                            点以上
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>

                              <TabsContent value="detail">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-medium mb-2">基礎医学系 ({score.basic_medicine_score}点)</h3>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>科目</TableHead>
                                          <TableHead className="text-right">得点</TableHead>
                                          <TableHead className="text-right">満点</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>医療概論</TableCell>
                                          <TableCell className="text-right">
                                            {score.medical_overview !== null ? score.medical_overview : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.medical_overview}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>衛生・公衆衛生学</TableCell>
                                          <TableCell className="text-right">
                                            {score.public_health !== null ? score.public_health : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.public_health}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>関係法規</TableCell>
                                          <TableCell className="text-right">
                                            {score.related_laws !== null ? score.related_laws : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.related_laws}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>解剖学</TableCell>
                                          <TableCell className="text-right">
                                            {score.anatomy !== null ? score.anatomy : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.anatomy}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>生理学</TableCell>
                                          <TableCell className="text-right">
                                            {score.physiology !== null ? score.physiology : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.physiology}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>病理学</TableCell>
                                          <TableCell className="text-right">
                                            {score.pathology !== null ? score.pathology : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.pathology}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>

                                  <div>
                                    <h3 className="font-medium mb-2">臨床医学系 ({score.clinical_medicine_score}点)</h3>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>科目</TableHead>
                                          <TableHead className="text-right">得点</TableHead>
                                          <TableHead className="text-right">満点</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>臨床医学総論</TableCell>
                                          <TableCell className="text-right">
                                            {score.clinical_medicine_overview !== null
                                              ? score.clinical_medicine_overview
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {MAX_SCORES.clinical_medicine_overview}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>臨床医学各論</TableCell>
                                          <TableCell className="text-right">
                                            {score.clinical_medicine_detail !== null
                                              ? score.clinical_medicine_detail
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {MAX_SCORES.clinical_medicine_detail}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>リハビリテーション医学</TableCell>
                                          <TableCell className="text-right">
                                            {score.rehabilitation !== null ? score.rehabilitation : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.rehabilitation}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>

                                    <h3 className="font-medium mb-2 mt-4">
                                      東洋医学系 ({score.oriental_medicine_score}点)
                                    </h3>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>科目</TableHead>
                                          <TableHead className="text-right">得点</TableHead>
                                          <TableHead className="text-right">満点</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>東洋医学概論</TableCell>
                                          <TableCell className="text-right">
                                            {score.oriental_medicine_overview !== null
                                              ? score.oriental_medicine_overview
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {MAX_SCORES.oriental_medicine_overview}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>経絡経穴概論</TableCell>
                                          <TableCell className="text-right">
                                            {score.meridian_points !== null ? score.meridian_points : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.meridian_points}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>東洋医学臨床論</TableCell>
                                          <TableCell className="text-right">
                                            {score.oriental_medicine_clinical !== null
                                              ? score.oriental_medicine_clinical
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {MAX_SCORES.oriental_medicine_clinical}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>東洋医学臨床論（総合）</TableCell>
                                          <TableCell className="text-right">
                                            {score.oriental_medicine_clinical_general !== null
                                              ? score.oriental_medicine_clinical_general
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {MAX_SCORES.oriental_medicine_clinical_general}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>

                                    <h3 className="font-medium mb-2 mt-4">専門系</h3>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>科目</TableHead>
                                          <TableHead className="text-right">得点</TableHead>
                                          <TableHead className="text-right">満点</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>はり理論</TableCell>
                                          <TableCell className="text-right">
                                            {score.acupuncture_theory !== null ? score.acupuncture_theory : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.acupuncture_theory}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>きゅう理論</TableCell>
                                          <TableCell className="text-right">
                                            {score.moxibustion_theory !== null ? score.moxibustion_theory : "-"}
                                          </TableCell>
                                          <TableCell className="text-right">{MAX_SCORES.moxibustion_theory}</TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
