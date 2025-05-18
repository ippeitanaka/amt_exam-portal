import { redirect } from "next/navigation"

export default function Home() {
  // ホームページから学生管理ページにリダイレクト
  redirect("/admin/students")

  // リダイレクトが機能しない場合のフォールバック
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">国家試験模擬試験確認アプリ</h1>
      <p className="mb-8">学生データを管理するためのアプリケーションです。</p>
      <a
        href="/admin/students"
        className="px-4 py-2 bg-brown-600 text-white rounded hover:bg-brown-700 transition-colors"
      >
        学生管理へ
      </a>
    </div>
  )
}
