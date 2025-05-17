"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ResultsPage() {
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

    fetchResults(storedStudentId)
  }, [router])

  const fetchResults = async (id: string) => {
    setIsLoading(true)
    try {
      // テスト結果を取得
      const { data, error } = await supabase
        .from("test_scores")
        .select("*")
        .eq("student_id", id)
        .order("test_date", { ascending: false })

      if (error) throw error
      setResults(data || [])
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

  // 平均点を計算
  const calculateAverage = () => {
    if (results.length === 0) return 0
    const sum = results.reduce((acc, result) => acc + result.total_score, 0)
    return Math.round((sum / results.length) * 10) / 10
  }

  // 最高点を取得
  const getHighestScore = () => {
    if (results.length === 0) return 0
    return Math.max(...results.map((result) => result.total_score))
  }

  // 合格基準（例として設定、実際の基準に合わせて調整してください）
  const PASSING_SCORE = 180 // 合格点（例: 300点満点の60%）

  // 合格判定関数
  const isPassingScore = (score: any) => {
    return (score.total_score || 0) >= PASSING_SCORE
  }

  // 合格率を計算
  const calculatePassRate = () => {
    if (results.length === 0) return 0
    const passCount = results.filter((result) => isPassingScore(result)).length
    return Math.round((passCount / results.length) * 100)
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
              <CardDescription>学生ID: {studentId}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">テスト数</p>
                    <p className="text-3xl font-bold">{results.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">平均点</p>
                    <p className="text-3xl font-bold">{calculateAverage()}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">最高点</p>
                    <p className="text-3xl font-bold">{getHighestScore()}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">合格率</p>
                    <p className="text-3xl font-bold">{calculatePassRate()}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>テスト名</TableHead>
                    <TableHead>テスト日</TableHead>
                    <TableHead className="text-right">一般問題午前</TableHead>
                    <TableHead className="text-right">一般問題午後</TableHead>
                    <TableHead className="text-right">鍼師問題</TableHead>
                    <TableHead className="text-right">灸師問題</TableHead>
                    <TableHead className="text-right">合計</TableHead>
                    <TableHead className="text-center">判定</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => {
                    const passing = isPassingScore(result)

                    return (
                      <TableRow key={index}>
                        <TableCell>{result.test_name}</TableCell>
                        <TableCell>{result.test_date}</TableCell>
                        <TableCell className="text-right">
                          {result.general_morning !== null ? result.general_morning : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.general_afternoon !== null ? result.general_afternoon : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.acupuncturist !== null ? result.acupuncturist : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {result.moxibustion !== null ? result.moxibustion : "-"}
                        </TableCell>
                        <TableCell className="text-right font-bold">{result.total_score}</TableCell>
                        <TableCell className="text-center">
                          {passing ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              合格
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              不合格
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        テスト結果がありません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
