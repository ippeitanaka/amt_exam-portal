"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud } from "lucide-react"

interface Student {
  student_id: string
  name: string
  password?: string
}

interface StudentImportProps {
  onClose: () => void
  onComplete: (students: Student[]) => void
}

const StudentImport: React.FC<StudentImportProps> = ({ onClose, onComplete }) => {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importedStudents, setImportedStudents] = useState<Student[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCsvFile(file)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split("\n")
    const headers = lines[0].split(",")
    const students: Student[] = []

    for (let i = 1; i < lines.length; i++) {
      const data = lines[i].split(",")
      if (data.length === headers.length) {
        const student: any = {}
        for (let j = 0; j < headers.length; j++) {
          student[headers[j].trim()] = data[j].trim()
        }
        students.push(student)
      }
    }
    return students
  }

  const handleImport = () => {
    if (!csvFile) {
      setError("CSVファイルを選択してください")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      try {
        const students = parseCSV(text)
        setImportedStudents(students)
        onComplete(students)
        onClose()
      } catch (e) {
        setError("CSVファイルの解析に失敗しました")
      }
    }
    reader.readAsText(csvFile)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <Card>
          <CardHeader>
            <CardTitle>学生データインポート</CardTitle>
            <CardDescription>CSVファイルから学生データをインポートします。</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-500">{error}</div>}
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                  CSVファイルを選択
                </Label>
                <Input type="file" id="csv" accept=".csv" onChange={handleFileChange} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleImport} className="bg-brown-600 hover:bg-brown-700 text-white">
              <UploadCloud className="mr-2 h-4 w-4" />
              インポート
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default StudentImport
