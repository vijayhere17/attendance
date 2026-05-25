import { useState, useEffect, useCallback } from 'react';
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
  Navigation,
  Calendar,
  Timer,
  Fingerprint,
  Clock,
  Pause,
  Award,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  break_minutes?: number;
  break_start?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
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
  const [attendanceAction, setAttendanceAction] = useState<'check_in' | 'check_out' | null>(null);

  const streak = profile?.current_streak || 0;

  const fetchShiftConfig = useCallback(async () => {
    try {
      const { data } = await client.get('/shifts/my-shift');
      setShiftConfig(data);
    } catch (error) {
      console.error('Failed to fetch shift config:', error);
    } finally {
      setShiftLoading(false);
    }
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    if (!profile) return;
    try {
      const { data } = await client.get('/attendance/today');
      // API returns { record, wfh_count, wfh_limit } but older versions returned the record directly
      const record = data?.record !== undefined ? data.record : (data?._id ? data : null);
      setTodayRecord(record);
      setWfhCount(data.wfh_count || 0);
      setWfhLimit(data.wfh_limit || 2);
    } catch (error) {
      console.error('Failed to fetch today\'s attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      fetchTodayAttendance();
      fetchShiftConfig();
    }
  }, [profile, fetchTodayAttendance, fetchShiftConfig]);

  const handleAttendance = async (action: 'check_in' | 'check_out') => {
    setActionLoading(true);
    try {
      let position;

      try {
        position = await getCurrentPosition();

        console.log("📍 LOCATION:", position.latitude, position.longitude);

        // 🚨 IMPORTANT FIX
        if (!position.latitude || !position.longitude) {
          throw new Error("Location not available. Please enable GPS.");
        }

      } catch (err) {
        console.error("❌ GEO ERROR:", err);

        toast.error("Please enable location (GPS) and allow permission.");

        setActionLoading(false);
        return;
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
    } catch (error) {
      const err = error as ApiError;
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to process attendance';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setActionLoading(true);
    try {
      const { data } = await client.post('/attendance/start-break');
      if (data?.success) {
        toast.success(data.message);
        fetchTodayAttendance();
      }
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || 'Failed to start break');
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
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || 'Failed to resume from break');
    } finally {
      setActionLoading(false);
    }
  };

  const canCheckIn = !todayRecord?.check_in;
  const canCheckOut = todayRecord?.check_in && !todayRecord?.check_out;
  const isComplete = todayRecord?.check_in && todayRecord?.check_out;

  const getWorkDuration = () => {
    if (!todayRecord?.check_in) return null;
    const startTime = new Date(todayRecord.check_in);
    let endTime = todayRecord.check_out ? new Date(todayRecord.check_out) : new Date();

    // Total break minutes already stored + current break if active
    const breakTotal = todayRecord.break_minutes || 0;

    if (todayRecord.is_on_break && todayRecord.break_start) {
      const breakStart = new Date(todayRecord.break_start);
      // While on break, work timer ends at break start
      endTime = breakStart;
    }

    const diffMins = differenceInMinutes(endTime, startTime) - breakTotal;

    return {
      hours: Math.floor(diffMins / 60),
      mins: diffMins % 60,
    };
  };

  const getBreakTime = () => {
    if (!todayRecord?.check_in) return 0;
    let total = todayRecord.break_minutes || 0;
    if (todayRecord.is_on_break && todayRecord.break_start) {
      const start = new Date(todayRecord.break_start);
      total += differenceInMinutes(new Date(), start);
    }
    return total;
  };

  const getShiftProgress = () => {
    if (!todayRecord?.check_in || !profile) return 0;
    const [endH, endM] = (profile.shift_end || '18:00:00').split(':').map(Number);
    const [startH, startM] = (profile.shift_start || '09:00:00').split(':').map(Number);
    const totalMinutes = (endH - startH) * 60 + (endM - startM);
    const duration = getWorkDuration();
    if (!duration) return 0;
    return Math.min(100, Math.round(((duration.hours * 60 + duration.mins) / totalMinutes) * 100));
  };

  const workDuration = getWorkDuration();
  const shiftProgress = getShiftProgress();

  const limits = (profile)?.monthly_limits || { leave: 2, late: 3, wfh: 2 };
  const stats = (profile)?.month_stats || { leave: 0, late: 0, wfh: 0 };

  const getAvatarSrc = (url: string | undefined) => {
    if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'user'}`;
    if (url.startsWith('https://') || url.startsWith('http://')) return url;

    // Correctly derive server URL from VITE_API_URL or current origin
    const apiURL = import.meta.env.VITE_API_URL || '/api';
    const serverURL = apiURL.includes('://')
      ? apiURL.replace('/api', '')
      : window.location.origin;

    return `${serverURL}${url}`;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-slate-900 flex items-center justify-center text-lg font-bold text-white uppercase">
              {(profile?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {getGreeting()}, {profile?.full_name?.split(' ')[0]}
              </h1>
              <p className="text-sm text-slate-500">
                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Team Member'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Current Time</p>
              <div className="text-xl font-bold text-slate-900 font-mono">
                <LiveClock showSeconds />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Action Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white border-slate-200 shadow-sm p-4 rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">WFH Quota</p>
                  <span className="text-[10px] font-bold text-slate-500">
                    {Math.max(0, limits.wfh - stats.wfh)} left
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{stats.wfh} / {limits.wfh}</h3>
                  <button 
                    disabled={stats.wfh >= limits.wfh || !canCheckIn}
                    onClick={() => setWorkMode(prev => prev === 'office' ? 'wfh' : 'office')}
                    className={`p-1.5 rounded transition-colors ${workMode === 'wfh' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-900'}`}
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-4 rounded-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Grace Lates</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{stats.late} / {limits.late}</h3>
                  <div className="text-slate-200">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-4 rounded-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Leave Allowance</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{stats.leave} / {limits.leave}</h3>
                  <div className="text-slate-200">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Attendance Action Card */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-md overflow-hidden">
              <div className="p-8 flex flex-col items-center justify-center relative min-h-[300px]">
                {geoError && (
                  <div className="mb-6 w-full flex items-center gap-3 p-3 bg-rose-50 text-rose-600 rounded border border-rose-100 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{geoError}</p>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest">
                    {isComplete ? 'Shift Finalized' : canCheckOut ? 'Session Active' : 'Attendance Log'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isComplete ? 'Your logs for today are complete.' : 'Select an action to record your status.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm">
                  <Button
                    className={`flex-1 h-24 w-full rounded-md flex flex-col items-center justify-center gap-2 transition-all border
                      ${canCheckIn 
                          ? 'bg-slate-900 text-white hover:bg-slate-800 border-transparent' 
                          : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}
                    `}
                    disabled={!canCheckIn || actionLoading || geoLoading}
                    onClick={() => setAttendanceAction('check_in')}
                  >
                    {actionLoading && !todayRecord?.check_in ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <LogIn className="w-6 h-6" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-widest">Check In</span>
                  </Button>

                  <Button
                    className={`flex-1 h-24 w-full rounded-md flex flex-col items-center justify-center gap-2 transition-all border
                      ${canCheckOut && !todayRecord?.is_on_break
                          ? 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50' 
                          : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'}
                    `}
                    disabled={!canCheckOut || todayRecord?.is_on_break || actionLoading || geoLoading}
                    onClick={() => setAttendanceAction('check_out')}
                  >
                    {actionLoading && canCheckOut ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <LogOut className="w-6 h-6" />
                    )}
                    <span className="font-bold text-xs uppercase tracking-widest">Check Out</span>
                  </Button>
                </div>

                {canCheckOut && (
                  <div className="mt-4 w-full max-w-sm">
                    <Button
                      variant="ghost"
                      className={`w-full h-10 rounded-md font-bold text-[10px] uppercase tracking-widest border
                        ${todayRecord?.is_on_break 
                          ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      disabled={actionLoading}
                      onClick={todayRecord?.is_on_break ? handleResumeBreak : handleStartBreak}
                    >
                      <Pause className="w-3.5 h-3.5 mr-2" />
                      {todayRecord?.is_on_break ? 'Resume Work' : 'Take a Break'}
                    </Button>

                    {/* // show how break time is used up if on break add a aclock for it also a real working clock to be shown not emoji like this :- Break Time Used 4 / 45 mins*/}
                    {todayRecord?.is_on_break && (
                      <div className="mt-2 flex items-center justify-center gap-2 text-center text-xs text-slate-500 italic font-medium ">
                        <Timer className="w-3.5 h-3.5" />
                        Break time used: {Math.floor(getBreakTime() / 60)}m {getBreakTime() % 60}s
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="bg-white border-slate-200 shadow-sm p-5 rounded-md">
                <div className="flex items-center gap-2 mb-4">
                  <Fingerprint className="w-4 h-4 text-slate-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Timestamps</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Check In</span>
                    <span className="font-mono font-bold text-slate-900">
                      {todayRecord?.check_in ? format(new Date(todayRecord.check_in), 'hh:mm a') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">Check Out</span>
                    <span className="font-mono font-bold text-slate-900">
                      {todayRecord?.check_out ? format(new Date(todayRecord.check_out), 'hh:mm a') : '—'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm p-5 rounded-md">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duration</h3>
                </div>
                {workDuration ? (
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <p className="text-2xl font-bold text-slate-900">
                        {workDuration.hours}h {workDuration.mins}m
                      </p>
                      <span className="text-[10px] font-bold text-slate-400">{shiftProgress}% of shift</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-slate-900 rounded-full" style={{ width: `${shiftProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-300">
                    <p className="text-xs font-medium">Session inactive</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
          
          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-slate-900 text-white p-6 rounded-md shadow-lg border-0 overflow-hidden relative">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Consistency Streak</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl font-bold">{streak}</h2>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Days</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Best</span>
                  <span className="text-sm font-bold">{profile?.best_streak || streak}d</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Award className="w-20 h-20" />
              </div> 
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm rounded-md overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shift Configuration</h3>
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-slate-50">
                  {profile?.role}
                </Badge>
              </div>
              <div className="p-5 space-y-4">
                {shiftLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-200" />
                ) : shiftConfig ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">Shift Start</span>
                      <span className="text-xs font-bold text-slate-900">{shiftConfig.formatted.shift_start}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium">Shift End</span>
                      <span className="text-xs font-bold text-slate-900">{shiftConfig.formatted.shift_end}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 italic">No shift assigned.</p>
                )}
                <div className="pt-4 border-t border-slate-50">
                  <Button variant="ghost" className="w-full h-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900" asChild>
                    <a href="/employee/history">
                      Log History
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!attendanceAction} onOpenChange={(open) => !open && setAttendanceAction(null)}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Confirm Action</DialogTitle>
            <DialogDescription className="text-xs">
              Select your work mode for this attendance log.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant={workMode === 'office' ? 'default' : 'outline'}
              onClick={() => setWorkMode('office')}
              className={`h-12 rounded-md ${workMode === 'office' ? 'bg-slate-900 text-white' : ''}`}
            >
              🏢 Office
            </Button>
            <Button
              variant={workMode === 'wfh' ? 'default' : 'outline'}
              onClick={() => setWorkMode('wfh')}
              disabled={workMode !== 'wfh' && stats.wfh >= limits.wfh && attendanceAction === 'check_in'}
              className={`h-12 rounded-md ${workMode === 'wfh' ? 'bg-slate-900 text-white' : ''}`}
            >
              🏠 Remote
            </Button>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="text-xs font-bold" onClick={() => setAttendanceAction(null)}>
              Cancel
            </Button>
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-md px-6"
              disabled={actionLoading || geoLoading}
              onClick={() => {
                if (attendanceAction) {
                  handleAttendance(attendanceAction);
                  setAttendanceAction(null);
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
