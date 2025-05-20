import { CharacterIcon } from "@/components/character-icon"

interface CharacterLoadingProps {
  message?: string
}

export function CharacterLoading({ message = "読み込み中..." }: CharacterLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <CharacterIcon size={80} animated={true} className="mx-auto mb-4" />
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}
