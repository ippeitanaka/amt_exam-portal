import Image from "next/image"

export type MascotType = "nurse" | "firefighter" | "doctor"

interface ParamedicMascotProps {
  width?: number
  height?: number
  className?: string
  type?: MascotType
}

export function ParamedicMascot({ width = 24, height = 24, className = "", type = "nurse" }: ParamedicMascotProps) {
  const mascotImages = {
    nurse: "/images/paramedic-nurse.png",
    firefighter: "/images/paramedic-firefighter.png",
    doctor: "/images/paramedic-doctor.png",
  }

  return (
    <div className={`relative inline-block ${className}`} style={{ width, height }}>
      <Image
        src={mascotImages[type] || "/placeholder.svg"}
        alt="救急救命士マスコット"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
