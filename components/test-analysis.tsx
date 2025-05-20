"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Check, X, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

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
  total_score?: number
  [key: string]: any
}

interface TestAnalysisProps {
  testScore: TestScore
  allScores?: TestScore[]
}

// 科目名の日本語表示
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

// 配色用の定数
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]
const PASS_COLOR = "#4ade80"
const FAIL_COLOR = "#f87171"
const WARNING_COLOR = "#facc15"

export function TestAnalysis({ testScore, allScores = [] }: TestAnalysisProps) {
  const [activeTab, setActiveTab] = useState("overview")

  if (!testScore) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">テスト結果が見つかりませんでした</p>
        </CardContent>
      </Card>
    )
  }

  // 合計点の計算（存在しない場合）
  if (testScore.total_score === undefined) {
    let totalScore = 0
    Object.entries(subjectLabels).forEach(([key]) => {
      totalScore += Number(testScore[key]) || 0
    })
    testScore.total_score = Math.round(totalScore * 10) / 10
  }

  // 各科目グループの合計点を計算
  const basicMedicineScore = calculateGroupScore(testScore, subjectGroups.basic)
  const clinicalMedicineScore = calculateGroupScore(testScore, subjectGroups.clinical)
  const orientalMedicineScore = calculateGroupScore(testScore, subjectGroups.oriental)
  const specializedScore = calculateGroupScore(testScore, subjectGroups.specialized)

  // 共通問題の合計点を計算
  const commonScore = calculateGroupScore(testScore, [
    ...subjectGroups.basic,
    ...subjectGroups.clinical,
    ...subjectGroups.oriental,
  ])

  // はり師試験の合計点（共通問題 + はり理論）
  const acupuncturistScore = commonScore + (Number(testScore.acupuncture_theory) || 0)

  // きゅう師試験の合計点（共通問題 + きゅう理論）
  const moxibustionistScore = commonScore + (Number(testScore.moxibustion_theory) || 0)

  // はり師合格判定（共通問題 + はり理論の合計が114点以上）
  const isAcupuncturistPassing = acupuncturistScore >= PASSING_SCORE

  // きゅう師合格判定（共通問題 + きゅう理論の合計が114点以上）
  const isMoxibustionistPassing = moxibustionistScore >= PASSING_SCORE

  // 科目ごとの達成率を計算
  const subjectPerformance = Object.entries(subjectLabels).map(([key, label]) => {
    const score = Number(testScore[key]) || 0
    const maxScore = MAX_SCORES[key as keyof typeof MAX_SCORES] || 0
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
    return {
      subject: label,
      score,
      maxScore,
      percentage,
      status: percentage >= 60 ? "pass" : percentage >= 40 ? "warning" : "fail",
    }
  })

  // 科目グループごとの達成率を計算
  const groupPerformance = [
    {
      name: "基礎医学",
      value: basicMedicineScore,
      maxValue: calculateGroupMaxScore(subjectGroups.basic),
      fullMark: 100,
    },
    {
      name: "臨床医学",
      value: clinicalMedicineScore,
      maxValue: calculateGroupMaxScore(subjectGroups.clinical),
      fullMark: 100,
    },
    {
      name: "東洋医学",
      value: orientalMedicineScore,
      maxValue: calculateGroupMaxScore(subjectGroups.oriental),
      fullMark: 100,
    },
    {
      name: "専門科目",
      value: specializedScore,
      maxValue: calculateGroupMaxScore(subjectGroups.specialized),
      fullMark: 100,
    },
  ]

  // レーダーチャート用のデータ
  const radarData = groupPerformance.map((group) => ({
    subject: group.name,
    A: (group.value / group.maxValue) * 100, // パーセンテージに変換
    fullMark: 100,
  }))

  // 強み・弱みの分析
  const strengths = subjectPerformance
    .filter((subject) => subject.percentage >= 70)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)

  const weaknesses = subjectPerformance
    .filter((subject) => subject.percentage < 60)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3)

  // 合格までの必要点数
  const pointsNeededForAcupuncturist = isAcupuncturistPassing ? 0 : PASSING_SCORE - acupuncturistScore
  const pointsNeededForMoxibustionist = isMoxibustionistPassing ? 0 : PASSING_SCORE - moxibustionistScore

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4 grid grid-cols-3 w-full">
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="subjects">科目別分析</TabsTrigger>
        <TabsTrigger value="recommendations">学習アドバイス</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>総合成績</CardTitle>
              <CardDescription>
                試験日: {testScore.test_date} / {testScore.test_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">合計点</p>
                <p className="text-4xl font-bold">{testScore.total_score}点</p>
                <div className="mt-2 flex justify-center gap-2">
                  {isAcupuncturistPassing && isMoxibustionistPassing ? (
                    <Badge className="bg-green-500">両方合格</Badge>
                  ) : isAcupuncturistPassing ? (
                    <Badge className="bg-amber-500">はり師のみ合格</Badge>
                  ) : isMoxibustionistPassing ? (
                    <Badge className="bg-amber-500">きゅう師のみ合格</Badge>
                  ) : (
                    <Badge variant="destructive">両方不合格</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg p-3">
                  <p className="text-sm text-gray-500">はり師試験</p>
                  <p className="text-xl font-bold">{acupuncturistScore}点</p>
                  <div className="mt-1">
                    {isAcupuncturistPassing ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <Check className="h-4 w-4 mr-1" />
                        合格
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 text-sm">
                        <X className="h-4 w-4 mr-1" />
                        不合格 (あと{Math.ceil(pointsNeededForAcupuncturist)}点)
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <p className="text-sm text-gray-500">きゅう師試験</p>
                  <p className="text-xl font-bold">{moxibustionistScore}点</p>
                  <div className="mt-1">
                    {isMoxibustionistPassing ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <Check className="h-4 w-4 mr-1" />
                        合格
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600 text-sm">
                        <X className="h-4 w-4 mr-1" />
                        不合格 (あと{Math.ceil(pointsNeededForMoxibustionist)}点)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">基礎医学系</span>
                    <span className="text-sm font-medium">
                      {basicMedicineScore}/{calculateGroupMaxScore(subjectGroups.basic)}点
                    </span>
                  </div>
                  <Progress
                    value={(basicMedicineScore / calculateGroupMaxScore(subjectGroups.basic)) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">臨床医学系</span>
                    <span className="text-sm font-medium">
                      {clinicalMedicineScore}/{calculateGroupMaxScore(subjectGroups.clinical)}点
                    </span>
                  </div>
                  <Progress
                    value={(clinicalMedicineScore / calculateGroupMaxScore(subjectGroups.clinical)) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">東洋医学系</span>
                    <span className="text-sm font-medium">
                      {orientalMedicineScore}/{calculateGroupMaxScore(subjectGroups.oriental)}点
                    </span>
                  </div>
                  <Progress
                    value={(orientalMedicineScore / calculateGroupMaxScore(subjectGroups.oriental)) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">専門科目</span>
                    <span className="text-sm font-medium">
                      {specializedScore}/{calculateGroupMaxScore(subjectGroups.specialized)}点
                    </span>
                  </div>
                  <Progress
                    value={(specializedScore / calculateGroupMaxScore(subjectGroups.specialized)) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分野別達成度</CardTitle>
              <CardDescription>各分野の得点率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="得点率"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      isAnimationActive={true}
                    />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, "得点率"]} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>強みと弱み</CardTitle>
            <CardDescription>得点率に基づく科目別の強みと弱み</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  強み
                </h3>
                {strengths.length > 0 ? (
                  <div className="space-y-2">
                    {strengths.map((subject, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{subject.subject}</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {subject.score}/{subject.maxScore}
                          </span>
                          <Badge className="bg-green-500">{subject.percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">70%以上の得点率の科目がありません</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
                  弱み
                </h3>
                {weaknesses.length > 0 ? (
                  <div className="space-y-2">
                    {weaknesses.map((subject, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{subject.subject}</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-2">
                            {subject.score}/{subject.maxScore}
                          </span>
                          <Badge variant="destructive">{subject.percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">60%未満の得点率の科目がありません</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subjects">
        <Card>
          <CardHeader>
            <CardTitle>科目別得点</CardTitle>
            <CardDescription>各科目の得点と達成率</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">基礎医学系</h3>
                <div className="space-y-3">
                  {subjectGroups.basic.map((subject) => (
                    <div key={subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{subjectLabels[subject]}</span>
                        <span className="text-sm font-medium">
                          {testScore[subject] || 0}/{MAX_SCORES[subject as keyof typeof MAX_SCORES]}点
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Progress
                          value={((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100}
                          className="h-2 flex-grow"
                          indicatorColor={
                            ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 60
                              ? "bg-green-500"
                              : ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }
                        />
                        <span className="text-xs ml-2 w-10 text-right">
                          {(((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100).toFixed(
                            0,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">臨床医学系</h3>
                <div className="space-y-3">
                  {subjectGroups.clinical.map((subject) => (
                    <div key={subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{subjectLabels[subject]}</span>
                        <span className="text-sm font-medium">
                          {testScore[subject] || 0}/{MAX_SCORES[subject as keyof typeof MAX_SCORES]}点
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Progress
                          value={((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100}
                          className="h-2 flex-grow"
                          indicatorColor={
                            ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 60
                              ? "bg-green-500"
                              : ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }
                        />
                        <span className="text-xs ml-2 w-10 text-right">
                          {(((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100).toFixed(
                            0,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">東洋医学系</h3>
                <div className="space-y-3">
                  {subjectGroups.oriental.map((subject) => (
                    <div key={subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{subjectLabels[subject]}</span>
                        <span className="text-sm font-medium">
                          {testScore[subject] || 0}/{MAX_SCORES[subject as keyof typeof MAX_SCORES]}点
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Progress
                          value={((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100}
                          className="h-2 flex-grow"
                          indicatorColor={
                            ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 60
                              ? "bg-green-500"
                              : ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }
                        />
                        <span className="text-xs ml-2 w-10 text-right">
                          {(((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100).toFixed(
                            0,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">専門科目</h3>
                <div className="space-y-3">
                  {subjectGroups.specialized.map((subject) => (
                    <div key={subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{subjectLabels[subject]}</span>
                        <span className="text-sm font-medium">
                          {testScore[subject] || 0}/{MAX_SCORES[subject as keyof typeof MAX_SCORES]}点
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Progress
                          value={((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100}
                          className="h-2 flex-grow"
                          indicatorColor={
                            ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 60
                              ? "bg-green-500"
                              : ((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100 >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }
                        />
                        <span className="text-xs ml-2 w-10 text-right">
                          {(((testScore[subject] || 0) / MAX_SCORES[subject as keyof typeof MAX_SCORES]) * 100).toFixed(
                            0,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>科目グループ比較</CardTitle>
            <CardDescription>各科目グループの得点比較</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupPerformance}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "value") return [`${value}点`, "得点"]
                      if (name === "maxValue") return [`${value}点`, "満点"]
                      return [value, name]
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="得点" fill="#8884d8" />
                  <Bar dataKey="maxValue" name="満点" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recommendations">
        <Card>
          <CardHeader>
            <CardTitle>学習アドバイス</CardTitle>
            <CardDescription>成績に基づく学習改善のためのアドバイス</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-blue-800 font-medium mb-2 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  総合評価
                </h3>
                <p className="text-blue-700">
                  {testScore.total_score >= PASSING_SCORE
                    ? "現在の成績は合格ラインを超えています。このまま学習を継続して、さらなる得点アップを目指しましょう。"
                    : `現在の成績は合格ラインに達していません。あと${Math.ceil(
                        PASSING_SCORE - testScore.total_score,
                      )}点の得点アップが必要です。特に苦手科目を重点的に学習することをお勧めします。`}
                </p>
              </div>

              {weaknesses.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h3 className="text-amber-800 font-medium mb-2 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    重点的に学習すべき科目
                  </h3>
                  <ul className="space-y-2">
                    {weaknesses.map((subject, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{subject.subject}</span>
                        <Badge
                          variant={subject.percentage < 40 ? "destructive" : "outline"}
                          className="flex items-center"
                        >
                          {subject.percentage.toFixed(1)}% ({subject.score}/{subject.maxScore})
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-amber-700 mt-3">
                    これらの科目は得点率が低いため、重点的に学習することで効率的に総合点を上げることができます。
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">はり師試験対策</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        {isAcupuncturistPassing
                          ? "はり師試験は合格ラインに達しています。"
                          : `はり師試験はあと${Math.ceil(
                              pointsNeededForAcupuncturist,
                            )}点が必要です。以下の対策を行いましょう。`}
                      </p>
                      {!isAcupuncturistPassing && (
                        <ul className="text-sm space-y-1 mt-2">
                          <li>・ 経絡経穴概論の要点整理と暗記</li>
                          <li>・ はり理論の問題演習を増やす</li>
                          <li>・ 東洋医学臨床論の症例問題対策</li>
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">きゅう師試験対策</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        {isMoxibustionistPassing
                          ? "きゅう師試験は合格ラインに達しています。"
                          : `きゅう師試験はあと${Math.ceil(
                              pointsNeededForMoxibustionist,
                            )}点が必要です。以下の対策を行いましょう。`}
                      </p>
                      {!isMoxibustionistPassing && (
                        <ul className="text-sm space-y-1 mt-2">
                          <li>・ きゅう理論の基本事項の復習</li>
                          <li>・ 東洋医学概論の理解を深める</li>
                          <li>・ 過去問題の解き直しと解説の理解</li>
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-green-800 font-medium mb-2">効果的な学習方法</h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                    <span>
                      <strong>反復学習:</strong>{" "}
                      特に弱点科目は、同じ内容を繰り返し学習することで記憶の定着を図りましょう。
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                    <span>
                      <strong>アウトプット重視:</strong>{" "}
                      学んだ内容を自分の言葉で説明したり、問題を解いたりすることで理解度を高めましょう。
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                    <span>
                      <strong>過去問分析:</strong> 過去の国家試験問題を解き、出題傾向や自分の弱点を把握しましょう。
                    </span>
                  </li>
                </ul>
              </div>
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
    return total + (Number(score[subject]) || 0)
  }, 0)
}

// 科目グループの満点を計算する関数
function calculateGroupMaxScore(subjects: string[]) {
  return subjects.reduce((total, subject) => {
    return total + (MAX_SCORES[subject as keyof typeof MAX_SCORES] || 0)
  }, 0)
}
