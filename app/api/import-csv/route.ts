import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // CSVファイルを取得
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/24%E6%9C%9F%E7%94%9FID-UZj37SYowlEWDNiqVa2ARXrax14Cv5.csv",
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`)
    }

    const text = await response.text()

    // Supabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies })

    // CSVデータを直接処理
    const rows = text.split("\n")
    const students = []

    // ヘッダー行をスキップ
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) continue

      // カンマで分割
      const columns = row.split(",")

      if (columns.length >= 3) {
        const [name, studentId, password] = columns

        students.push({
          name: name.trim(),
          student_id: studentId.trim(),
          password: password.trim(),
        })
      }
    }

    if (students.length === 0) {
      return NextResponse.json({ error: "有効な学生データが見つかりませんでした" }, { status: 400 })
    }

    // 学生データをデータベースに挿入
    const { data, error } = await supabase.from("students").upsert(students, { onConflict: "student_id" }).select()

    if (error) {
      console.error("学生データの挿入エラー:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${students.length}人の学生データをインポートしました`,
      students: data,
    })
  } catch (error) {
    console.error("インポートエラー:", error)
    return NextResponse.json(
      {
        error: "学生データのインポートに失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
