"use client"

import { useAuth } from "@/lib/auth/AuthContext"
import { Search, Bell, Menu, User, Settings, LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Avatar from "@radix-ui/react-avatar"

export function Topbar() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="h-16 border-b border-white/10 glass bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
          <Menu size={20} />
        </button>
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-background/50 border border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="relative text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">
                3
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="w-80 glass bg-card/90 backdrop-blur-xl border border-white/10 rounded-xl p-0 shadow-2xl z-50 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 mr-4"
              sideOffset={16}
              align="end"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-sm">Notifications</h3>
                <span className="text-xs text-primary cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {[
                  { title: "New Assignment", desc: "DBMS: ER Diagrams uploaded", time: "10m ago" },
                  { title: "Attendance Updated", desc: "You were marked PRESENT for DBMS", time: "1h ago" },
                  { title: "Fee Due", desc: "Semester 5 fee is pending", time: "2d ago" }
                ].map((notif, i) => (
                  <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-sm">{notif.title}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">{notif.time}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{notif.desc}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-white/5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors font-medium">
                View all notifications
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user?.email.split('@')[0].toUpperCase()}</p>
                <p className="text-xs text-muted-foreground uppercase">{user?.role}</p>
              </div>
              <Avatar.Root className="inline-flex items-center justify-center align-middle overflow-hidden select-none w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-md border-2 border-background">
                <Avatar.Image
                  className="w-full h-full object-cover rounded-[inherit]"
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}&backgroundColor=transparent`}
                  alt="Avatar"
                />
                <Avatar.Fallback className="w-full h-full flex items-center justify-center bg-white text-[15px] font-medium" delayMs={600}>
                  {user?.email[0].toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="min-w-[220px] glass bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
              sideOffset={8}
              align="end"
            >
              <DropdownMenu.Label className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                My Account
              </DropdownMenu.Label>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-2 text-sm rounded-md outline-none cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
                <User size={16} /> Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-2 px-2 py-2 text-sm rounded-md outline-none cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
                <Settings size={16} /> Settings
              </DropdownMenu.Item>
              
              <DropdownMenu.Separator className="h-[1px] bg-white/10 m-1" />
              
              <DropdownMenu.Item 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-md outline-none cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenu.Item>
              
              <DropdownMenu.Separator className="h-[1px] bg-white/10 m-1" />
              
              <DropdownMenu.Item 
                onClick={logout}
                className="flex items-center gap-2 px-2 py-2 text-sm rounded-md outline-none cursor-pointer text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}
