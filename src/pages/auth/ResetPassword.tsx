import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background" dir="rtl">
        <Card className="w-full max-w-md border-border shadow-lg text-center p-8">
          <p className="text-muted-foreground">رابط غير صالح أو منتهي الصلاحية.</p>
          <Link to="/auth/forgot-password" className="text-primary hover:underline mt-4 inline-block">طلب رابط جديد</Link>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('كلمة السر لازم تكون 6 حروف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { token, newPassword: password },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }
      toast.success('تم تغيير كلمة السر بنجاح!');
      navigate('/auth/login');
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
          <CardTitle className="text-2xl font-['Space_Grotesk']">كلمة سر جديدة</CardTitle>
          <CardDescription>اختار كلمة سر جديدة لحسابك</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة السر الجديدة</Label>
              <Input id="password" type="password" placeholder="6 حروف على الأقل" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تغيير كلمة السر'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
