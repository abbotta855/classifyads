import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code, 3: Success
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await axios.post('/api/forgot-password', { email });
      setStep(2); // Move to code entry step
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setErrors({ email: ['Something went wrong. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await axios.post('/api/verify-reset-code', {
        email,
        code: resetCode,
      });
      setCodeVerified(true);
      // Navigate to reset password page with email and code
      navigate('/reset-password', {
        state: { email, code: resetCode },
      });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setErrors({ code: ['Invalid or expired reset code. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md animate-fade-in shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your email address and we'll send you a code to reset your password."
              : "Enter the 6-digit code sent to your email."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
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
                  <p className="text-sm text-[hsl(var(--destructive))] animate-slide-in mt-1">
                    {errors.email[0]}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
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
                />
                {errors.code && (
                  <p className="text-sm text-[hsl(var(--destructive))] animate-slide-in mt-1">
                    {errors.code[0]}
                  </p>
                )}
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Check your email for the 6-digit code. The code expires in 10 minutes.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || resetCode.length !== 6}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setResetCode('');
                  setErrors({});
                }}
              >
                Back to Email
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">
              Remember your password?{' '}
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

export default ForgotPassword;
