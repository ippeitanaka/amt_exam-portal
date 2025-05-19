"use server"

import { createClient } from "@supabase/supabase-js"

export async function debugTestScores() {
  try {
    // サービスロールキーを使用してクライアントを作成
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("Service Role Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // テストスコアを取得
    const { data: testScores, error } = await supabase.from("test_scores").select("*").limit(10)

    if (error) {
      console.error("Error fetching test scores:", error)
      return { success: false, error: error.message, data: null }
    }

    console.log(`Retrieved ${testScores?.length || 0} test scores`)

    return {
      success: true,
      data: testScores,
      count: testScores?.length || 0,
    }
  } catch (error) {
    console.error("Unexpected error in debugTestScores:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    }
  }
}

export async function getTestScoresCount() {
  try {
    // サービスロールキーを使用してクライアントを作成
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // テストスコアの数を取得
    const { count, error } = await supabase.from("test_scores").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error counting test scores:", error)
      return { success: false, error: error.message, count: 0 }
    }

    console.log(`Total test scores count: ${count || 0}`)

    return {
      success: true,
      count: count || 0,
    }
  } catch (error) {
    console.error("Unexpected error in getTestScoresCount:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      count: 0,
    }
  }
}
