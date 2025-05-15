import { type NextRequest, NextResponse } from "next/server"

// APIルートで認証状態を確認するためのヘルパー関数
export async function checkApiAuth(req: NextRequest) {
  // リファラーチェック（同一オリジンからのリクエストかどうか）
  const referer = req.headers.get("referer") || ""
  const host = req.headers.get("host") || ""

  if (!referer.includes(host) && process.env.NODE_ENV === "production") {
    return {
      authenticated: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  // CSRFトークンチェック（実装する場合）
  // const csrfToken = req.headers.get("x-csrf-token")
  // if (!csrfToken || csrfToken !== cookies().get("csrf")?.value) {
  //   return {
  //     authenticated: false,
  //     response: NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 })
  //   }
  // }

  return {
    authenticated: true,
    response: null,
  }
}

// 管理者APIルートで使用する認証チェック
export async function checkAdminApiAuth(req: NextRequest) {
  const basicCheck = await checkApiAuth(req)
  if (!basicCheck.authenticated) {
    return basicCheck
  }

  // ここに管理者固有の認証チェックを追加できます
  // 例: 特定のヘッダーやトークンの確認など

  return {
    authenticated: true,
    response: null,
  }
}
