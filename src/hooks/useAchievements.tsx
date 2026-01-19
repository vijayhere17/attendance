import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { AchievementType } from '@/components/AchievementBadge';
import client from '@/api/client';

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
        queryKey: ['achievements', user?._id],
        queryFn: async () => {
            if (!user) return [];

            try {
                const { data } = await client.get('/achievements');
                return data as Achievement[];
            } catch (error) {
                console.error("Error fetching achievements", error);
                return [];
            }
        },
        enabled: !!user,
    });
}
