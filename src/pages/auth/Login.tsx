import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'البريد أو كلمة السر غلط' : error.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/3 w-72 h-72 rounded-full bg-primary/20 blur-[100px]" />
      </div>
      <Card className="w-full max-w-md relative z-10 border-border shadow-lg">
        <CardHeader className="text-center">
          <Link to="/" className="text-3xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2 inline-block">
            Boardly
          </Link>
          <CardTitle className="text-2xl font-['Space_Grotesk']">تسجيل الدخول</CardTitle>
          <CardDescription>ادخل بياناتك للوصول لحسابك</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة السر</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
            </div>
            <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline block">نسيت كلمة السر؟</Link>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تسجيل دخول'}
            </Button>
            <p className="text-sm text-muted-foreground">
              ماعندك حساب؟{' '}
              <Link to="/auth/signup" className="text-primary hover:underline">أنشئ حساب جديد</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
