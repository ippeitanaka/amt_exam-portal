import { CharacterIcon } from "./character-icon"
import { ModeToggle } from "./mode-toggle"

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title = "AMT模擬試験確認システム", subtitle }: HeaderProps) {
  return (
    <header className="bg-brown-500 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CharacterIcon size={40} className="bg-white rounded-full p-1" />
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-brown-100">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
