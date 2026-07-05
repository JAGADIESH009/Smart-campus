"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global application settings.</p>
      </div>

      <Card className="glass bg-card/60">
        <CardHeader>
          <CardTitle>Institution Details</CardTitle>
          <CardDescription>Update the core details of the university/college.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Institution Name</label>
              <Input defaultValue="Smart Campus University" className="bg-background/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain Name</label>
              <Input defaultValue="smartcampus.edu" className="bg-background/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Support Email</label>
              <Input defaultValue="support@smartcampus.edu" className="bg-background/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Input defaultValue="2026-2027" className="bg-background/50 border-white/10" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t border-border/50 pt-4">
          <Button className="bg-primary text-primary-foreground">
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="glass bg-card/60 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
          <CardDescription>Advanced administrative actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
            <div>
              <h4 className="font-semibold text-foreground">Reset Academic Year</h4>
              <p className="text-sm text-muted-foreground">This will archive all current student records and classes.</p>
            </div>
            <Button variant="destructive">Reset System</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
