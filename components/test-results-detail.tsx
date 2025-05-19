"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Check, X, Info, TrendingUp, TrendingDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface TestScore {
  id: number
  student_id: number
  student_name?: string
  test_name: string
  test_date: string
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
  total_score: number
  basic_medicine_score?: number
  clinical_medicine_score?: number
  oriental_medicine_score?: number
  specialized_score?: number
  [key: string]: any
}

interface TestResultsDetailProps {
  testScores: TestScore[]
}

// 科目名と表示名のマッピング
const subjectLabels: Record<string, string> = {
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

// 科目グループ
const subjectGroups = {
  basic: ["medical_overview", "public_health", "related_laws", "anatomy", "physiology", "pathology"],
  clinical: ["clinical_medicine_overview", "clinical_medicine_detail", "rehabilitation"],
  oriental: [
    "oriental_medicine_overview",
    "meridian_points",
    "oriental_medicine_clinical",
    "oriental_medicine_clinical_general",
  ],
  specialized: ["acupuncture_theory", "moxibustion_theory"],
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

// 共通問題の満点
const COMMON_MAX_SCORE = 180

// 合格基準（60%）
const PASSING_PERCENTAGE = 0.6

// 合格基準点
const PASSING_SCORE = (COMMON_MAX_SCORE + 10) * PASSING_PERCENTAGE // 190点の60% = 114点

// パーセンタイルを計算する関数
function calculatePercentile(scores: number[], score: number): number {
  const sortedScores = [...scores].sort((a, b) => a - b)
  const index = sortedScores.findIndex((s) => s >= score)
  return Math.round((index / sortedScores.length) * 100)
}

// 偏差値を計算する関数
function calculateStandardScore(score: number, mean: number, stdDev: number): number {
  return ((score - mean) / stdDev) * 10 + 50
}

export function TestResultsDetail({ testScores }: TestResultsDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!testScores || testScores.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">テスト結果が見つかりませんでした</p>
        </CardContent>
      </Card>
    )
  }

  // 各学生の合計点を計算し、合格判定を追加
  const scoresWithPassFail = useMemo(
    () =>
      testScores.map((score) => {
        // 各科目グループの合計点を計算
        const basicMedicineScore = calculateGroupScore(score, subjectGroups.basic)
        const clinicalMedicineScore = calculateGroupScore(score, subjectGroups.clinical)
        const orientalMedicineScore = calculateGroupScore(score, subjectGroups.oriental)
        const specializedScore = calculateGroupScore(score, subjectGroups.specialized)

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

        return {
          ...score,
          basic_medicine_score: basicMedicineScore,
          clinical_medicine_score: clinicalMedicineScore,
          oriental_medicine_score: orientalMedicineScore,
          specialized_score: specializedScore,
          common_score: commonScore,
          acupuncturist_score: acupuncturistScore,
          moxibustionist_score: moxibustionistScore,
          acupuncturist_passing: isAcupuncturistPassing,
          moxibustionist_passing: isMoxibustionistPassing,
          // 両方合格の場合のみ合格とする
          passing: isAcupuncturistPassing && isMoxibustionistPassing,
        }
      }),
    [testScores],
  )

  // 分析データを計算
  const analysis = useMemo(() => {
    // 全体の平均点を計算
    const totalScores = scoresWithPassFail.map((s) => s.total_score)
    const averageScore = calculateAverage(totalScores)

    // 標準偏差を計算
    const stdDeviation = calculateStdDeviation(totalScores, averageScore)

    // 最高点と最低点
    const maxScore = Math.max(...totalScores)
    const minScore = Math.min(...totalScores)

    // 中央値
    const sortedScores = [...totalScores].sort((a, b) => a - b)
    const medianScore = sortedScores[Math.floor(sortedScores.length / 2)]

    // はり師合格者数と合格率を計算
    const acupuncturistPassingCount = scoresWithPassFail.filter((s) => s.acupuncturist_passing).length
    const acupuncturistPassingRate = (acupuncturistPassingCount / scoresWithPassFail.length) * 100

    // きゅう師合格者数と合格率を計算
    const moxibustionistPassingCount = scoresWithPassFail.filter((s) => s.moxibustionist_passing).length
    const moxibustionistPassingRate = (moxibustionistPassingCount / scoresWithPassFail.length) * 100

    // 科目別の平均点を計算
    const subjectAverages: Record<string, number> = {}
    const subjectMaxScores: Record<string, number> = {}
    const subjectMinScores: Record<string, number> = {}
    const subjectPassingRates: Record<string, number> = {}

    Object.keys(subjectLabels).forEach((subject) => {
      const scores = scoresWithPassFail.map((s) => s[subject] as number).filter((s) => s !== null && s !== undefined)
      subjectAverages[subject] = calculateAverage(scores)

      // 最高点と最低点
      subjectMaxScores[subject] = Math.max(...scores)
      subjectMinScores[subject] = Math.min(...scores)

      // 科目ごとの合格率 (60%以上を合格とする)
      const maxScore = MAX_SCORES[subject as keyof typeof MAX_SCORES] || 10
      const passingThreshold = maxScore * 0.6 // 60%以上を合格とする
      const passingCount = scores.filter((score) => score >= passingThreshold).length
      subjectPassingRates[subject] = (passingCount / scores.length) * 100
    })

    // 点数分布（ヒストグラム用のデータ）
    const scoreRanges = [
      { range: "0-10", count: 0 },
      { range: "11-20", count: 0 },
      { range: "21-30", count: 0 },
      { range: "31-40", count: 0 },
      { range: "41-50", count: 0 },
      { range: "51-60", count: 0 },
      { range: "61-70", count: 0 },
      { range: "71-80", count: 0 },
      { range: "81-90", count: 0 },
      { range: "91-100", count: 0 },
    ]

    totalScores.forEach((score) => {
      const index = Math.min(Math.floor(score / 10), 9)
      scoreRanges[index].count++
    })

    // 偏差値分布のデータ作成
    const standardScores = scoresWithPassFail
      .map((score) => {
        return {
          id: score.student_id,
          name: score.student_name || `学生ID: ${score.student_id}`,
          score: score.total_score,
          acupuncturist_score: score.acupuncturist_score,
          moxibustionist_score: score.moxibustionist_score,
          acupuncturist_passing: score.acupuncturist_passing,
          moxibustionist_passing: score.moxibustionist_passing,
          standardScore: calculateStandardScore(score.total_score, averageScore, stdDeviation),
        }
      })
      .sort((a, b) => b.standardScore - a.standardScore)

    // グループ別成績比較
    const groupComparison = [
      { name: "基礎医学", average: calculateAverage(scoresWithPassFail.map((s) => s.basic_medicine_score || 0)) },
      { name: "臨床医学", average: calculateAverage(scoresWithPassFail.map((s) => s.clinical_medicine_score || 0)) },
      { name: "東洋医学", average: calculateAverage(scoresWithPassFail.map((s) => s.oriental_medicine_score || 0)) },
      { name: "専門科目", average: calculateAverage(scoresWithPassFail.map((s) => s.specialized_score || 0)) },
    ]

    // 相関分析のためのデータ
    // 例: 基礎医学と臨床医学の相関
    const correlationData = scoresWithPassFail.map((score) => ({
      student_id: score.student_id,
      basicScore: score.basic_medicine_score || 0,
      clinicalScore: score.clinical_medicine_score || 0,
      orientalScore: score.oriental_medicine_score || 0,
      specializedScore: score.specialized_score || 0,
      totalScore: score.total_score,
    }))

    return {
      scores: scoresWithPassFail,
      averageScore,
      stdDeviation,
      maxScore,
      minScore,
      medianScore,
      acupuncturistPassingCount,
      acupuncturistPassingRate,
      moxibustionistPassingCount,
      moxibustionistPassingRate,
      subjectAverages,
      subjectMaxScores,
      subjectMinScores,
      subjectPassingRates,
      scoreRanges,
      standardScores,
      groupComparison,
      correlationData,
    }
  }, [scoresWithPassFail])

  // グラフ表示用の科目データ
  const subjectChartData = Object.entries(subjectLabels).map(([key, label]) => ({
    name: label,
    平均点: analysis.subjectAverages[key],
    最高点: analysis.subjectMaxScores[key],
    最低点: analysis.subjectMinScores[key],
    合格率: analysis.subjectPassingRates[key],
  }))

  // 配色用の定数
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]
  const PASS_COLOR = "#4ade80"
  const FAIL_COLOR = "#f87171"

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4 grid grid-cols-5 md:w-[600px]">
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="subjects">科目別分析</TabsTrigger>
        <TabsTrigger value="distribution">得点分布</TabsTrigger>
        <TabsTrigger value="correlation">相関分析</TabsTrigger>
        <TabsTrigger value="students">学生別成績</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">受験者数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.scores.length}名</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">平均点</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{analysis.averageScore.toFixed(1)}点</div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                最高点: {analysis.maxScore}点 / 最低点: {analysis.minScore}点 / 中央値: {analysis.medianScore}点
              </div>
              <div className="mt-2 flex items-center">
                <span className="mr-2 text-xs text-muted-foreground">標準偏差:</span>
                <span className="text-sm font-medium">{analysis.stdDeviation.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">合格率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">はり師:</span>
                    <span className="font-bold">{analysis.acupuncturistPassingRate.toFixed(1)}%</span>
                  </div>
                  <Progress
                    className="mt-1"
                    value={analysis.acupuncturistPassingRate}
                    indicatorColor={analysis.acupuncturistPassingRate >= 60 ? "bg-green-500" : "bg-amber-500"}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {analysis.acupuncturistPassingCount}名/{analysis.scores.length}名
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">きゅう師:</span>
                    <span className="font-bold">{analysis.moxibustionistPassingRate.toFixed(1)}%</span>
                  </div>
                  <Progress
                    className="mt-1"
                    value={analysis.moxibustionistPassingRate}
                    indicatorColor={analysis.moxibustionistPassingRate >= 60 ? "bg-green-500" : "bg-amber-500"}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {analysis.moxibustionistPassingCount}名/{analysis.scores.length}名
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>グループ別平均点</CardTitle>
              <CardDescription>各科目グループの平均点比較</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.groupComparison} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}点`, "平均点"]} />
                    <Legend />
                    <Bar dataKey="average" fill="#8884d8" name="平均点" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>点数分布</CardTitle>
              <CardDescription>得点帯ごとの学生数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.scoreRanges} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}名`, "学生数"]} />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="学生数">
                      {analysis.scoreRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index >= 6 ? PASS_COLOR : FAIL_COLOR} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>はり師試験 合格状況</CardTitle>
              <CardDescription>合格基準: 共通問題+はり理論の合計190点の60%以上（114点以上）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="80%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "合格", value: analysis.acupuncturistPassingCount },
                        { name: "不合格", value: analysis.scores.length - analysis.acupuncturistPassingCount },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      <Cell fill={PASS_COLOR} />
                      <Cell fill={FAIL_COLOR} />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}名`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>きゅう師試験 合格状況</CardTitle>
              <CardDescription>合格基準: 共通問題+きゅう理論の合計190点の60%以上（114点以上）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="80%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "合格", value: analysis.moxibustionistPassingCount },
                        { name: "不合格", value: analysis.scores.length - analysis.moxibustionistPassingCount },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      <Cell fill={PASS_COLOR} />
                      <Cell fill={FAIL_COLOR} />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}名`, ""]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="subjects">
        <Card>
          <CardHeader>
            <CardTitle>科目別成績分析</CardTitle>
            <CardDescription>各科目の平均点と合格率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="平均点" fill="#8884d8" />
                  <Bar yAxisId="left" dataKey="最高点" fill="#82ca9d" />
                  <Bar yAxisId="left" dataKey="最低点" fill="#ffc658" />
                  <Line yAxisId="right" type="monotone" dataKey="合格率" stroke="#ff7300" name="合格率(%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基礎医学系科目</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>科目</TableHead>
                    <TableHead className="text-right">平均点</TableHead>
                    <TableHead className="text-right">最高点</TableHead>
                    <TableHead className="text-right">合格率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectGroups.basic.map((subject) => (
                    <TableRow key={subject}>
                      <TableCell>{subjectLabels[subject]}</TableCell>
                      <TableCell className="text-right">
                        {analysis.subjectAverages[subject]?.toFixed(1) || "-"}
                      </TableCell>
                      <TableCell className="text-right">{analysis.subjectMaxScores[subject] || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={analysis.subjectPassingRates[subject] >= 60 ? "success" : "destructive"}>
                          {analysis.subjectPassingRates[subject]?.toFixed(1) || "-"}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>臨床医学系科目</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>科目</TableHead>
                    <TableHead className="text-right">平均点</TableHead>
                    <TableHead className="text-right">最高点</TableHead>
                    <TableHead className="text-right">合格率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectGroups.clinical.map((subject) => (
                    <TableRow key={subject}>
                      <TableCell>{subjectLabels[subject]}</TableCell>
                      <TableCell className="text-right">
                        {analysis.subjectAverages[subject]?.toFixed(1) || "-"}
                      </TableCell>
                      <TableCell className="text-right">{analysis.subjectMaxScores[subject] || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={analysis.subjectPassingRates[subject] >= 60 ? "success" : "destructive"}>
                          {analysis.subjectPassingRates[subject]?.toFixed(1) || "-"}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>東洋医学系科目</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>科目</TableHead>
                    <TableHead className="text-right">平均点</TableHead>
                    <TableHead className="text-right">最高点</TableHead>
                    <TableHead className="text-right">合格率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectGroups.oriental.map((subject) => (
                    <TableRow key={subject}>
                      <TableCell>{subjectLabels[subject]}</TableCell>
                      <TableCell className="text-right">
                        {analysis.subjectAverages[subject]?.toFixed(1) || "-"}
                      </TableCell>
                      <TableCell className="text-right">{analysis.subjectMaxScores[subject] || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={analysis.subjectPassingRates[subject] >= 60 ? "success" : "destructive"}>
                          {analysis.subjectPassingRates[subject]?.toFixed(1) || "-"}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>専門系科目</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>科目</TableHead>
                    <TableHead className="text-right">平均点</TableHead>
                    <TableHead className="text-right">最高点</TableHead>
                    <TableHead className="text-right">合格率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectGroups.specialized.map((subject) => (
                    <TableRow key={subject}>
                      <TableCell>{subjectLabels[subject]}</TableCell>
                      <TableCell className="text-right">
                        {analysis.subjectAverages[subject]?.toFixed(1) || "-"}
                      </TableCell>
                      <TableCell className="text-right">{analysis.subjectMaxScores[subject] || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={analysis.subjectPassingRates[subject] >= 60 ? "success" : "destructive"}>
                          {analysis.subjectPassingRates[subject]?.toFixed(1) || "-"}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="distribution">
        <Card>
          <CardHeader>
            <CardTitle>得点分布</CardTitle>
            <CardDescription>得点帯ごとの学生数分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.scoreRanges} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value}名`, "学生数"]}
                    labelFormatter={(label) => `得点帯: ${label}点`}
                  />
                  <Legend />
                  <Bar dataKey="count" name="学生数">
                    {analysis.scoreRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index >= 6 ? PASS_COLOR : FAIL_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex justify-between">
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-red-400"></div>
                <span className="text-sm">不合格ライン (70点未満)</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 rounded-full bg-green-400"></div>
                <span className="text-sm">合格ライン (70点以上)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>偏差値分布</CardTitle>
            <CardDescription>学生ごとの偏差値 (標準得点)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>順位</TableHead>
                  <TableHead>学生ID</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead className="text-right">得点</TableHead>
                  <TableHead className="text-right">偏差値</TableHead>
                  <TableHead className="text-right">状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.standardScores.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{student.id}</TableCell>
                    <TableCell>
                      {student.name && typeof student.name === "string" && student.name.trim() !== ""
                        ? student.name
                        : `学生ID: ${student.id}`}
                    </TableCell>
                    <TableCell className="text-right">{student.score.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{student.standardScore.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {student.standardScore >= 60 ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> 優秀
                        </Badge>
                      ) : student.standardScore >= 50 ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Info className="h-3 w-3" /> 平均以上
                        </Badge>
                      ) : student.standardScore >= 40 ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Info className="h-3 w-3" /> 平均以下
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" /> 要対策
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="correlation">
        <Card>
          <CardHeader>
            <CardTitle>科目間の相関分析</CardTitle>
            <CardDescription>各科目群の得点相関分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="basicScore" name="基礎医学系得点" unit="点" />
                  <YAxis type="number" dataKey="clinicalScore" name="臨床医学系得点" unit="点" />
                  <ZAxis type="number" dataKey="totalScore" range={[100, 400]} name="総合得点" unit="点" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => [`${value}点`, name]} />
                  <Legend />
                  <Scatter name="学生の成績" data={analysis.correlationData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              ※ 横軸は基礎医学系得点、縦軸は臨床医学系得点を表します。バブルの大きさは総合得点を表します。
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>東洋医学と専門科目の相関</CardTitle>
            <CardDescription>東洋医学系科目と専門科目の得点相関</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="orientalScore" name="東洋医学系得点" unit="点" />
                  <YAxis type="number" dataKey="specializedScore" name="専門科目得点" unit="点" />
                  <ZAxis type="number" dataKey="totalScore" range={[100, 400]} name="総合得点" unit="点" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => [`${value}点`, name]} />
                  <Legend />
                  <Scatter name="学生の成績" data={analysis.correlationData} fill="#82ca9d" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              ※ 横軸は東洋医学系得点、縦軸は専門科目得点を表します。バブルの大きさは総合得点を表します。
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="students">
        <Card>
          <CardHeader>
            <CardTitle>学生別成績一覧</CardTitle>
            <CardDescription>合格/不合格状況と各科目群の得点</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生ID</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead className="text-right">合計点</TableHead>
                    <TableHead className="text-right">基礎医学</TableHead>
                    <TableHead className="text-right">臨床医学</TableHead>
                    <TableHead className="text-right">東洋医学</TableHead>
                    <TableHead className="text-center">はり師</TableHead>
                    <TableHead className="text-center">きゅう師</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.scores
                    .sort((a, b) => b.total_score - a.total_score)
                    .map((score) => (
                      <TableRow key={score.id}>
                        <TableCell>{score.student_id}</TableCell>
                        <TableCell>
                          {score.student_name ||
                          (typeof score.student_name === "string" && score.student_name.trim() !== "")
                            ? score.student_name
                            : `学生ID: ${score.student_id}`}
                        </TableCell>
                        <TableCell className="text-right">{score.total_score.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{score.basic_medicine_score?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{score.clinical_medicine_score?.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{score.oriental_medicine_score?.toFixed(1)}</TableCell>
                        <TableCell className="text-center">
                          {score.acupuncturist_passing ? (
                            <div className="flex items-center justify-center">
                              <Check className="mr-1 h-4 w-4 text-green-500" />
                              <span className="text-green-600">合格</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <X className="mr-1 h-4 w-4 text-red-500" />
                              <span className="text-red-600">不合格</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {score.moxibustionist_passing ? (
                            <div className="flex items-center justify-center">
                              <Check className="mr-1 h-4 w-4 text-green-500" />
                              <span className="text-green-600">合格</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <X className="mr-1 h-4 w-4 text-red-500" />
                              <span className="text-red-600">不合格</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

// 科目グループの合計点を計算する関数
function calculateGroupScore(score: TestScore, subjects: string[]) {
  return subjects.reduce((total, subject) => {
    return total + (Number(score[subject as keyof TestScore]) || 0)
  }, 0)
}

// 平均値を計算する関数
function calculateAverage(values: number[]) {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

// 標準偏差を計算する関数
function calculateStdDeviation(values: number[], mean: number) {
  if (values.length <= 1) return 0
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}
