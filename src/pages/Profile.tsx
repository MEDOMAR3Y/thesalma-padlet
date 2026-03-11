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
import { Camera, Loader2, Save, Layout, UserCircle, LogOut, AtSign, Check, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';
import BoardCard from '@/components/BoardCard';
import CreateBoardDialog from '@/components/CreateBoardDialog';
import logo from '@/assets/logo.png';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { boards } = useBoards();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [originalUsername, setOriginalUsername] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || '');
          setUsername((data as any).username || '');
          setOriginalUsername((data as any).username || '');
        }
      });
  }, [user]);

  // Check username availability
  useEffect(() => {
    if (!username || username === originalUsername) {
      setUsernameStatus('idle');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username' as any, username)
        .neq('user_id', user?.id || '')
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timeout);
  }, [username, originalUsername, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (usernameStatus === 'taken') { toast.error('اسم المستخدم محجوز'); return; }
    if (usernameStatus === 'invalid') { toast.error('اسم المستخدم لازم يكون 3-20 حرف (أحرف إنجليزية، أرقام، _)'); return; }

    setLoading(true);
    try {
      const finalDisplayName = displayName.trim() || username.trim() || null;
      // Validate display name matches username (case-insensitive)
      if (finalDisplayName && username && finalDisplayName.toLowerCase() !== username.toLowerCase()) {
        toast.error('الاسم المعروض لازم يكون نفس اسم المستخدم (تغيير الأحرف الكبيرة/الصغيرة فقط)');
        setLoading(false);
        return;
      }
      const profileData: any = {
        display_name: finalDisplayName,
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        username: username.trim() || null,
      };

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('profiles').update(profileData).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').insert({ ...profileData, user_id: user.id });
        if (error) throw error;
      }
      setOriginalUsername(username.trim());
      toast.success('تم حفظ البروفايل!');
    } catch (err: any) {
      if (err?.message?.includes('profiles_username_unique')) {
        toast.error('اسم المستخدم محجوز');
      } else {
        toast.error('حصل خطأ أثناء الحفظ');
      }
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
      setAvatarUrl(data.publicUrl);
      const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (existing) {
        await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('user_id', user.id);
      } else {
        await supabase.from('profiles').insert({ user_id: user.id, avatar_url: data.publicUrl });
      }
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
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'فشل تغيير كلمة المرور');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/"><img src={logo} alt="Logo" className="h-14 object-contain" /></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="md:hidden" title="البروفايل">
              <UserCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="md:hidden" title="خروج">
              <LogOut className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="hidden md:inline-flex gap-2">
              <UserCircle className="h-4 w-4" /> البروفايل
            </Button>
            <Button variant="ghost" onClick={handleSignOut} className="hidden md:inline-flex gap-2">
              <LogOut className="h-4 w-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>البروفايل</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">{displayName?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    {avatarLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div>
                  <p className="font-semibold text-lg">{displayName || 'بدون اسم'}</p>
                  {username && <p className="text-sm text-muted-foreground">@{username}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1.5">
                    <AtSign className="h-3.5 w-3.5" /> اسم المستخدم (Username)
                  </Label>
                  <div className="relative">
                    <Input
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
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
                <div className="space-y-1">
                  <Label>الاسم المعروض (Display Name)</Label>
                  <Input
                    value={displayName}
                    onChange={e => {
                      const val = e.target.value;
                      // Only allow capitalization changes of the username
                      if (username && val.toLowerCase() === username.toLowerCase()) {
                        setDisplayName(val);
                      } else if (!val) {
                        setDisplayName('');
                      }
                    }}
                    placeholder={username || 'اسمك'}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">يمكنك تغيير الأحرف الكبيرة والصغيرة فقط (مثال: {username ? `${username} → ${username.charAt(0).toUpperCase()}${username.slice(1)}` : 'ahmed → Ahmed'})</p>
                </div>
                <div className="space-y-1">
                  <Label>النبذة</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="اكتب نبذة عنك..." rows={3} />
                </div>
                <Button onClick={handleSaveProfile} disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
                </Button>
              </div>
            </CardContent>
          </Card>

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
                {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} تغيير كلمة المرور
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Layout className="h-5 w-5" /> لوحاتي ({boards.length})</span>
                <CreateBoardDialog />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {boards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">ماعندك لوحات لسه</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {boards.map(board => <BoardCard key={board.id} board={board} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
