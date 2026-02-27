import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('كلمة السر لازم تكون 6 حروف على الأقل');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد حسابك.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-accent/20 blur-[100px]" />
      </div>
      <Card className="w-full max-w-md relative z-10 border-border shadow-lg">
        <CardHeader className="text-center">
          <Link to="/" className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2 inline-block">
            The Salma Padlet
          </Link>
          <CardTitle className="text-2xl font-['Space_Grotesk']">إنشاء حساب جديد</CardTitle>
          <CardDescription>أنشئ حسابك وابدأ في بناء لوحاتك</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" type="text" placeholder="اسمك" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
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
