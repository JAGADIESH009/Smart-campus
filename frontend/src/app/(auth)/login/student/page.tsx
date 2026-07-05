import { LoginForm } from "@/components/auth/login-form"

export default function StudentLoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      
      <div className="z-10 w-full max-w-md">
        <LoginForm role="STUDENT" title="Student Portal" />
      </div>
    </div>
  )
}
