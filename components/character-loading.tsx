import { CharacterIcon } from "./character-icon"

interface CharacterLoadingProps {
  message?: string
}

export function CharacterLoading({ message = "読み込み中..." }: CharacterLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-bounce mb-4">
        <CharacterIcon size={64} />
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  )
}
