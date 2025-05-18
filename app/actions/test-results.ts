"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント（サービスロールキーが設定されている場合のみ使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getTestResults() {
  try {
    console.log("テスト結果取得を開始します")

    // まず通常のクライアントで試す
    let result = await supabase.from("test_scores").select("*").order("test_date", { ascending: false })

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (result.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      result = await adminSupabase.from("test_scores").select("*").order("test_date", { ascending: false })
    }

    if (result.error) {
      console.error("テスト結果取得エラー:", result.error)
      return { success: false, error: result.error.message, data: [] }
    }

    console.log("テスト結果を取得しました:", result.data?.length || 0, "件")
    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error("テスト結果取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果の取得に失敗しました",
      data: [],
    }
  }
}

export async function importTestResults(results: any[]) {
  try {
    if (!results || results.length === 0) {
      return { success: false, error: "インポートするデータがありません" }
    }

    console.log("テスト結果をインポートします:", results.length, "件")

    // テーブル構造を確認
    // まず通常のクライアントで試す
    let tableInfoResult = await supabase.from("test_scores").select("*").limit(1)

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (tableInfoResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      tableInfoResult = await adminSupabase.from("test_scores").select("*").limit(1)
    }

    if (tableInfoResult.error) {
      console.error("テーブル構造確認エラー:", tableInfoResult.error)
      return { success: false, error: `テーブル構造の確認に失敗しました: ${tableInfoResult.error.message}` }
    }

    // データベースのカラム名を取得
    const dbColumns =
      tableInfoResult.data && tableInfoResult.data.length > 0 ? Object.keys(tableInfoResult.data[0]) : []
    console.log("利用可能なカラム:", dbColumns)

    // 各結果をテーブル構造に合わせて整形
    const formattedResults = results.map((result) => {
      const formattedResult: Record<string, any> = {}

      // 基本項目を追加（必須項目）
      formattedResult.student_id = result.student_id
      formattedResult.test_name = result.test_name
      formattedResult.test_date = result.test_date
      formattedResult.total_score = result.total_score

      // 存在するカラムのみ追加
      if (dbColumns.includes("student_name") && result.student_name !== undefined) {
        formattedResult.student_name = result.student_name
      }

      if (dbColumns.includes("general_morning") && result.general_morning !== undefined) {
        formattedResult.general_morning = result.general_morning
      }

      if (dbColumns.includes("general_afternoon") && result.general_afternoon !== undefined) {
        formattedResult.general_afternoon = result.general_afternoon
      }

      if (dbColumns.includes("acupuncturist") && result.acupuncturist !== undefined) {
        formattedResult.acupuncturist = result.acupuncturist
      }

      if (dbColumns.includes("moxibustion") && result.moxibustion !== undefined) {
        formattedResult.moxibustion = result.moxibustion
      }

      if (dbColumns.includes("max_score")) {
        formattedResult.max_score = result.max_score || 300 // デフォルト値
      }

      return formattedResult
    })

    // データをインポート
    // まず通常のクライアントで試す
    let insertResult = await supabase.from("test_scores").insert(formattedResults)

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (insertResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      insertResult = await adminSupabase.from("test_scores").insert(formattedResults)
    }

    if (insertResult.error) {
      console.error("テスト結果インポートエラー:", insertResult.error)
      return { success: false, error: insertResult.error.message }
    }

    console.log("テスト結果のインポートが完了しました:", formattedResults.length, "件")
    return { success: true, count: formattedResults.length }
  } catch (error) {
    console.error("テスト結果インポートエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト結果のインポートに失敗しました",
    }
  }
}
