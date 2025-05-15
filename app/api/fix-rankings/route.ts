import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 管理者権限チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "認証されていません" }, { status: 401 })
    }

    const { data: adminCheck } = await supabase.from("admins").select("*").eq("id", user.id).single()

    if (!adminCheck) {
      return NextResponse.json({ error: "管理者権限がありません" }, { status: 403 })
    }

    // SQLファイルを読み込む
    const sqlFilePath = path.join(process.cwd(), "db", "fix_total_rankings.sql")
    const sql = fs.readFileSync(sqlFilePath, "utf8")

    // SQLを実行
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("ランキング関数の修正エラー:", error)
      return NextResponse.json({ error: `ランキング関数の修正に失敗しました: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "総合ランキング関数を修正しました" })
  } catch (error) {
    console.error("ランキング関数の修正中にエラーが発生しました:", error)
    return NextResponse.json(
      { error: `ランキング関数の修正中にエラーが発生しました: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}
