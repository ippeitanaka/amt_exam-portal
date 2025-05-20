"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Target, BarChart, TrendingUp, TrendingDown } from "lucide-react"

interface OverallRankingProps {
  averageRank: number
  totalTests: number
  bestRank: number
  bestTest: string
  percentile: number
}

export function OverallRankingDisplay({
  averageRank,
  totalTests,
  bestRank,
  bestTest,
  percentile,
}: OverallRankingProps) {
  // パーセンタイルに基づくメッセージ
  const getPercentileMessage = (percentile: number) => {
    if (percentile >= 90) return "トップクラスの成績です！"
    if (percentile >= 75) return "上位25%に入る優秀な成績です"
    if (percentile >= 50) return "平均以上の成績です"
    if (percentile >= 25) return "もう少し頑張りましょう"
    return "基礎からしっかり学習しましょう"
  }

  // パーセンタイルに基づくアイコン
  const getPercentileIcon = (percentile: number) => {
    if (percentile >= 75) return <TrendingUp className="h-5 w-5 text-green-500" />
    if (percentile >= 50) return <BarChart className="h-5 w-5 text-blue-500" />
    return <TrendingDown className="h-5 w-5 text-amber-500" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          総合ランキング
        </CardTitle>
        <CardDescription>全テストの平均順位と成績分布</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">平均順位</p>
            <p className="text-2xl font-bold">{averageRank}位</p>
            <p className="text-xs text-gray-500">{totalTests}回のテスト平均</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">パーセンタイル</p>
            <p className="text-2xl font-bold">{percentile}%</p>
            <p className="text-xs text-gray-500">上位{100 - Math.round(percentile)}%以内</p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <Target className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">最高順位</h3>
              <p className="text-blue-700">
                {bestTest}で<span className="font-bold">{bestRank}位</span>を獲得しました
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            {getPercentileIcon(percentile)}
            <div>
              <h3 className="font-medium">成績評価</h3>
              <p className="text-gray-700">{getPercentileMessage(percentile)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
