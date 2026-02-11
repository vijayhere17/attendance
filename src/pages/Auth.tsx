import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Mail, Lock, ArrowRight, Sparkles, Zap, Heart, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AnimatedBackground } from '@/components/AnimatedBackground';

// Login validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const { signIn, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (!loading && user) {
      // Check if user must change password first
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
      // Redirect is handled by useEffect
    } catch (error: any) {
      // Error toast is handled in useAuth
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh-animated">
        <div className="text-center animate-slide-up">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8 animate-slide-up">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-coral rotate-6 hover:rotate-0 transition-transform duration-300">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-2xl text-foreground">GeoAttend</h1>
                <p className="text-sm text-muted-foreground">Smart Attendance Tracking</p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-5xl font-bold text-foreground leading-tight">
                  Track attendance
                  <br />
                  <span className="text-primary">the smart way</span>
                  <span className="text-accent">.</span>
                </h2>
                <p className="text-lg text-muted-foreground mt-4 leading-relaxed max-w-md">
                  GPS-verified check-ins, real-time tracking, and powerful analytics.
                  Everything you need to manage attendance effortlessly.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="card-tilted p-4 rounded-2xl bg-card border-2 border-primary/20 shadow-coral">
                  <Sparkles className="w-6 h-6 text-primary mb-2" />
                  <p className="font-semibold text-sm">GPS Verified</p>
                  <p className="text-xs text-muted-foreground mt-1">Accurate location tracking</p>
                </div>
                <div className="card-skewed p-4 rounded-2xl bg-card border-2 border-accent/20 shadow-teal">
                  <Zap className="w-6 h-6 text-accent mb-2" />
                  <p className="font-semibold text-sm">Real-time</p>
                  <p className="text-xs text-muted-foreground mt-1">Instant updates</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-4">
                <div>
                  <p className="text-3xl font-bold text-primary">99.9%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-3xl font-bold text-accent">24/7</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-3xl font-bold text-success">Secure</p>
                  <p className="text-xs text-muted-foreground">Enterprise-grade</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form Only (No Signup) */}
          <div className="w-full max-w-md mx-auto lg:mx-0 animate-scale-in">
            {/* Mobile Logo */}
            <div className="text-center mb-8 lg:hidden">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-coral rotate-3">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">GeoAttend</h1>
              <p className="text-muted-foreground mt-1">Smart Attendance Tracking</p>
            </div>

            <Card className="shadow-large border-2 border-border/50 overflow-hidden backdrop-blur-sm bg-card/95">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

              <CardHeader className="pb-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-primary animate-pulse-soft" />
                  <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                </div>
                <CardDescription>
                  Sign in to continue to your dashboard
                </CardDescription>
                {/* Admin-only notice */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Contact your administrator for account access</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@company.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-12 border-2 focus:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 h-12 border-2 focus:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base gap-2 shadow-coral ripple gradient-primary hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to our{' '}
              <span className="text-primary hover:underline cursor-pointer">Terms</span>
              {' '}and{' '}
              <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
