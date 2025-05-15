"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Award,
  Star,
  Target,
  BookOpen,
  Activity,
  Calendar,
  CheckCircle,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { TestScoreWithStats } from "@/lib/ranking-utils"
import { motion } from "framer-motion"
import { ParamedicMascot } from "@/components/paramedic-mascot"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Student = {
  id: string
  name: string
  student_id: string
}

// 問題領域の表示名マッピング
const sectionNames = {
  section_a: "A問題（一般）",
  section_b: "B問題（必修）",
  section_c: "C問題（必修症例）",
  section_d: "D問題（一般症例）",
  section_ad: "AD問題（一般合計）",
  section_bc: "BC問題（必修合計）",
}

// アチーブメントの定義
const achievements = [
  {
    id: 1,
    name: "合格ライン突破",
    description: "合格ラインを超えました",
    icon: <Award className="h-5 w-5" />,
    color: "bg-green-500",
  },
  {
    id: 2,
    name: "トップ10入り",
    description: "ランキングトップ10に入りました",
    icon: <Medal className="h-5 w-5" />,
    color: "bg-blue-500",
  },
  {
    id: 3,
    name: "連続合格",
    description: "3回連続で合格ラインを超えました",
    icon: <Activity className="h-5 w-5" />,
    color: "bg-purple-500",
  },
  {
    id: 4,
    name: "学習マスター",
    description: "全ての分野で平均点以上を獲得",
    icon: <BookOpen className="h-5 w-5" />,
    color: "bg-indigo-500",
  },
]

export default function StudentDashboard({
  student,
  scores: propsScores,
}: {
  student: Student
  scores: TestScoreWithStats[]
}) {
  const [activeTab, setActiveTab] = useState("overview")
  const [scores, setScores] = useState<TestScoreWithStats[]>(propsScores)
  const [sortedScores, setScoresSorted] = useState([...scores])

  // 成績データがない場合
  if (scores.length === 0) {
    return (
      <Card className="card-decorated">
        <CardHeader>
          <CardTitle>成績データ</CardTitle>
          <CardDescription>現在の成績情報</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              まだ成績データがありません。模擬試験を受けると、ここに結果が表示されます。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Format data for the chart
  const chartData = scores
    .map((score) => ({
      date: new Date(score.test_date).toLocaleDateString("ja-JP"),
      name: score.test_name,
      score: score.total_score,
      rank: score.rank,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // 最新のスコア
  const latestScore = scores[0]

  // 成績の傾向分析
  const getTrend = () => {
    if (scores.length < 2) return { trend: "neutral", message: "まだ傾向を分析するのに十分なデータがありません" }

    const sortedScores = [...scores].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())
    const recentScores = sortedScores.slice(-3) // 最新の3つのスコア

    // 最新のスコアと1つ前のスコアを比較
    const latestScore = recentScores[recentScores.length - 1].total_score || 0
    const previousScore = recentScores[recentScores.length - 2].total_score || 0

    const difference = latestScore - previousScore

    if (difference > 5) {
      return {
        trend: "up",
        message: `前回より${difference.toFixed(1)}点上昇しています。このまま頑張りましょう！`,
        icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      }
    } else if (difference < -5) {
      return {
        trend: "down",
        message: `前回より${Math.abs(difference).toFixed(1)}点下降しています。復習を強化しましょう。`,
        icon: <TrendingDown className="h-5 w-5 text-red-500" />,
      }
    } else {
      return {
        trend: "neutral",
        message: "成績は安定しています。引き続き学習を続けましょう。",
        icon: <Minus className="h-5 w-5 text-blue-500" />,
      }
    }
  }

  const trend = getTrend()

  // 合格ラインに対する状況（新しい判定基準）
  const isPassingScore = (score: TestScoreWithStats) => {
    return (score.section_ad || 0) >= 132 && (score.section_bc || 0) >= 44
  }

  const passStatus = isPassingScore(latestScore)
    ? {
        status: "pass",
        message: "現在の成績は合格ラインを超えています。このまま維持しましょう！",
      }
    : {
        status: "fail",
        message: `合格には、AD問題（一般合計）が${Math.max(0, 132 - (latestScore.section_ad || 0))}点、BC問題（必修合計）が${Math.max(0, 44 - (latestScore.section_bc || 0))}点足りません。もう少し頑張りましょう！`,
      }

  // レーダーチャートのデータ
  const radarData = [
    {
      subject: "A問題\n（一般）",
      score: latestScore.section_a || 0,
      average: latestScore.avg_section_a || 0,
      fullMark: 50,
    },
    {
      subject: "B問題\n（必修）",
      score: latestScore.section_b || 0,
      average: latestScore.avg_section_b || 0,
      fullMark: 50,
    },
    {
      subject: "C問題\n（必修症例）",
      score: latestScore.section_c || 0,
      average: latestScore.avg_section_c || 0,
      fullMark: 50,
    },
    {
      subject: "D問題\n（一般症例）",
      score: latestScore.section_d || 0,
      average: latestScore.avg_section_d || 0,
      fullMark: 50,
    },
    {
      subject: "AD問題\n（一般合計）",
      score: latestScore.section_ad || 0,
      average: latestScore.avg_section_ad || 0,
      fullMark: 150, // AD領域の満点を調整
    },
    {
      subject: "BC問題\n（必修合計）",
      score: latestScore.section_bc || 0,
      average: latestScore.avg_section_bc || 0,
      fullMark: 50, // BC領域の満点を調整
    },
  ]

  // 実績の達成回数を計算
  const calculateAchievementCounts = () => {
    // 合格ライン突破回数
    const passingCount = scores.filter((score) => isPassingScore(score)).length

    // トップ10入り回数
    const top10Count = scores.filter((score) => score.rank <= 10).length

    // 連続合格回数（最大の連続回数を計算）
    let maxConsecutivePassing = 0
    let currentConsecutive = 0
    const sortedByDate = [...scores].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())

    sortedByDate.forEach((score) => {
      if (isPassingScore(score)) {
        currentConsecutive++
        maxConsecutivePassing = Math.max(maxConsecutivePassing, Math.floor(currentConsecutive / 3))
      } else {
        currentConsecutive = 0
      }
    })

    // 学習マスター回数（全分野で平均以上）
    const masterCount = scores.filter((score) =>
      Object.keys(sectionNames).every((section) => (score as any)[section] > (score as any)[`avg_${section}`]),
    ).length

    return {
      passingCount,
      top10Count,
      consecutivePassingCount: maxConsecutivePassing,
      masterCount,
    }
  }

  const achievementCounts = calculateAchievementCounts()

  // アチーブメントの計算（達成回数付き）
  const unlockedAchievements = [
    // 合格ライン突破
    { ...achievements[0], unlocked: achievementCounts.passingCount > 0, count: achievementCounts.passingCount },
    // トップ10入り
    { ...achievements[1], unlocked: achievementCounts.top10Count > 0, count: achievementCounts.top10Count },
    // 連続合格
    {
      ...achievements[2],
      unlocked: achievementCounts.consecutivePassingCount > 0,
      count: achievementCounts.consecutivePassingCount,
    },
    // 学習マスター
    { ...achievements[3], unlocked: achievementCounts.masterCount > 0, count: achievementCounts.masterCount },
  ]

  // 学習レベルの計算（実績達成回数に基づく）
  const totalAchievements =
    achievementCounts.passingCount +
    achievementCounts.top10Count +
    achievementCounts.consecutivePassingCount +
    achievementCounts.masterCount

  const studyLevel = Math.max(1, totalAchievements)

  // バッジを生成する関数
  const renderBadges = (count: number, color: string) => {
    return Array.from({ length: count }).map((_, index) => (
      <div key={index} className={`w-5 h-5 rounded-full ${color} flex items-center justify-center text-white text-xs`}>
        <Star className="h-3 w-3" />
      </div>
    ))
  }

  return (
    <Tabs defaultValue="overview" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-5 rounded-xl bg-muted/80">
        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Activity size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">概要</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <BookOpen size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">詳細成績</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="analysis" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Target size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">成績分析</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="ranking" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Medal size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">順位情報</span>
          </div>
        </TabsTrigger>
        <TabsTrigger value="achievements" className="rounded-lg data-[state=active]:bg-primary">
          <div className="flex items-center gap-1 md:gap-2">
            <Award size={14} className="md:h-4 md:w-4" />
            <span className="text-xs md:text-sm">実績</span>
          </div>
        </TabsTrigger>
      </TabsList>

      {/* 概要タブ */}
      <TabsContent value="overview" className="mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="card-decorated bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                成績概要
              </CardTitle>
              <CardDescription>模擬試験の成績推移</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                  <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">受験回数</p>
                        <div className="flex items-center justify-center mt-1">
                          <BookOpen className="h-5 w-5 text-primary mr-1" />
                          <p className="text-3xl font-bold">{scores.length}回</p>
                        </div>
                        <div className="mt-2">
                          <div className="level-badge from-blue-400 to-primary">Lv{studyLevel}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                  <Card className="overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-white to-green-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">最新の点数</p>
                        <div className="flex flex-col items-center justify-center mt-1 gap-3">
                          <div className="flex items-center justify-center gap-2">
                            <ParamedicMascot width={24} height={24} type="nurse" />
                            <div className="flex flex-col">
                              <span className="font-medium text-primary">AD問題（一般）</span>
                              <span className="text-2xl font-bold">{latestScore.section_ad || 0}点</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <ParamedicMascot width={24} height={24} type="doctor" />
                            <div className="flex flex-col">
                              <span className="font-medium text-secondary">BC問題（必修）</span>
                              <span className="text-2xl font-bold">{latestScore.section_bc || 0}点</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              passStatus.status === "pass"
                                ? "bg-green-100 text-green-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {passStatus.status === "pass" ? "合格ライン突破" : "もう少し"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                  <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-white to-pink-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500">総合順位</p>
                        <div className="flex items-center justify-center mt-1">
                          <Medal className="h-5 w-5 text-accent mr-1" />
                          <p className="text-3xl font-bold">{latestScore.total_rank || "-"}位</p>
                        </div>
                        <div className="mt-2">
                          {latestScore.avg_rank !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              平均順位: {latestScore.avg_rank.toFixed(1)}位
                            </span>
                          )}
                          {latestScore.total_rank <= 3 && (
                            <motion.div
                              animate={{ rotate: [0, 10, 0, -10, 0] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                              className="mt-1"
                            >
                              <Award className="h-5 w-5 text-yellow-500 mx-auto" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="h-80 w-full mb-8 bg-white p-4 rounded-xl shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} />
                    <YAxis domain={[0, 200]} stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 6, fill: "#0ea5e9", strokeWidth: 2, stroke: "white" }}
                      activeDot={{ r: 8, fill: "#0284c7" }}
                      name="点数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="h-96 w-full bg-white p-4 rounded-xl shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={120} data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <PolarRadiusAxis angle={30} domain={[0, "auto"]} stroke="#94a3b8" />
                    <Radar name="あなたの点数" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                    <Radar name="平均点" dataKey="average" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      {/* 詳細成績タブ */}
      <TabsContent value="details" className="mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="card-decorated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                詳細成績
              </CardTitle>
              <CardDescription>これまでの模擬試験の成績一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{scores.length}回の模擬試験を受験しています</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">並べ替え:</span>
                  <Select
                    defaultValue="test_date"
                    onValueChange={(value) => {
                      const sortedScores = [...scores].sort((a, b) => {
                        if (value === "test_date") {
                          return new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
                        } else if (value === "section_ad") {
                          return (b.section_ad || 0) - (a.section_ad || 0)
                        } else if (value === "section_bc") {
                          return (b.section_bc || 0) - (a.section_bc || 0)
                        } else if (value === "total_score") {
                          return (b.total_score || 0) - (a.total_score || 0)
                        }
                        return 0
                      })
                      setScores(sortedScores)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="並べ替え" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test_date">実施日順</SelectItem>
                      <SelectItem value="section_ad">AD問題点数順</SelectItem>
                      <SelectItem value="section_bc">BC問題点数順</SelectItem>
                      <SelectItem value="total_score">合計点数順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>試験名</TableHead>
                      <TableHead>実施日</TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        A問題
                        <br />
                        （一般）
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        B問題
                        <br />
                        （必修）
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        C問題
                        <br />
                        （必修症例）
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        D問題
                        <br />
                        （一般症例）
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        AD問題
                        <br />
                        （一般合計）
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-right">
                        BC問題
                        <br />
                        （必修合計）
                      </TableHead>
                      <TableHead className="text-right">合計</TableHead>
                      <TableHead className="text-center">順位</TableHead>
                      <TableHead className="text-center">判定</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map((score, index) => {
                      const adPassing = (score.section_ad || 0) >= 132
                      const bcPassing = (score.section_bc || 0) >= 44
                      const passed = adPassing && bcPassing

                      return (
                        <TableRow
                          key={score.id}
                          className={`hover:bg-blue-50/50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />
                              {score.test_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(score.test_date).toLocaleDateString("ja-JP")}
                            </div>
                          </TableCell>
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
                            <Badge variant="outline" className="bg-blue-50 border-blue-200">
                              {score.rank || "-"}位
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={passed ? "default" : "destructive"}
                              className={passed ? "bg-green-500" : ""}
                            >
                              {passed ? "合格" : "不合格"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">合格基準</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <div className="text-xs text-muted-foreground">AD問題（一般合計）</div>
                    <div className="font-medium text-primary">132点以上</div>
                  </div>
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <div className="text-xs text-muted-foreground">BC問題（必修合計）</div>
                    <div className="font-medium text-primary">44点以上</div>
                  </div>
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <div className="text-xs text-muted-foreground">判定</div>
                    <div className="font-medium text-primary">両方必要</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      {/* 成績分析タブ */}
      <TabsContent value="analysis" className="mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="card-decorated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                成績分析
              </CardTitle>
              <CardDescription>あなたの成績の傾向と対策</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      最近の傾向
                    </CardTitle>
                    {trend.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{trend.message}</p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-white to-green-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-secondary" />
                      合格ラインとの比較
                    </CardTitle>
                    <Badge
                      variant={passStatus.status === "pass" ? "default" : "outline"}
                      className={passStatus.status === "pass" ? "bg-green-500" : ""}
                    >
                      {passStatus.status === "pass" ? "合格ライン超え" : "もう少し"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{passStatus.message}</p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AD問題（一般合計）: {latestScore.section_ad || 0}点</span>
                        <span>合格ライン: 132点</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-value ${(latestScore.section_ad || 0) >= 132 ? "bg-green-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(100, ((latestScore.section_ad || 0) / 150) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>BC問題（必修合計）: {latestScore.section_bc || 0}点</span>
                        <span>合格ライン: 44点</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-value ${(latestScore.section_bc || 0) >= 44 ? "bg-green-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(100, ((latestScore.section_bc || 0) / 50) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {latestScore.previous_scores && (
                <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-white to-pink-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-accent" />
                      前回からの変化
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>問題領域</TableHead>
                            <TableHead className="text-right">前回</TableHead>
                            <TableHead className="text-right">今回</TableHead>
                            <TableHead className="text-right">変化</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>A問題（一般）</TableCell>
                            <TableCell className="text-right">
                              {(latestScore.section_a || 0) - (latestScore.previous_scores.section_a_change || 0)}
                            </TableCell>
                            <TableCell className="text-right">{latestScore.section_a || 0}</TableCell>
                            <TableCell
                              className={`text-right ${
                                latestScore.previous_scores.section_a_change > 0
                                  ? "text-green-600"
                                  : latestScore.previous_scores.section_a_change < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {latestScore.previous_scores.section_a_change > 0 && "+"}
                              {latestScore.previous_scores.section_a_change}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>B問題（必修）</TableCell>
                            <TableCell className="text-right">
                              {(latestScore.section_b || 0) - (latestScore.previous_scores.section_b_change || 0)}
                            </TableCell>
                            <TableCell className="text-right">{latestScore.section_b || 0}</TableCell>
                            <TableCell
                              className={`text-right ${
                                latestScore.previous_scores.section_b_change > 0
                                  ? "text-green-600"
                                  : latestScore.previous_scores.section_b_change < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {latestScore.previous_scores.section_b_change > 0 && "+"}
                              {latestScore.previous_scores.section_b_change}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>C問題（必修症例）</TableCell>
                            <TableCell className="text-right">
                              {(latestScore.section_c || 0) - (latestScore.previous_scores.section_c_change || 0)}
                            </TableCell>
                            <TableCell className="text-right">{latestScore.section_c || 0}</TableCell>
                            <TableCell
                              className={`text-right ${
                                latestScore.previous_scores.section_c_change > 0
                                  ? "text-green-600"
                                  : latestScore.previous_scores.section_c_change < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {latestScore.previous_scores.section_c_change > 0 && "+"}
                              {latestScore.previous_scores.section_c_change}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>D問題（一般症例）</TableCell>
                            <TableCell className="text-right">
                              {(latestScore.section_d || 0) - (latestScore.previous_scores.section_d_change || 0)}
                            </TableCell>
                            <TableCell className="text-right">{latestScore.section_d || 0}</TableCell>
                            <TableCell
                              className={`text-right ${
                                latestScore.previous_scores.section_d_change > 0
                                  ? "text-green-600"
                                  : latestScore.previous_scores.section_d_change < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {latestScore.previous_scores.section_d_change > 0 && "+"}
                              {latestScore.previous_scores.section_d_change}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>AD問題（一般合計）</TableCell>
                            <TableCell className="text-right">
                              {(latestScore.section_ad || 0) - (latestScore.previous_scores.section_ad_change || 0)}
                            </TableCell>
                            <TableCell className="text-right">{latestScore.section_ad || 0}</TableCell>
                            <TableCell
                              className={`text-right ${
                                latestScore.previous_scores.section_ad_change > 0
                                  ? "text-green-600"
                                  : latestScore.previous_scores.section_ad_change < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {latestScore.previous_scores.section_ad_change > 0 && "+"}
                              {latestScore.previous_scores.section_ad_change}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>BC問題（必修合計）</TableCell>
                            <TableCell className="text-right">
                              {(latestScore.section_bc || 0) - (latestScore.previous_scores.section_bc_change || 0)}
                            </TableCell>
                            <TableCell className="text-right">{latestScore.section_bc || 0}</TableCell>
                            <TableCell
                              className={`text-right ${
                                latestScore.previous_scores.section_bc_change > 0
                                  ? "text-green-600"
                                  : latestScore.previous_scores.section_bc_change < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {latestScore.previous_scores.section_bc_change > 0 && "+"}
                              {latestScore.previous_scores.section_bc_change}
                            </TableCell>
                          </TableRow>
                          <TableRow className="font-medium">
                            <TableCell>合計</TableCell>
                            <TableCell className="text-right">
                              {(latestScore.total_score || 0) - (latestScore.previous_scores.total_score_change || 0)}
                            </TableCell>
                            <TableCell className="text-right">{latestScore.total_score || 0}</TableCell>
                            <TableCell
                              className={`text-right ${
                                latestScore.previous_scores.total_score_change > 0
                                  ? "text-green-600"
                                  : latestScore.previous_scores.total_score_change < 0
                                    ? "text-red-600"
                                    : ""
                              }`}
                            >
                              {latestScore.previous_scores.total_score_change > 0 && "+"}
                              {latestScore.previous_scores.total_score_change}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    学習アドバイス
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>定期的に過去問を解いて、出題傾向に慣れましょう。</li>
                    <li>苦手分野を特定し、集中的に学習することで効率的に点数を上げられます。</li>
                    <li>模擬試験の結果を振り返り、間違えた問題を復習することが重要です。</li>
                    <li>
                      国家試験の合格ラインはAD問題（一般合計）132点以上、BC問題（必修合計）44点以上です。この基準を目指しましょう。
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      {/* 順位情報タブ */}
      <TabsContent value="ranking" className="mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="card-decorated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-primary" />
                順位情報
              </CardTitle>
              <CardDescription>あなたの模擬試験の順位と平均点の比較</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                  <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        最新テストの順位
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center mb-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">{latestScore.test_name}の順位</p>
                          <div className="flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: [0, 10, 0, -10, 0] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                            >
                              <Medal className="h-8 w-8 mr-2 text-yellow-500" />
                            </motion.div>
                            <span className="text-4xl font-bold">{latestScore.rank || "-"}位</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          あなたの点数: <span className="font-medium">{latestScore.total_score || 0}点</span>
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          平均点: <span className="font-medium">{latestScore.avg_total_score?.toFixed(1) || 0}点</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          平均点との差:
                          <span
                            className={`font-medium ${
                              (latestScore.total_score || 0) > (latestScore.avg_total_score || 0)
                                ? "text-green-600"
                                : (latestScore.total_score || 0) < (latestScore.avg_total_score || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.total_score || 0) - (latestScore.avg_total_score || 0)).toFixed(1)}点
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                  <Card className="overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-white to-green-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Medal className="h-5 w-5 text-secondary" />
                        総合順位（平均順位に基づく）
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center mb-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">あなたの総合順位</p>
                          <div className="flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: [0, 10, 0, -10, 0] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                            >
                              <Medal className="h-8 w-8 mr-2 text-blue-500" />
                            </motion.div>
                            <span className="text-4xl font-bold">{latestScore.total_rank || "-"}位</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        {latestScore.avg_rank !== undefined && (
                          <p className="text-sm text-gray-600 mb-2">
                            平均順位: <span className="font-medium">{latestScore.avg_rank.toFixed(1)}位</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          総合順位は、これまでのすべてのテストでの順位の平均に基づいています。
                          継続的に良い順位を維持することで、総合順位が上がります。
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* 順位の推移グラフ */}
              <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    順位の推移
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full bg-white p-4 rounded-xl shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData.map((item) => ({ ...item, invertedRank: item.rank ? -item.rank : 0 }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                        <YAxis
                          stroke="#888"
                          fontSize={12}
                          tickFormatter={(value) => `${Math.abs(value)}位`}
                          domain={["dataMin", "dataMax"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value, name) => {
                            if (name === "順位") {
                              return [`${Math.abs(value as number)}位`, name]
                            }
                            return [value, name]
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="invertedRank"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "white" }}
                          activeDot={{ r: 8, fill: "#2563eb" }}
                          name="順位"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-sm text-gray-500 mt-2 text-center">
                    ※グラフは上に行くほど順位が上位であることを示しています
                  </div>
                </CardContent>
              </Card>

              {/* 過去のテスト順位一覧 */}
              <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-white to-pink-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Medal className="h-5 w-5 text-accent" />
                    過去のテスト順位一覧
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>テスト名</TableHead>
                          <TableHead>実施日</TableHead>
                          <TableHead className="text-center">順位</TableHead>
                          <TableHead className="text-center">合計点</TableHead>
                          <TableHead className="text-center">平均点</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scores.map((score, index) => {
                          return (
                            <TableRow
                              key={score.id}
                              className={`hover:bg-blue-50/50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                            >
                              <TableCell className="font-medium">{score.test_name}</TableCell>
                              <TableCell>{new Date(score.test_date).toLocaleDateString("ja-JP")}</TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={score.rank <= 3 ? "default" : "outline"}
                                  className={score.rank <= 3 ? "bg-yellow-500" : "bg-blue-50 border-blue-200"}
                                >
                                  {score.rank || "-"}位
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{score.total_score || "-"}点</TableCell>
                              <TableCell className="text-center">
                                {score.avg_total_score?.toFixed(1) || "-"}点
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-white to-pink-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
                    最新テストの分野別比較
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>問題領域</TableHead>
                          <TableHead className="text-right">あなたの点数</TableHead>
                          <TableHead className="text-right">平均点</TableHead>
                          <TableHead className="text-right">差</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>A問題（一般）</TableCell>
                          <TableCell className="text-right">{latestScore.section_a || 0}</TableCell>
                          <TableCell className="text-right">{latestScore.avg_section_a?.toFixed(1) || 0}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (latestScore.section_a || 0) > (latestScore.avg_section_a || 0)
                                ? "text-green-600"
                                : (latestScore.section_a || 0) < (latestScore.avg_section_a || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.section_a || 0) - (latestScore.avg_section_a || 0)).toFixed(1)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>B問題（必修）</TableCell>
                          <TableCell className="text-right">{latestScore.section_b || 0}</TableCell>
                          <TableCell className="text-right">{latestScore.avg_section_b?.toFixed(1) || 0}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (latestScore.section_b || 0) > (latestScore.avg_section_b || 0)
                                ? "text-green-600"
                                : (latestScore.section_b || 0) < (latestScore.avg_section_b || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.section_b || 0) - (latestScore.avg_section_b || 0)).toFixed(1)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>C問題（必修症例）</TableCell>
                          <TableCell className="text-right">{latestScore.section_c || 0}</TableCell>
                          <TableCell className="text-right">{latestScore.avg_section_c?.toFixed(1) || 0}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (latestScore.section_c || 0) > (latestScore.avg_section_c || 0)
                                ? "text-green-600"
                                : (latestScore.section_c || 0) < (latestScore.avg_section_c || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.section_c || 0) - (latestScore.avg_section_c || 0)).toFixed(1)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>D問題（一般症例）</TableCell>
                          <TableCell className="text-right">{latestScore.section_d || 0}</TableCell>
                          <TableCell className="text-right">{latestScore.avg_section_d?.toFixed(1) || 0}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (latestScore.section_d || 0) > (latestScore.avg_section_d || 0)
                                ? "text-green-600"
                                : (latestScore.section_d || 0) < (latestScore.avg_section_d || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.section_d || 0) - (latestScore.avg_section_d || 0)).toFixed(1)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>AD問題（一般合計）</TableCell>
                          <TableCell className="text-right">{latestScore.section_ad || 0}</TableCell>
                          <TableCell className="text-right">{latestScore.avg_section_ad?.toFixed(1) || 0}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (latestScore.section_ad || 0) > (latestScore.avg_section_ad || 0)
                                ? "text-green-600"
                                : (latestScore.section_ad || 0) < (latestScore.avg_section_ad || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.section_ad || 0) - (latestScore.avg_section_ad || 0)).toFixed(1)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>BC問題（必修合計）</TableCell>
                          <TableCell className="text-right">{latestScore.section_bc || 0}</TableCell>
                          <TableCell className="text-right">{latestScore.avg_section_bc?.toFixed(1) || 0}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (latestScore.section_bc || 0) > (latestScore.avg_section_bc || 0)
                                ? "text-green-600"
                                : (latestScore.section_bc || 0) < (latestScore.avg_section_bc || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.section_bc || 0) - (latestScore.avg_section_bc || 0)).toFixed(1)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="font-medium">
                          <TableCell>合計</TableCell>
                          <TableCell className="text-right">{latestScore.total_score || 0}</TableCell>
                          <TableCell className="text-right">{latestScore.avg_total_score?.toFixed(1) || 0}</TableCell>
                          <TableCell
                            className={`text-right ${
                              (latestScore.total_score || 0) > (latestScore.avg_total_score || 0)
                                ? "text-green-600"
                                : (latestScore.total_score || 0) < (latestScore.avg_total_score || 0)
                                  ? "text-red-600"
                                  : ""
                            }`}
                          >
                            {((latestScore.total_score || 0) - (latestScore.avg_total_score || 0)).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      {/* 実績タブ */}
      <TabsContent value="achievements" className="mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="card-decorated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                実績とバッジ
              </CardTitle>
              <CardDescription>あなたの学習の成果を示すバッジとアチーブメント</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  学習レベル
                </h3>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="level-badge from-blue-400 to-primary text-lg w-12 h-12">{studyLevel}</div>
                    <div>
                      <h4 className="font-medium">レベル {studyLevel}</h4>
                      <p className="text-sm text-gray-600">実績を達成するたびにレベルアップします！</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 flex justify-between mb-1">
                      <span>現在のレベル</span>
                      <span>次のレベル</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-value bg-gradient-to-r from-blue-400 to-primary"
                        style={{ width: `100%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between mt-1">
                      <span>実績達成回数: {totalAchievements}回</span>
                      <span>次のレベルまであと1回の実績達成！</span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                獲得したバッジ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {unlockedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    whileHover={achievement.unlocked ? { scale: 1.03 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`achievement ${!achievement.unlocked ? "achievement-locked" : ""}`}
                  >
                    <div className={`achievement-icon ${achievement.color}`}>{achievement.icon}</div>
                    <div>
                      <h4 className="font-medium">{achievement.name}</h4>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                      {achievement.unlocked && (
                        <div className="flex gap-1 mt-1">{renderBadges(achievement.count, achievement.color)}</div>
                      )}
                    </div>
                    {achievement.unlocked && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        className="ml-auto"
                      >
                        <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                          {achievement.count}回達成
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                次の目標
              </h3>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <ul className="space-y-2">
                  {!unlockedAchievements[0].unlocked && (
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>合格ラインを突破しよう！</span>
                    </li>
                  )}
                  {!unlockedAchievements[1].unlocked && (
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>ランキングトップ10を目指そう！</span>
                    </li>
                  )}
                  {!unlockedAchievements[2].unlocked && (
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>3回連続で合格ラインを超えよう！</span>
                    </li>
                  )}
                  {!unlockedAchievements[3].unlocked && (
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span>全ての分野で平均点以上を獲得しよう！</span>
                    </li>
                  )}
                  {unlockedAchievements.every((a) => a.unlocked) && (
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>おめでとう！全てのバッジを獲得しました！さらに実績を積み重ねましょう！</span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex justify-center mt-8 gap-4">
                <ParamedicMascot width={50} height={50} type="nurse" />
                <ParamedicMascot width={50} height={50} type="doctor" />
                <ParamedicMascot width={50} height={50} type="firefighter" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}
