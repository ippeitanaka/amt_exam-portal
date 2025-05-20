import { createClient } from "@supabase/supabase-js"

// 環境変数の検証
function validateEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const errors = []

  if (!supabaseUrl) errors.push("NEXT_PUBLIC_SUPABASE_URL が設定されていません")
  if (!supabaseServiceRoleKey) errors.push("SUPABASE_SERVICE_ROLE_KEY が設定されていません")
  if (!supabaseAnonKey) errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません")

  return {
    isValid: errors.length === 0,
    errors,
    values: {
      supabaseUrl,
      supabaseServiceRoleKey,
      supabaseAnonKey,
    },
  }
}

// サーバーサイド用のSupabaseクライアント
export function createServerSupabaseClient() {
  const validation = validateEnvVars()

  if (!validation.isValid) {
    console.error("Supabase環境変数エラー:", validation.errors.join(", "))
    throw new Error(`Supabase環境変数が正しく設定されていません: ${validation.errors.join(", ")}`)
  }

  const { supabaseUrl, supabaseServiceRoleKey } = validation.values

  try {
    return createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (error) {
    console.error("Supabaseクライアント作成エラー:", error)
    throw new Error("Supabaseクライアントの作成に失敗しました")
  }
}

// クライアントサイド用のSupabaseクライアント（匿名キー使用）
export function createClientSupabaseClient() {
  const validation = validateEnvVars()

  if (!validation.isValid) {
    console.error("Supabase環境変数エラー:", validation.errors.join(", "))
    throw new Error(`Supabase環境変数が正しく設定されていません: ${validation.errors.join(", ")}`)
  }

  const { supabaseUrl, supabaseAnonKey } = validation.values

  try {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (error) {
    console.error("Supabaseクライアント作成エラー:", error)
    throw new Error("Supabaseクライアントの作成に失敗しました")
  }
}
