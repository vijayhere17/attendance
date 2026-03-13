import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { LiveClock } from '@/components/LiveClock';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import client from '@/api/client';
import {
  MapPin,
  LogIn,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Calendar,
  Timer,
  Fingerprint,
  Clock,
  Briefcase,
  Pause,
  Play
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { StreakCounter } from '@/components/StreakCounter';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import '@/styles/CheckInOut.css';

interface TodayAttendance {
  _id: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  distance_at_check_in: number | null;
  worked_minutes?: number;
  is_late?: boolean;
  is_early_checkout?: boolean;
  final_status?: string;
  is_on_break?: boolean;
}

interface ShiftConfig {
  role: string;
  batch: string | null;
  shift_start: string;
  shift_end: string;
  check_in_window_start: string;
  check_in_window_end: string;
  min_minutes: number;
  description: string;
  formatted: {
    shift_start: string;
    shift_end: string;
    check_in_window: string;
    min_hours: string;
  };
  status: {
    canCheckIn: boolean;
    canCheckOut: boolean;
    isBeforeCheckIn: boolean;
    isAfterCheckIn: boolean;
    currentTime: string;
  };
}

export default function CheckInOut() {
  const { profile } = useAuth();
  const { getCurrentPosition, loading: geoLoading, error: geoError } = useGeolocation();
  const [todayRecord, setTodayRecord] = useState<TodayAttendance | null>(null);
  const [wfhCount, setWfhCount] = useState(0);
  const [wfhLimit, setWfhLimit] = useState(2);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [workMode, setWorkMode] = useState<'office' | 'wfh'>('office');

  const streak = profile?.current_streak || 0;

  const fetchShiftConfig = async () => {
    try {
      const { data } = await client.get('/shifts/my-shift');
      setShiftConfig(data);
    } catch (error) {
      console.error('Error fetching shift config:', error);
    } finally {
      setShiftLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    if (!profile) return;
    try {
      const { data } = await client.get('/attendance/today');
      // Handle both { record: ... } and direct record response for resilience
      const record = data?.record !== undefined ? data.record : (data?._id ? data : null);
      setTodayRecord(record);
      setWfhCount(data.wfh_count || 0);
      setWfhLimit(data.wfh_limit || 2);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchTodayAttendance();
      fetchShiftConfig();
    }
  }, [profile]);

  const handleAttendance = async (action: 'check_in' | 'check_out') => {
    setActionLoading(true);
    try {
      let position = { latitude: 0, longitude: 0 };
      try {
        position = await getCurrentPosition();
      } catch (err) {
        if (workMode === 'office') throw err;
      }

      const endpoint = action === 'check_in' ? '/attendance/check-in' : '/attendance/check-out';
      const { data } = await client.post(endpoint, {
        latitude: position.latitude,
        longitude: position.longitude,
        work_mode: workMode,
      });

      if (data?.success) {
        toast.success(data.message);
        fetchTodayAttendance();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to process attendance';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeBreak = async () => {
    setActionLoading(true);
    try {
      const { data } = await client.post('/attendance/resume-break');
      if (data?.success) {
        toast.success(data.message);
        fetchTodayAttendance();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resume break';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const canCheckIn = !todayRecord?.check_in;
  const canCheckOut = todayRecord?.check_in && !todayRecord?.check_out;
  const isComplete = todayRecord?.check_in && todayRecord?.check_out;

  const getWorkDuration = () => {
    if (!todayRecord?.check_in) return null;
    let endTime = todayRecord.check_out ? new Date(todayRecord.check_out) : new Date();
    const startTime = new Date(todayRecord.check_in);

    // Timer Fix: If on break, cap endTime at the break start (assuming 2:00 PM for now as per user)
    // In a real system, we'd use the actual break start time from config.
    if (todayRecord.is_on_break) {
      const breakStart = new Date(endTime);
      breakStart.setHours(14, 0, 0, 0);
      if (endTime > breakStart) {
        endTime = breakStart;
      }
    }

    const hours = differenceInHours(endTime, startTime);
    const mins = differenceInMinutes(endTime, startTime) % 60;
    return { hours, mins };
  };

  const getShiftProgress = () => {
    if (!todayRecord?.check_in || !profile) return 0;
    const [endH, endM] = (profile.shift_end || '18:00:00').split(':').map(Number);
    const [startH, startM] = (profile.shift_start || '09:00:00').split(':').map(Number);
    const totalMinutes = (endH - startH) * 60 + (endM - startM);
    
    // Use the same paused logic for progress
    const duration = getWorkDuration();
    if (!duration) return 0;
    const worked = duration.hours * 60 + duration.mins;
    return Math.min(100, Math.round((worked / totalMinutes) * 100));
  };

  const workDuration = getWorkDuration();
  const shiftProgress = getShiftProgress();

  // Monthly Limits from profile
  const limits = (profile as any)?.monthly_limits || { leave: 2, late: 3, wfh: 2 };
  const stats = (profile as any)?.month_stats || { leave: 0, late: 0, wfh: 0 };

  return (
    <Layout>
      <div className="check-in-container">
        <div className="check-in-header">
          <div className="header-user-info">
            <p className="greeting-text font-display">
              Terminal Operational — {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
            </p>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 border-2 border-primary/20">
                <AvatarImage src={(profile as any)?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {(profile?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="user-full-name font-display text-gradient">Agent {profile?.full_name?.split(' ')[0]}</h1>
                <p className="current-date">
                  <Calendar className="w-4 h-4 text-primary" />
                  {format(new Date(), 'EEEE, dd MMMM yyyy').toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <div className="time-card glass-card">
              <div className="flex items-center justify-between gap-12">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">Standard Time</p>
                  <div className="live-clock-text">
                    <LiveClock showSeconds />
                  </div>
                </div>
                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                  <Timer className="w-8 h-8 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="check-in-main-grid">
          <div className="action-column">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="glass-card p-6 border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WFH Protocol</p>
                  <Badge variant={stats.wfh >= limits.wfh ? "destructive" : "secondary"} className="text-[10px] py-0">
                    {Math.max(0, limits.wfh - stats.wfh)} REMAINING
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white">{stats.wfh}/{limits.wfh}</h3>
                  <div className={`p-2 rounded-lg ${workMode === 'wfh' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                    <Navigation className="w-5 h-5 cursor-pointer" onClick={() => {
                        if (canCheckIn && stats.wfh < limits.wfh) {
                            setWorkMode(prev => prev === 'office' ? 'wfh' : 'office');
                        } else if (canCheckIn) {
                            toast.error('WFH monthly limit reached');
                        }
                    }} />
                  </div>
                </div>
                <Progress value={(stats.wfh / limits.wfh) * 100} className="h-1 mt-4" />
              </Card>

              <Card className="glass-card p-6 border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Late Tolerance</p>
                  <Badge variant={stats.late >= limits.late ? "destructive" : "secondary"} className="text-[10px] py-0">
                    {Math.max(0, limits.late - stats.late)} REMAINING
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white">{stats.late}/{limits.late}</h3>
                  <div className="p-2 rounded-lg bg-white/5 text-orange-500">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <Progress value={(stats.late / limits.late) * 100} className="h-1 mt-4" />
              </Card>

              <Card className="glass-card p-6 border-white/5 bg-white/2">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Leave Quota</p>
                  <Badge variant={stats.leave >= limits.leave ? "destructive" : "secondary"} className="text-[10px] py-0">
                    {Math.max(0, limits.leave - stats.leave)} REMAINING
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white">{stats.leave}/{limits.leave}</h3>
                  <div className="p-2 rounded-lg bg-white/5 text-purple-500">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <Progress value={(stats.leave / limits.leave) * 100} className="h-1 mt-4" />
              </Card>
            </div>

            <Card className={`main-action-card glass-card ${isComplete ? 'complete' : ''}`}>
              <CardHeader className="pb-10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-4xl font-black tracking-tighter flex items-center gap-4 text-white">
                      <Fingerprint className="w-10 h-10 text-primary" />
                      {isComplete ? 'Shift Logged' : canCheckOut ? 'Active Duty' : 'Command Center'}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium mt-3 text-lg">
                      {isComplete ? 'Your mission logs have been saved for the current cycle.' : 'Initialize biometric authentication to begin your shift.'}
                    </CardDescription>
                  </div>
                  {todayRecord && (
                    <StatusBadge status={todayRecord.is_on_break ? 'on_break' : todayRecord.status} size="lg" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-10">
                {geoError && (
                  <div className="flex items-center gap-4 p-8 bg-destructive/5 text-destructive rounded-[2rem] border border-destructive/20">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                      <p className="font-black uppercase tracking-widest text-xs mb-1">Navigation Error</p>
                      <p className="font-medium opacity-80">{geoError}</p>
                    </div>
                  </div>
                )}

                <div className="action-buttons-grid">
                  <Button
                    className="check-in-button"
                    disabled={!canCheckIn || actionLoading || geoLoading}
                    onClick={() => handleAttendance('check_in')}
                  >
                    {actionLoading && !todayRecord?.check_in ? (
                      <Loader2 className="w-10 h-10 animate-spin" />
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary blur-2xl opacity-50 animate-pulse"></div>
                        <LogIn className="w-12 h-12 relative z-10" />
                      </div>
                    )}
                    <div className="text-center relative z-10">
                      <p className="text-2xl font-black uppercase tracking-tighter">Check In</p>
                      <p className="text-[10px] font-bold opacity-70 tracking-widest mt-1">START TRACKING</p>
                    </div>
                  </Button>

                  <Button
                    className="check-out-button group"
                    disabled={!canCheckOut || actionLoading || geoLoading}
                    onClick={() => handleAttendance('check_out')}
                  >
                    {actionLoading && canCheckOut ? (
                      <Loader2 className="w-10 h-10 animate-spin" />
                    ) : (
                      <LogOut className="w-12 h-12 text-primary group-hover:rotate-12 transition-transform" />
                    )}
                    <div className="text-center">
                      <p className="text-2xl font-black uppercase tracking-tighter text-white">Check Out</p>
                      <p className="text-[10px] font-bold text-muted-foreground tracking-widest mt-1">STOP TRACKING</p>
                    </div>
                  </Button>
                </div>

                {todayRecord?.is_on_break && (
                  <div className="break-info-panel">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                        <Pause className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-black text-white uppercase tracking-tighter">Standby Mode</p>
                        <p className="text-sm text-muted-foreground font-medium">Standard break protocol active. System precision monitoring suspended.</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="h-14 px-8 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20"
                        onClick={handleResumeBreak}
                        disabled={actionLoading}
                      >
                        Resume Protocol
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="activity-summary-grid">
              <Card className="summary-card-premium glass-card overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                <CardHeader className="pb-6">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                    <Fingerprint className="w-4 h-4 text-primary" /> Shift Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 transition-colors hover:bg-white/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Entry Gate</span>
                    <span className="text-xl font-black font-mono text-white">
                      {todayRecord?.check_in ? format(new Date(todayRecord.check_in), 'hh:mm a') : 'LOCKED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 transition-colors hover:bg-white/10">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Exit Gate</span>
                    <span className="text-xl font-black font-mono text-white">
                      {todayRecord?.check_out ? format(new Date(todayRecord.check_out), 'hh:mm a') : 'ACTIVE'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="summary-card-premium glass-card group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                <CardHeader className="pb-6">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary" /> Operational Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workDuration ? (
                    <div className="space-y-8">
                      <div className="flex items-end justify-between">
                        <p className="duration-display">
                          {workDuration.hours}<span className="duration-suffix">h</span> {workDuration.mins}<span className="duration-suffix">m</span>
                        </p>
                        <div className="text-right">
                          <p className="text-3xl font-black text-primary tracking-tighter">{shiftProgress}%</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Completed</p>
                        </div>
                      </div>
                      <div className="h-4 bg-white/5 rounded-full p-1 border border-white/5 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                          style={{ width: `${shiftProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/40 italic">
                      <Timer className="w-12 h-12 mb-4 opacity-10 animate-spin-slow" />
                      <p className="text-sm font-bold uppercase tracking-widest">Awaiting Manifest</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="sidebar-column">
            <StreakCounter streak={streak} bestStreak={profile?.best_streak || streak} />

            <Card className="glass-card overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/2 pb-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-primary">
                  <Clock className="w-4 h-4" /> Duty Manifest
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                {shiftLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : shiftConfig ? (
                  <>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Operational Window</p>
                      <p className="font-black text-2xl tracking-tighter text-white">{shiftConfig.formatted.shift_start} — {shiftConfig.formatted.shift_end}</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Unit Classification</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="font-black px-4 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">{profile?.role?.toUpperCase()}</Badge>
                        {profile?.batch && <Badge variant="outline" className="font-black px-4 py-1.5 rounded-lg border-white/10 uppercase">{profile.batch}</Badge>}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-bold text-muted-foreground/50 italic py-4">No directive assigned for this cycle.</p>
                )}
                <div className="pt-4">
                  <Button variant="ghost" className="w-full h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] justify-between group" asChild>
                    <a href="/employee/history">
                      Access Logs <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Separator() {
  return <div className="h-px bg-border w-full my-4" />;
}
