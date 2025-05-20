import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // URLからstudentIdを取得
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ error: "学生IDが指定されていません" }, { status: 400 })
    }

    console.log(`API: 学生ID ${studentId} の成績データを取得します`)

    // Supabaseクライアントを作成
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Supabase環境変数が設定されていません" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 学生IDを数値に変換
    const studentIdNum = Number.parseInt(studentId, 10)
    const isNumeric = !isNaN(studentIdNum)

    let data = null
    let error = null

    // 数値型として検索
    if (isNumeric) {
      console.log(`API: 数値型の学生ID ${studentIdNum} でクエリを実行します`)
      const result = await supabase
        .from("test_scores")
        .select("*")
        .eq("student_id", studentIdNum)
        .order("test_date", { ascending: false })

      if (!result.error) {
        data = result.data
      } else {
        error = result.error
        console.error("API: 数値型IDでの検索エラー:", error)
      }
    }

    // 数値型での検索に失敗した場合、文字列型として検索
    if (!data && error) {
      console.log(`API: 文字列型の学生ID "${studentId}" でクエリを実行します`)
      const result = await supabase
        .from("test_scores")
        .select("*")
        .eq("student_id", studentId)
        .order("test_date", { ascending: false })

      if (!result.error) {
        data = result.data
      } else {
        error = result.error
        console.error("API: 文字列型IDでの検索エラー:", error)
      }
    }

    // データが見つかった場合
    if (data && data.length > 0) {
      console.log(`API: ${data.length} 件の成績データが見つかりました`)
      return NextResponse.json({ success: true, data: data })
    }

    // データが見つからない場合
    return NextResponse.json({
      success: false,
      error: error ? error.message : "成績データが見つかりませんでした",
      data: [],
    })
  } catch (error) {
    console.error("API エラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "成績データの取得に失敗しました",
        data: [],
      },
      { status: 500 },
    )
  }
}
