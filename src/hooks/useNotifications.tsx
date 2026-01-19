import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import client from '@/api/client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', user?._id],
        queryFn: async () => {
            if (!user) return [];

            const { data } = await client.get('/notifications');
            return data as Notification[];
        },
        enabled: !!user,
    });

    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            await client.put(`/notifications/${id}/read`);
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(['notifications', user?._id], (old: Notification[] | undefined) => {
                return old?.map(n => n.id === id ? { ...n, read: true } : n) || [];
            });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            await client.put(`/notifications/read-all`);
            return true;
        },
        onSuccess: () => {
            queryClient.setQueryData(['notifications', user?._id], (old: Notification[] | undefined) => {
                return old?.map(n => ({ ...n, read: true })) || [];
            });
        },
    });

    const deleteNotification = useMutation({
        mutationFn: async (id: string) => {
            await client.delete(`/notifications/${id}`);
            return id;
        },
        onSuccess: (id) => {
            queryClient.setQueryData(['notifications', user?._id], (old: Notification[] | undefined) => {
                return old?.filter(n => n.id !== id) || [];
            });
        },
    });

    return {
        notifications,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification
    };
}
