"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TestResultsListProps {
  scores: any[]
}

export default function TestResultsList({ scores }: TestResultsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("test_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // 合格基準（例として設定、実際の基準に合わせて調整してください）
  const PASSING_SCORE = 180 // 合格点（例: 300点満点の60%）

  // 合格判定関数
  const isPassingScore = (score: any) => {
    return (score.total_score || 0) >= PASSING_SCORE
  }

  // 検索フィルター
  const filteredScores = scores.filter(
    (score) =>
      score.student_id?.toString().includes(searchTerm) ||
      score.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.test_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // ソート
  const sortedScores = [...filteredScores].sort((a, b) => {
    if (sortField === "test_date") {
      const dateA = new Date(a[sortField]).getTime()
      const dateB = new Date(b[sortField]).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }

    if (typeof a[sortField] === "number" && typeof b[sortField] === "number") {
      return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
    }

    const valueA = String(a[sortField] || "")
    const valueB = String(b[sortField] || "")
    return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
  })

  // ソートの切り替え
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // ソートアイコンの表示
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="学生ID、名前、テスト名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("student_id")}>
                学生ID {getSortIcon("student_id")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("student_name")}>
                氏名 {getSortIcon("student_name")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("test_name")}>
                テスト名 {getSortIcon("test_name")}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("test_date")}>
                テスト日 {getSortIcon("test_date")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("general_morning")}>
                一般問題午前 {getSortIcon("general_morning")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("general_afternoon")}>
                一般問題午後 {getSortIcon("general_afternoon")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("acupuncturist")}>
                鍼師問題 {getSortIcon("acupuncturist")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("moxibustion")}>
                灸師問題 {getSortIcon("moxibustion")}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("total_score")}>
                合計 {getSortIcon("total_score")}
              </TableHead>
              <TableHead className="text-center">判定</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((score, index) => {
              const passing = isPassingScore(score)

              return (
                <TableRow key={index}>
                  <TableCell>{score.student_id}</TableCell>
                  <TableCell>{score.student_name || "-"}</TableCell>
                  <TableCell>{score.test_name}</TableCell>
                  <TableCell>{score.test_date}</TableCell>
                  <TableCell className="text-right">
                    {score.general_morning !== null ? score.general_morning : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {score.general_afternoon !== null ? score.general_afternoon : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {score.acupuncturist !== null ? score.acupuncturist : "-"}
                  </TableCell>
                  <TableCell className="text-right">{score.moxibustion !== null ? score.moxibustion : "-"}</TableCell>
                  <TableCell className="text-right font-bold">{score.total_score}</TableCell>
                  <TableCell className="text-center">
                    {passing ? (
                      <Badge className="bg-green-500">合格</Badge>
                    ) : (
                      <Badge variant="destructive">不合格</Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {sortedScores.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  検索結果がありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
