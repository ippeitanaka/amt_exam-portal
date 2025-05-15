import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // テーブル情報を取得
    const { data: tables, error: tablesError } = await supabase.rpc("get_tables_info")

    if (tablesError) {
      // テーブル情報取得用の関数がない場合は作成
      await supabase.rpc("create_tables_info_function", {}, { count: "exact" })

      // 再度テーブル情報を取得
      const { data: tablesRetry, error: tablesRetryError } = await supabase.rpc("get_tables_info")

      if (tablesRetryError) {
        return NextResponse.json(
          {
            error: "テーブル情報の取得に失敗しました",
            details: tablesRetryError.message,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({
        tables: tablesRetry,
      })
    }

    return NextResponse.json({
      tables,
    })
  } catch (error) {
    console.error("テーブル確認エラー:", error)
    return NextResponse.json(
      {
        error: "テーブル情報の確認に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
