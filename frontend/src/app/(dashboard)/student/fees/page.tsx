"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Receipt, CreditCard, CheckCircle2, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function StudentFeesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [fees, setFees] = useState<any[]>([])
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const supabase = createClient()

  const fetchFees = async () => {
    if (!user) return
    
    try {
      const { data: studentData } = await supabase.from('Student').select('id').eq('userId', user.id).single()
      
      if (studentData?.id) {
        const { data } = await supabase
          .from('Fee')
          .select('*, Semester(name)')
          .eq('studentId', studentData.id)
          .order('dueDate', { ascending: false })
          
        if (data) setFees(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFees()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handlePayClick = (fee: any) => {
    setSelectedFee(fee)
    setPaymentModalOpen(true)
  }

  const simulatePayment = async () => {
    if (!selectedFee) return
    
    setProcessing(true)
    
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    try {
      const receiptNumber = `RCPT-${Math.floor(100000 + Math.random() * 900000)}`
      
      const { error } = await supabase
        .from('Fee')
        .update({ 
          status: 'PAID',
          paymentDate: new Date().toISOString(),
          receiptNumber
        })
        .eq('id', selectedFee.id)
        
      if (error) throw error
      
      toast({ title: "Payment Successful", description: `Receipt ${receiptNumber} generated.` })
      setPaymentModalOpen(false)
      await fetchFees()
      
    } catch (err: any) {
      toast({ title: "Payment Failed", description: err.message, variant: "destructive" })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="p-8 text-center animate-pulse">Loading fee records...</div>

  const totalPending = fees.filter(f => f.status !== 'PAID').reduce((sum, f) => sum + f.amount, 0)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground mt-1">Track and pay your academic fees</p>
        </div>
        
        <Card className="glass border-orange-500/30 bg-orange-500/10 inline-block shrink-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/20 text-orange-500">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-500/80">Total Due</p>
              <h2 className="text-2xl font-bold text-orange-400">₹{totalPending.toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {fees.length === 0 ? (
          <div className="col-span-full text-center p-12 glass rounded-xl border border-white/10">
            <p className="text-muted-foreground">No fee records found.</p>
          </div>
        ) : (
          fees.map((fee) => {
            const isPaid = fee.status === 'PAID'
            const isOverdue = !isPaid && new Date(fee.dueDate) < new Date()
            
            return (
              <Card key={fee.id} className={`glass flex flex-col ${isPaid ? 'bg-card/30 border-white/5' : isOverdue ? 'bg-red-500/5 border-red-500/30' : 'bg-card/60 border-white/10 shadow-xl'}`}>
                <CardHeader className="pb-3 border-b border-white/5 mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{fee.Semester?.name}</span>
                    {isPaid ? (
                      <span className="flex items-center text-xs font-bold text-green-500"><CheckCircle2 className="w-3.5 h-3.5 mr-1"/> PAID</span>
                    ) : isOverdue ? (
                      <span className="flex items-center text-xs font-bold text-red-500"><Clock className="w-3.5 h-3.5 mr-1"/> OVERDUE</span>
                    ) : (
                      <span className="flex items-center text-xs font-bold text-orange-500"><Clock className="w-3.5 h-3.5 mr-1"/> PENDING</span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{fee.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Amount</p>
                      <p className="text-2xl font-bold font-mono tracking-tight">₹{fee.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Due Date</p>
                      <p className="font-medium text-foreground/80">{new Date(fee.dueDate).toLocaleDateString()}</p>
                    </div>
                    {isPaid && fee.paymentDate && (
                      <div>
                        <p className="text-muted-foreground mb-1">Paid On</p>
                        <p className="font-medium text-green-400">{new Date(fee.paymentDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {isPaid && fee.receiptNumber && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground mb-1">Receipt No.</p>
                        <p className="font-medium text-foreground/80 font-mono text-xs">{fee.receiptNumber}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {!isPaid && (
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full shadow-lg" 
                      onClick={() => handlePayClick(fee)}
                      variant={isOverdue ? "destructive" : "default"}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md glass border-white/20">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              You are about to pay the {selectedFee?.title}. This is a simulated payment gateway.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-background/50 rounded-lg border border-white/5 flex flex-col items-center justify-center my-4 space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Amount to Pay</p>
            <p className="text-4xl font-bold font-mono">₹{selectedFee?.amount?.toLocaleString()}</p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setPaymentModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={simulatePayment} disabled={processing} className="min-w-[140px]">
              {processing ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
