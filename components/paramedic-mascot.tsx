import Image from "next/image"
import { cn } from "@/lib/utils"

interface ParamedicMascotProps {
  width?: number
  height?: number
  type?: "paramedic" | "firefighter" | "nurse" | "doctor" | "acupuncturist"
  className?: string
  animated?: boolean
}

export function ParamedicMascot({
  width = 100,
  height = 100,
  type = "acupuncturist",
  className,
  animated = false,
}: ParamedicMascotProps) {
  return (
    <div className={cn("relative select-none", animated && "animate-bounce", className)}>
      <Image
        src="/images/character-icon-new.png"
        alt="マスコットキャラクター"
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  )
}
