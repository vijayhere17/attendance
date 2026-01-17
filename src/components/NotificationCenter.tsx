import { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-success" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-warning" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-destructive" />;
            default:
                return <Info className="w-4 h-4 text-primary" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-success/10';
            case 'warning':
                return 'bg-warning/10';
            case 'error':
                return 'bg-destructive/10';
            default:
                return 'bg-primary/10';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-xl border-border/50">
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-primary hover:text-primary/80"
                            onClick={() => markAllAsRead.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", getBgColor(notification.type))}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn("text-sm font-medium leading-none", !notification.read && "text-foreground")}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-md shadow-sm">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6 hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead.mutate(notification.id);
                                                }}
                                            >
                                                <Check className="w-3 h-3" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-6 h-6 hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification.mutate(notification.id);
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
