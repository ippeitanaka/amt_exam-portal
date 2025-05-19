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

// テスト結果データを取得する関数
export async function fetchTestScores() {
  try {
    console.log("デバッグ: テスト結果データを取得します")
    const supabase = createSupabaseClient()

    const { data, error } = await supabase.from("test_scores").select("*").limit(10)

    if (error) {
      console.error("デバッグ: テスト結果データ取得エラー", error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`デバッグ: ${data?.length || 0}件のテスト結果データを取得しました`)
    return { success: true, data }
  } catch (error) {
    console.error("デバッグ: 予期しないエラー", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました",
      data: null,
    }
  }
}

// 学生データを取得する関数
export async function fetchStudents() {
  try {
    console.log("デバッグ: 学生データを取得します")
    const supabase = createSupabaseClient()

    const { data, error } = await supabase.from("students").select("*").limit(10)

    if (error) {
      console.error("デバッグ: 学生データ取得エラー", error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`デバッグ: ${data?.length || 0}件の学生データを取得しました`)
    return { success: true, data }
  } catch (error) {
    console.error("デバッグ: 予期しないエラー", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました",
      data: null,
    }
  }
}

// テスト結果の総数を取得する関数
export async function getTestScoresCount() {
  try {
    console.log("デバッグ: テスト結果の総数を取得します")
    const supabase = createSupabaseClient()

    const { count, error } = await supabase.from("test_scores").select("*", { count: "exact", head: true })

    if (error) {
      console.error("デバッグ: テスト結果総数取得エラー", error)
      return { success: false, error: error.message, count: 0 }
    }

    console.log(`デバッグ: テスト結果の総数は${count || 0}件です`)
    return { success: true, count: count || 0 }
  } catch (error) {
    console.error("デバッグ: 予期しないエラー", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました",
      count: 0,
    }
  }
}

// 学生の総数を取得する関数
export async function getStudentsCount() {
  try {
    console.log("デバッグ: 学生の総数を取得します")
    const supabase = createSupabaseClient()

    const { count, error } = await supabase.from("students").select("*", { count: "exact", head: true })

    if (error) {
      console.error("デバッグ: 学生総数取得エラー", error)
      return { success: false, error: error.message, count: 0 }
    }

    console.log(`デバッグ: 学生の総数は${count || 0}件です`)
    return { success: true, count: count || 0 }
  } catch (error) {
    console.error("デバッグ: 予期しないエラー", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました",
      count: 0,
    }
  }
}

// 環境変数を確認する関数
export async function checkEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return {
    supabaseUrl: supabaseUrl ? "設定されています" : "未設定",
    supabaseAnonKey: supabaseAnonKey ? "設定されています" : "未設定",
    supabaseServiceRoleKey: supabaseServiceRoleKey ? "設定されています" : "未設定",
  }
}
