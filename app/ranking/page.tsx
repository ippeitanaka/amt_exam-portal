"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Medal, Loader2, AlertCircle, Trophy, Award, Crown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTotalRankings, getTestRankings } from "@/lib/ranking-utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { motion } from "framer-motion"

export default function RankingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalRankings, setTotalRankings] = useState<any[]>([])
  const [testRankings, setTestRankings] = useState<any[]>([])
  const [tests, setTests] = useState<{ name: string; date: string }[]>([])
  const [selectedTest, setSelectedTest] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // テスト一覧を取得
        const supabase = createClientComponentClient()
        const { data: testsData, error: testsError } = await supabase
          .from("test_scores")
          .select("test_name, test_date")
          .order("test_date", { ascending: false })
          .limit(100)

        if (testsError) throw testsError

        // 重複を除去
        const uniqueTests = Array.from(
          new Map(testsData.map((item) => [`${item.test_name}_${item.test_date}`, item])).values(),
        )
        setTests(uniqueTests)

        // 最新のテストを選択
        if (uniqueTests.length > 0) {
          const latestTest = uniqueTests[0]
          setSelectedTest(`${latestTest.test_name}_${latestTest.test_date}`)

          // 最新テストのランキングを取得
          const testRankingsData = await getTestRankings(latestTest.test_name, latestTest.test_date)
          setTestRankings(testRankingsData)
        }

        // 総合ランキングを取得
        const totalRankingsData = await getTotalRankings()
        setTotalRankings(totalRankingsData)
      } catch (err) {
        console.error("ランキング取得エラー:", err)
        setError("ランキングの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleTestChange = async (value: string) => {
    setSelectedTest(value)
    setLoading(true)

    try {
      const [testName, testDate] = value.split("_")
      const testRankingsData = await getTestRankings(testName, testDate)
      setTestRankings(testRankingsData)
    } catch (err) {
      console.error("テストランキング取得エラー:", err)
      setError("テストランキングの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  // メダル表示用の関数
  const getRankMedal = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
    return null
  }

  // 合格判定用の関数
  const isPassingScore = (score: any) => {
    return (score.section_ad || 0) >= 132 && (score.section_bc || 0) >= 44
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white medical-pattern p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6 card-decorated">
            <CardHeader>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                >
                  <Trophy className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl">ランキング</CardTitle>
                  <CardDescription>模擬試験の成績ランキング</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <Tabs defaultValue="test">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/80">
            <TabsTrigger value="test" className="rounded-lg data-[state=active]:bg-primary">
              <div className="flex items-center gap-2">
                <Trophy size={16} />
                <span>テスト別ランキング</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="total" className="rounded-lg data-[state=active]:bg-primary">
              <div className="flex items-center gap-2">
                <Award size={16} />
                <span>総合ランキング</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="mt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="card-decorated">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        テスト別ランキング
                      </CardTitle>
                      <CardDescription>各テストごとの点数ランキング</CardDescription>
                    </div>
                    <div className="w-full md:w-64">
                      <Select value={selectedTest} onValueChange={handleTestChange}>
                        <SelectTrigger className="rounded-full border-primary/30">
                          <SelectValue placeholder="テストを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {tests.map((test) => (
                            <SelectItem
                              key={`${test.test_name}_${test.test_date}`}
                              value={`${test.test_name}_${test.test_date}`}
                            >
                              {test.test_name} ({new Date(test.test_date).toLocaleDateString("ja-JP")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : testRankings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-16">順位</TableHead>
                            <TableHead>学生ID</TableHead>
                            <TableHead>名前</TableHead>
                            <TableHead className="text-right whitespace-nowrap">
                              AD問題
                              <br />
                              （一般合計）
                            </TableHead>
                            <TableHead className="text-right whitespace-nowrap">
                              BC問題
                              <br />
                              （必修合計）
                            </TableHead>
                            <TableHead className="text-right">合計点</TableHead>
                            <TableHead className="text-center">判定</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {testRankings.map((ranking, index) => {
                            const passed = isPassingScore(ranking)
                            return (
                              <motion.tr
                                key={ranking.student_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`${index < 3 ? "font-medium" : ""} ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50`}
                              >
                                <TableCell className="flex items-center">
                                  {getRankMedal(ranking.rank)}
                                  <span className={`ml-1 ${ranking.rank <= 3 ? "font-bold" : ""}`}>{ranking.rank}</span>
                                  {ranking.rank <= 3 && (
                                    <motion.div
                                      className="absolute -z-10"
                                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                    >
                                      <div
                                        className={`h-8 w-8 rounded-full ${
                                          ranking.rank === 1
                                            ? "bg-yellow-200"
                                            : ranking.rank === 2
                                              ? "bg-gray-200"
                                              : "bg-amber-200"
                                        }`}
                                      ></div>
                                    </motion.div>
                                  )}
                                </TableCell>
                                <TableCell>{ranking.student_id}</TableCell>
                                <TableCell>{ranking.name || "名前なし"}</TableCell>
                                <TableCell className="text-right">{ranking.section_ad || "-"}</TableCell>
                                <TableCell className="text-right">{ranking.section_bc || "-"}</TableCell>
                                <TableCell className="text-right font-medium">{ranking.total_score}</TableCell>
                                <TableCell className="text-center">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {passed ? "合格" : "不合格"}
                                  </span>
                                </TableCell>
                              </motion.tr>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Alert className="rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>ランキングデータがありません</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="total" className="mt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="card-decorated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    総合ランキング
                  </CardTitle>
                  <CardDescription>全テストの平均点によるランキング</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : totalRankings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-16">順位</TableHead>
                            <TableHead>学生ID</TableHead>
                            <TableHead>名前</TableHead>
                            <TableHead className="text-right">平均点</TableHead>
                            <TableHead className="text-center">バッジ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {totalRankings.map((ranking, index) => (
                            <motion.tr
                              key={ranking.student_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className={`${index < 3 ? "font-medium" : ""} ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50`}
                            >
                              <TableCell className="flex items-center">
                                {getRankMedal(ranking.rank)}
                                <span className={`ml-1 ${ranking.rank <= 3 ? "font-bold" : ""}`}>{ranking.rank}</span>
                                {ranking.rank <= 3 && (
                                  <motion.div
                                    className="absolute -z-10"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                  >
                                    <div
                                      className={`h-8 w-8 rounded-full ${
                                        ranking.rank === 1
                                          ? "bg-yellow-200"
                                          : ranking.rank === 2
                                            ? "bg-gray-200"
                                            : "bg-amber-200"
                                      }`}
                                    ></div>
                                  </motion.div>
                                )}
                              </TableCell>
                              <TableCell>{ranking.student_id}</TableCell>
                              <TableCell>{ranking.name || "名前なし"}</TableCell>
                              <TableCell className="text-right font-medium">{ranking.avg_score.toFixed(1)}</TableCell>
                              <TableCell className="text-center">
                                {ranking.rank === 1 && (
                                  <motion.div
                                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                                    transition={{
                                      duration: 2,
                                      repeat: Number.POSITIVE_INFINITY,
                                      repeatType: "reverse",
                                    }}
                                    className="inline-block"
                                  >
                                    <Crown className="h-5 w-5 text-yellow-500" />
                                  </motion.div>
                                )}
                                {ranking.rank === 2 && <Award className="h-5 w-5 text-gray-400 inline-block" />}
                                {ranking.rank === 3 && <Award className="h-5 w-5 text-amber-700 inline-block" />}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Alert className="rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>ランキングデータがありません</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
