import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import client from '@/api/client';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Full name is required'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminExists, setAdminExists] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn, signUp, user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data } = await client.get('/auth/admin-exists');
        setAdminExists(data.exists);
        if (!data.exists) {
          setIsRegistering(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, []);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegistering) {
      const validation = registerSchema.safeParse({
        email: loginEmail,
        password: loginPassword,
        full_name: fullName
      });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    } else {
      const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        await signUp(loginEmail, loginPassword, fullName);
      } else {
        await signIn(loginEmail, loginPassword);
      }
    } catch (error) {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <img src={logo} alt="Exotic Infotech" className="h-10 w-auto mx-auto mb-6" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isRegistering ? 'Create Admin Account' : 'Sign in to your account'}
          </h1>
          <p className="text-sm text-slate-500">
            {isRegistering
              ? 'Set up the primary administrator account for the system'
              : 'Enter your credentials to access the attendance portal'}
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleAuth} className="space-y-6">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Admin User"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 border-slate-200 rounded-md focus:ring-slate-900"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-11 border-slate-200 rounded-md focus:ring-slate-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  {!isRegistering && (
                    <Link to="/forgot-password" title="Forgot Password" className="text-xs font-medium text-slate-600 hover:text-slate-900">
                      Forgot?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-11 border-slate-200 rounded-md pr-10 focus:ring-slate-900"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-md font-medium transition-colors" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isRegistering ? 'Register Administrator' : 'Sign In'}
              </Button>
            </form>

            {!adminExists && (
              <div className="mt-6 p-4 rounded-md bg-amber-50 border border-amber-100">
                <p className="text-xs font-medium text-amber-800 text-center">
                  SYSTEM SETUP: No administrator detected.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Precision Attendance System &copy; {new Date().getFullYear()} Exotic Infotech
        </p>
      </div>
    </div>
  );
}
