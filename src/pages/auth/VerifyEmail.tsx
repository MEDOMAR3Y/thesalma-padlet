import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Link } from 'react-router-dom';

export default function VerifyEmail() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Check if already verified
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login');
      return;
    }
    if (user) {
      supabase
        .from('profiles')
        .select('email_verified')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.email_verified) {
            navigate('/profile');
          }
        });
    }
  }, [user, authLoading, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendOtp = useCallback(async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-otp');
      if (error) throw error;
      toast.success('تم إرسال كود التأكيد لبريدك الإلكتروني');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || 'حصل خطأ في إرسال الكود');
    } finally {
      setSending(false);
    }
  }, [sending, cooldown]);

  // Send OTP on mount
  useEffect(() => {
    if (user && !authLoading) {
      sendOtp();
    }
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { otp },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setVerifying(false);
        return;
      }
      toast.success('تم تأكيد حسابك بنجاح! 🎉');
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.message || 'كود غير صحيح');
    } finally {
      setVerifying(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4" dir="rtl">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mb-2">
            <img src={logo} alt="The Salma Padlet" className="h-12 mx-auto object-contain" />
          </Link>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-['Space_Grotesk']">تأكيد البريد الإلكتروني</CardTitle>
          <CardDescription>
            تم إرسال كود مكون من 6 أرقام إلى<br />
            <strong className="text-foreground">{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            onClick={handleVerify}
            className="w-full bg-primary hover:bg-primary/90"
            disabled={otp.length !== 6 || verifying}
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
            تأكيد الحساب
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            onClick={sendOtp}
            disabled={sending || cooldown > 0}
            className="text-sm gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${sending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : 'إعادة إرسال الكود'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
