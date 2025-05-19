"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ChevronRight, Search, Users, CalendarDays, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TestScore {
  id: number
  test_name: string
  test_date: string
  student_id: number
  total_score: number
  [key: string]: any
}

interface TestResultsListProps {
  scores: TestScore[]
  isDashboard?: boolean
  onSuccess?: () => void
}

export default function TestResultsList({ scores, isDashboard = false, onSuccess }: TestResultsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  // テスト名と日付でグループ化したテスト結果
  const groupedTests = useMemo(() => {
    const grouped = new Map<
      string,
      {
        test_name: string
        test_date: string
        count: number
        avgScore: number
        passingRate: number
      }
    >()

    // 各スコアに対して処理
    scores.forEach((score) => {
      const key = `${score.test_name}_${score.test_date}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          test_name: score.test_name,
          test_date: score.test_date,
          count: 0,
          avgScore: 0,
          passingRate: 0,
        })
      }

      const group = grouped.get(key)!
      group.count += 1

      // 平均点の計算用に合計を更新
      group.avgScore = (group.avgScore * (group.count - 1) + score.total_score) / group.count

      // 合格者数の計算（70点以上を合格とする）
      const isPassing = score.total_score >= 70
      if (isPassing) {
        group.passingRate = (((group.passingRate * (group.count - 1)) / 100 + (isPassing ? 1 : 0)) / group.count) * 100
      }
    })

    // 日付の新しい順にソート
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
    )
  }, [scores])

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
                  <TableHead>合格率</TableHead>
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
                      <Badge variant={test.passingRate >= 60 ? "success" : "destructive"}>
                        {test.passingRate.toFixed(1)}%
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
