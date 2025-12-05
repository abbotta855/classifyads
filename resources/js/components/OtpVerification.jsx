import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { otpAPI } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

function OtpVerification({ email, userName, onVerified }) {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-focus first input
    const firstInput = document.getElementById('otp-0');
    if (firstInput) {
      firstInput.focus();
    }
    
    // NOTE: Do NOT auto-generate OTP here because:
    // - Registration already generates OTP before showing this component
    // - Login already generates OTP before showing this component
    // Auto-generating here would overwrite the OTP that was just sent!
    // Users can use the "Resend" button if they need a new OTP.
  }, [email]);

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

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    setErrors({});

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
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
      setOtpCode(digits);
      // Focus last input
      const lastInput = document.getElementById('otp-5');
      if (lastInput) {
        lastInput.focus();
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const code = otpCode.join('');
    if (code.length !== 6) {
      setErrors({ otp_code: ['Please enter the complete 6-digit code'] });
      return;
    }

    setLoading(true);
    try {
      const response = await otpAPI.verify(email, code);
      if (onVerified) {
        onVerified(response.data.user);
      } else {
        // Default behavior: navigate to login
        navigate('/login', { 
          replace: true,
          state: { message: 'Email verified successfully. Please login.' }
        });
      }
    } catch (error) {
      setErrors({
        otp_code: error.response?.data?.message 
          ? [error.response.data.message]
          : ['Invalid OTP code. Please try again.'],
      });
      // Clear OTP on error
      setOtpCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
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
      const response = await otpAPI.resend(email);
      setResendCooldown(60); // 60 second cooldown
      if (response.data.expires_at) {
        setExpiresAt(new Date(response.data.expires_at));
      }
      // Clear OTP inputs
      setOtpCode(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      if (firstInput) {
        firstInput.focus();
      }
    } catch (error) {
      setErrors({
        resend: error.response?.data?.message 
          ? [error.response.data.message]
          : ['Failed to resend OTP. Please try again.'],
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter Verification Code</Label>
              <div className="flex gap-2 justify-center">
                {otpCode.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
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
              {errors.otp_code && (
                <p className="text-sm text-[hsl(var(--destructive))] text-center">
                  {errors.otp_code[0]}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default OtpVerification;

