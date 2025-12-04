import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OtpVerification from './OtpVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for verification message from registration
  useEffect(() => {
    if (location.state?.message) {
      // Show success message (you can add a toast notification here)
      console.log(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = await login(email, password);

    if (!result.success) {
      if (result.requiresVerification) {
        // User needs to verify email
        setUnverifiedUser(result.user);
        setShowOtpVerification(true);
      } else {
        setErrors(result.errors);
      }
    } else {
      // Redirect based on role
      let redirectPath = '/dashboard';
      if (result.user?.role === 'super_admin') {
        redirectPath = '/super_admin';
      } else if (result.user?.role === 'admin') {
        redirectPath = '/admin';
      }
      navigate(location.state?.from?.pathname || redirectPath, { replace: true });
    }

    setLoading(false);
  };

  const handleOtpVerified = (verifiedUser) => {
    // After OTP verification, try login again
    setShowOtpVerification(false);
    // Auto-submit login form
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  // Show OTP verification if needed
  if (showOtpVerification && unverifiedUser) {
    return (
      <OtpVerification
        email={unverifiedUser.email}
        userName={unverifiedUser.name}
        onVerified={handleOtpVerified}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
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
            />
            {errors.email && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {errors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errors.password && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {errors.password[0]}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">
            Don't have an account?{' '}
          </span>
          <Link to="/register" className="text-[hsl(var(--primary))] hover:underline font-medium">
            Register
          </Link>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

export default Login;