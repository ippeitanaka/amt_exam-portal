import { NextResponse } from "next/server"

export async function POST() {
  // ローカルストレージはサーバーサイドでアクセスできないため、
  // クライアントサイドでのリダイレクト処理を返す
  return NextResponse.json({ success: true, message: "ログアウトしました" }, { status: 200 })
}
