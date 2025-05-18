import { redirect } from "next/navigation"

export default function AdminPage() {
  // 管理ページから学生管理ページにリダイレクト
  redirect("/admin/students")

  // リダイレクトが機能しない場合のフォールバック
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">管理ページ</h1>
      <a
        href="/admin/students"
        className="px-4 py-2 bg-brown-600 text-white rounded hover:bg-brown-700 transition-colors"
      >
        学生管理へ
      </a>
    </div>
  )
}
