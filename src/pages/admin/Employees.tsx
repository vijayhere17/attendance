import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  MoreVertical,
  UserPlus,
  Copy,
  Check,
  Key,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnimatedBackground } from '@/components/AnimatedBackground';
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

interface Employee {
  _id: string;
  full_name: string;
  email: string;
  role: string;
  batch?: string | null;
  shift_start: string;
  shift_end: string;
  createdAt: string;
  must_change_password?: boolean;
}

// NEW: Interface for create user response
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

  // NEW: States for create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'employee' | 'intern'>('employee');
  const [newUserBatch, setNewUserBatch] = useState<'batch1' | 'batch2'>('batch1');

  // NEW: State for showing temp password after creation
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

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

  // NEW: Handle create user
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
      });

      // Show the temp password to admin
      setCreatedUser(data);

      // Refresh employee list
      fetchEmployees();

      toast.success('User created successfully!');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  // NEW: Reset form and close dialog
  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setCreatedUser(null);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('employee');
    setNewUserBatch('batch1');
    setPasswordCopied(false);
  };

  // NEW: Copy password to clipboard
  const copyPassword = async () => {
    if (createdUser?.temporary_password) {
      await navigator.clipboard.writeText(createdUser.temporary_password);
      setPasswordCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  // NEW: Handle password reset
  const handleResetPassword = async (userId: string) => {
    try {
      const { data } = await client.post(`/admin/users/${userId}/reset-password`);
      toast.success('Password reset successfully', {
        description: `New temporary password: ${data.temporary_password}`,
        duration: 10000,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  // NEW: Handle delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await client.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <Layout>
      <div className="relative z-0">
        <AnimatedBackground />
      </div>

      <div className="space-y-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage your workforce and roles</p>
          </div>
          <div className="flex items-center gap-3">
            {/* NEW: Create User Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={(open) => open ? setCreateDialogOpen(true) : handleCloseDialog()}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-glow-accent hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {!createdUser ? (
                  // CREATE USER FORM
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Create New User
                      </DialogTitle>
                      <DialogDescription>
                        Add a new employee or intern. A temporary password will be generated.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          placeholder="John Doe"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@company.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select value={newUserRole} onValueChange={(v: 'employee' | 'intern') => setNewUserRole(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Employee (Full-time)
                              </div>
                            </SelectItem>
                            <SelectItem value="intern">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Intern (Part-time)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show batch selector only for interns */}
                      {newUserRole === 'intern' && (
                        <div className="space-y-2 animate-slide-up">
                          <Label htmlFor="batch">Batch *</Label>
                          <Select value={newUserBatch} onValueChange={(v: 'batch1' | 'batch2') => setNewUserBatch(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="batch1">
                                <div className="flex flex-col">
                                  <span>Batch 1</span>
                                  <span className="text-xs text-muted-foreground">10:30 AM - 1:30 PM</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="batch2">
                                <div className="flex flex-col">
                                  <span>Batch 2</span>
                                  <span className="text-xs text-muted-foreground">3:00 PM - 6:00 PM</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseDialog}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={creating} className="gap-2">
                          {creating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Create User
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </>
                ) : (
                  // SHOW TEMP PASSWORD AFTER CREATION
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-success">
                        <Check className="w-5 h-5" />
                        User Created Successfully!
                      </DialogTitle>
                      <DialogDescription>
                        Share these credentials with the user. They will be required to change their password on first login.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {/* User details */}
                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{createdUser.user.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{createdUser.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Role:</span>
                          <Badge variant="secondary">{createdUser.user.role}</Badge>
                        </div>
                        {createdUser.user.batch && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Batch:</span>
                            <Badge variant="outline">{createdUser.user.batch}</Badge>
                          </div>
                        )}
                      </div>

                      {/* IMPORTANT: Temporary password */}
                      <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 space-y-2">
                        <div className="flex items-center gap-2 text-warning font-medium">
                          <Key className="w-4 h-4" />
                          Temporary Password
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 rounded bg-background font-mono text-lg tracking-widest">
                            {createdUser.temporary_password}
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={copyPassword}
                            className="shrink-0"
                          >
                            {passwordCopied ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>This password will only be shown once. The user must change it on first login.</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button onClick={handleCloseDialog} className="w-full">
                        Done
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search employees by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base bg-card/50 backdrop-blur-sm border-border/50 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 h-12 border-border/50 bg-card/50">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <div className="bg-card/50 border border-border/50 rounded-lg p-1 flex items-center h-12">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-9 w-9 p-0"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-9 w-9 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20 min-h-[50vh]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 bg-card/30 rounded-3xl border border-border/50 backdrop-blur-sm animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
              <UserCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No employees found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {searchTerm ? 'Try adjusting your search terms to find what you looking for.' : 'Get started by adding your first employee to the system.'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
                {filteredEmployees.map((emp) => (
                  <Card key={emp._id} className="group hover:shadow-medium transition-all duration-300 border-border/50 overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-background shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white font-bold">
                            {getInitials(emp.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base font-bold">{emp.full_name}</CardTitle>
                          <div className="flex gap-1 mt-1">
                            <Badge variant={emp.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                              {emp.role}
                            </Badge>
                            {emp.batch && (
                              <Badge variant="outline" className="text-xs">
                                {emp.batch}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleResetPassword(emp._id)}>
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteUser(emp._id, emp.full_name)}
                            disabled={emp.role === 'admin'}
                          >
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(`2000-01-01 ${emp.shift_start}`), 'h:mm a')} - {format(new Date(`2000-01-01 ${emp.shift_end}`), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {format(new Date(emp.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      {emp.must_change_password && (
                        <Badge variant="outline" className="text-warning border-warning/50 bg-warning/5 w-full justify-center">
                          Pending First Login
                        </Badge>
                      )}
                      <div className="pt-2 flex gap-2">
                        <Button variant="outline" className="flex-1 h-9 text-xs">View History</Button>
                        <Button variant="secondary" className="flex-1 h-9 text-xs">Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-soft border-border/50 overflow-hidden animate-slide-up">
                <div className="rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold pl-6">Employee</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Shift</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Joined</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((emp) => (
                        <TableRow key={emp._id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 border border-border">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white text-xs font-bold">
                                  {getInitials(emp.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground">{emp.full_name}</p>
                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={emp.role === 'admin' ? 'default' : 'secondary'} className="gap-1 font-medium">
                                <Shield className="w-3 h-3" />
                                {emp.role}
                              </Badge>
                              {emp.batch && (
                                <Badge variant="outline" className="text-xs">
                                  {emp.batch}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {format(new Date(`2000-01-01 ${emp.shift_start}`), 'h:mm a')} - {format(new Date(`2000-01-01 ${emp.shift_end}`), 'h:mm a')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {emp.must_change_password ? (
                              <Badge variant="outline" className="text-warning border-warning/50 bg-warning/5">
                                Pending Login
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-success border-success/50 bg-success/5">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(emp.createdAt), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleResetPassword(emp._id)}>
                                  <Key className="w-4 h-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteUser(emp._id, emp.full_name)}
                                  disabled={emp.role === 'admin'}
                                >
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
