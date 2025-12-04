import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OtpVerification from './OtpVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = await register(name, email, password, passwordConfirmation);

    if (!result.success) {
      setErrors(result.errors);
    } else if (result.requiresVerification) {
      // Show OTP verification screen
      setRegisteredUser(result.user);
      setShowOtpVerification(true);
    } else {
      navigate('/dashboard', { replace: true });
    }

    setLoading(false);
  };

  const handleOtpVerified = (verifiedUser) => {
    // After OTP verification, navigate to login
    navigate('/login', { 
      replace: true,
      state: { message: 'Email verified successfully. Please login.' }
    });
  };

  // Show OTP verification if needed
  if (showOtpVerification && registeredUser) {
    return (
      <OtpVerification
        email={registeredUser.email}
        userName={registeredUser.name}
        onVerified={handleOtpVerified}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your information to create a new account.
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {errors.name && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {errors.name[0]}
              </p>
            )}
          </div>

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
              minLength={8}
            />
            {errors.password && (
              <p className="text-sm text-[hsl(var(--destructive))]">
                {errors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm Password</Label>
            <Input
              id="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">
            Already have an account?{' '}
          </span>
          <Link to="/login" className="text-[hsl(var(--primary))] hover:underline font-medium">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

export default Register;