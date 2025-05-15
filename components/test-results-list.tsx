"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Calendar, Users, CheckCircle, Sun, Moon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 成績データの型定義
type TestScore = {
  id: string
  student_id: string
  name?: string
  test_name: string
  test_date: string
  section_a?: number
  section_b?: number
  section_c?: number
  section_d?: number
  section_ad?: number
  section_bc?: number
  total_score?: number
}

// テスト情報の型定義
type TestInfo = {
  test_name: string
  test_date: string
  displayName: string
}

// 学生グループの型定義
type StudentGroup = "day" | "evening" | "all"

interface TestResultsListProps {
  scores: TestScore[]
}

export default function TestResultsList({ scores }: TestResultsListProps) {
  // 並べ替えオプション
  const [sortOption, setSortOption] = useState<string>("student_id")

  // 表示するグループ（全体、昼間部、夜間部）
  const [viewGroup, setViewGroup] = useState<StudentGroup>("all")

  // 合格基準
  const PASSING_SCORE_AD = 132 // AD問題の合格点
  const PASSING_SCORE_BC = 44 // BC問題の合格点

  // 学生が昼間部か夜間部かを判定する関数
  const getStudentGroup = (studentId: string): StudentGroup => {
    if (studentId.length >= 3) {
      const thirdDigit = studentId.charAt(2)
      if (thirdDigit === "2") return "day"
      if (thirdDigit === "3") return "evening"
    }
    return "all" // デフォルト値
  }

  // 合格判定関数
  const isPassingScore = (score: TestScore) => {
    const adPassing = (score.section_ad || 0) >= PASSING_SCORE_AD
    const bcPassing = (score.section_bc || 0) >= PASSING_SCORE_BC
    return { adPassing, bcPassing, allPassing: adPassing && bcPassing }
  }

  // テスト情報を抽出
  const testInfos = useMemo(() => {
    const uniqueTests = new Map<string, TestInfo>()

    scores.forEach((score) => {
      const key = `${score.test_name}_${score.test_date}`
      if (!uniqueTests.has(key)) {
        uniqueTests.set(key, {
          test_name: score.test_name,
          test_date: score.test_date,
          displayName: `${score.test_name} (${new Date(score.test_date).toLocaleDateString("ja-JP")})`,
        })
      }
    })

    // 日付の新しい順に並べ替え
    return Array.from(uniqueTests.values()).sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
    )
  }, [scores])

  // テストごとにスコアをグループ化
  const groupedScores = useMemo(() => {
    const grouped = new Map<string, TestScore[]>()

    testInfos.forEach((testInfo) => {
      const key = `${testInfo.test_name}_${testInfo.test_date}`
      const testScores = scores.filter(
        (score) => score.test_name === testInfo.test_name && score.test_date === testInfo.test_date,
      )
      grouped.set(key, testScores)
    })

    return grouped
  }, [scores, testInfos])

  // 並べ替え関数
  const sortScores = (scores: TestScore[], option: string) => {
    return [...scores].sort((a, b) => {
      if (option === "student_id") {
        return a.student_id.localeCompare(b.student_id)
      } else if (option === "section_ad") {
        const adA = a.section_ad || 0
        const adB = b.section_ad || 0
        return adB - adA // 降順（高い順）
      } else if (option === "section_bc") {
        const bcA = a.section_bc || 0
        const bcB = b.section_bc || 0
        return bcB - bcA // 降順（高い順）
      } else if (option === "total_score") {
        const totalA = a.total_score || 0
        const totalB = b.total_score || 0
        return totalB - totalA // 降順（高い順）
      }
      return 0
    })
  }

  // 合格者数を計算
  const calculatePassingStats = (scores: TestScore[], group: StudentGroup = "all") => {
    // グループでフィルタリング
    const filteredScores =
      group === "all" ? scores : scores.filter((score) => getStudentGroup(score.student_id) === group)

    const count = filteredScores.length
    if (count === 0)
      return {
        adPassCount: 0,
        bcPassCount: 0,
        totalPassCount: 0,
        adPassRate: "0.0",
        bcPassRate: "0.0",
        totalPassRate: "0.0",
        count: 0,
      }

    let adPassCount = 0
    let bcPassCount = 0
    let totalPassCount = 0

    filteredScores.forEach((score) => {
      const { adPassing, bcPassing, allPassing } = isPassingScore(score)
      if (adPassing) adPassCount++
      if (bcPassing) bcPassCount++
      if (allPassing) totalPassCount++
    })

    return {
      adPassCount,
      bcPassCount,
      totalPassCount,
      adPassRate: ((adPassCount / count) * 100).toFixed(1),
      bcPassRate: ((bcPassCount / count) * 100).toFixed(1),
      totalPassRate: ((totalPassCount / count) * 100).toFixed(1),
      count,
    }
  }

  // 平均点を計算
  const calculateAverages = (scores: TestScore[], group: StudentGroup = "all") => {
    // グループでフィルタリング
    const filteredScores =
      group === "all" ? scores : scores.filter((score) => getStudentGroup(score.student_id) === group)

    const count = filteredScores.length
    if (count === 0)
      return {
        section_a: 0,
        section_b: 0,
        section_c: 0,
        section_d: 0,
        section_ad: 0,
        section_bc: 0,
        total_score: 0,
        count: 0,
      }

    return {
      section_a: filteredScores.reduce((sum, score) => sum + (score.section_a || 0), 0) / count,
      section_b: filteredScores.reduce((sum, score) => sum + (score.section_b || 0), 0) / count,
      section_c: filteredScores.reduce((sum, score) => sum + (score.section_c || 0), 0) / count,
      section_d: filteredScores.reduce((sum, score) => sum + (score.section_d || 0), 0) / count,
      section_ad: filteredScores.reduce((sum, score) => sum + (score.section_ad || 0), 0) / count,
      section_bc: filteredScores.reduce((sum, score) => sum + (score.section_bc || 0), 0) / count,
      total_score: filteredScores.reduce((sum, score) => sum + (score.total_score || 0), 0) / count,
      count,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">{testInfos.length}個のテストが登録されています</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">並べ替え:</span>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="並べ替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student_id">学生ID順</SelectItem>
              <SelectItem value="section_ad">AD問題点数順</SelectItem>
              <SelectItem value="section_bc">BC問題点数順</SelectItem>
              <SelectItem value="total_score">合計点数順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {testInfos.map((testInfo) => {
          const key = `${testInfo.test_name}_${testInfo.test_date}`
          const testScores = groupedScores.get(key) || []
          const sortedScores = sortScores(testScores, sortOption)

          // 全体、昼間部、夜間部の平均点を計算
          const allAverages = calculateAverages(testScores, "all")
          const dayAverages = calculateAverages(testScores, "day")
          const eveningAverages = calculateAverages(testScores, "evening")

          // 全体、昼間部、夜間部の合格状況を計算
          const allPassingStats = calculatePassingStats(testScores, "all")
          const dayPassingStats = calculatePassingStats(testScores, "day")
          const eveningPassingStats = calculatePassingStats(testScores, "evening")

          return (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-left">
                  <span className="font-medium">{testInfo.test_name}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(testInfo.test_date).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{allAverages.count}名</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    合格率 {allPassingStats.totalPassRate}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="mt-2">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">試験概要</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <Tabs defaultValue="all" className="mb-4">
                      <TabsList>
                        <TabsTrigger value="all" onClick={() => setViewGroup("all")}>
                          <Users className="h-4 w-4 mr-1" />
                          全体 ({allAverages.count}名)
                        </TabsTrigger>
                        <TabsTrigger value="day" onClick={() => setViewGroup("day")}>
                          <Sun className="h-4 w-4 mr-1" />
                          昼間部 ({dayAverages.count}名)
                        </TabsTrigger>
                        <TabsTrigger value="evening" onClick={() => setViewGroup("evening")}>
                          <Moon className="h-4 w-4 mr-1" />
                          夜間部 ({eveningAverages.count}名)
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">平均点</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium">{allAverages.section_ad.toFixed(1)}</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium">{allAverages.section_bc.toFixed(1)}</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">合計</div>
                                <div className="font-medium">{allAverages.total_score.toFixed(1)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">合格基準</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium text-primary">{PASSING_SCORE_AD}点以上</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium text-primary">{PASSING_SCORE_BC}点以上</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">判定</div>
                                <div className="font-medium text-primary">両方必要</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">合格状況</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium text-green-600">{allPassingStats.adPassRate}%</div>
                                <div className="text-xs">
                                  {allPassingStats.adPassCount}/{allAverages.count}名
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium text-green-600">{allPassingStats.bcPassRate}%</div>
                                <div className="text-xs">
                                  {allPassingStats.bcPassCount}/{allAverages.count}名
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">総合</div>
                                <div className="font-medium text-green-600">{allPassingStats.totalPassRate}%</div>
                                <div className="text-xs">
                                  {allPassingStats.totalPassCount}/{allAverages.count}名
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-sm">
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">A問題</div>
                            <div className="font-medium">{allAverages.section_a.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">B問題</div>
                            <div className="font-medium">{allAverages.section_b.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">C問題</div>
                            <div className="font-medium">{allAverages.section_c.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">D問題</div>
                            <div className="font-medium">{allAverages.section_d.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">AD問題</div>
                            <div className="font-medium">{allAverages.section_ad.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">BC問題</div>
                            <div className="font-medium">{allAverages.section_bc.toFixed(1)}</div>
                          </div>
                          <div className="bg-primary/10 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">合計</div>
                            <div className="font-medium">{allAverages.total_score.toFixed(1)}</div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="day" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">
                              <span className="flex items-center">
                                <Sun className="h-4 w-4 mr-1" />
                                昼間部平均点
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium">{dayAverages.section_ad.toFixed(1)}</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium">{dayAverages.section_bc.toFixed(1)}</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">合計</div>
                                <div className="font-medium">{dayAverages.total_score.toFixed(1)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">合格基準</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium text-primary">{PASSING_SCORE_AD}点以上</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium text-primary">{PASSING_SCORE_BC}点以上</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">判定</div>
                                <div className="font-medium text-primary">両方必要</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">昼間部合格状況</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium text-green-600">{dayPassingStats.adPassRate}%</div>
                                <div className="text-xs">
                                  {dayPassingStats.adPassCount}/{dayAverages.count}名
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium text-green-600">{dayPassingStats.bcPassRate}%</div>
                                <div className="text-xs">
                                  {dayPassingStats.bcPassCount}/{dayAverages.count}名
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">総合</div>
                                <div className="font-medium text-green-600">{dayPassingStats.totalPassRate}%</div>
                                <div className="text-xs">
                                  {dayPassingStats.totalPassCount}/{dayAverages.count}名
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-sm">
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">A問題</div>
                            <div className="font-medium">{dayAverages.section_a.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">B問題</div>
                            <div className="font-medium">{dayAverages.section_b.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">C問題</div>
                            <div className="font-medium">{dayAverages.section_c.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">D問題</div>
                            <div className="font-medium">{dayAverages.section_d.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">AD問題</div>
                            <div className="font-medium">{dayAverages.section_ad.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">BC問題</div>
                            <div className="font-medium">{dayAverages.section_bc.toFixed(1)}</div>
                          </div>
                          <div className="bg-primary/10 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">合計</div>
                            <div className="font-medium">{dayAverages.total_score.toFixed(1)}</div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="evening" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">
                              <span className="flex items-center">
                                <Moon className="h-4 w-4 mr-1" />
                                夜間部平均点
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium">{eveningAverages.section_ad.toFixed(1)}</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium">{eveningAverages.section_bc.toFixed(1)}</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">合計</div>
                                <div className="font-medium">{eveningAverages.total_score.toFixed(1)}</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">合格基準</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium text-primary">{PASSING_SCORE_AD}点以上</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium text-primary">{PASSING_SCORE_BC}点以上</div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">判定</div>
                                <div className="font-medium text-primary">両方必要</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">夜間部合格状況</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">AD問題</div>
                                <div className="font-medium text-green-600">{eveningPassingStats.adPassRate}%</div>
                                <div className="text-xs">
                                  {eveningPassingStats.adPassCount}/{eveningAverages.count}名
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">BC問題</div>
                                <div className="font-medium text-green-600">{eveningPassingStats.bcPassRate}%</div>
                                <div className="text-xs">
                                  {eveningPassingStats.bcPassCount}/{eveningAverages.count}名
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded-md shadow-sm">
                                <div className="text-xs text-muted-foreground">総合</div>
                                <div className="font-medium text-green-600">{eveningPassingStats.totalPassRate}%</div>
                                <div className="text-xs">
                                  {eveningPassingStats.totalPassCount}/{eveningAverages.count}名
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-sm">
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">A問題</div>
                            <div className="font-medium">{eveningAverages.section_a.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">B問題</div>
                            <div className="font-medium">{eveningAverages.section_b.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">C問題</div>
                            <div className="font-medium">{eveningAverages.section_c.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">D問題</div>
                            <div className="font-medium">{eveningAverages.section_d.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">AD問題</div>
                            <div className="font-medium">{eveningAverages.section_ad.toFixed(1)}</div>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">BC問題</div>
                            <div className="font-medium">{eveningAverages.section_bc.toFixed(1)}</div>
                          </div>
                          <div className="bg-primary/10 p-2 rounded-md">
                            <div className="text-xs text-muted-foreground">合計</div>
                            <div className="font-medium">{eveningAverages.total_score.toFixed(1)}</div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <div className="overflow-x-auto mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("student_id")}
                          >
                            学生ID
                            {sortOption === "student_id" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead>学生名</TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_a")}
                          >
                            A問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_b")}
                          >
                            B問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_c")}
                          >
                            C問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_d")}
                          >
                            D問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_ad")}
                          >
                            AD問題
                            {sortOption === "section_ad" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_bc")}
                          >
                            BC問題
                            {sortOption === "section_bc" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("total_score")}
                          >
                            合計
                            {sortOption === "total_score" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">判定</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedScores
                        .filter((score) => viewGroup === "all" || getStudentGroup(score.student_id) === viewGroup)
                        .map((score) => {
                          const { adPassing, bcPassing, allPassing } = isPassingScore(score)
                          const studentGroup = getStudentGroup(score.student_id)

                          return (
                            <TableRow key={score.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-1">
                                  {score.student_id}
                                  {studentGroup === "day" && <Sun className="h-3 w-3 text-amber-500" />}
                                  {studentGroup === "evening" && <Moon className="h-3 w-3 text-blue-500" />}
                                </div>
                              </TableCell>
                              <TableCell>{score.name || "名前なし"}</TableCell>
                              <TableCell className="text-right">{score.section_a || "-"}</TableCell>
                              <TableCell className="text-right">{score.section_b || "-"}</TableCell>
                              <TableCell className="text-right">{score.section_c || "-"}</TableCell>
                              <TableCell className="text-right">{score.section_d || "-"}</TableCell>
                              <TableCell
                                className={`text-right font-medium ${adPassing ? "bg-green-50 text-green-700" : ""}`}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  {score.section_ad || "-"}
                                  {adPassing && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </div>
                              </TableCell>
                              <TableCell
                                className={`text-right font-medium ${bcPassing ? "bg-green-50 text-green-700" : ""}`}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  {score.section_bc || "-"}
                                  {bcPassing && <CheckCircle className="h-4 w-4 text-green-500" />}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">{score.total_score || "-"}</TableCell>
                              <TableCell className="text-center">
                                {allPassing ? (
                                  <Badge className="bg-green-500">合格</Badge>
                                ) : (
                                  <Badge variant="destructive">不合格</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
