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
        phone_number: (profile as any)?.phone_number || '',
        avatar_url: (profile as any)?.avatar_url || ''
    });

    useEffect(() => {
        if (profile) {
            setEditForm({
                full_name: profile.full_name || '',
                phone_number: (profile as any).phone_number || '',
                avatar_url: (profile as any).avatar_url || ''
            });
        }
    }, [profile]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [profileViewMode, setProfileViewMode] = useState(false);

    useEffect(() => {
        const fetchActivity = async () => {
            setLoadingActivity(true);
            try {
                const { data } = await client.get('/auth/profile/activity');
                setActivities(data);
            } catch (error) {
                console.error("Failed to load activity", error);
            } finally {
                setLoadingActivity(false);
            }
        };
        if (user) fetchActivity();
    }, [user]);

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        try {
            const { data } = await client.post('/auth/upload-avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Avatar uploaded successfully!');
            // Update local state or reload
            window.location.reload();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleRandomAvatar = async () => {
        const randomSeed = Math.random().toString(36).substring(7);
        const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
        try {
            await client.put('/auth/profile', { avatar_url: newAvatarUrl });
            toast.success('Random avatar generated!');
            window.location.reload();
        } catch (err: any) {
            toast.error('Failed to update avatar');
        }
    };

    const handleUpdateProfile = async () => {
        setUpdating(true);
        try {
            await client.put('/auth/profile', editForm);
            toast.success('Profile updated successfully');
            window.location.reload();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const getAvatarSrc = (url: string | undefined) => {
        if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`;
        if (url.startsWith('https://') || url.startsWith('http://')) return url;
        // Prefix local uploads with server URL
        const serverURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${serverURL}${url}`;
    };

    const stats = [
        {
            label: 'Current Streak',
            value: `${profile?.current_streak || 0} Days`,
            icon: Flame,
            color: 'text-orange-500',
        },
        {
            label: 'Total Attendance',
            value: `${profile?.total_attendance || 0} Days`,
            icon: Calendar,
            color: 'text-blue-500',
        },
        {
            label: 'Best Streak',
            value: `${profile?.best_streak || 0} Days`,
            icon: Trophy,
            color: 'text-yellow-500',
        },
        {
            label: 'On Time Rate',
            value: `${profile?.total_attendance ? Math.round(((profile.total_attendance - (profile.late_count || 0)) / profile.total_attendance) * 100) : 100}%`,
            icon: Clock,
            color: 'text-green-500',
        },
    ];

    return (
        <Layout>
            <div className="profile-container space-y-10 p-4 md:p-8">
                <div className="glass-card rounded-[3rem] border-white/5 overflow-hidden shadow-2xl">
                    <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                        <div className="absolute top-8 right-8">
                            <Badge className="bg-success/20 text-success border border-success/30 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                Authorized {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}
                            </Badge>
                        </div>
                    </div>

                    <div className="px-8 pb-12 -mt-16 md:-mt-24 relative flex flex-col md:flex-row items-end gap-8">
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] border-[6px] border-background p-1 bg-gradient-to-tr from-primary to-blue-600 shadow-2xl relative overflow-hidden">
                                <Avatar className="w-full h-full rounded-[2rem]">
                                    {uploading ? (
                                        <div className="flex items-center justify-center w-full h-full bg-black/50">
                                            <Loader2 className="w-10 h-10 animate-spin text-white" />
                                        </div>
                                    ) : (
                                        <>
                                            <AvatarImage src={getAvatarSrc((profile as any)?.avatar_url)} className="object-cover" />
                                            <AvatarFallback className="bg-white/10 text-white text-4xl font-black">
                                                {getInitials(profile?.full_name || '')}
                                            </AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                            </div>
                            <div className="absolute -bottom-2 -right-2 flex gap-2">
                                <button
                                    onClick={handleRandomAvatar}
                                    className="p-3 bg-card text-foreground rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-background group"
                                    title="Generate Random Avatar"
                                >
                                    <Flame className="w-4 h-4 group-hover:animate-pulse" />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-background"
                                    title="Upload Photo"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </div>

                        <div className="flex-1 pb-4">
                            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-2">{profile?.full_name}</h1>
                            <div className="flex flex-wrap gap-4 items-center">
                                <Badge variant="outline" className="gap-2 border-border bg-muted/50 text-muted-foreground py-1.5 px-4 rounded-xl font-bold">
                                    <Mail className="w-3.5 h-3.5" />
                                    {profile?.email}
                                </Badge>
                                <Badge variant="outline" className="gap-2 border-border bg-muted/50 text-muted-foreground py-1.5 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    {profile?.role}
                                </Badge>
                                <div className="h-4 w-px bg-white/10 mx-2" />
                                <p className="text-sm font-mono text-muted-foreground">ID: {profile?._id.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="pb-4 flex gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold gap-2">
                                        <Settings className="w-4 h-4 text-primary" />
                                        Configure Profile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] glass border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                                    <div className="p-8 space-y-8">
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black text-white tracking-tighter">Profile Settings</h2>
                                            <p className="text-muted-foreground font-medium">Update your profile details and identity parameters.</p>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Full Name</Label>
                                                <Input 
                                                    value={editForm.full_name} 
                                                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                                    className="h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 text-white font-medium pl-6"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Phone Number</Label>
                                                <Input 
                                                    value={editForm.phone_number} 
                                                    onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                                                    className="h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 text-white font-medium pl-6"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Avatar URL</Label>
                                                <Input 
                                                    value={editForm.avatar_url} 
                                                    onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                                                    className="h-14 bg-white/5 border-white/5 rounded-2xl focus:ring-primary/20 text-white font-medium pl-6"
                                                    placeholder="https://..."
                                                />
                                                <p className="text-[10px] text-muted-foreground ml-1">Leave blank to use dicebear random generation.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 text-white font-bold">Cancel</Button>
                                            </DialogTrigger>
                                            <Button 
                                                onClick={handleUpdateProfile} 
                                                className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-tighter"
                                                disabled={updating}
                                            >
                                                {updating ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <div className="profile-stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-item glass-card group">
                            <div className={`w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <p className="stat-value">{stat.value}</p>
                            <p className="stat-label">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="profile-content-grid">
                    <div className="lg:col-span-2 space-y-10">
                        <section className="section-card shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
                                        <Trophy className="w-6 h-6 text-primary" />
                                        Operational Merit
                                    </h2>
                                    <p className="text-muted-foreground font-medium">Achievements and certifications unlocked.</p>
                                </div>
                                <Badge variant="outline" className="border-white/10 rounded-lg">
                                    {achievements?.filter(a => a.unlocked_at).length || 0} Unlocked
                                </Badge>
                            </div>

                            {loadingAchievements ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="achievement-grid">
                                    {achievements?.map((achievement) => (
                                        <div key={achievement.id} className="flex flex-col items-center p-4 rounded-3xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                            <AchievementBadge
                                                type={achievement.type}
                                                unlocked={!!achievement.unlocked_at}
                                                date={achievement.unlocked_at ? format(new Date(achievement.unlocked_at), 'MMM d, yyyy') : undefined}
                                            />
                                            <p className={`mt-3 text-[10px] font-black uppercase tracking-widest ${achievement.unlocked_at ? 'text-white' : 'text-muted-foreground opacity-30'}`}>
                                                {achievement.type.replace('_', ' ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <div className="flex gap-2 mb-8 p-1 bg-muted/50 rounded-2xl border border-border w-fit">
                                <button
                                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${!profileViewMode ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setProfileViewMode(false)}
                                >
                                    Attendance Logs
                                </button>
                                <button
                                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${profileViewMode ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => setProfileViewMode(true)}
                                >
                                    Account Settings
                                </button>
                            </div>

                            {!profileViewMode ? (
                                <div className="section-card shadow-2xl">
                                    {loadingActivity ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="text-center py-12 opacity-50">
                                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 border border-border">
                                                <Clock className="w-8 h-8" />
                                            </div>
                                            <p className="font-bold text-foreground">No active history reported.</p>
                                        </div>
                                    ) : (
                                        <div className="activity-list">
                                            {activities.map((activity) => (
                                                <div key={activity._id} className="activity-item group">
                                                    <div className={`activity-icon ${activity.check_out ? 'bg-blue-500/10 text-blue-500' : 'bg-success/10 text-success'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${activity.check_out ? 'bg-blue-500' : 'bg-success'} animate-pulse`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-black text-foreground uppercase tracking-tighter">
                                                            {activity.check_out ? 'Check-out Complete' : 'Check-in Confirmed'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                            {format(new Date(activity.date), 'MMMM d, yyyy')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right header-glass glass-card">
                                                        <p className="font-mono text-foreground font-black text-base">
                                                            {activity.check_out
                                                                ? format(new Date(activity.check_out), 'hh:mm a')
                                                                : format(new Date(activity.check_in), 'hh:mm a')
                                                            }
                                                        </p>
                                                        <StatusBadge status={activity.status} size="sm" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Button variant="ghost" className="w-full mt-6 h-12 rounded-2xl hover:bg-muted/50 text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest text-[10px]">
                                        Load Full Archive
                                    </Button>
                                </div>
                            ) : (
                                <div className="section-card shadow-2xl">
                                    <h3 className="text-xl font-black text-foreground tracking-tighter mb-6 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-primary" /> Password Settings
                                    </h3>
                                    <form onSubmit={async (e) => {
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
                                        } catch (err: any) {
                                            toast.error(err.response?.data?.message || 'Failed to change password');
                                        }
                                    }} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-foreground text-[10px] uppercase font-bold tracking-widest">Current Password</Label>
                                                <Input type="password" name="currentPassword" required className="bg-muted/50 border-border text-foreground h-12 rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground text-[10px] uppercase font-bold tracking-widest">New Password</Label>
                                                <Input type="password" name="newPassword" required className="bg-muted/50 border-border text-foreground h-12 rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground text-[10px] uppercase font-bold tracking-widest">Confirm New Password</Label>
                                            <Input type="password" name="confirmPassword" required className="bg-muted/50 border-border text-foreground h-12 rounded-xl" />
                                        </div>
                                        <Button type="submit" className="w-full bg-primary text-white font-black uppercase tracking-tighter h-14 rounded-2xl shadow-lg shadow-primary/20">
                                            Update Password
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="space-y-10">
                        <section className="glass-card p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent border-primary/20 shadow-2xl">
                            <h3 className="text-xl font-black text-foreground tracking-tighter mb-8 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" /> Employment Details
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Employee Token ID</p>
                                    <p className="font-mono text-[10px] text-foreground/50 bg-muted/50 p-3 rounded-xl border border-border break-all leading-relaxed">{profile?._id}</p>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Joining Date</p>
                                    <p className="text-lg font-black text-foreground tracking-tighter">January 10, 2026</p>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Department</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <p className="text-lg font-black text-foreground tracking-tighter uppercase">Operations</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="glass-card p-8 rounded-[2rem] border-border shadow-2xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                            <h3 className="text-xl font-black text-foreground tracking-tighter mb-6">HR Support</h3>
                            <p className="text-sm text-muted-foreground font-medium mb-8 leading-relaxed">
                                Need to update your profile or having technical issues? Contact HR Support.
                            </p>
                            <Button className="w-full h-14 rounded-2xl bg-muted/50 border border-border hover:bg-muted text-foreground font-black uppercase tracking-widest text-xs shadow-xl">
                                Contact HR
                            </Button>
                        </section>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
