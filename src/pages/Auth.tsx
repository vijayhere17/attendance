import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Mail, Lock, ArrowRight, Shield, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import '@/styles/Auth.css';
import logo from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.must_change_password) {
        navigate('/change-password');
      } else if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
    } catch (error: any) {
      // Handled in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Restoring session...</p>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      <div className="auth-container">
        <div className="auth-branding">
          <div className="logo-section animate-float">
            <img src={logo} alt="Exotic Infotech" className="h-16 w-auto" />
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Radius Check</h1>
          </div>

          <div className="space-y-8 mt-12 bg-muted/20 p-10 rounded-[3rem] border border-border backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
            
            <div className="relative space-y-6">
              <h2 className="hero-title">
                Precision Attendance <br />
                <span className="text-primary">Reliability.</span>
              </h2>
              <p className="hero-subtitle">
                The modern standard for secure, verified workforce management. Professional tracking with real-time analytics.
              </p>

              <div className="feature-highlights">
                <div className="feature-item">
                  <Shield className="w-8 h-8 text-primary" />
                  <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground mt-2">Security</p>
                  <p className="font-bold">Enterprise Grade</p>
                </div>
                <div className="feature-item">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                  <p className="font-black uppercase tracking-widest text-[10px] text-muted-foreground mt-2">Accuracy</p>
                  <p className="font-bold">Verified Logs</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-primary/5 border border-primary/10 w-fit">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-background bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden">
                  {i === 4 ? '+50' : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />}
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-muted-foreground">Join 500+ professionals using Radius Check</p>
          </div>
        </div>

        <div className="flex items-center justify-center relative">
          <div className="w-full max-w-md">
            <div className="text-center mb-10 lg:hidden">
              <img src={logo} alt="Exotic Infotech" className="h-12 w-auto mx-auto mb-4" />
              <h1 className="text-3xl font-black tracking-tighter">Radius Check</h1>
            </div>

            <Card className="auth-form-card">
              <CardHeader className="auth-form-header">
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest ml-1">Email Address</Label>
                    <div className="auth-input-group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-14 pl-12 bg-muted/50 border-border rounded-2xl focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest ml-1">Password</Label>
                    <div className="auth-input-group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-14 pl-12 bg-muted/50 border-border rounded-2xl focus:ring-primary/20"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="auth-submit-btn" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </form>

                <div className="auth-footer-text">
                  <p>Secured by Enterprise Infrastructure</p>
                  <p className="mt-1">Contact your manager if you've lost access.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
