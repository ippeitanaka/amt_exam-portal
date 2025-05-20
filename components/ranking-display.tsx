import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal } from "lucide-react"

interface RankingDisplayProps {
  rankings: any[]
  currentStudentId: string
  title: string
  description: string
  showDate?: boolean
}

export function RankingDisplay({
  rankings,
  currentStudentId,
  title,
  description,
  showDate = false,
}: RankingDisplayProps) {
  if (!rankings || rankings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4 text-gray-500">ランキングデータがありません</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">順位</TableHead>
                <TableHead>学生</TableHead>
                <TableHead className="text-right">得点</TableHead>
                {showDate && <TableHead className="text-right">日付</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((ranking) => {
                const isCurrentStudent = String(ranking.student_id) === String(currentStudentId)
                return (
                  <TableRow key={ranking.student_id} className={isCurrentStudent ? "bg-amber-50" : undefined}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {ranking.rank === 1 ? (
                          <Trophy className="h-5 w-5 text-yellow-500 mr-1" />
                        ) : ranking.rank === 2 ? (
                          <Medal className="h-5 w-5 text-gray-400 mr-1" />
                        ) : ranking.rank === 3 ? (
                          <Medal className="h-5 w-5 text-amber-600 mr-1" />
                        ) : null}
                        {ranking.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={isCurrentStudent ? "font-medium" : undefined}>
                          {ranking.student_name || `学生ID: ${ranking.student_id}`}
                        </span>
                        {isCurrentStudent && (
                          <Badge variant="outline" className="ml-2">
                            あなた
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{ranking.score.toFixed(1)}</TableCell>
                    {showDate && <TableCell className="text-right">{ranking.test_date}</TableCell>}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
