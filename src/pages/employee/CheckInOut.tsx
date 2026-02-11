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
  Sparkles,
  ArrowRight,
  Clock,
  Users,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { ConfettiEffect } from '@/components/ConfettiEffect';
import { StreakCounter } from '@/components/StreakCounter';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Badge } from '@/components/ui/badge';

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
}

// NEW: Shift configuration interface
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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);

  const streak = profile?.current_streak || 0;

  // NEW: Fetch shift configuration
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
      setTodayRecord(data);
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
      const position = await getCurrentPosition();

      const endpoint = action === 'check_in' ? '/attendance/check-in' : '/attendance/check-out';

      const { data } = await client.post(endpoint, {
        latitude: position.latitude,
        longitude: position.longitude,
      });

      if (data?.success) {
        if (action === 'check_in') {
          setShowConfetti(true);
          toast.success(data.message, {
            description: 'Have a productive day! 🎉',
          });
        } else {
          toast.success(data.message, {
            description: 'See you tomorrow! 👋',
          });
        }
        fetchTodayAttendance();
      }
    } catch (error: any) {
      console.error('Attendance error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to process attendance';
      const distance = error.response?.data?.distance;

      toast.error(errorMessage, {
        description: distance ? `You are ${distance}m from the office` : undefined,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const canCheckIn = !todayRecord?.check_in;
  const canCheckOut = todayRecord?.check_in && !todayRecord?.check_out;
  const isComplete = todayRecord?.check_in && todayRecord?.check_out;

  const getWorkDuration = () => {
    if (!todayRecord?.check_in) return null;
    const endTime = todayRecord.check_out ? new Date(todayRecord.check_out) : new Date();
    const startTime = new Date(todayRecord.check_in);
    const hours = differenceInHours(endTime, startTime);
    const mins = differenceInMinutes(endTime, startTime) % 60;
    return { hours, mins };
  };

  const getShiftProgress = () => {
    if (!todayRecord?.check_in || !profile) return 0;
    const [endH, endM] = (profile.shift_end || '18:00:00').split(':').map(Number);
    const [startH, startM] = (profile.shift_start || '09:00:00').split(':').map(Number);
    const totalMinutes = (endH - startH) * 60 + (endM - startM);
    const checkIn = new Date(todayRecord.check_in);
    const now = todayRecord.check_out ? new Date(todayRecord.check_out) : new Date();
    const worked = differenceInMinutes(now, checkIn);
    return Math.min(100, Math.round((worked / totalMinutes) * 100));
  };

  const workDuration = getWorkDuration();
  const shiftProgress = getShiftProgress();

  return (
    <Layout>
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="relative z-0">
        <AnimatedBackground />
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-2 animate-slide-up">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Sparkles className="w-4 h-4 animate-pulse-soft" />
              <span>
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {profile?.full_name?.split(' ')[0]}
              <span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-accent" />
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 animate-scale-in">
            <Card className="shadow-coral border-primary/20 bg-card/50 backdrop-blur-sm min-w-[200px]">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Current Time</p>
                  <div className="text-2xl font-bold text-primary font-mono">
                    <LiveClock showSeconds />
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Card */}
            <Card className={`
              relative overflow-hidden border-2 transition-all duration-500
              ${isComplete ? 'border-success/30 bg-success/5 shadow-glow-success' :
                canCheckOut ? 'border-primary/30 bg-primary/5 shadow-glow' :
                  'border-border/50 shadow-large hover:shadow-glow'
              }
            `}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <CardHeader className="pb-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Navigation className={`w-6 h-6 ${isComplete ? 'text-success' : 'text-primary'}`} />
                      {isComplete ? 'All Done!' : canCheckOut ? 'Active Shift' : 'Ready to Start?'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {isComplete ? 'See you tomorrow' : 'Ensure you are within office range'}
                    </CardDescription>
                  </div>
                  {todayRecord && <StatusBadge status={todayRecord.status} />}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 relative">
                {geoError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-wiggle">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-destructive">Location Access Required</p>
                      <p className="text-sm text-destructive/80 mt-1">{geoError}</p>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className={`
                      h-auto py-8 flex-col gap-3 rounded-2xl transition-all duration-300
                      ${!canCheckIn
                        ? 'opacity-50 grayscale'
                        : 'shadow-coral hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] gradient-primary'
                      }
                    `}
                    disabled={!canCheckIn || actionLoading || geoLoading}
                    onClick={() => handleAttendance('check_in')}
                  >
                    {actionLoading && !todayRecord?.check_in ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                        <LogIn className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <div className="text-center">
                      <span className="text-xl font-bold block text-white">Check In</span>
                      <span className="text-xs text-white/80">Start your workday</span>
                    </div>
                  </Button>

                  <Button
                    size="lg"
                    className={`
                      h-auto py-8 flex-col gap-3 rounded-2xl transition-all duration-300 border-2
                      ${!canCheckOut
                        ? 'opacity-50 grayscale bg-muted'
                        : 'bg-card hover:bg-accent/5 border-accent text-accent hover:shadow-teal hover:-translate-y-1 hover:scale-[1.02]'
                      }
                    `}
                    disabled={!canCheckOut || actionLoading || geoLoading}
                    onClick={() => handleAttendance('check_out')}
                  >
                    {actionLoading && canCheckOut ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${canCheckOut ? 'bg-accent/10' : 'bg-muted-foreground/10'}`}>
                        <LogOut className={`w-7 h-7 ${canCheckOut ? 'text-accent' : 'text-muted-foreground'}`} />
                      </div>
                    )}
                    <div className="text-center">
                      <span className={`text-xl font-bold block ${canCheckOut ? 'text-accent' : 'text-muted-foreground'}`}>Check Out</span>
                      <span className="text-xs text-muted-foreground">End your workday</span>
                    </div>
                  </Button>
                </div>

                {isComplete && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-success/10 border border-success/20 animate-scale-in">
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center shadow-glow-success">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-success text-lg">Attendance Complete!</p>
                      <p className="text-sm text-success/80">You've completed your attendance for today. Great work!</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Stats Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="shadow-soft border-border/50 hover:shadow-medium transition-shadow duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-accent" />
                    Today's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : todayRecord ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                            <LogIn className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Check In</p>
                            <p className="font-bold">
                              {todayRecord.check_in ? format(new Date(todayRecord.check_in), 'hh:mm a') : '—'}
                            </p>
                          </div>
                        </div>
                        {todayRecord.check_in && <CheckCircle2 className="w-4 h-4 text-success" />}
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Check Out</p>
                            <p className="font-bold">
                              {todayRecord.check_out ? format(new Date(todayRecord.check_out), 'hh:mm a') : '—'}
                            </p>
                          </div>
                        </div>
                        {todayRecord.check_out && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No activity yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-soft border-border/50 hover:shadow-medium transition-shadow duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Timer className="w-5 h-5 text-warning" />
                    Work Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workDuration ? (
                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-foreground">
                            {workDuration.hours}<span className="text-sm text-muted-foreground font-normal ml-1">hrs</span>
                            {' '}
                            {workDuration.mins}<span className="text-sm text-muted-foreground font-normal ml-1">mins</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Total active time</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{shiftProgress}%</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                      </div>
                      <Progress value={shiftProgress} className="h-3 rounded-full" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                      <Timer className="w-8 h-8 mb-2 opacity-20" />
                      <p>Start your shift to track progress</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-6">
            {/* Streak Counter */}
            <StreakCounter streak={streak} bestStreak={15} />

            {/* Shift Info - NEW: Dynamic shift config display */}
            <Card className="shadow-soft border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Shift Schedule
                  </CardTitle>
                  {shiftConfig && (
                    <div className="flex gap-2">
                      <Badge variant={profile?.role === 'intern' ? 'secondary' : 'default'} className="text-xs">
                        {profile?.role === 'intern' ? (
                          <><Users className="w-3 h-3 mr-1" /> Intern</>
                        ) : (
                          <><Briefcase className="w-3 h-3 mr-1" /> Employee</>
                        )}
                      </Badge>
                      {profile?.batch && (
                        <Badge variant="outline" className="text-xs">
                          {profile.batch === 'batch1' ? 'Batch 1' : 'Batch 2'}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {shiftLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : shiftConfig?.formatted ? (
                  <div className="space-y-4">
                    {/* Check-in Window Status */}
                    <div className={`p-3 rounded-xl border ${shiftConfig.status.canCheckIn
                      ? 'bg-success/10 border-success/30'
                      : shiftConfig.status.isBeforeCheckIn
                        ? 'bg-warning/10 border-warning/30'
                        : 'bg-muted/30 border-border/50'
                      }`}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Check-in Window</p>
                      <p className="font-bold">
                        {shiftConfig.formatted.check_in_window}
                      </p>
                      <p className={`text-xs mt-1 ${shiftConfig.status.canCheckIn ? 'text-success' :
                        shiftConfig.status.isBeforeCheckIn ? 'text-warning' : 'text-muted-foreground'
                        }`}>
                        {shiftConfig.status.canCheckIn
                          ? '✓ Check-in available now'
                          : shiftConfig.status.isBeforeCheckIn
                            ? '⏳ Check-in opens soon'
                            : '✕ Check-in window closed'}
                      </p>
                    </div>

                    {/* Shift Times */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-muted/30">
                        <span className="text-xs text-muted-foreground block">Shift Start</span>
                        <span className="font-bold font-mono">{shiftConfig.formatted.shift_start}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30">
                        <span className="text-xs text-muted-foreground block">Shift End</span>
                        <span className="font-bold font-mono">{shiftConfig.formatted.shift_end}</span>
                      </div>
                    </div>

                    {/* Minimum Hours */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-sm text-muted-foreground">Min. Required</span>
                      <span className="font-bold text-primary">{shiftConfig.formatted.min_hours} hours</span>
                    </div>

                    <div className="pt-2">
                      <Button variant="outline" className="w-full justify-between group" asChild>
                        <a href="/employee/history">
                          View History
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Fallback to legacy display if no shift config */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <span className="text-sm text-muted-foreground">Start Time</span>
                      <span className="font-bold font-mono">
                        {format(new Date(`2000-01-01 ${profile?.shift_start || '09:00:00'}`), 'hh:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <span className="text-sm text-muted-foreground">End Time</span>
                      <span className="font-bold font-mono">
                        {format(new Date(`2000-01-01 ${profile?.shift_end || '18:00:00'}`), 'hh:mm a')}
                      </span>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full justify-between group" asChild>
                        <a href="/employee/history">
                          View History
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    </div>
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
