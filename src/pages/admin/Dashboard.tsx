import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import client from '@/api/client';
import {
  Users,
  Clock,
  Loader2,
  Calendar,
  ArrowRight,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import '@/styles/Dashboard.css';

interface WeeklyData {
  day: string;
  present: number;
  late: number;
  absent: number;
}

interface RecentRecord {
  id: string | number;
  user?: {
    full_name?: string;
  };
  check_in?: string | null;
  status: 'present' | 'late' | 'absent' | string;
}

interface TopPerformer {
  id: string | number;
  name: string;
  streak: number;
  score: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, weeklyRes, topRes, activityRes] = await Promise.all([
          client.get('/admin/dashboard/stats'),
          client.get('/admin/dashboard/weekly'),
          client.get('/admin/dashboard/top-performers'),
          client.get('/admin/dashboard/activity'),
        ]);

        setStats(statsRes.data);
        setWeeklyData(weeklyRes.data);
        setTopPerformers(topRes.data);
        setRecentRecords(activityRes.data);

        const { present, late, total } = statsRes.data;
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        setAttendanceRate(Math.min(100, rate));
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20 min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4 font-medium">Initializing Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
            <p className="text-sm text-slate-500 mt-1">
              Live metrics for {format(new Date(), 'MMMM d, yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-md shadow-sm">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance Rate</p>
                <p className="text-xl font-bold text-slate-900">{attendanceRate}%</p>
             </div>
             <div className={`h-8 w-1 rounded-full ${attendanceRate > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Workforce"
            value={stats.total}
            icon={<Users className="w-5 h-5" />}
            description="Active accounts"
          />
          <StatCard
            title="Present"
            value={stats.present}
            icon={<UserCheck className="w-5 h-5" />}
            description="Checked in today"
          />
          <StatCard
            title="Late"
            value={stats.late}
            icon={<Clock className="w-5 h-5" />}
            description="Past shift window"
          />
          <StatCard
            title="Absent"
            value={stats.absent}
            icon={<UserX className="w-5 h-5" />}
            description="No logs recorded"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 bg-white border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-5 px-6">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Weekly Engagement</CardTitle>
                <CardDescription className="text-xs">Arrival trends over 7 days</CardDescription>
              </div>
              <Activity className="w-4 h-4 text-slate-300" />
            </CardHeader>
            <CardContent className="flex-1 p-6">
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      name="Present"
                      stroke="#0f172a"
                      fill="#f8fafc"
                      strokeWidth={2}
                      animationDuration={1000}
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      name="Late"
                      stroke="#64748b"
                      fill="#f1f5f9"
                      strokeWidth={2}
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-4 px-5">
                <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">Activity Feed</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[380px] overflow-y-auto">
                {recentRecords.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No recent activity
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentRecords.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {r.user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{r.user?.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {r.check_in ? format(new Date(r.check_in), 'hh:mm a') : 'Pending'}
                          </p>
                        </div>
                        <StatusBadge status={r.status} size="sm" className="h-5 px-2 text-[10px] font-bold" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-3 border-t border-slate-50 bg-slate-50/50">
                <Button variant="ghost" size="sm" className="w-full text-xs font-bold h-8 text-slate-600 hover:text-slate-900" asChild>
                  <Link to="/admin/attendance">
                    View All Logs
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <CardHeader className="border-b border-slate-50 py-4 px-5">
                <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {topPerformers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No data available
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {topPerformers.map((user, i) => (
                      <div key={user.id} className="flex items-center gap-3 p-4">
                        <span className="text-xs font-bold text-slate-400 w-4">0{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-bold text-slate-900 truncate">{user.name}</span>
                            <span className="text-slate-500 font-medium">{user.streak}d streak</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full transition-all duration-700"
                              style={{ width: `${user.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
