import { Award, Star, Zap, Target, Crown, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type AchievementType =
    | 'perfect_week'
    | 'early_bird'
    | 'consistent'
    | 'streak_master'
    | 'never_late'
    | 'dedication';

interface AchievementBadgeProps {
    type: AchievementType;
    unlocked: boolean;
    date?: string;
}

const achievements: Record<AchievementType, {
    icon: typeof Award;
    title: string;
    description: string;
    color: string;
}> = {
    perfect_week: {
        icon: Star,
        title: 'Perfect Week',
        description: 'Attended all 5 days without being late',
        color: 'text-yellow-500',
    },
    early_bird: {
        icon: Zap,
        title: 'Early Bird',
        description: 'Checked in 30 minutes early for 5 days',
        color: 'text-orange-500',
    },
    consistent: {
        icon: Target,
        title: 'Consistency King',
        description: 'Maintained a 7-day streak',
        color: 'text-blue-500',
    },
    streak_master: {
        icon: Crown,
        title: 'Streak Master',
        description: 'Achieved a 30-day streak',
        color: 'text-purple-500',
    },
    never_late: {
        icon: Award,
        title: 'Punctuality Pro',
        description: 'Never late for an entire month',
        color: 'text-green-500',
    },
    dedication: {
        icon: Heart,
        title: 'Dedicated',
        description: 'Perfect attendance for 90 days',
        color: 'text-pink-500',
    },
};

export function AchievementBadge({ type, unlocked, date }: AchievementBadgeProps) {
    const achievement = achievements[type];
    const Icon = achievement.icon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`relative group cursor-pointer ${unlocked ? 'animate-scale-in' : ''}`}>
                        <div
                            className={`
                w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                ${unlocked
                                    ? 'bg-gradient-to-br from-primary/20 to-accent/20 shadow-coral hover:shadow-teal hover:scale-110'
                                    : 'bg-muted/30 grayscale opacity-40'
                                }
              `}
                        >
                            <Icon className={`w-8 h-8 ${unlocked ? achievement.color : 'text-muted-foreground'}`} />
                        </div>
                        {unlocked && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center shadow-glow-success">
                                <Star className="w-3 h-3 text-white fill-white" />
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                        <p className="font-semibold">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        {unlocked && date && (
                            <p className="text-xs text-primary font-medium mt-2">Unlocked: {date}</p>
                        )}
                        {!unlocked && (
                            <div className="mt-2">
                                <Badge variant="outline" className="text-xs">Locked</Badge>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
