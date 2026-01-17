import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    getDay,
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AttendanceRecord {
    id: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    status: string;
}

interface AttendanceCalendarProps {
    records: AttendanceRecord[];
    currentDate: Date;
    onMonthChange: (date: Date) => void;
}

export function AttendanceCalendar({ records, currentDate, onMonthChange }: AttendanceCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate empty days for start of month padding
    const startDay = getDay(monthStart);
    const paddingDays = Array.from({ length: startDay }, (_, i) => i);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'bg-success text-success-foreground hover:bg-success/90';
            case 'late': return 'bg-warning text-warning-foreground hover:bg-warning/90';
            case 'absent': return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
            case 'early_exit': return 'bg-orange-500 text-white hover:bg-orange-600';
            default: return 'bg-muted text-muted-foreground hover:bg-muted/80';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present': return <CheckCircle2 className="w-3 h-3" />;
            case 'late': return <Clock className="w-3 h-3" />;
            case 'absent': return <XCircle className="w-3 h-3" />;
            case 'early_exit': return <AlertCircle className="w-3 h-3" />;
            default: return null;
        }
    };

    const getRecordForDay = (day: Date) => {
        return records.find(r => isSameDay(new Date(r.date), day));
    };

    return (
        <Card className="shadow-soft border-border/50 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Attendance Calendar</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onMonthChange(subMonths(currentDate, 1))}
                            className="h-8 w-8 rounded-full hover:bg-muted"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[100px] text-center">
                            {format(currentDate, 'MMMM yyyy')}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onMonthChange(addMonths(currentDate, 1))}
                            className="h-8 w-8 rounded-full hover:bg-muted"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {paddingDays.map((i) => (
                        <div key={`padding-${i}`} className="aspect-square" />
                    ))}
                    {daysInMonth.map((day) => {
                        const record = getRecordForDay(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);

                        return (
                            <TooltipProvider key={day.toISOString()}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setSelectedDate(day)}
                                            className={cn(
                                                "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all duration-200 group",
                                                record ? getStatusColor(record.status) : "bg-muted/30 hover:bg-muted/50 text-muted-foreground",
                                                isSelected && "ring-2 ring-primary ring-offset-2",
                                                isTodayDate && !record && "border-2 border-primary/50 border-dashed"
                                            )}
                                        >
                                            <span className="text-xs font-medium">{format(day, 'd')}</span>
                                            {record && (
                                                <div className="mt-1 opacity-80 group-hover:scale-110 transition-transform">
                                                    {getStatusIcon(record.status)}
                                                </div>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-xs">
                                            <p className="font-semibold mb-1">{format(day, 'EEEE, MMM d')}</p>
                                            {record ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="capitalize text-primary">{record.status.replace('_', ' ')}</span>
                                                    </div>
                                                    {record.check_in && (
                                                        <p>In: {format(new Date(record.check_in), 'hh:mm a')}</p>
                                                    )}
                                                    {record.check_out && (
                                                        <p>Out: {format(new Date(record.check_out), 'hh:mm a')}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground">No record</p>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>

                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-success" />
                        <span>Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-warning" />
                        <span>Late</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>Early Exit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        <span>Absent</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
