import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import client from '@/api/client';
import {
  Download,
  Loader2,
  Calendar,
  Filter,
  FileSpreadsheet,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  Pause,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import '@/styles/Attendance.css';
interface AdminAttendanceRecord {
  _id: string;
  date: string;
  status: string;
  break_minutes?: number;
  worked_minutes?: number;
  work_mode?: string;
  is_policy_violation?: boolean;
  user?: {
    full_name?: string;
    email?: string;
    role?: string;
    batch?: string;
  };
}

export default function AdminAttendance() {
  const [records, setRecords] = useState<AdminAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/admin/attendance', {
        params: {
          startDate,
          endDate,
          shift: shiftFilter
        }
      });
      setRecords(data);
    } catch (error) {
      console.error("Error fetching attendance records", error);
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, shiftFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await client.get('/admin/attendance/export', {
        params: {
          startDate,
          endDate,
          shift: shiftFilter
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Attendance report exported successfully');
    } catch (error) {
      console.error("Export error:", error);
      toast.error('Export failed', { description: 'Please try again later.' });
    } finally {
      setExporting(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = !searchTerm ||
      r.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.status === 'present').length,
    late: filteredRecords.filter(r => r.status === 'late').length,
    absent: filteredRecords.filter(r => r.status === 'absent').length,
  };

  return (
    <Layout>
      <div className="attendance-container">
        <div className="attendance-header">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Records</h1>
            <p className="text-muted-foreground mt-1 text-lg">View, filter, and export attendance data</p>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export to Excel
          </Button>
        </div>

        <div className="stats-grid">
          <Card className="stat-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold mt-1 text-success">{stats.present}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold mt-1 text-warning">{stats.late}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{stats.absent}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="filter-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="filter-grid">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="early_exit">Early Exit</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="intern_batch1">Batch 1</SelectItem>
                    <SelectItem value="intern_batch2">Batch 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="records-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Records List
            </CardTitle>
            <CardDescription>
              Showing {filteredRecords.length} records from {format(new Date(startDate), 'MMM d')} to {format(new Date(endDate), 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">No records found</p>
                <p className="text-muted-foreground mt-1">Try adjusting your filters to see more results</p>
              </div>
            ) : (
              <div className="table-container">
                <Table className="attendance-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Net Work</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell>
                          <div className="font-medium">{format(new Date(r.date), 'MMM d, yyyy')}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(r.date), 'EEEE')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 border border-border">
                              <AvatarFallback className="avatar-initials">
                                {getInitials(r.user?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-foreground">{r.user?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{r.user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="capitalize">{r.user?.role}</span>
                            {r.user?.role === 'intern' && r.user?.batch && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({r.user.batch})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="time-cell">
                            <Pause className="w-3 h-3 text-indigo-400" />
                            <span className="text-sm">{r.break_minutes || 0}m</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">
                              {Math.floor((r.worked_minutes || 0) / 60)}h {(r.worked_minutes || 0) % 60}m
                            </span>
                            {r.work_mode === 'wfh' && (
                              <Badge variant="outline" className="text-[10px] w-fit h-4 px-1 bg-primary/5">WFH</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={r.status} />
                            {r.is_policy_violation && (
                              <Badge variant="destructive" className="text-[8px] h-3 px-1">VIOLATION</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
