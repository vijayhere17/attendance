import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/hooks/useAuth';
import client from '@/api/client';
import {
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  LogOut as LogOutIcon,
  MapPin,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AttendanceCalendar } from '@/components/AttendanceCalendar';
import { Badge } from '@/components/ui/badge';
import '@/styles/History.css';

import { AttendanceRecord } from '@/types/attendance';

export default function History() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!profile) return;
      setLoading(true);
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      try {
        const { data } = await client.get(`/attendance/history?startDate=${startDate}&endDate=${endDate}`);
        if (data) setRecords(data);
      } catch (error) {
        console.error("Error fetching history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [profile, currentDate]);

  const filteredRecords = records.filter(record => {
    const matchesSearch = format(parseISO(record.date), 'MMM d EEEE').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    earlyExit: records.filter(r => r.status === 'early_exit').length,
    total: records.length,
  };

  const attendanceRate = stats.total > 0
    ? Math.round(((stats.present + stats.late) / stats.total) * 100)
    : 0;

  return (
    <Layout>
      <div className="history-container space-y-8 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                Attendance History
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">My History</h1>
            <p className="text-muted-foreground font-medium max-w-md">Detailed record of your work history and attendance reliability.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-2xl glass border-white/10 hover:bg-white/10 text-white font-bold gap-2">
              <Download className="w-4 h-4 text-primary" />
              Export
            </Button>
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 pl-12 pr-6 rounded-2xl glass border-white/10 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-transparent cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="early_exit">Early Exit</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div className="relative group flex-1 md:flex-none">
              <LogOutIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors rotate-180" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 h-12 pl-12 pr-6 rounded-2xl glass border-white/10 text-white font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sessions"
            value={stats.total}
            icon={<Calendar className="w-5 h-5" />}
            className="rounded-[2rem] border-white/5 bg-white/5 shadow-2xl hover:scale-[1.02] transition-transform duration-500"
          />
          <StatCard
            title="On Time"
            value={stats.present}
            icon={<CheckCircle2 className="w-5 h-5 text-success" />}
            className="rounded-[2rem] border-white/5 bg-white/5 shadow-2xl hover:scale-[1.02] transition-transform duration-500"
          />
          <StatCard
            title="Late Entries"
            value={stats.late}
            icon={<Clock className="w-5 h-5 text-warning" />}
            className="rounded-[2rem] border-white/5 bg-white/5 shadow-2xl hover:scale-[1.02] transition-transform duration-500"
          />
          <StatCard
            title="Efficiency Rate"
            value={`${attendanceRate}%`}
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            className="rounded-[2rem] border-white/5 bg-white/5 shadow-2xl hover:scale-[1.02] transition-transform duration-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit">
            <div className="glass-card rounded-[2.5rem] border-white/5 p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white tracking-tighter">Temporal View</h3>
                <Badge className="bg-primary/10 text-primary border-none">Active</Badge>
              </div>
              <AttendanceCalendar
                records={records}
                currentDate={currentDate}
                onMonthChange={setCurrentDate}
              />
              <div className="p-4 rounded-3xl bg-white/5 border border-white/5 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Legend</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-[10px] text-white font-bold opacity-70">PRESENT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-[10px] text-white font-bold opacity-70">LATE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-[10px] text-white font-bold opacity-70">ABSENT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] text-white font-bold opacity-70">STREAK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter">Operational Logs</h3>
                  <p className="text-muted-foreground font-medium text-sm">Detailed sequence for {format(currentDate, 'MMMM yyyy')}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-white tracking-tighter leading-none">{filteredRecords.length}</p>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Found Entries</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 animate-spin text-primary/50" />
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="py-32 flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group animate-pulse">
                      <Calendar className="w-10 h-10 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-white tracking-tighter">No encrypted logs found</p>
                      <p className="text-muted-foreground text-sm font-medium">Try adjusting your filters or search query.</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableHead className="py-6 px-8 text-white/40 font-black uppercase text-[10px] tracking-widest">Timeline</TableHead>
                        <TableHead className="px-8 text-white/40 font-black uppercase text-[10px] tracking-widest">Arrival</TableHead>
                        <TableHead className="px-8 text-white/40 font-black uppercase text-[10px] tracking-widest">Departure</TableHead>
                        <TableHead className="px-8 text-white/40 font-black uppercase text-[10px] tracking-widest text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record._id} className="record-row border-b border-white/5 group">
                          <TableCell className="px-8 py-6">
                            <p className="text-lg font-black text-white tracking-tighter group-hover:text-primary transition-colors">{format(parseISO(record.date), 'MMM d')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{format(parseISO(record.date), 'EEEE')}</p>
                          </TableCell>
                          <TableCell className="px-8 font-mono text-white/80 font-medium">
                              {record.check_in ? (
                                  <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                      {format(new Date(record.check_in), 'hh:mm a')}
                                  </div>
                              ) : (
                                  <span className="opacity-20">--:--</span>
                              )}
                          </TableCell>
                          <TableCell className="px-8 font-mono text-white/80 font-medium">
                              {record.check_out ? (
                                  <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                                      {format(new Date(record.check_out), 'hh:mm a')}
                                  </div>
                              ) : (
                                  <span className="opacity-20">--:--</span>
                              )}
                          </TableCell>
                          <TableCell className="px-8 text-right">
                            <StatusBadge status={record.status} size="sm" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}