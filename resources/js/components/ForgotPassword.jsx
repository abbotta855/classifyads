import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-focus first input when in code entry step
    if (step === 2) {
      const firstInput = document.getElementById('reset-code-0');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [step]);

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newResetCode = [...resetCode];
    newResetCode[index] = value;
    setResetCode(newResetCode);
    setErrors({});

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-code-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
      const prevInput = document.getElementById(`reset-code-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setResetCode(digits);
      // Focus last input
      const lastInput = document.getElementById('reset-code-5');
      if (lastInput) {
        lastInput.focus();
      }
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await axios.post('/api/forgot-password', { email });
      setStep(2); // Move to code entry step
      setResendCooldown(60); // 60 second cooldown
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
    
    const code = resetCode.join('');
    if (code.length !== 6) {
      setErrors({ code: ['Please enter the complete 6-digit code'] });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/verify-reset-code', {
        email,
        code: code,
      });
      // Navigate to reset password page with email and code
      navigate('/reset-password', {
        state: { email, code: code },
      });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setErrors({ code: ['Invalid or expired reset code. Please try again.'] });
      }
      // Clear code on error
      setResetCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('reset-code-0');
      if (firstInput) {
        firstInput.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setResendLoading(true);
    setErrors({});
    try {
      const response = await axios.post('/api/forgot-password', { email });
      setResendCooldown(60); // 60 second cooldown
      // Clear code inputs
      setResetCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('reset-code-0');
      if (firstInput) {
        firstInput.focus();
      }
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setErrors({ resend: ['Failed to resend code. Please try again.'] });
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {step === 1 ? 'Forgot Password' : 'Verify Your Email'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your email address and we'll send you a code to reset your password."
              : (
                <>
                  We've sent a 6-digit verification code to <strong>{email}</strong>
                </>
              )}
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
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-code">Enter Verification Code</Label>
                <div className="flex gap-2 justify-center">
                  {resetCode.map((digit, index) => (
                    <Input
                      key={index}
                      id={`reset-code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-12 h-14 text-center text-2xl font-semibold"
                      required
                    />
                  ))}
                </div>
                {errors.code && (
                  <p className="text-sm text-[hsl(var(--destructive))] text-center">
                    {errors.code[0]}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendLoading || resendCooldown > 0}
                  className="w-full"
                >
                  {resendLoading
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </Button>
                {errors.resend && (
                  <p className="text-sm text-[hsl(var(--destructive))]">
                    {errors.resend[0]}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep(1);
                  setResetCode(['', '', '', '', '', '']);
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
