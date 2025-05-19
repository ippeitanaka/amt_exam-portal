import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getTestResultsByTest } from "@/app/actions/test-results"
import { TestResultsDetail } from "@/components/test-results-detail"
import { CharacterLoading } from "@/components/character-loading"

interface TestResultsPageProps {
  params: {
    testName: string
    testDate: string
  }
}

async function fetchTestScores(testName: string, testDate: string) {
  const decodedTestName = decodeURIComponent(testName)
  const decodedTestDate = decodeURIComponent(testDate)

  const result = await getTestResultsByTest(decodedTestName, decodedTestDate)

  if (!result.success) {
    console.error("テスト結果取得エラー:", result.error)
    throw new Error(`テスト結果の取得に失敗しました: ${result.error}`)
  }

  return result.data
}

export default async function TestResultsPage({ params }: TestResultsPageProps) {
  if (!params.testName || !params.testDate) {
    return notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-6 text-2xl font-bold">
        テスト結果詳細: {decodeURIComponent(params.testName)} ({decodeURIComponent(params.testDate)})
      </h1>

      <Suspense fallback={<CharacterLoading message="テスト結果を読み込み中..." />}>
        <TestResultsDetailWrapper testName={params.testName} testDate={params.testDate} />
      </Suspense>
    </div>
  )
}

async function TestResultsDetailWrapper({ testName, testDate }: { testName: string; testDate: string }) {
  try {
    const testScores = await fetchTestScores(testName, testDate)
    return <TestResultsDetail testScores={testScores} />
  } catch (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <h3 className="text-lg font-medium">エラーが発生しました</h3>
        <p>{error instanceof Error ? error.message : "テスト結果の取得に失敗しました"}</p>
      </div>
    )
  }
}
