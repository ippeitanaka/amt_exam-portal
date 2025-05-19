"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント（サービスロールキーを使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function checkAdminTables() {
  try {
    console.log("管理者テーブル確認を開始します")

    // admin_usersテーブルの確認
    const adminUsersResult = await adminSupabase.from("admin_users").select("*").limit(5)

    // adminsテーブルの確認
    const adminsResult = await adminSupabase.from("admins").select("*").limit(5)

    // テーブルが存在しない場合、テーブルを作成
    if (adminUsersResult.error && adminUsersResult.error.code === "PGRST116") {
      console.log("admin_usersテーブルが存在しないため、作成します")

      // admin_usersテーブルを作成
      await adminSupabase.rpc("create_admin_users_table")

      // デフォルト管理者ユーザーを作成
      const { error: insertError } = await adminSupabase
        .from("admin_users")
        .insert([{ username: "amt", password: "TOYOamt01" }])

      if (insertError) {
        console.error("デフォルト管理者ユーザー作成エラー:", insertError)
      }
    }

    if (adminsResult.error && adminsResult.error.code === "PGRST116") {
      console.log("adminsテーブルが存在しないため、作成します")

      // adminsテーブルを作成
      await adminSupabase.rpc("create_admins_table")

      // admin_usersテーブルからIDを取得
      const { data: userData } = await adminSupabase.from("admin_users").select("id").eq("username", "amt").single()

      if (userData) {
        // デフォルト管理者情報を作成
        const { error: insertError } = await adminSupabase
          .from("admins")
          .insert([{ admin_user_id: userData.id, name: "管理者", role: "super_admin" }])

        if (insertError) {
          console.error("デフォルト管理者情報作成エラー:", insertError)
        }
      }
    }

    // 再度テーブルを確認
    const updatedAdminUsersResult = await adminSupabase.from("admin_users").select("*").limit(5)
    const updatedAdminsResult = await adminSupabase.from("admins").select("*").limit(5)

    return {
      success: true,
      adminUsers: {
        error: updatedAdminUsersResult.error ? updatedAdminUsersResult.error.message : null,
        data: updatedAdminUsersResult.data
          ? updatedAdminUsersResult.data.map((user) => ({ ...user, password: "********" }))
          : [],
        count: updatedAdminUsersResult.data?.length || 0,
      },
      admins: {
        error: updatedAdminsResult.error ? updatedAdminsResult.error.message : null,
        data: updatedAdminsResult.data || [],
        count: updatedAdminsResult.data?.length || 0,
      },
    }
  } catch (error) {
    console.error("管理者テーブル確認エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "管理者テーブル確認に失敗しました",
    }
  }
}

export async function testAdminLogin(username: string, password: string) {
  try {
    console.log(`管理者ログインテスト - ユーザー名: ${username}`)

    // ハードコードされた認証をチェック
    if (username === "amt" && password === "TOYOamt01") {
      return {
        success: true,
        message: "ハードコードされた認証に成功しました",
        data: {
          id: 1,
          username: "amt",
          role: "super_admin",
          name: "管理者",
        },
      }
    }

    // admin_usersテーブルから管理者情報を取得
    const { data, error } = await adminSupabase
      .from("admin_users")
      .select("id, username, password")
      .eq("username", username)
      .maybeSingle()

    if (error) {
      console.error("管理者情報取得エラー:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data) {
      return {
        success: false,
        error: "ユーザー名が見つかりません",
      }
    }

    // パスワード検証
    const passwordMatch = data.password === password

    // 管理者情報を取得
    let adminData = null
    if (passwordMatch) {
      const { data: adminInfo, error: adminError } = await adminSupabase
        .from("admins")
        .select("*")
        .eq("admin_user_id", data.id)
        .maybeSingle()

      if (!adminError) {
        adminData = adminInfo
      }
    }

    return {
      success: true,
      data: {
        ...data,
        password: "********",
      },
      adminData,
      passwordMatch,
    }
  } catch (error) {
    console.error("管理者ログインテストエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "管理者ログインテストに失敗しました",
    }
  }
}
