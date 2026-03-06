import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo.png';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: {
          email,
          redirectUrl: window.location.origin,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || 'حصل خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4" dir="rtl">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mb-2">
            <img src={logo} alt="The Salma Padlet" className="h-12 mx-auto object-contain" />
          </Link>
          <CardTitle className="text-2xl font-['Space_Grotesk']">نسيت كلمة السر</CardTitle>
          <CardDescription>هنبعتلك رابط لإعادة تعيين كلمة السر</CardDescription>
        </CardHeader>
        {sent ? (
          <CardContent className="text-center py-8">
            <p className="text-lg mb-4">✅ تم إرسال رابط إعادة التعيين</p>
            <p className="text-muted-foreground">تحقق من بريدك الإلكتروني <strong>{email}</strong></p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال رابط التعيين'}
              </Button>
            </CardFooter>
          </form>
        )}
        <CardFooter className="justify-center">
          <Link to="/auth/login" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowRight className="h-4 w-4 rotate-180" /> رجوع لتسجيل الدخول
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
