"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ChevronRight, Search, Users, CalendarDays, Award, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TestScore {
  id: number
  test_name: string
  test_date: string
  student_id: number
  total_score: number
  medical_overview: number
  public_health: number
  related_laws: number
  anatomy: number
  physiology: number
  pathology: number
  clinical_medicine_overview: number
  clinical_medicine_detail: number
  rehabilitation: number
  oriental_medicine_overview: number
  meridian_points: number
  oriental_medicine_clinical: number
  oriental_medicine_clinical_general: number
  acupuncture_theory: number
  moxibustion_theory: number
  [key: string]: any
}

interface TestResultsListProps {
  scores: TestScore[]
  isDashboard?: boolean
  onSuccess?: () => void
  error?: string | null
}

// 科目グループ
const subjectGroups = {
  common: [
    "medical_overview",
    "public_health",
    "related_laws",
    "anatomy",
    "physiology",
    "pathology",
    "clinical_medicine_overview",
    "clinical_medicine_detail",
    "rehabilitation",
    "oriental_medicine_overview",
    "meridian_points",
    "oriental_medicine_clinical",
    "oriental_medicine_clinical_general",
  ],
}

// 共通問題の満点
const COMMON_MAX_SCORE = 180

// 合格基準（60%）
const PASSING_PERCENTAGE = 0.6

// 合格基準点
const PASSING_SCORE = (COMMON_MAX_SCORE + 10) * PASSING_PERCENTAGE // 190点の60% = 114点

// 重複を排除する関数（同じテスト名と日付の組み合わせのみ）
function removeDuplicateTests(tests: any[]) {
  const uniqueTests = new Map<string, any>()

  tests.forEach((test) => {
    const key = `${test.test_name}_${test.test_date}`
    if (!uniqueTests.has(key)) {
      uniqueTests.set(key, test)
    }
  })

  return Array.from(uniqueTests.values())
}

export default function TestResultsList({ scores, isDashboard = false, onSuccess, error }: TestResultsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  // 重複を排除したスコア（IDのみで重複を判断）
  const uniqueScores = useMemo(() => {
    // IDをキーとして使用して重複を排除
    const uniqueMap = new Map()
    scores.forEach((score) => {
      if (!uniqueMap.has(score.id)) {
        uniqueMap.set(score.id, score)
      }
    })
    return Array.from(uniqueMap.values())
  }, [scores])

  // 科目グループの合計点を計算する関数
  const calculateGroupScore = (score: TestScore, subjects: string[]) => {
    return subjects.reduce((total, subject) => {
      return total + (Number(score[subject as keyof TestScore]) || 0)
    }, 0)
  }

  // テスト名と日付でグループ化したテスト結果
  const groupedTests = useMemo(() => {
    const grouped = new Map<
      string,
      {
        test_name: string
        test_date: string
        count: number
        avgScore: number
        acupuncturistPassingRate: number
        moxibustionistPassingRate: number
      }
    >()

    // 各スコアに対して処理
    uniqueScores.forEach((score) => {
      const key = `${score.test_name}_${score.test_date}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          test_name: score.test_name,
          test_date: score.test_date,
          count: 0,
          avgScore: 0,
          acupuncturistPassingRate: 0,
          moxibustionistPassingRate: 0,
        })
      }

      const group = grouped.get(key)!
      group.count += 1

      // 平均点の計算用に合計を更新
      group.avgScore = (group.avgScore * (group.count - 1) + score.total_score) / group.count

      // 共通問題の合計点を計算
      const commonScore = calculateGroupScore(score, subjectGroups.common)

      // はり師試験の合計点（共通問題 + はり理論）
      const acupuncturistScore = commonScore + (score.acupuncture_theory || 0)

      // きゅう師試験の合計点（共通問題 + きゅう理論）
      const moxibustionistScore = commonScore + (score.moxibustion_theory || 0)

      // はり師合格判定（共通問題 + はり理論の合計が114点以上）
      const isAcupuncturistPassing = acupuncturistScore >= PASSING_SCORE

      // きゅう師合格判定（共通問題 + きゅう理論の合計が114点以上）
      const isMoxibustionistPassing = moxibustionistScore >= PASSING_SCORE

      // 合格率の更新
      group.acupuncturistPassingRate =
        (((group.acupuncturistPassingRate * (group.count - 1)) / 100 + (isAcupuncturistPassing ? 1 : 0)) /
          group.count) *
        100

      group.moxibustionistPassingRate =
        (((group.moxibustionistPassingRate * (group.count - 1)) / 100 + (isMoxibustionistPassing ? 1 : 0)) /
          group.count) *
        100
    })

    // 日付の新しい順にソート
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
    )
  }, [uniqueScores])

  // 検索フィルター
  const filteredTests = useMemo(() => {
    return groupedTests.filter(
      (test) => test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) || test.test_date.includes(searchTerm),
    )
  }, [groupedTests, searchTerm])

  // テスト結果をクリックしたときの処理
  const handleRowClick = (testName: string, testDate: string) => {
    const basePath = isDashboard ? "/admin/results" : "/results"
    const encodedTestName = encodeURIComponent(testName)
    const encodedTestDate = encodeURIComponent(testDate)
    router.push(`${basePath}/${encodedTestName}/${encodedTestDate}`)
  }

  // 日付を日本語形式に変換
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>テスト結果一覧</CardTitle>
        <CardDescription>過去のテスト結果を確認できます</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="テスト名や日付で検索..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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

        {filteredTests.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">テスト結果が見つかりませんでした</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>テスト名</TableHead>
                  <TableHead>実施日</TableHead>
                  <TableHead>受験者数</TableHead>
                  <TableHead>平均点</TableHead>
                  <TableHead>はり師合格率</TableHead>
                  <TableHead>きゅう師合格率</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow
                    key={`${test.test_name}-${test.test_date}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(test.test_name, test.test_date)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        {test.test_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        {formatDate(test.test_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        {test.count}名
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={test.avgScore >= 70 ? "default" : "secondary"}>
                        {test.avgScore.toFixed(1)}点
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={test.acupuncturistPassingRate >= 60 ? "success" : "destructive"}>
                        {test.acupuncturistPassingRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={test.moxibustionistPassingRate >= 60 ? "success" : "destructive"}>
                        {test.moxibustionistPassingRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`${isDashboard ? "/admin/results" : "/results"}/${encodeURIComponent(test.test_name)}/${encodeURIComponent(test.test_date)}`}
                        className="flex items-center"
                      >
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">詳細を見る</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
