import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { checkAdminApiAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  // 認証チェック
  const authCheck = await checkAdminApiAuth(request as any)
  if (!authCheck.authenticated) {
    return authCheck.response
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { testName, testDate } = await request.json()

    if (!testName || !testDate) {
      return NextResponse.json({ error: "テスト名と日付が必要です" }, { status: 400 })
    }

    // 指定されたテスト名と日付に一致するすべてのテスト結果を削除
    const { data, error, count } = await supabase
      .from("test_scores")
      .delete()
      .eq("test_name", testName)
      .eq("test_date", testDate)
      .select()

    if (error) {
      console.error("テスト結果削除エラー:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length || 0}件のテスト結果を削除しました`,
      deletedCount: data?.length || 0,
    })
  } catch (error) {
    console.error("削除エラー:", error)
    return NextResponse.json(
      {
        error: "テスト結果の削除に失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    )
  }
}
