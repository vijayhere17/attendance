import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
   ArrowRight,
   TrendingUp,
   AlertCircle,
   User,
   MoreVertical,
   Briefcase,
   History,
   CalendarDays,
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
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import '@/styles/Attendance.css';

interface AdminAttendanceRecord {
   _id: string;
   date: string;
   status: string;
   break_minutes?: number;
   worked_minutes?: number;
   work_mode?: string;
   is_policy_violation?: boolean;
   check_in?: string;
   check_out?: string;
   user?: {
      _id?: string;
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
         setRecords(data || []);
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
      late: filteredRecords.filter(r => r.status === 'late' || r.status === 'halfday').length,
      absent: filteredRecords.filter(r => r.status === 'absent').length,
      violations: filteredRecords.filter(r => r.is_policy_violation).length,
   };

   return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-border/60">
          <div className='space-y-1'>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <History className="w-8 h-8 text-primary" />
              Attendance Details
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Recorded sessions for {format(new Date(startDate), 'MMM dd')} — {format(new Date(endDate), 'MMM dd, yyyy')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 lg:flex-none h-10 px-4 bg-white border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-widest gap-2 shadow-sm hover:bg-slate-50"
              onClick={() => {
                setStartDate(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
                setEndDate(format(new Date(), 'yyyy-MM-dd'));
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || filteredRecords.length === 0}
              size="sm"
              className="flex-1 lg:flex-none h-10 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-bold shadow-sm gap-2"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Export .XLSX
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card className="rounded-lg border-slate-200 shadow-sm bg-slate-50 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input
                  placeholder="Search identity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-white border-slate-200 rounded-md text-sm focus:ring-slate-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-md shadow-sm">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 w-28 border-none shadow-none focus-visible:ring-0 text-[10px] font-bold"
                  />
                  <span className="text-slate-300 font-bold text-[10px]">TO</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 w-28 border-none shadow-none focus-visible:ring-0 text-[10px] font-bold"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-[120px] rounded-md bg-white border-slate-200 text-[10px] font-bold uppercase tracking-widest">
                    <SelectValue placeholder="STATUS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ALL STATUS</SelectItem>
                    <SelectItem value="present">PRESENT</SelectItem>
                    <SelectItem value="late">LATE</SelectItem>
                    <SelectItem value="early_exit">EARLY EXIT</SelectItem>
                    <SelectItem value="absent">ABSENT</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={shiftFilter} onValueChange={setShiftFilter}>
                  <SelectTrigger className="h-10 w-[120px] rounded-md bg-white border-slate-200 text-[10px] font-bold uppercase tracking-widest">
                    <SelectValue placeholder="SHIFT" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ALL ROLES</SelectItem>
                    <SelectItem value="employee">FULL-TIME</SelectItem>
                    <SelectItem value="intern_batch1">BATCH 1</SelectItem>
                    <SelectItem value="intern_batch2">BATCH 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Member</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">In</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Out</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Work Mode</TableHead>
                {/* <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Worked</TableHead> */}
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Break</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Working hours</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center text-slate-500">
                    No records found for the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r) => (
                  <TableRow key={r._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-50 last:border-0">
                    <TableCell className="pl-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{format(new Date(r.date), 'MMM dd')}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{format(new Date(r.date), 'EEE')}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {getInitials(r.user?.full_name || '')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{r.user?.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{r.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs font-mono font-bold text-slate-700">
                        <span>{r.check_in ? format(new Date(r.check_in), 'hh:mm a') : '--:--'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                         <span className="text-xs font-mono font-bold text-slate-700">{r.check_out ? format(new Date(r.check_out), 'hh:mm a') : (r.check_in ? 'Active' : '--:--')}</span>
                    </TableCell>
                    <TableCell>
                        <Badge className="text-[10px] font-bold uppercase tracking-widest px-2 h-5">
                           {r.work_mode === 'remote' ? 'REMOTE' : r.work_mode === 'office' ? 'OFFICE' : 'HYBRID'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                       <span className="text-xs font-bold text-slate-700">{r.break_minutes || 0}m</span>
                    </TableCell>
                    <TableCell>
                       <span className="text-xs font-bold text-slate-900">
                          {Math.floor((r.worked_minutes || 0) / 60)}h {(r.worked_minutes || 0) % 60}m
                       </span>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="inline-flex flex-col items-center gap-1">
                          <StatusBadge status={r.status} className="text-[9px] font-bold uppercase tracking-widest px-2 h-5" />
                          {r.is_policy_violation && (
                             <AlertCircle className="w-3 h-3 text-rose-500" />
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="pr-6">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                <MoreVertical className="w-4 h-4" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest">Details</DropdownMenuItem>
                             <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest text-rose-600">Flag</DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
