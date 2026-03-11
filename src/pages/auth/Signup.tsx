import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo.png';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Check, AlertCircle, AtSign } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const { signUp } = useAuth();

  // Check username availability
  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username' as any, username)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 400);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || usernameStatus !== 'available') {
      toast.error('اختر اسم مستخدم صالح ومتاح');
      return;
    }
    if (password.length < 6) {
      toast.error('كلمة السر لازم تكون 6 حروف على الأقل');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد حسابك.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8" dir="rtl">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-accent/20 blur-[100px]" />
      </div>
      <Card className="w-full max-w-md relative z-10 border-border shadow-lg">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mb-2">
            <img src={logo} alt="The Salma Padlet" className="h-12 mx-auto object-contain" />
          </Link>
          <CardTitle className="text-2xl font-['Space_Grotesk']">إنشاء حساب جديد</CardTitle>
          <CardDescription>أنشئ حسابك وابدأ في بناء لوحاتك</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-1.5">
                <AtSign className="h-3.5 w-3.5" /> اسم المستخدم (Username)
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  dir="ltr"
                  className="pl-8"
                  maxLength={20}
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {usernameStatus === 'available' && <Check className="h-4 w-4 text-emerald-500" />}
                  {usernameStatus === 'taken' && <AlertCircle className="h-4 w-4 text-destructive" />}
                  {usernameStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
              </div>
              {usernameStatus === 'taken' && <p className="text-xs text-destructive">اسم المستخدم محجوز</p>}
              {usernameStatus === 'invalid' && <p className="text-xs text-amber-500">3-20 حرف (أحرف إنجليزية، أرقام، _ فقط)</p>}
              {usernameStatus === 'available' && <p className="text-xs text-emerald-500">متاح ✓</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة السر</Label>
              <Input id="password" type="password" placeholder="6 حروف على الأقل" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading || usernameStatus !== 'available'}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء حساب'}
            </Button>
            <p className="text-sm text-muted-foreground">
              عندك حساب؟{' '}
              <Link to="/auth/login" className="text-primary hover:underline">تسجيل دخول</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
