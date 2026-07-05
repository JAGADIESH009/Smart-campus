"use client"

import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Briefcase, Users, Calendar, Award } from "lucide-react"

export default function AlumniDashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">Alumni Network & Career Portal</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Job Board</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Briefcase size={20} />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-foreground">42</div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">New Opportunities</p>
          </CardContent>
        </Card>
        
        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Alumni Network</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
              <Users size={20} />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-foreground">1,245</div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Registered Alumni</p>
          </CardContent>
        </Card>

        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming Events</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Calendar size={20} />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-foreground">3</div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">This Month</p>
          </CardContent>
        </Card>

        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contributions</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Award size={20} />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-foreground">$0</div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Donations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass bg-card/60 h-[400px]">
          <CardHeader>
            <CardTitle>Recent Job Postings</CardTitle>
            <CardDescription>Opportunities shared by alumni</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
            No job postings yet.
          </CardContent>
        </Card>

        <Card className="glass bg-card/60 h-[400px]">
          <CardHeader>
            <CardTitle>Alumni Events</CardTitle>
            <CardDescription>Connect with fellow graduates</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
            No upcoming events.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
