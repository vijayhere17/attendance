import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import client from '@/api/client';
import {
  MapPin,
  Loader2,
  Navigation,
  Save,
  Settings,
  Bell,
  Globe,
  UserCircle,
  Shield,
  Calendar,
  Mail,
  Phone,
  Trash2,
  Plus,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import '@/styles/Settings.css';

interface Office {
  _id?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  grace_period_mins: number;
  name?: string;
}

function NotificationSettingsPanel() {
  const [settings, setSettings] = useState({
    lateAlerts: true,
    earlyExitAlerts: true,
    dailySummary: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await client.get('/admin/settings/notifications');
        if (data) setSettings({ ...settings, ...data });
      } catch (error) {
        console.error("Failed to load notification settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await client.post('/admin/settings/notifications', newSettings);
      toast.success("Preference saved");
    } catch (error) {
      toast.error("Failed to save preference");
      setSettings(settings);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold tracking-tight">Late Arrival Alerts</Label>
          <p className="text-xs font-semibold text-muted-foreground opacity-70 italic">Notify admin instantly when an employee logs in late.</p>
        </div>
        <Switch
          checked={settings.lateAlerts}
          onCheckedChange={(checked) => updateSetting('lateAlerts', checked)}
          className="data-[state=checked]:bg-indigo-600"
        />
      </div>
      <Separator className="opacity-50" />
      <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold tracking-tight">Early Exit Alerts</Label>
          <p className="text-xs font-semibold text-muted-foreground opacity-70 italic">Get notified if someone logs out before shift end.</p>
        </div>
        <Switch
          checked={settings.earlyExitAlerts}
          onCheckedChange={(checked) => updateSetting('earlyExitAlerts', checked)}
          className="data-[state=checked]:bg-indigo-600"
        />
      </div>
      <Separator className="opacity-50" />
      <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
        <div className="space-y-0.5">
          <Label className="text-sm font-bold tracking-tight">Intelligence Summaries</Label>
          <p className="text-xs font-semibold text-muted-foreground opacity-70 italic">Receive a consolidated daily attendance report via email.</p>
        </div>
        <Switch
          checked={settings.dailySummary}
          onCheckedChange={(checked) => updateSetting('dailySummary', checked)}
          className="data-[state=checked]:bg-indigo-600"
        />
      </div>
    </div>
  );
}

function ProfileSettingsPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await client.put('/auth/profile', formData);
      toast.success('Admin profile updated');
      window.location.reload(); // Refresh to update context
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Sync failed: ' + (err.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Legal Identity</Label>
          <Input id="full_name" value={formData.full_name} onChange={handleChange} className="h-12 rounded-xl border-border/40" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_number" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contact Secure</Label>
          <Input id="phone_number" value={formData.phone_number} onChange={handleChange} className="h-12 rounded-xl border-border/40" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Management Alias (Verified Email)</Label>
        <Input id="email" type="email" value={formData.email} onChange={handleChange} className="h-12 rounded-xl border-border/40" />
      </div>

      <Button onClick={handleSave} disabled={loading} className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-black text-white font-black shadow-xl shadow-indigo-100 gap-2 transition-all active:scale-95">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Synchronize Profile
      </Button>
    </div>
  );
}

function SecuritySettingsPanel() {
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      await client.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl border-2 border-dashed border-border/60 bg-muted/10">
        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-6">
          <Shield className="w-4 h-4" /> Security Protocol Update
        </h4>
        <form onSubmit={handlePasswordChange} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">Current Key</Label>
              <Input type="password" name="currentPassword" required className="h-12 rounded-xl" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">New Access Key</Label>
              <Input type="password" name="newPassword" required className="h-12 rounded-xl" placeholder="••••••••" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">Confirm Key Selection</Label>
            <Input type="password" name="confirmPassword" required className="h-12 rounded-xl" placeholder="••••••••" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-slate-900 border-0 font-bold tracking-tight text-white hover:bg-black">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            Commit Security Update
          </Button>
        </form>
      </div>
    </div>
  );
}

interface Holiday {
  _id: string;
  date: string;
  name: string;
}

function HolidaySettingsPanel() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchHolidays = async () => {
    try {
      const { data } = await client.get('/admin/holidays');
      setHolidays(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddHoliday = async () => {
    if (!date || !name) {
      return toast.error("Missing holiday parameters.");
    }
    setAdding(true);
    try {
      await client.post('/admin/holidays', { date, name });
      toast.success("Calendar updated!");
      fetchHolidays();
      setDate('');
      setName('');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to index holiday.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Erase this holiday from records?")) return;
    try {
      await client.delete(`/admin/holidays/${id}`);
      toast.success("Entry purged.");
      fetchHolidays();
    } catch (error) {
      toast.error("Process aborted.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 space-y-5">
          <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Calendar Event
          </h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">Occurrence Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider opacity-60">Event Title</Label>
              <Input placeholder="e.g. Independence Day" value={name} onChange={e => setName(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <Button onClick={handleAddHoliday} disabled={adding} className="w-full h-11 rounded-xl bg-slate-900 border-0 font-bold tracking-tight">
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Seal to Calendar
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Upcoming Observed Holidays</h4>
        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary/30" /></div>
          ) : holidays.length === 0 ? (
            <div className="p-12 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center opacity-40">
              <Calendar className="w-10 h-10 mb-3" />
              <p className="text-xs font-bold font-mono">CALENDAR_IDLE_STATE</p>
            </div>
          ) : (
            holidays.map(h => (
              <div key={h._id} className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black uppercase text-indigo-400">{format(new Date(h.date), 'MMM')}</span>
                    <span className="text-sm font-black text-indigo-700 leading-none">{format(new Date(h.date), 'dd')}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 tracking-tight">{h.name}</p>
                    <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-wider">Observed Leave</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all" onClick={() => handleDeleteHoliday(h._id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [office, setOffice] = useState<Office>({
    latitude: 0,
    longitude: 0,
    radius_meters: 100,
    grace_period_mins: 5,
    name: 'Main Office',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const fetchOffice = async () => {
      try {
        const { data } = await client.get('/office');
        if (data) {
          setOffice(data);
        }
      } catch (error) {
        console.error("Error fetching office settings", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOffice();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await client.post('/office', office);
      setOffice(data);
      toast.success('Core configuration synced!');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error('Sync error: ' + (err.response?.data?.message || (error instanceof Error ? error.message : 'Unknown error')));
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Not able to find location');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOffice({
          ...office,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGettingLocation(false);
        toast.success('Location found');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('G-Link failure: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (loading) {
    return (
       <Layout>
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Configuration</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
            <p className="text-sm text-slate-500 mt-1">Manage global system parameters and geofence policies.</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-bold shadow-sm gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-md h-10 gap-1 border border-slate-200">
            {['general', 'profile', 'security', 'holidays', 'location', 'alerts'].map(tab => (
              <TabsTrigger key={tab} value={tab} className="h-8 px-4 rounded text-[10px] font-bold uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 hover:text-slate-900">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="m-0 space-y-6">
            <Card className="rounded-lg border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">General Blueprint</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Office Name</Label>
                    <Input
                      value={office.name}
                      onChange={(e) => setOffice({ ...office, name: e.target.value })}
                      className="h-10 rounded-md border-slate-200 focus:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Grace Period (Minutes)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        value={office.grace_period_mins}
                        onChange={(e) => setOffice({ ...office, grace_period_mins: parseInt(e.target.value) || 0 })}
                        className="h-10 rounded-md border-slate-200 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="m-0 space-y-6">
            <Card className="rounded-lg border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Administrator Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ProfileSettingsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="m-0 space-y-6">
            <Card className="rounded-lg border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Access Control</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <SecuritySettingsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holidays" className="m-0 space-y-6">
            <Card className="rounded-lg border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Holiday Calendar</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <HolidaySettingsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="m-0 space-y-6">
            <Card className="rounded-lg border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Geofence Compliance</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  <div className="md:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Latitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={office.latitude}
                          onChange={(e) => setOffice({ ...office, latitude: parseFloat(e.target.value) || 0 })}
                          className="h-10 rounded-md font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Longitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={office.longitude}
                          onChange={(e) => setOffice({ ...office, longitude: parseFloat(e.target.value) || 0 })}
                          className="h-10 rounded-md font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Verification Radius (Meters)</Label>
                      <Input
                        type="number"
                        value={office.radius_meters}
                        onChange={(e) => setOffice({ ...office, radius_meters: parseInt(e.target.value) || 100 })}
                        className="h-10 rounded-md font-bold"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="h-full rounded-md border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-8">
                      <Navigation className="w-8 h-8 text-slate-300 mb-4" />
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">GPS Detection</h4>
                      <p className="text-xs text-slate-500 mb-6 max-w-[200px]">Capture current location metadata for system geofencing.</p>
                      <Button
                        onClick={useCurrentLocation}
                        disabled={gettingLocation}
                        size="sm"
                        className="w-full bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 font-bold uppercase tracking-widest text-[10px]"
                      >
                        {gettingLocation ? 'Detecting...' : 'Detect Location'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="m-0 space-y-6">
            <Card className="rounded-lg border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50 p-6">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Intelligence Triggers</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-2xl">
                  <NotificationSettingsPanel />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
