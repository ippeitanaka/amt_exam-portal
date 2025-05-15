import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { checkAdminApiAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  // 認証チェック
  const authCheck = await checkAdminApiAuth(request as any)
  if (!authCheck.authenticated) {
    return authCheck.response
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const formData = await request.formData()
    const csvFile = formData.get("file") as File

    if (!csvFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await csvFile.text()
    const rows = text.split("\n")

    // Skip header row if it exists
    const startIndex = rows[0].includes("ID") || rows[0].includes("PASS") ? 1 : 0

    const students = []

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i].trim()
      if (!row) continue

      // Split by comma, but handle potential quotes
      const columns = row.split(",").map((col) => col.trim().replace(/^"|"$/g, ""))

      if (columns.length >= 3) {
        const [name, studentId, password] = columns

        students.push({
          name,
          student_id: studentId,
          password,
        })
      }
    }

    if (students.length === 0) {
      return NextResponse.json({ error: "No valid student data found" }, { status: 400 })
    }

    // Insert students into the database
    const { data, error } = await supabase.from("students").upsert(students, { onConflict: "student_id" }).select()

    if (error) {
      console.error("Error inserting students:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${students.length} students imported successfully`,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      {
        error: "Failed to import students",
      },
      { status: 500 },
    )
  }
}
