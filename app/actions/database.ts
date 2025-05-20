"use server"

import { createClient } from "@supabase/supabase-js"

// Supabaseクライアントを作成する関数
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase環境変数が設定されていません")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// データベース接続を確認するサーバーアクション
export async function checkDatabaseConnection() {
  try {
    console.log("サーバーサイドでデータベース接続を確認中...")

    // 環境変数の確認
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "設定済み" : "未設定",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
    }

    console.log("環境変数状態:", envVars)

    // 環境変数が設定されていない場合
    if (envVars.NEXT_PUBLIC_SUPABASE_URL === "未設定" || envVars.SUPABASE_SERVICE_ROLE_KEY === "未設定") {
      console.error("必要な環境変数が設定されていません")
      return {
        success: false,
        error: "システム設定エラー: データベース接続情報が設定されていません",
        envStatus: envVars,
      }
    }

    // Supabaseクライアントの作成
    const supabase = createSupabaseClient()

    // 集計関数を使わずにデータベース接続を確認
    // 最初の5件のデータを取得するだけで接続確認とする
    const { data: students, error: studentsError } = await supabase.from("students").select("*").limit(5)

    if (studentsError) {
      console.error("学生データ取得エラー:", studentsError)
      return {
        success: false,
        error: studentsError.message,
        code: studentsError.code,
      }
    }

    // 学生の総数を取得（サーバーサイドでは集計関数が使用可能）
    const { count, error: countError } = await supabase.from("students").select("*", { count: "exact", head: true })

    if (countError) {
      console.error("学生数取得エラー:", countError)
      // 接続自体は成功しているので、エラーは返さない
      return {
        success: true,
        studentCount: students?.length || 0,
        sampleData: students?.length > 0,
      }
    }

    return {
      success: true,
      studentCount: count || 0,
      sampleData: students?.length > 0,
    }
  } catch (error) {
    console.error("データベース接続確認エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース接続の確認に失敗しました",
    }
  }
}
