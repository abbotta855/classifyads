import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get email and code from location state (passed from ForgotPassword)
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.code) {
      setResetCode(location.state.code);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await axios.post('/api/reset-password', {
        email,
        code: resetCode,
        password,
        password_confirmation: passwordConfirmation,
      });
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successful. Please login with your new password.' }
        });
      }, 3000);
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setErrors({ password: ['Something went wrong. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
        <Card className="w-full max-w-md animate-fade-in shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been reset successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md mb-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                You can now login with your new password. Redirecting to login page...
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md animate-fade-in shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your reset code and new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!location.state?.email}
              />
              {errors.email && (
                <p className="text-sm text-[hsl(var(--destructive))] animate-slide-in mt-1">
                  {errors.email[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Reset Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={resetCode}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setResetCode(value);
                  setErrors({ ...errors, code: '' });
                }}
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest font-mono"
                disabled={!!location.state?.code}
              />
              {errors.code && (
                <p className="text-sm text-[hsl(var(--destructive))] animate-slide-in mt-1">
                  {errors.code[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              {errors.password && (
                <p className="text-sm text-[hsl(var(--destructive))] animate-slide-in mt-1">
                  {errors.password[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm New Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={8}
              />
              {errors.password_confirmation && (
                <p className="text-sm text-[hsl(var(--destructive))] animate-slide-in mt-1">
                  {errors.password_confirmation[0]}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !resetCode || resetCode.length !== 6}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
              Remember your password?{' '}
            </span>
            <Link to="/login" className="text-[hsl(var(--primary))] hover:underline font-medium">
              Login
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-[hsl(var(--primary))] hover:underline"
            >
              Request a new reset code
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPassword;
