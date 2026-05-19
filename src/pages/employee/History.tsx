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
  Search,
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Attendance History</h1>
            <p className="text-sm text-slate-500 mt-1">Detailed record of your work sessions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 px-4 rounded-md bg-white border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-widest gap-2 shadow-sm hover:bg-slate-50">
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 pl-4 pr-8 rounded-md bg-white border border-slate-200 text-slate-900 text-xs font-bold uppercase tracking-widest shadow-sm focus:ring-1 focus:ring-slate-900 appearance-none cursor-pointer"
              >
                <option value="all">Filter Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="early_exit">Early Exit</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-48 h-9 pl-9 pr-4 rounded-md bg-white border border-slate-200 text-xs font-medium placeholder:text-slate-400 shadow-sm focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Logs"
            value={stats.total}
            icon={<Calendar className="w-4 h-4" />}
          />
          <StatCard
            title="On Time"
            value={stats.present}
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <StatCard
            title="Late"
            value={stats.late}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <StatCard
            title="Rate"
            value={`${attendanceRate}%`}
            icon={<TrendingUp className="w-4 h-4 text-slate-900" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 lg:sticky lg:top-6 h-fit space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Calendar</h3>
                <span className="text-[10px] font-bold text-slate-900">{format(currentDate, 'MMM yyyy')}</span>
              </div>
              <div className="p-4">
                <AttendanceCalendar
                  records={records}
                  currentDate={currentDate}
                  onMonthChange={setCurrentDate}
                />
              </div>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-lg p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Color Legend</p>
              <div className="grid grid-cols-2 gap-y-3">
                {[
                  { label: 'Present', color: 'bg-emerald-500' },
                  { label: 'Late', color: 'bg-amber-500' },
                  { label: 'Absent', color: 'bg-rose-500' },
                  { label: 'Streak', color: 'bg-slate-900' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="bg-white border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Session Records</h3>
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-white">{filteredRecords.length} Entries</Badge>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                    <p className="text-xs font-medium">No records matching your criteria.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 h-10 px-5">Date</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 h-10 px-5">Check In</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 h-10 px-5">Check Out</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 h-10 px-5 text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-50 last:border-0">
                          <TableCell className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-900">{format(parseISO(record.date), 'MMM d')}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{format(parseISO(record.date), 'EEEE')}</p>
                          </TableCell>
                          <TableCell className="px-5">
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '--:--'}
                            </span>
                          </TableCell>
                          <TableCell className="px-5">
                            <span className="text-xs font-mono font-bold text-slate-700">
                              {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '--:--'}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 text-right">
                            <StatusBadge status={record.status} size="sm" className="h-5 px-2 text-[9px] font-bold uppercase tracking-widest" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
