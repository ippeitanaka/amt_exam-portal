"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, BarChart } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CharacterLoading } from "@/components/character-loading"
import { Badge } from "@/components/ui/badge"

export default function TestsPage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [tests, setTests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

    fetchTests(storedStudentId)
  }, [router])

  // テスト一覧を取得する関数
  const fetchTests = async (id: string) => {
    try {
      setIsLoading(true)
      console.log(`学生ID: ${id} のテスト一覧を取得します`)

      // 学生IDを数値に変換
      const studentIdNum = Number.parseInt(id, 10)
      const isNumeric = !isNaN(studentIdNum)

      // OR条件を使用して両方の型で検索
      const { data, error } = await supabase
        .from("test_scores")
        .select("*")
        .or(`student_id.eq.${id},student_id.eq.${isNumeric ? studentIdNum : id}`)
        .order("test_date", { ascending: false })

      if (error) {
        console.error("テスト一覧取得エラー:", error)
        throw new Error(`テスト一覧の取得に失敗しました: ${error.message}`)
      }

      if (data && data.length > 0) {
        console.log(`${data.length}件のテスト結果を取得しました`)

        // 重複を排除（同じテスト名のテストは最新のものだけを表示）
        const uniqueTests = new Map()
        data.forEach((test) => {
          if (
            !uniqueTests.has(test.test_name) ||
            new Date(test.test_date) > new Date(uniqueTests.get(test.test_name).test_date)
          ) {
            uniqueTests.set(test.test_name, test)
          }
        })

        setTests(Array.from(uniqueTests.values()))
      } else {
        console.log("テスト結果が見つかりませんでした")
        setTests([])
      }
    } catch (err) {
      console.error("テスト一覧取得エラー:", err)
      setError(err instanceof Error ? err.message : "テスト一覧の取得に失敗しました")
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "テスト一覧の取得に失敗しました",
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
    return <CharacterLoading message="テスト一覧を読み込んでいます..." />
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
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <CardTitle>テスト一覧</CardTitle>
                <CardDescription>
                  {studentName ? `${studentName}さん` : `学生ID: ${studentId}`}のテスト結果一覧
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {tests.length > 0 ? (
              <div className="space-y-4">
                {tests.map((test) => {
                  const totalScore = calculateTotalScore(test)
                  const passingStatus = isTestPassing(test)
                  return (
                    <Card key={test.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex-grow p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{test.test_name}</h3>
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
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <CharacterIcon size={64} />
                </div>
                <p className="text-gray-500">テスト結果がありません</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
