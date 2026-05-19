import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import client from '@/api/client';
import {
  Users,
  Search,
  Mail,
  Clock,
  Loader2,
  UserCircle,
  Shield,
  Calendar,
  LayoutGrid,
  List,
  Filter,
  MoreHorizontal,
  UserPlus,
  Copy,
  Check,
  Key,
  AlertTriangle,
  Phone,
  Hash,
  ArrowRight,
  UserMinus,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import '@/styles/Employees.css';

interface Employee {
  _id: string;
  full_name: string;
  email: string;
  role: string;
  phone_number: string;
  batch?: string | null;
  shift_start: string;
  shift_end: string;
  createdAt: string;
  must_change_password?: boolean;
  studentId?: string;
  wfh_enabled?: boolean;
  avatar_url?: string;
  monthly_limits?: {
    leave: number;
    late: number;
    wfh: number;
  };
}

interface CreateUserResponse {
  success: boolean;
  message: string;
  user: Employee;
  temporary_password: string;
  instructions: string;
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'employee' | 'intern'>('employee');
  const [newUserBatch, setNewUserBatch] = useState<'batch1' | 'batch2'>('batch1');
  const [newUserWfhEnabled, setNewUserWfhEnabled] = useState(false);
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserStudentId, setNewUserStudentId] = useState('');

  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      const { data } = await client.get('/admin/employees');
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setCreating(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const data = {
        full_name: formData.get('full_name'),
        phone_number: formData.get('phone_number'),
        studentId: formData.get('studentId'),
        role: formData.get('role'),
        batch: formData.get('batch'),
        wfh_enabled: formData.get('wfh_enabled') === 'on',
        monthly_limits: {
          leave: Number(formData.get('limit_leave')),
          late: Number(formData.get('limit_late')),
          wfh: Number(formData.get('limit_wfh')),
        }
      };

      await client.put(`/admin/users/${editingEmployee._id}`, data);
      toast.success('User updated successfully');
      setEditDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const { data } = await client.post('/admin/users', {
        full_name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        batch: newUserRole === 'intern' ? newUserBatch : null,
        wfh_enabled: newUserWfhEnabled,
        phone_number: newUserPhone,
        studentId: newUserStudentId,
      });

      setCreatedUser(data);
      fetchEmployees();
      toast.success('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setCreatedUser(null);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('employee');
    setNewUserBatch('batch1');
    setNewUserPhone('');
    setNewUserStudentId('');
    setPasswordCopied(false);
  };

  const copyPassword = async () => {
    if (createdUser?.temporary_password) {
      await navigator.clipboard.writeText(createdUser.temporary_password);
      setPasswordCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const { data } = await client.post(`/admin/users/${userId}/reset-password`);
      toast.success('Password reset successfully', {
        description: `New temporary password: ${data.temporary_password}`,
        duration: 10000,
      });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await client.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchEmployees();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handlePromoteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to promote ${userName} to a full-time Employee?`)) return;
    
    try {
      await client.put(`/admin/users/${userId}`, { role: 'employee' });
      toast.success(`${userName} has been promoted to Employee!`);
      fetchEmployees();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to promote user');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="w-6 h-6" />
              Team Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage workforce roles, permissions, and session policies.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Dialog open={createDialogOpen} onOpenChange={(open) => open ? setCreateDialogOpen(true) : handleCloseDialog()}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto h-10 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-bold shadow-sm gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden border-slate-200 shadow-xl">
                {!createdUser ? (
                  <div className="p-0">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-200">
                      <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        <UserPlus className="w-5 h-5" />
                        New Team Member
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        Enter account details to onboard a new employee.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
                          <Input
                            id="full_name"
                            placeholder="John Doe"
                            className="h-10 rounded-md border-slate-200 focus:ring-slate-900"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="studentId" className="text-xs font-bold uppercase text-slate-500">Internal ID</Label>
                          <Input
                            id="studentId"
                            placeholder="e.g. 2024-001"
                            className="h-10 rounded-md border-slate-200 focus:ring-slate-900"
                            value={newUserStudentId}
                            onChange={(e) => setNewUserStudentId(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@company.com"
                          className="h-10 rounded-md border-slate-200 focus:ring-slate-900"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role" className="text-xs font-bold uppercase text-slate-500">Work Role</Label>
                          <Select value={newUserRole} onValueChange={(v: 'employee' | 'intern') => setNewUserRole(v)}>
                            <SelectTrigger className="h-10 rounded-md border-slate-200">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="intern">Intern</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase text-slate-500">Shift Batch</Label>
                           <Select value={newUserBatch} onValueChange={(v: 'batch1' | 'batch2') => setNewUserBatch(v)}>
                              <SelectTrigger className="h-10 rounded-md border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="batch1">Batch 1 (AM)</SelectItem>
                                <SelectItem value="batch2">Batch 2 (PM)</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 border p-4 rounded-md bg-slate-50 border-slate-200">
                        <input
                          type="checkbox"
                          id="wfh"
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          checked={newUserWfhEnabled}
                          onChange={(e) => setNewUserWfhEnabled(e.target.checked)}
                        />
                        <label htmlFor="wfh" className="text-sm font-medium text-slate-700 cursor-pointer">
                          Enable Remote Check-in
                        </label>
                      </div>

                      <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={handleCloseDialog} className="text-slate-600">Cancel</Button>
                        <Button type="submit" disabled={creating} className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-bold">
                          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                       <Check className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Account Created</h3>
                      <p className="text-sm text-slate-500 mt-1">{createdUser.user.full_name} is now in the system.</p>
                    </div>

                    <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Temporary Password</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 font-mono text-lg font-bold text-slate-900 tracking-wider">
                          {createdUser.temporary_password}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-900"
                          onClick={copyPassword}
                        >
                          {passwordCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button onClick={handleCloseDialog} className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-bold">
                      Done
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-sm rounded-md border-slate-200 focus:ring-slate-900 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md border border-slate-200">
             <button
               onClick={() => setViewMode('grid')}
               className={`h-8 px-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
               Grid
             </button>
             <button
               onClick={() => setViewMode('list')}
               className={`h-8 px-3 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
               List
             </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Directory</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-lg">
            <p className="text-slate-500 font-medium">No team members found.</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEmployees.map((emp) => (
                  <Card key={emp._id} className="bg-white border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col group">
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {getInitials(emp.full_name)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingEmployee(emp); setEditDialogOpen(true); }}>Edit Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(emp._id)}>Reset Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(emp._id, emp.full_name)}
                              disabled={emp.role === 'admin'}
                              className="text-rose-600"
                            >
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-slate-900 truncate">{emp.full_name}</h3>
                        <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-5 bg-slate-50">
                          {emp.role}
                        </Badge>
                        {emp.batch && (
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-5 bg-slate-50">
                            {emp.batch}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-50 space-y-2">
                        <div className="flex justify-between text-[10px] font-medium">
                          <span className="text-slate-400 uppercase tracking-widest">Employee ID</span>
                          <span className="text-slate-900 font-mono">{emp.studentId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium">
                          <span className="text-slate-400 uppercase tracking-widest">Shift</span>
                          <span className="text-slate-900">{emp.shift_start} - {emp.shift_end}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" className="w-full h-10 rounded-none border-t border-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-50" asChild>
                      <Link to={`/admin/attendance?search=${emp.full_name}`}>
                        View Activity
                      </Link>
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Member</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ID</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Role</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Schedule</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp) => (
                      <TableRow key={emp._id} className="hover:bg-slate-50/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                              {getInitials(emp.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{emp.full_name}</p>
                              <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono font-medium text-slate-600">{emp.studentId || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-slate-50">
                            {emp.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-600">{emp.shift_start} - {emp.shift_end}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-widest ${emp.must_change_password ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {emp.must_change_password ? 'Pending' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingEmployee(emp); setEditDialogOpen(true); }}>Edit Profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(emp._id)}>Reset Password</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(emp._id, emp.full_name)}
                                disabled={emp.role === 'admin'}
                                className="text-rose-600"
                              >
                                Delete Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg p-0 overflow-hidden border-slate-200 shadow-xl">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-200">
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Member Profile</DialogTitle>
          </DialogHeader>
          
          {editingEmployee && (
            <form onSubmit={handleEditUser} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
                  <Input name="full_name" defaultValue={editingEmployee.full_name} required className="h-10 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Internal ID</Label>
                  <Input name="studentId" defaultValue={editingEmployee.studentId} required className="h-10 rounded-md" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Work Role</Label>
                  <Select name="role" defaultValue={editingEmployee.role}>
                    <SelectTrigger className="h-10 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Shift Batch</Label>
                  <Select name="batch" defaultValue={editingEmployee.batch || 'batch1'}>
                    <SelectTrigger className="h-10 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="batch1">Batch 1 (Morning)</SelectItem>
                      <SelectItem value="batch2">Batch 2 (Evening)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Monthly Quotas</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 text-center">
                    <Label className="text-[10px] font-medium text-slate-500">Leaves</Label>
                    <Input name="limit_leave" type="number" defaultValue={editingEmployee.monthly_limits?.leave || 2} className="h-9 text-center font-bold" />
                  </div>
                  <div className="space-y-1 text-center">
                    <Label className="text-[10px] font-medium text-slate-500">Lates</Label>
                    <Input name="limit_late" type="number" defaultValue={editingEmployee.monthly_limits?.late || 3} className="h-9 text-center font-bold" />
                  </div>
                  <div className="space-y-1 text-center">
                    <Label className="text-[10px] font-medium text-slate-500">WFH</Label>
                    <Input name="limit_wfh" type="number" defaultValue={editingEmployee.monthly_limits?.wfh || 2} className="h-9 text-center font-bold" />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 border p-4 rounded-md bg-slate-50 border-slate-200">
                <input
                  type="checkbox"
                  id="edit_wfh_enabled"
                  name="wfh_enabled"
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  defaultChecked={editingEmployee.wfh_enabled}
                />
                <label htmlFor="edit_wfh_enabled" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Authorise Work From Home Permissions
                </label>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)} className="text-slate-600">Cancel</Button>
                <Button type="submit" disabled={creating} className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-bold">
                   {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
