import { Award, Trophy, Medal, Star, BookOpen, Brain, Heart, Zap } from "lucide-react"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earned: boolean
}

interface BadgeDisplayProps {
  badges: Badge[]
  showAll?: boolean
}

export function BadgeDisplay({ badges, showAll = false }: BadgeDisplayProps) {
  // バッジがない場合のデフォルトバッジ
  const defaultBadges: Badge[] = [
    {
      id: "first_test",
      name: "初めての挑戦",
      description: "初めてのテストを受験",
      icon: "star",
      color: "blue",
      earned: true,
    },
    {
      id: "passing_score",
      name: "合格達成",
      description: "合格点を獲得",
      icon: "trophy",
      color: "green",
      earned: false,
    },
    {
      id: "top_rank",
      name: "トップランカー",
      description: "ランキング1位を獲得",
      icon: "medal",
      color: "yellow",
      earned: false,
    },
    {
      id: "perfect_anatomy",
      name: "解剖学マスター",
      description: "解剖学で満点を獲得",
      icon: "brain",
      color: "purple",
      earned: false,
    },
    {
      id: "oriental_expert",
      name: "東洋医学の達人",
      description: "東洋医学系で高得点を獲得",
      icon: "heart",
      color: "red",
      earned: false,
    },
    {
      id: "clinical_expert",
      name: "臨床医学の達人",
      description: "臨床医学系で高得点を獲得",
      icon: "zap",
      color: "orange",
      earned: false,
    },
  ]

  // バッジが提供されていない場合はデフォルトバッジを使用
  const displayBadges = badges && badges.length > 0 ? badges : defaultBadges

  // 獲得済みのバッジのみ表示するか、すべて表示するかを決定
  const filteredBadges = showAll ? displayBadges : displayBadges.filter((badge) => badge.earned)

  // バッジがない場合
  if (filteredBadges.length === 0) {
    return (
      <div className="text-center py-6">
        <Award className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">まだバッジを獲得していません</p>
        <p className="text-sm text-gray-400 mt-1">テストを受けて実績を獲得しましょう！</p>
      </div>
    )
  }

  // アイコンのマッピング
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "trophy":
        return <Trophy className="h-6 w-6" />
      case "medal":
        return <Medal className="h-6 w-6" />
      case "star":
        return <Star className="h-6 w-6" />
      case "book":
        return <BookOpen className="h-6 w-6" />
      case "brain":
        return <Brain className="h-6 w-6" />
      case "heart":
        return <Heart className="h-6 w-6" />
      case "zap":
        return <Zap className="h-6 w-6" />
      default:
        return <Award className="h-6 w-6" />
    }
  }

  // 色のマッピング
  const getColorClass = (color: string, earned: boolean) => {
    if (!earned) return "bg-gray-100 text-gray-400"

    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-600"
      case "green":
        return "bg-green-100 text-green-600"
      case "yellow":
        return "bg-yellow-100 text-yellow-600"
      case "red":
        return "bg-red-100 text-red-600"
      case "purple":
        return "bg-purple-100 text-purple-600"
      case "orange":
        return "bg-orange-100 text-orange-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {filteredBadges.map((badge) => (
        <div
          key={badge.id}
          className={`flex flex-col items-center p-4 rounded-lg ${getColorClass(
            badge.color,
            badge.earned,
          )} ${!badge.earned && "opacity-50"}`}
        >
          <div className="mb-2">{getIcon(badge.icon)}</div>
          <h3 className="font-medium text-center">{badge.name}</h3>
          <p className="text-xs text-center mt-1">{badge.description}</p>
          {!badge.earned && showAll && (
            <span className="text-xs mt-2 px-2 py-1 bg-white bg-opacity-50 rounded">未獲得</span>
          )}
        </div>
      ))}
    </div>
  )
}
