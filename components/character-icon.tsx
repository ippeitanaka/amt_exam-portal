import Image from "next/image"
import { cn } from "@/lib/utils"

interface CharacterIconProps {
  size?: number
  className?: string
  animated?: boolean
}

export function CharacterIcon({ size = 32, className, animated = false }: CharacterIconProps) {
  return (
    <div
      className={cn("relative select-none", animated && "animate-pulse", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/character-icon-new.png"
        alt="キャラクターアイコン"
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  )
}
