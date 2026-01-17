import { Flame, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StreakCounterProps {
    streak: number;
    bestStreak?: number;
}

export function StreakCounter({ streak, bestStreak = 0 }: StreakCounterProps) {
    const getStreakColor = () => {
        if (streak >= 30) return 'text-orange-500';
        if (streak >= 14) return 'text-amber-500';
        if (streak >= 7) return 'text-yellow-500';
        return 'text-primary';
    };

    const getStreakMessage = () => {
        if (streak >= 30) return 'Legendary!';
        if (streak >= 14) return 'On Fire!';
        if (streak >= 7) return 'Great Job!';
        if (streak >= 3) return 'Keep Going!';
        return 'Start Your Streak!';
    };

    return (
        <Card className="card-tilted shadow-coral border-2 border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-warm opacity-5" />
            <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`relative ${streak > 0 ? 'animate-bounce-slow' : ''}`}>
                            <Flame className={`w-12 h-12 ${getStreakColor()}`} />
                            {streak >= 7 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-ping" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Attendance Streak</p>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-4xl font-bold ${getStreakColor()}`}>{streak}</p>
                                <p className="text-lg text-muted-foreground">days</p>
                            </div>
                            <p className="text-xs font-medium text-primary mt-1">{getStreakMessage()}</p>
                        </div>
                    </div>
                    {bestStreak > 0 && (
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Trophy className="w-4 h-4" />
                                <p className="text-xs font-medium">Best</p>
                            </div>
                            <p className="text-2xl font-bold text-accent">{bestStreak}</p>
                        </div>
                    )}
                </div>
                {streak > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Keep it up! Don't break the chain 🔥</span>
                            <span className="font-semibold text-primary">{30 - streak} days to legendary</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
