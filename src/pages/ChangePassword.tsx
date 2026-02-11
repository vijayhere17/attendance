import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Lock, ArrowRight, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import client from '@/api/client';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Progress } from '@/components/ui/progress';

/**
 * ChangePassword Page
 * 
 * Displayed when a user logs in for the first time and must_change_password = true.
 * User must set a new password before accessing the system.
 * Admin does NOT know the final password - only the temporary one.
 */
export default function ChangePassword() {
    const [isLoading, setIsLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // Password strength calculator
    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return 0;
        if (password.length < 6) return 25;
        if (password.length < 8) return 50;
        if (password.length < 12) return 75;
        return 100;
    };

    const passwordStrength = getPasswordStrength(newPassword);
    const passwordsMatch = newPassword === confirmPassword && newPassword.length >= 6;

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await client.post('/auth/change-password', {
                newPassword,
            });

            if (data.success) {
                toast.success('Password changed successfully!', {
                    description: 'Redirecting to your dashboard...',
                });

                // Force refresh to get updated user data
                // Small delay to show success message
                setTimeout(() => {
                    window.location.href = user?.role === 'admin' ? '/admin' : '/employee';
                }, 1500);
            }
        } catch (error: any) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        signOut();
        navigate('/auth');
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-background">
            <AnimatedBackground />

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-md animate-scale-in">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-coral">
                            <MapPin className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">GeoAttend</h1>
                        <p className="text-muted-foreground mt-1">Secure Your Account</p>
                    </div>

                    <Card className="shadow-large border-2 border-warning/30 overflow-hidden backdrop-blur-sm bg-card/95">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-warning opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                        <CardHeader className="pb-4 relative">
                            <div className="flex items-center gap-2 mb-2">
                                <KeyRound className="w-5 h-5 text-warning" />
                                <CardTitle className="text-2xl">Set New Password</CardTitle>
                            </div>
                            <CardDescription>
                                For security, you must set a new password before continuing.
                            </CardDescription>

                            {/* Security notice */}
                            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
                                <div className="flex items-start gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium text-warning">First-time login detected</p>
                                        <p className="text-muted-foreground mt-1">
                                            Choose a strong password that only you know. Your administrator will NOT have access to this password.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                {/* Welcome message */}
                                {user && (
                                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50 mb-4">
                                        <p className="text-sm text-muted-foreground">
                                            Welcome, <span className="font-medium text-foreground">{user.full_name}</span>
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-warning transition-colors" />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-10 h-12 border-2 focus:border-warning transition-all"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    {newPassword && (
                                        <div className="space-y-1 animate-slide-up">
                                            <Progress value={passwordStrength} className="h-2" />
                                            <p className="text-xs text-muted-foreground">
                                                Password strength: {
                                                    passwordStrength < 50 ? 'Weak' :
                                                        passwordStrength < 75 ? 'Good' :
                                                            passwordStrength < 100 ? 'Strong' : 'Very Strong'
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-warning transition-colors" />
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 h-12 border-2 focus:border-warning transition-all"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    {confirmPassword && (
                                        <div className="flex items-center gap-2 text-sm animate-slide-up">
                                            {passwordsMatch ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                                    <span className="text-success">Passwords match</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                                    <span className="text-destructive">Passwords do not match</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base gap-2 bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg"
                                    disabled={isLoading || !passwordsMatch}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Updating password...
                                        </>
                                    ) : (
                                        <>
                                            Set Password & Continue
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            {/* Logout option */}
                            <div className="mt-4 text-center">
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Sign out and use a different account
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
