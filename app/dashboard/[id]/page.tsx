"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import StudentDashboard from "@/components/student-dashboard"
import { getStudentScoresWithStats } from "@/lib/ranking-utils"
import LogoutButton from "@/components/logout-button"
import { Heart, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ParamedicMascot } from "@/components/paramedic-mascot"

export default function DashboardPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      try {
        // ローカルストレージから学生情報を取得
        const storedStudent = localStorage.getItem("currentStudent")

        if (!storedStudent) {
          console.error("学生情報がありません")
          router.push("/")
          return
        }

        const studentData = JSON.parse(storedStudent)

        // IDが一致するか確認
        if (studentData.id !== params.id) {
          console.error("学生IDが一致しません")
          router.push("/")
          return
        }

        setStudent(studentData)

        // 学生の成績と統計情報を取得
        const scoresData = await getStudentScoresWithStats(studentData.student_id)
        setScores(scoresData)
      } catch (err) {
        console.error("Dashboard error:", err)
        setError("データの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "学生情報が見つかりません"}</p>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-primary text-white rounded-md">
            ログインページに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white medical-pattern p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 card-decorated overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ParamedicMascot width={28} height={28} type="doctor" />
                  <div className="absolute -top-1 -right-1">
                    <Heart size={12} fill="#f43f5e" className="text-accent" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl">マイページ</CardTitle>
                  <CardDescription>{student.name} さんの模擬試験成績</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">学生ID: {student.student_id}</p>
              </div>
              <LogoutButton />
            </div>
          </CardContent>
        </Card>

        <StudentDashboard student={student} scores={scores} />
      </div>
    </main>
  )
}
