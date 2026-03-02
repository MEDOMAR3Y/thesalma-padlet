import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Camera, Loader2, Save, Layout } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';
import BoardCard from '@/components/BoardCard';
import logo from '@/assets/logo.png';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user } = useAuth();
  const { boards } = useBoards();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
      }
    });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: displayName.trim(),
        bio: bio.trim(),
      }).eq('user_id', user.id);
      if (error) throw error;
      toast.success('تم حفظ البروفايل!');
    } catch {
      toast.error('حصل خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('user_id', user.id);
      setAvatarUrl(data.publicUrl);
      toast.success('تم تحديث الصورة!');
    } catch {
      toast.error('فشل رفع الصورة');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('كلمة المرور لازم تكون 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { toast.error('كلمات المرور مش متطابقة'); return; }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('تم تغيير كلمة المرور!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/dashboard"><img src={logo} alt="Logo" className="h-9 object-contain" /></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
          <ArrowRight className="h-4 w-4" /> رجوع للداشبورد
        </Button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader><CardTitle>البروفايل</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {displayName?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    {avatarLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div>
                  <p className="font-semibold text-lg">{displayName || 'بدون اسم'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>الاسم</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="اسمك" />
                </div>
                <div className="space-y-1">
                  <Label>النبذة</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="اكتب نبذة عنك..." rows={3} />
                </div>
                <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader><CardTitle>تغيير كلمة المرور</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>كلمة المرور الجديدة</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" />
              </div>
              <div className="space-y-1">
                <Label>تأكيد كلمة المرور</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="أعد كتابة كلمة المرور" />
              </div>
              <Button onClick={handleChangePassword} disabled={passwordLoading} variant="outline" className="gap-2">
                {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                تغيير كلمة المرور
              </Button>
            </CardContent>
          </Card>

          {/* User's Boards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" /> لوحاتي ({boards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {boards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">ماعندك لوحات لسه</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {boards.map(board => (
                    <BoardCard key={board.id} board={board} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
