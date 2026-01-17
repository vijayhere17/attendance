import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { AchievementType } from '@/components/AchievementBadge';

export interface Achievement {
    id: string;
    type: AchievementType;
    title: string;
    description: string;
    icon_name: string;
    color: string;
    unlocked_at?: string;
}

export function useAchievements() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['achievements', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // Fetch all available achievements
            // Casting to any to avoid type errors until migration is run and types are regenerated
            const { data: allAchievements, error: achievementsError } = await (supabase
                .from('achievements' as any)
                .select('*') as any);

            if (achievementsError) throw achievementsError;

            // Fetch user's unlocked achievements
            const { data: userAchievements, error: userAchievementsError } = await (supabase
                .from('user_achievements' as any)
                .select('achievement_id, unlocked_at')
                .eq('user_id', user.id) as any);

            if (userAchievementsError) throw userAchievementsError;

            // Merge data
            const unlockedMap = new Map(
                (userAchievements as any[]).map(ua => [ua.achievement_id, ua.unlocked_at])
            );

            return (allAchievements as any[]).map(achievement => ({
                ...achievement,
                unlocked_at: unlockedMap.get(achievement.id),
            })) as Achievement[];
        },
        enabled: !!user,
    });
}
