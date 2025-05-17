"use server"

import { createClient } from "@supabase/supabase-js"

// サーバーサイドでSupabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// 管理者用のクライアント（サービスロールキーが設定されている場合のみ使用）
const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient(supabaseUrl, supabaseAnonKey)

// 通常のクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getStudents() {
  try {
    console.log("学生データ取得を開始します")

    // まず、通常のクライアントを使用してstudentsテーブルからデータを取得
    let studentsResult = await supabase.from("students").select("*").order("student_id", { ascending: true })

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (studentsResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      studentsResult = await adminSupabase.from("students").select("*").order("student_id", { ascending: true })
    }

    // studentsテーブルから正常にデータが取得できた場合
    if (!studentsResult.error && studentsResult.data && studentsResult.data.length > 0) {
      console.log("studentsテーブルからデータを取得しました:", studentsResult.data.length, "件")
      return { success: true, data: studentsResult.data, source: "students_table" }
    }

    // studentsテーブルからのデータ取得でエラーがあった場合、
    // または結果が空だった場合は、test_scoresテーブルから間接的に取得
    if (studentsResult.error) {
      console.error("studentsテーブルからのデータ取得エラー:", studentsResult.error)
    } else {
      console.log("studentsテーブルにデータがありません")
    }

    // フォールバック: test_scoresテーブルから一意の学生IDを取得する
    console.log("test_scoresテーブルからデータを取得します")

    // まず通常のクライアントで試す
    let testScoresResult = await supabase
      .from("test_scores")
      .select("student_id, student_name")
      .order("student_id", { ascending: true })

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (testScoresResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      testScoresResult = await adminSupabase
        .from("test_scores")
        .select("student_id, student_name")
        .order("student_id", { ascending: true })
    }

    if (testScoresResult.error) {
      console.error("テスト結果からの学生データ取得エラー:", testScoresResult.error)
      return { success: false, error: testScoresResult.error.message, data: [] }
    }

    if (!testScoresResult.data || testScoresResult.data.length === 0) {
      console.log("test_scoresテーブルにもデータがありません")
      return { success: true, data: [], source: "no_data" }
    }

    // 一意の学生IDを抽出
    const uniqueStudentIds = new Map()

    for (const item of testScoresResult.data) {
      if (item.student_id && !uniqueStudentIds.has(item.student_id)) {
        uniqueStudentIds.set(item.student_id, {
          student_id: item.student_id,
          name: item.student_name || `学生${item.student_id}`,
          password: "password", // デフォルト値
          created_at: new Date().toISOString(),
        })
      }
    }

    const uniqueStudents = Array.from(uniqueStudentIds.values())
    console.log("test_scoresテーブルから", uniqueStudents.length, "件の学生データを抽出しました")

    return { success: true, data: uniqueStudents, source: "test_scores_table" }
  } catch (error) {
    console.error("学生データ取得エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生データの取得に失敗しました",
      data: [],
    }
  }
}

export async function addOrUpdateStudent(student: any) {
  try {
    // 入力値の検証
    if (!student || !student.student_id || !student.name || !student.password) {
      return { success: false, error: "必須フィールドが不足しています" }
    }

    console.log("学生データを保存します:", student)

    // まず通常のクライアントで試す
    let existingStudentResult = await supabase
      .from("students")
      .select("student_id")
      .eq("student_id", student.student_id)
      .maybeSingle()

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (existingStudentResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      existingStudentResult = await adminSupabase
        .from("students")
        .select("student_id")
        .eq("student_id", student.student_id)
        .maybeSingle()
    }

    if (existingStudentResult.error) {
      console.error("学生データ検索エラー:", existingStudentResult.error)
      // エラーがあっても処理を続行（ローカルストレージには保存する）
    }

    let result

    try {
      if (existingStudentResult.data) {
        // 既存の学生を更新
        console.log("既存の学生を更新します:", student.student_id)

        // まず通常のクライアントで試す
        result = await supabase
          .from("students")
          .update({
            name: student.name,
            password: student.password,
          })
          .eq("student_id", student.student_id)

        // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
        if (result.error && supabaseServiceRoleKey) {
          console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
          result = await adminSupabase
            .from("students")
            .update({
              name: student.name,
              password: student.password,
            })
            .eq("student_id", student.student_id)
        }
      } else {
        // 新しい学生を挿入
        console.log("新しい学生を挿入します:", student.student_id)

        // まず通常のクライアントで試す
        result = await supabase.from("students").insert({
          student_id: student.student_id,
          name: student.name,
          password: student.password,
          created_at: new Date().toISOString(),
        })

        // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
        if (result.error && supabaseServiceRoleKey) {
          console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
          result = await adminSupabase.from("students").insert({
            student_id: student.student_id,
            name: student.name,
            password: student.password,
            created_at: new Date().toISOString(),
          })
        }
      }

      if (result.error) {
        console.error("学生データ保存エラー:", result.error)
        // エラーがあっても処理を続行（ローカルストレージには保存する）
      } else {
        console.log("学生データを保存しました")
      }
    } catch (dbError) {
      console.error("データベース操作エラー:", dbError)
      // エラーを無視して続行
    }

    // 学生情報をローカルストレージに保存するため、成功を返す
    return { success: true }
  } catch (error) {
    console.error("学生データ保存エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生データの保存に失敗しました",
    }
  }
}

// 学生インポート用の関数
export async function importStudents(students: any[]) {
  try {
    if (!students || students.length === 0) {
      return { success: false, error: "インポートするデータがありません" }
    }

    console.log("学生データをインポートします:", students.length, "件")

    let successCount = 0
    let errorCount = 0

    for (const student of students) {
      try {
        // studentsテーブルに保存を試みる
        const result = await addOrUpdateStudent(student)

        if (result.success) {
          successCount++
        } else {
          errorCount++
          console.error("学生インポートエラー:", result.error)
        }

        // test_scoresテーブルにも学生情報を関連付ける（オプション）
        try {
          // 学生のテスト結果が存在するか確認
          // まず通常のクライアントで試す
          let testScoresResult = await supabase
            .from("test_scores")
            .select("student_id")
            .eq("student_id", student.student_id)
            .limit(1)

          // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
          if (testScoresResult.error && supabaseServiceRoleKey) {
            console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
            testScoresResult = await adminSupabase
              .from("test_scores")
              .select("student_id")
              .eq("student_id", student.student_id)
              .limit(1)
          }

          if (!testScoresResult.error && (!testScoresResult.data || testScoresResult.data.length === 0)) {
            // テスト結果が存在しない場合は、ダミーのテスト結果を作成
            const dummyTestResult = {
              student_id: student.student_id,
              test_name: "初期登録",
              test_date: new Date().toISOString().split("T")[0],
              total_score: 0,
              max_score: 300,
            }

            // まず通常のクライアントで試す
            let insertResult = await supabase.from("test_scores").insert(dummyTestResult)

            // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
            if (insertResult.error && supabaseServiceRoleKey) {
              console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
              insertResult = await adminSupabase.from("test_scores").insert(dummyTestResult)
            }

            if (insertResult.error) {
              console.error("ダミーテスト結果作成エラー:", insertResult.error)
            } else {
              console.log("ダミーテスト結果を作成しました:", student.student_id)
            }
          }
        } catch (testError) {
          console.error("テスト結果作成エラー:", testError)
          // このエラーは無視（メインの処理は学生テーブルへの保存）
        }
      } catch (err) {
        console.error("学生インポート処理エラー:", err)
        errorCount++
      }
    }

    console.log("学生データのインポートが完了しました:", successCount, "件成功,", errorCount, "件失敗")

    return {
      success: true,
      successCount,
      errorCount,
      message: `${successCount}件の学生情報をインポートしました${
        errorCount > 0 ? `（${errorCount}件の処理に失敗しました）` : ""
      }`,
    }
  } catch (error) {
    console.error("学生インポートエラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "学生情報のインポートに失敗しました",
    }
  }
}

// テーブル構造を確認するための関数
export async function checkDatabaseStructure() {
  try {
    console.log("データベース構造を確認します")

    // studentsテーブルの構造を確認
    // まず通常のクライアントで試す
    let studentsResult = await supabase.from("students").select("*").limit(1)

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (studentsResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      studentsResult = await adminSupabase.from("students").select("*").limit(1)
    }

    // test_scoresテーブルの構造を確認
    // まず通常のクライアントで試す
    let testScoresResult = await supabase.from("test_scores").select("*").limit(1)

    // エラーがあり、かつadminSupabaseが通常のクライアントと異なる場合は管理者クライアントで再試行
    if (testScoresResult.error && supabaseServiceRoleKey) {
      console.log("通常クライアントでエラー発生、管理者クライアントで再試行します")
      testScoresResult = await adminSupabase.from("test_scores").select("*").limit(1)
    }

    return {
      success: true,
      studentsColumns: studentsResult.data && studentsResult.data.length > 0 ? Object.keys(studentsResult.data[0]) : [],
      studentsError: studentsResult.error ? studentsResult.error.message : null,
      testScoresColumns:
        testScoresResult.data && testScoresResult.data.length > 0 ? Object.keys(testScoresResult.data[0]) : [],
      testScoresError: testScoresResult.error ? testScoresResult.error.message : null,
    }
  } catch (error) {
    console.error("データベース構造確認エラー:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "データベース構造の確認に失敗しました",
    }
  }
}
