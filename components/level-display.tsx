"use client"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Zap } from "lucide-react"

interface LevelDisplayProps {
  level: number
  experience: number
  nextLevel: number
  progress: number
}

export function LevelDisplay({ level, experience, nextLevel, progress }: LevelDisplayProps) {
  // レベルに応じたタイトルを取得
  const getLevelTitle = (level: number) => {
    if (level <= 2) return "初心者"
    if (level <= 5) return "見習い"
    if (level <= 8) return "アドバンス"
    if (level <= 12) return "エキスパート"
    if (level <= 15) return "マスター"
    return "レジェンド"
  }

  // レベルに応じたアイコンを取得
  const getLevelIcon = (level: number) => {
    if (level <= 5) return <Star className="h-6 w-6 text-yellow-500" />
    if (level <= 10) return <Zap className="h-6 w-6 text-blue-500" />
    return <Trophy className="h-6 w-6 text-purple-500" />
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getLevelIcon(level)}
          <div>
            <h3 className="font-bold text-lg">レベル {level}</h3>
            <p className="text-sm text-gray-600">{getLevelTitle(level)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">経験値</p>
          <p className="font-medium">
            {experience} / {nextLevel}
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <p className="text-xs text-gray-500 mt-2">次のレベルまであと {nextLevel - experience} ポイント</p>
    </div>
  )
}
