"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント
const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// データベース接続を確認する関数
export async function checkDatabaseConnection() {
  try {
    console.log("データベース接続を確認します")

    // 簡単なクエリを実行して接続を確認
    const { data, error } = await adminSupabase.from("test_scores").select("id").limit(1)

    if (error) {
      console.error("データベース接続エラー:", error)
      return { success: false, error: error.message }
    }

    console.log("データベース接続成功")
    return { success: true }
  } catch (error) {
    console.error("データベース接続エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース接続に失敗しました",
    }
  }
}

// テーブル情報を取得する関数
export async function getTableInfo(studentId?: string, testName?: string) {
  try {
    console.log("テーブル情報を取得します")

    // テストデータを取得
    let query = adminSupabase.from("test_scores").select("*")

    if (studentId) {
      query = query.eq("student_id", studentId)
    }

    if (testName) {
      query = query.eq("test_name", testName)
    }

    query = query.limit(100).order("test_date", { ascending: false })

    const { data: testData, error: testError } = await query

    if (testError) {
      console.error("テストデータ取得エラー:", testError)
      throw new Error(`テストデータの取得に失敗しました: ${testError.message}`)
    }

    // テスト名一覧を取得
    const { data: testNames, error: testNamesError } = await adminSupabase
      .from("test_scores")
      .select("test_name")
      .order("test_name")

    if (testNamesError) {
      console.error("テスト名一覧取得エラー:", testNamesError)
      throw new Error(`テスト名一覧の取得に失敗しました: ${testNamesError.message}`)
    }

    // 学生ID一覧を取得
    const { data: studentIds, error: studentIdsError } = await adminSupabase
      .from("test_scores")
      .select("student_id")
      .order("student_id")

    if (studentIdsError) {
      console.error("学生ID一覧取得エラー:", studentIdsError)
      throw new Error(`学生ID一覧の取得に失敗しました: ${studentIdsError.message}`)
    }

    // 重複を排除
    const uniqueTestNames = [...new Set(testNames?.map((item) => item.test_name) || [])]
    const uniqueStudentIds = [...new Set(studentIds?.map((item) => item.student_id) || [])]

    // テーブルのカラム名を取得（最初のデータから）
    let columns = []
    if (testData && testData.length > 0) {
      columns = Object.keys(testData[0]).map((key) => ({
        column_name: key,
        data_type: typeof testData[0][key],
        is_nullable: testData[0][key] === null ? "YES" : "NO",
      }))
    }

    return {
      structure: columns,
      data: testData || [],
      testNames: uniqueTestNames,
      studentIds: uniqueStudentIds,
    }
  } catch (error) {
    console.error("テーブル情報取得エラー:", error)
    throw error
  }
}
