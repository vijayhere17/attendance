import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementBadge } from '@/components/AchievementBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    Mail,
    Briefcase,
    Calendar,
    Camera,
    Loader2,
    Trophy,
    Flame,
    Clock,
    CheckCircle2,
    Shield,
    Settings,
    Save
} from 'lucide-react';
import { format } from 'date-fns';
import client from '@/api/client';
import { StatusBadge } from '@/components/StatusBadge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import '@/styles/Profile.css';

export default function Profile() {
    const { user, profile } = useAuth();
    const { data: achievements, isLoading: loadingAchievements } = useAchievements();
    const [uploading, setUploading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: profile?.full_name || '',
        email: profile?.email || '',
        phone_number: profile?.phone_number || '',
        avatar_url: profile?.avatar_url || ''
    });

    useEffect(() => {
        if (profile) {
            setEditForm({
                full_name: profile.full_name || '',
                email: profile.email || '',
                phone_number: profile.phone_number || '',
                avatar_url: profile.avatar_url || ''
            });
        }
    }, [profile]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activities, setActivities] = useState<{ _id: string; date: string; check_in: string; check_out?: string; status: string }[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const fetchActivity = async () => {
            setLoadingActivity(true);
            try {
                const { data } = await client.get('/auth/profile/activity');
                setActivities(data);
            } catch (error) {
                console.error('Failed to load activity', error);
            } finally {
                setLoadingActivity(false);
            }
        };
        if (user) fetchActivity();
    }, [user]);

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    };

    const getAvatarSrc = (url: string | undefined) => {
        if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`;
        if (url.startsWith('https://') || url.startsWith('http://')) return url;
        
        // Correctly derive server URL from VITE_API_URL or current origin
        const apiURL = import.meta.env.VITE_API_URL || '/api';
        const serverURL = apiURL.includes('://') 
            ? apiURL.replace('/api', '') 
            : window.location.origin;
            
        return `${serverURL}${url}`;
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        try {
            await client.post('/auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Avatar updated!');
            window.location.reload();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleRandomAvatar = async () => {
        const seed = Math.random().toString(36).substring(7);
        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        try {
            await client.put('/auth/profile', { avatar_url: url });
            toast.success('Random avatar applied!');
            window.location.reload();
        } catch {
            toast.error('Failed to update avatar');
        }
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        try {
            await client.put('/auth/profile', editForm);
            toast.success('Profile updated');
            window.location.reload();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await client.post('/auth/change-password', { currentPassword, newPassword });
            toast.success('Password changed successfully');
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to change password');
        }
    };

    const stats = [
        { label: 'Current Streak', value: `${profile?.current_streak || 0} Days`, icon: Flame, color: 'text-orange-500' },
        { label: 'Total Attendance', value: `${profile?.total_attendance || 0} Days`, icon: Calendar, color: 'text-blue-500' },
        { label: 'Best Streak', value: `${profile?.best_streak || 0} Days`, icon: Trophy, color: 'text-yellow-500' },
        {
            label: 'On Time Rate',
            value: `${profile?.total_attendance ? Math.round(((profile.total_attendance - (profile.late_count || 0)) / profile.total_attendance) * 100) : 100}%`,
            icon: Clock,
            color: 'text-green-500',
        },
    ];

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-500">
                
                {/* Header Profile Section */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-24 bg-slate-900 relative" />

                    <div className="px-8 pb-8 relative flex flex-col md:flex-row items-center md:items-end gap-6">
                        <div className="relative -mt-12">
                            <div className="w-32 h-32 rounded-lg border-4 border-white bg-slate-100 shadow-sm relative overflow-hidden">
                                <Avatar className="w-full h-full rounded-none">
                                    {uploading ? (
                                        <div className="flex items-center justify-center w-full h-full">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                        </div>
                                    ) : (
                                        <>
                                            <AvatarImage src={getAvatarSrc(profile?.avatar_url)} className="object-cover" />
                                            <AvatarFallback className="bg-slate-100 text-slate-400 text-3xl font-bold">
                                                {getInitials(profile?.full_name || '')}
                                            </AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                            </div>
                            <div className="absolute -bottom-2 -right-2 flex gap-1">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white text-slate-900 rounded-md shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                                    title="Upload Photo"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{profile?.full_name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                    <Mail className="w-3.5 h-3.5" />
                                    {profile?.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-wider">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    {profile?.role}
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono lowercase">
                                    id_{profile?._id.slice(-6)}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                           <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 px-4 rounded-md font-bold uppercase tracking-widest text-[10px] gap-2">
                                        <Settings className="w-3.5 h-3.5" />
                                        Config
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[400px] rounded-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-base font-bold text-slate-900">Update Profile</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-500">Legal Name</Label>
                                            <Input value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="h-10 rounded-md" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-500">Contact</Label>
                                            <Input value={editForm.phone_number} onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} className="h-10 rounded-md" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-500">Avatar Source</Label>
                                            <Input value={editForm.avatar_url} onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})} className="h-10 rounded-md" placeholder="HTTPS source" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleUpdateProfile} disabled={updating} className="w-full h-10 bg-slate-900 text-white rounded-md font-bold">
                                            {updating ? 'Syncing...' : 'Commit Changes'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8 space-y-8">
                        
                        {/* Achievements */}
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Professional Milestones</h2>
                            </div>
                            <div className="p-6">
                                {loadingAchievements ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-100 mx-auto" />
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {achievements?.map((achievement) => (
                                            <div key={achievement.id} className="flex flex-col items-center p-4 rounded-md border border-slate-100 bg-slate-50/50">
                                                <AchievementBadge
                                                    type={achievement.type}
                                                    unlocked={!!achievement.unlocked_at}
                                                    date={achievement.unlocked_at ? format(new Date(achievement.unlocked_at), 'MMM d') : undefined}
                                                />
                                                <span className={`mt-3 text-[9px] font-bold uppercase tracking-tighter text-center ${achievement.unlocked_at ? 'text-slate-900' : 'text-slate-300'}`}>
                                                    {achievement.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity & Security */}
                        <Tabs defaultValue="activity" className="w-full">
                            <TabsList className="bg-slate-100 p-1 rounded-md h-10 border border-slate-200 mb-4">
                                <TabsTrigger value="activity" className="h-8 px-6 rounded text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Activity Logs</TabsTrigger>
                                <TabsTrigger value="security" className="h-8 px-6 rounded text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">Security</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="activity" className="m-0">
                                <Card className="rounded-lg border-slate-200 shadow-sm bg-white overflow-hidden">
                                    <div className="divide-y divide-slate-50">
                                        {loadingActivity ? (
                                            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-100" /></div>
                                        ) : activities.length === 0 ? (
                                            <div className="p-12 text-center text-slate-400 text-xs font-medium">No recent operations detected.</div>
                                        ) : (
                                            activities.map((activity) => (
                                                <div key={activity._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-1.5 h-8 rounded-full ${activity.check_out ? 'bg-slate-200' : 'bg-emerald-500'}`} />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{activity.check_out ? 'Session Finalized' : 'Session Initiated'}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(activity.date), 'MMM d, yyyy')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-xs font-bold text-slate-700">
                                                            {activity.check_out ? format(new Date(activity.check_out), 'hh:mm a') : format(new Date(activity.check_in), 'hh:mm a')}
                                                        </p>
                                                        <StatusBadge status={activity.status} className="mt-1 h-4 text-[8px] font-black uppercase tracking-widest" />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Card>
                            </TabsContent>
                            
                            <TabsContent value="security" className="m-0">
                                <Card className="rounded-lg border-slate-200 shadow-sm bg-white p-6">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Credential Management</h3>
                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-slate-500">Current Key</Label>
                                                <Input type="password" name="currentPassword" required className="h-10 rounded-md" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-slate-500">New Key</Label>
                                                <Input type="password" name="newPassword" required className="h-10 rounded-md" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-500">Confirm New Key</Label>
                                            <Input type="password" name="confirmPassword" required className="h-10 rounded-md" />
                                        </div>
                                        <Button type="submit" className="h-10 px-8 bg-slate-900 text-white font-bold rounded-md uppercase tracking-widest text-xs">
                                            Update Access Key
                                        </Button>
                                    </form>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="md:col-span-4 space-y-6">
                        <Card className="bg-slate-50 border-slate-200 p-6 rounded-lg">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Deployment Specs</h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Official Registry ID</p>
                                    <p className="font-mono text-[10px] text-slate-900 bg-white p-2 rounded border border-slate-200 break-all">{profile?._id}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Onboard Date</span>
                                    <span className="text-xs font-bold text-slate-900">Jan 10, 2026</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Registry Status</span>
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active_Node</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
