"use client"

import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Briefcase, Users, Calendar, Award, Building, MapPin, ExternalLink, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function AlumniDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      const { data } = await supabase.from('User').select('profile:UserProfile(firstName, lastName)').eq('id', user.id).single()
      const prof = Array.isArray(data?.profile) ? data?.profile[0] : data?.profile
      setProfile(prof)
    }
    fetchProfile()
  }, [user, supabase])

  const mockJobs = [
    { title: "Senior Frontend Engineer", company: "Google", location: "Remote / USA", type: "Full-time", salary: "$140k - $180k" },
    { title: "Product Manager", company: "Stripe", location: "London, UK", type: "Full-time", salary: "£85k - £110k" },
    { title: "Backend Developer", company: "Vercel", location: "Remote", type: "Contract", salary: "$90k - $120k" },
  ]

  const mockEvents = [
    { title: "Global Alumni Meet 2026", date: "Nov 15, 2026", time: "18:00 PM", location: "Virtual (Zoom)" },
    { title: "Tech Career Fair", date: "Dec 05, 2026", time: "10:00 AM", location: "Main Campus Auditorium" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.firstName || 'Alumni'}</h1>
          <p className="text-muted-foreground mt-1 text-lg">Alumni Network & Career Portal</p>
        </div>
        <Button className="bg-primary text-primary-foreground shadow-lg">
          Update Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors shadow-lg">
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
        
        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors shadow-lg">
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

        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors shadow-lg">
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

        <Card className="glass bg-card/60 hover:bg-card/80 transition-colors shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contributions</CardTitle>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Award size={20} />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black text-foreground">$5,000</div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Donated this year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass bg-card/60 shadow-xl flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Job Postings</CardTitle>
                <CardDescription>Opportunities shared by alumni</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {mockJobs.map((job, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-white/5 hover:bg-white/5 transition-colors shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{job.title}</h4>
                  <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">{job.type}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Building size={14}/> {job.company}</span>
                  <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className="text-sm font-medium">{job.salary}</span>
                  <Button variant="ghost" size="sm" className="h-8 group-hover:bg-primary group-hover:text-primary-foreground">
                    Apply <ExternalLink size={14} className="ml-2"/>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass bg-card/60 shadow-xl flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Alumni Events</CardTitle>
                <CardDescription>Connect with fellow graduates</CardDescription>
              </div>
              <Button variant="outline" size="sm">Calendar</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
             {mockEvents.map((ev, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-card border border-white/5 hover:bg-white/5 transition-colors shadow-sm">
                <div className="flex flex-col items-center justify-center p-3 bg-secondary/10 text-secondary rounded-lg shrink-0 min-w-[70px]">
                  <span className="text-xs font-bold uppercase tracking-wider">{ev.date.split(' ')[0]}</span>
                  <span className="text-xl font-black">{ev.date.split(' ')[1].replace(',', '')}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{ev.title}</h4>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2"><Clock size={14}/> {ev.time}</span>
                    <span className="flex items-center gap-2"><MapPin size={14}/> {ev.location}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-center">
              <p className="text-sm text-primary font-medium">Interested in hosting an event in your city?</p>
              <Button variant="link" className="text-primary mt-1 h-auto p-0">Contact Alumni Relations</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
