"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { BookOpen, Users, Trophy, MapPin, Mail, Phone, ArrowRight, ChevronRight, GraduationCap } from "lucide-react"

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 glass border-b-0 border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">Smart Campus</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-white/90">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#departments" className="hover:text-white transition-colors">Departments</a>
            <a href="#placements" className="hover:text-white transition-colors">Placements</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex gap-4">
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover' }}
        />
        <div className="absolute inset-0 z-10 bg-black/60" />
        
        <div className="z-20 text-center max-w-5xl mx-auto px-6 mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-6 inline-block backdrop-blur-md">
              Admissions Open for Fall 2026
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white drop-shadow-xl leading-tight">
              Empowering the Next <br className="hidden md:block"/> Generation of Leaders
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto font-light">
              Experience a world-class education with cutting-edge facilities, renowned faculty, and a vibrant campus life.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login/student">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 transition-all w-full sm:w-auto font-bold border border-primary/50">
                  Student Portal <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login/faculty">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full glass text-white border-white/40 hover:bg-white/20 transition-all w-full sm:w-auto font-semibold">
                  Faculty Portal
                </Button>
              </Link>
              <Link href="/login/alumni">
                <Button size="lg" variant="ghost" className="h-14 px-8 text-lg rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-all w-full sm:w-auto font-semibold border border-transparent hover:border-white/20">
                  Alumni Portal
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-30 -mt-20 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "50+", label: "Programs" },
            { value: "10k+", label: "Students" },
            { value: "95%", label: "Placement Rate" },
            { value: "500+", label: "Faculty" },
          ].map((stat, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="glass rounded-2xl p-6 text-center shadow-2xl border-white/10 bg-card/40 backdrop-blur-xl">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  {stat.value}
                </h3>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1 space-y-6">
                <h2 className="text-4xl font-bold text-foreground">A Legacy of Excellence</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Smart Campus University has been at the forefront of educational innovation for over three decades. Our commitment to academic rigor, practical research, and holistic development prepares students to tackle the challenges of tomorrow.
                </p>
                <ul className="space-y-4">
                  {["Global Rankings in Top 100", "State-of-the-art Research Labs", "Industry-aligned Curriculum"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CheckIcon />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl transform rotate-3 scale-105" />
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" 
                  alt="Students studying" 
                  className="relative rounded-3xl shadow-2xl object-cover h-[500px] w-full"
                />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Departments Section */}
      <section id="departments" className="py-32 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Academic Departments</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our diverse range of departments offering specialized courses designed by industry experts.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, name: "Computer Science", desc: "AI, Data Science, Software Eng." },
              { icon: Trophy, name: "Business School", desc: "MBA, Finance, Marketing" },
              { icon: Users, name: "Liberal Arts", desc: "Psychology, Literature, History" },
            ].map((dept, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="group glass bg-card/60 rounded-3xl p-8 hover:bg-card/80 transition-all cursor-pointer border border-border">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <dept.icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{dept.name}</h3>
                  <p className="text-muted-foreground mb-6">{dept.desc}</p>
                  <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform">
                    Learn more <ChevronRight size={18} className="ml-1" />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Footer */}
      <footer id="contact" className="bg-card pt-24 pb-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <GraduationCap size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">Smart Campus</span>
              </div>
              <p className="text-muted-foreground max-w-sm">
                A premium educational institution dedicated to fostering innovation, leadership, and global impact.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">Contact Us</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
                  <span>123 University Avenue<br/>Innovation District, Tech City 90210</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={20} className="text-primary shrink-0" />
                  <span>+1 (800) 555-0199</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={20} className="text-primary shrink-0" />
                  <span>admissions@smartcampus.edu</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Admissions</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Alumni</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Library</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 Smart Campus ERP. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
    </svg>
  )
}
