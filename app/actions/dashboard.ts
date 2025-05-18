"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 環境変数のログ出力（デバッグ用、本番環境では削除してください）
console.log("SUPABASE_URL:", supabaseUrl ? "設定されています" : "未設定")
console.log("SUPABASE_ANON_KEY:", supabaseAnonKey ? "設定されています" : "未設定")
console.log("SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "設定されています" : "未設定")

// 管理者用のクライアント（サービスロールキーを使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getDashboardData() {
  try {
    console.log("ダッシュボードデータ取得を開始します")

    // 並行してデータを取得
    const [testScoresResult, studentsResult, uniqueTestsResult] = await Promise.all([
      getTestScores(),
      getStudentCount(),
      getUniqueTests(),
    ])

    console.log("ダッシュボードデータを取得しました")

    return {
      success: true,
      testScores: testScoresResult.data || [],
      studentCount: studentsResult.count || 0,
      testCount: uniqueTestsResult.uniqueCount || 0,
      error: testScoresResult.error || studentsResult.error || uniqueTestsResult.error || null,
    }
  } catch (error) {
    console.error("ダッシュボードデータ取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データの取得に失敗しました",
      testScores: [],
      studentCount: 0,
      testCount: 0,
    }
  }
}

async function getTestScores() {
  try {
    // サービスロールキーを使用してテスト結果を取得
    console.log("テスト結果取得を開始します（サービスロールキー使用）")
    const result = await adminSupabase
      .from("test_scores")
      .select("*")
      .order("test_date", { ascending: false })
      .limit(10)

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

async function getStudentCount() {
  try {
    // サービスロールキーを使用してstudentsテーブルから学生数を取得
    console.log("studentsテーブルから学生数を取得します（サービスロールキー使用）")
    const result = await adminSupabase.from("students").select("student_id")

    if (result.error) {
      console.error("学生テーブル確認エラー:", result.error)
      // studentsテーブルにアクセスできない場合は、test_scoresテーブルから一意の学生IDを数える
      return getStudentCountFromTestScores()
    }

    const count = result.data?.length || 0
    console.log("学生数を取得しました:", count, "件")
    return { success: true, count }
  } catch (error) {
    console.error("学生数取得エラー:", error)
    // エラーが発生した場合もtest_scoresテーブルから取得を試みる
    return getStudentCountFromTestScores()
  }
}

// test_scoresテーブルから学生数を取得するヘルパー関数
async function getStudentCountFromTestScores() {
  try {
    console.log("test_scoresテーブルから学生数を取得します（サービスロールキー使用）")
    const result = await adminSupabase.from("test_scores").select("student_id")

    if (result.error) {
      console.error("テスト結果からの学生数取得エラー:", result.error)
      return { success: false, error: result.error.message, count: 0 }
    }

    // 一意の学生IDを数える
    const uniqueStudentIds = new Set(result.data?.map((item) => item.student_id) || [])
    const count = uniqueStudentIds.size
    console.log("テスト結果から学生数を取得しました:", count, "件")

    return { success: true, count }
  } catch (error) {
    console.error("テスト結果からの学生数取得エラー:", error)
    return { success: false, error: "学生数の取得に失敗しました", count: 0 }
  }
}

async function getUniqueTests() {
  try {
    // サービスロールキーを使用してテスト数を取得
    console.log("テスト数取得を開始します（サービスロールキー使用）")
    const result = await adminSupabase.from("test_scores").select("test_name")

    if (result.error) {
      console.error("テスト数取得エラー:", result.error)
      return { success: false, error: result.error.message, uniqueCount: 0 }
    }

    // ユニークなテスト名の数を計算
    const uniqueTests = new Set(result.data?.map((item) => item.test_name) || [])
    console.log("テスト数を取得しました:", uniqueTests.size, "件")

    return { success: true, uniqueCount: uniqueTests.size }
  } catch (error) {
    console.error("テスト数取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "テスト数の取得に失敗しました",
      uniqueCount: 0,
    }
  }
}
