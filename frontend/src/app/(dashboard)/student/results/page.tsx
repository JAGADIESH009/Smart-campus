"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Trophy, FileText, Download, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudentResultsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any>({})
  const [student, setStudent] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return
      
      try {
        const { data: studentData } = await supabase.from('Student').select('*, Course(name), Department(name)').eq('userId', user.id).single()
        setStudent(studentData)

        if (studentData?.id) {
          // Fetch marks grouped by exam
          const { data: marks } = await supabase
            .from('Mark')
            .select('*, Exam(name, date, maxMarks, Semester(name)), Subject(name, code, credits)')
            .eq('studentId', studentData.id)
            .order('Exam(date)', { ascending: false })

          if (marks) {
            // Group by Semester -> Exam
            const grouped: any = {}
            marks.forEach((mark: any) => {
              const semName = mark.Exam.Semester.name
              const examName = mark.Exam.name
              
              if (!grouped[semName]) grouped[semName] = { exams: {}, totalCredits: 0, totalPoints: 0 }
              if (!grouped[semName].exams[examName]) grouped[semName].exams[examName] = []
              
              grouped[semName].exams[examName].push(mark)
            })
            
            setResults(grouped)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchResults()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (loading) return <div className="p-8 text-center animate-pulse">Loading academic records...</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Results</h1>
          <p className="text-muted-foreground mt-1">View your grades and performance</p>
        </div>
        
        {student?.cgpa && (
          <Card className="glass border-emerald-500/30 bg-emerald-500/10 inline-block shrink-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-500">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-500/80">Overall CGPA</p>
                <h2 className="text-2xl font-bold text-emerald-400">{student.cgpa}</h2>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {Object.keys(results).length === 0 ? (
        <div className="text-center p-12 glass rounded-xl border border-white/10">
          <p className="text-muted-foreground">No examination results found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(results).map(([semName, semData]: [string, any]) => (
            <div key={semName} className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                {semName}
              </h2>
              
              <div className="grid gap-6 lg:grid-cols-2">
                {Object.entries(semData.exams).map(([examName, marks]: [string, any]) => {
                  
                  const totalObtained = marks.reduce((sum: number, m: any) => sum + m.marksObtained, 0)
                  const totalMax = marks.reduce((sum: number, m: any) => sum + m.Exam.maxMarks, 0)
                  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
                  
                  return (
                    <Card key={examName} className="glass bg-card/50 border-white/10 shadow-xl overflow-hidden">
                      <CardHeader className="bg-muted/30 border-b border-white/5 pb-4">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{examName}</CardTitle>
                          <Button variant="outline" size="sm" className="h-8 text-xs bg-background/50">
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Report Card
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Date: {new Date(marks[0].Exam.date).toLocaleDateString()}</p>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-white/5">
                              <tr>
                                <th className="px-4 py-3 font-medium">Subject</th>
                                <th className="px-4 py-3 font-medium text-right">Marks</th>
                                <th className="px-4 py-3 font-medium text-center">Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {marks.map((mark: any) => (
                                <tr key={mark.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-foreground/90">{mark.Subject.name}</div>
                                    <div className="text-xs text-muted-foreground">{mark.Subject.code}</div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono">
                                    <span className="font-semibold text-foreground/90">{mark.marksObtained}</span>
                                    <span className="text-muted-foreground">/{mark.Exam.maxMarks}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                      mark.grade === 'A' || mark.grade === 'O' ? 'bg-green-500/20 text-green-400' :
                                      mark.grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                      mark.grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                      mark.grade === 'F' ? 'bg-red-500/20 text-red-400' :
                                      'bg-secondary text-secondary-foreground'
                                    }`}>
                                      {mark.grade || '-'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-muted/10 border-t border-white/5 font-semibold">
                              <tr>
                                <td className="px-4 py-3">Total</td>
                                <td className="px-4 py-3 text-right text-primary font-mono">{totalObtained}/{totalMax}</td>
                                <td className="px-4 py-3 text-center text-primary">{percentage.toFixed(1)}%</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
