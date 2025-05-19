"use server"

import { createClient } from "@supabase/supabase-js"
import { getTestResults } from "./test-results"

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

export async function getDashboardData() {
  try {
    console.log("ダッシュボードデータ取得を開始します")

    // 共通のテスト結果取得関数を使用
    const testScoresResult = await getTestResults()

    // 学生数と試験数を取得
    const [studentsResult, uniqueTestsResult] = await Promise.all([
      getStudentCount(),
      getUniqueTests(testScoresResult.data),
    ])

    console.log("ダッシュボードデータを取得しました")

    return {
      success: true,
      data: {
        testResults: testScoresResult.data || [],
        studentCount: studentsResult.count || 0,
        testCount: uniqueTestsResult.uniqueCount || 0,
      },
      error: testScoresResult.error || studentsResult.error || uniqueTestsResult.error || null,
    }
  } catch (error) {
    console.error("ダッシュボードデータ取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データの取得に失敗しました",
      data: {
        testResults: [],
        studentCount: 0,
        testCount: 0,
      },
    }
  }
}

async function getStudentCount() {
  try {
    // サービスロールキーを使用してstudentsテーブルから学生数を取得
    console.log("studentsテーブルから学生数を取得します")
    const supabase = createSupabaseClient()

    const { count, error } = await supabase.from("students").select("*", { count: "exact", head: true })

    if (error) {
      console.error("学生テーブル確認エラー:", error)
      // studentsテーブルにアクセスできない場合は、test_scoresテーブルから一意の学生IDを数える
      return getStudentCountFromTestScores()
    }

    console.log("学生数を取得しました:", count || 0, "件")
    return { success: true, count: count || 0 }
  } catch (error) {
    console.error("学生数取得エラー:", error)
    // エラーが発生した場合もtest_scoresテーブルから取得を試みる
    return getStudentCountFromTestScores()
  }
}

// test_scoresテーブルから学生数を取得するヘルパー関数
async function getStudentCountFromTestScores() {
  try {
    console.log("test_scoresテーブルから学生数を取得します")
    const supabase = createSupabaseClient()

    const { data, error } = await supabase.from("test_scores").select("student_id")

    if (error) {
      console.error("テスト結果からの学生数取得エラー:", error)
      return { success: false, error: error.message, count: 0 }
    }

    // 一意の学生IDを数える
    const uniqueStudentIds = new Set(data?.map((item) => item.student_id) || [])
    const count = uniqueStudentIds.size
    console.log("テスト結果から学生数を取得しました:", count, "件")

    return { success: true, count }
  } catch (error) {
    console.error("テスト結果からの学生数取得エラー:", error)
    return { success: false, error: "学生数の取得に失敗しました", count: 0 }
  }
}

// テスト結果データから一意のテスト数を計算する関数
function getUniqueTests(testScores: any[]) {
  try {
    // テスト名と日付の組み合わせでユニークなテストを特定
    const uniqueTests = new Set(testScores?.map((item) => `${item.test_name}_${item.test_date}`) || [])
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
