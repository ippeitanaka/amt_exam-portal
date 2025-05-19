"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharacterIcon } from "@/components/character-icon"
import { CharacterLoading } from "@/components/character-loading"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function TestsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [studentId, setStudentId] = useState("")
  const [tests, setTests] = useState<any[]>([])
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // ローカルストレージから学生情報を取得
    const storedStudentId = localStorage.getItem("studentId")

    if (!storedStudentId) {
      router.push("/login")
      return
    }

    setStudentId(storedStudentId)
    fetchTests(storedStudentId)
  }, [router])

  const fetchTests = async (id: string) => {
    setIsLoading(true)
    try {
      // 学生IDを数値に変換
      const studentIdNum = Number.parseInt(id, 10)

      if (isNaN(studentIdNum)) {
        throw new Error("有効な学生IDではありません")
      }

      // 学生のテスト結果を取得
      const { data: studentTests, error: studentTestsError } = await supabase
        .from("test_scores")
        .select("test_name, test_date")
        .eq("student_id", studentIdNum)
        .order("test_date", { ascending: false })

      if (studentTestsError) throw studentTestsError

      // 重複を除去
      const uniqueTests = studentTests?.filter(
        (test, index, self) => index === self.findIndex((t) => t.test_name === test.test_name),
      )

      setTests(uniqueTests || [])
    } catch (error) {
      console.error("データ取得エラー:", error)
      toast({
        title: "エラー",
        description: "テスト情報の取得に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <CharacterLoading message="テスト情報を読み込んでいます..." />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard" className="flex items-center">
              <ChevronLeft className="mr-1 h-4 w-4" />
              ダッシュボードに戻る
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center gap-3">
            <CharacterIcon size={40} />
            <div>
              <CardTitle>テスト一覧</CardTitle>
              <CardDescription>あなたが受験した模擬試験の一覧</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {tests.length > 0 ? (
              tests.map((test, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{test.test_name}</CardTitle>
                        <CardDescription>実施日: {test.test_date}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/results?test=${encodeURIComponent(test.test_name)}`}>成績を見る</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      鍼灸師国家試験の出題範囲に準拠した模擬試験です。一般問題（午前・午後）、鍼師問題、灸師問題から出題されています。
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="p-3 bg-gray-50 rounded-md">
                        <h4 className="font-medium text-sm">一般問題午前</h4>
                        <p className="text-sm text-gray-500">解剖学・生理学など</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <h4 className="font-medium text-sm">一般問題午後</h4>
                        <p className="text-sm text-gray-500">病理学・衛生学など</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <h4 className="font-medium text-sm">鍼師問題</h4>
                        <p className="text-sm text-gray-500">経絡経穴・鍼技術など</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-md">
                        <h4 className="font-medium text-sm">灸師問題</h4>
                        <p className="text-sm text-gray-500">灸理論・灸技術など</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <CharacterIcon size={64} />
                </div>
                <p className="text-gray-500">テスト情報がありません</p>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-brown-600 dark:text-brown-300">AMT模擬試験確認システム</p>
      </div>
    </main>
  )
}
