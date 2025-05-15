"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // ローカルストレージから学生情報を削除
    localStorage.removeItem("currentStudent")

    // ログインページにリダイレクト
    router.push("/")
  }

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-full transition-colors flex items-center gap-1"
    >
      <LogOut size={16} />
      ログアウト
    </Button>
  )
}
