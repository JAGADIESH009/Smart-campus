"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserPlus, Trash2, KeyRound, Edit, Eye, Ban, CheckCircle2 } from "lucide-react"
import { CreateUserForm } from "./create-user-form"
import { EditUserForm } from "./edit-user-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { resetPasswordAction, deleteUserAction, updateUserStatusAction, bulkDeleteAction, bulkUpdateStatusAction } from "@/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function UserManagementClient({ users, departments, courses }: { users: any[], departments: any[], courses: any[] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<any | null>(null)
  const [viewUser, setViewUser] = useState<any | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  
  // Filtering & Pagination
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const { toast } = useToast()

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredUsers.slice(start, start + rowsPerPage)
  }, [filteredUsers, currentPage])

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedUsers.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedUsers.map(u => u.id)))
    }
  }

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedRows)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedRows(newSet)
  }

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) return
    const result = await resetPasswordAction(email)
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" })
    else toast({ title: "Success", description: "Password reset email sent." })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ${name}? This action cannot be undone.`)) return
    const result = await deleteUserAction(id)
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" })
    else toast({ title: "Success", description: "User deleted successfully." })
  }

  const handleStatusToggle = async (id: string, currentBanStatus: boolean) => {
    const isBanning = !currentBanStatus
    if (!confirm(`Are you sure you want to ${isBanning ? 'disable' : 'enable'} this account?`)) return
    const result = await updateUserStatusAction(id, isBanning)
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" })
    else toast({ title: "Success", description: `Account ${isBanning ? 'disabled' : 'enabled'}.` })
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.size} users?`)) return
    const result = await bulkDeleteAction(Array.from(selectedRows))
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" })
    else {
      toast({ title: "Success", description: "Users deleted." })
      setSelectedRows(new Set())
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Search users..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-[300px]"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="FACULTY">Faculty</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="ALUMNI">Alumni</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {selectedRows.size > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedRows.size})
            </Button>
          )}
          <Button onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input 
                  type="checkbox" 
                  checked={selectedRows.size > 0 && selectedRows.size === paginatedUsers.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(user.id)}
                    onChange={() => toggleRow(user.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 
                      user.role === 'FACULTY' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{user.specificInfo}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setViewUser(user)}>
                        <Eye className="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                        <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusToggle(user.id, false)}>
                        <Ban className="mr-2 h-4 w-4 text-orange-500" /> Disable Account
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {paginatedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <CreateUserForm 
            onSuccess={() => setIsCreateOpen(false)}
            departments={departments}
            courses={courses}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <EditUserForm 
              user={editUser}
              onSuccess={() => setEditUser(null)}
              departments={departments}
              courses={courses}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold">
                  {viewUser.profile?.profilePhoto ? <img src={viewUser.profile.profilePhoto} className="w-full h-full rounded-full object-cover"/> : viewUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewUser.name}</h3>
                  <p className="text-sm text-gray-500">{viewUser.email}</p>
                  <p className="text-sm font-semibold text-primary">{viewUser.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Joined:</strong> {new Date(viewUser.createdAt).toLocaleDateString()}</div>
                <div><strong>Phone:</strong> {viewUser.profile?.contactNumber || 'N/A'}</div>
                <div><strong>Gender:</strong> {viewUser.profile?.gender || 'N/A'}</div>
                <div><strong>Address:</strong> {viewUser.profile?.address || 'N/A'}</div>
              </div>
              
              {viewUser.role === 'STUDENT' && viewUser.student && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                  <h4 className="font-bold border-b pb-2 mb-2">Academic Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Reg No:</strong> {viewUser.student.registrationNo}</div>
                    <div><strong>Roll No:</strong> {viewUser.student.rollNumber}</div>
                    <div><strong>Status:</strong> {viewUser.student.academicStatus}</div>
                    <div><strong>CGPA:</strong> {viewUser.student.cgpa || 'N/A'}</div>
                    <div><strong>Parent Name:</strong> {viewUser.student.parentName || 'N/A'}</div>
                    <div><strong>Parent Contact:</strong> {viewUser.student.parentContact || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
