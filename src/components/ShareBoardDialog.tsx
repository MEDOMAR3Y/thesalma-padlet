import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBoardShares } from '@/hooks/useBoardShares';
import { useBoards } from '@/hooks/useBoards';
import { Share2, Copy, UserPlus, Trash2, Globe, Lock, Check, ShieldBan } from 'lucide-react';
import { toast } from 'sonner';

interface ShareBoardDialogProps {
  boardId: string;
  currentVisibility: string;
}

export default function ShareBoardDialog({ boardId, currentVisibility }: ShareBoardDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [copied, setCopied] = useState(false);
  const { shares, addShare, removeShare, updatePermission, getShareLink } = useBoardShares(boardId);
  const { updateBoard } = useBoards();

  const handleCopyLink = async () => {
    try {
      const token = await getShareLink();
      const url = `${window.location.origin}/board/${boardId}?token=${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('تم نسخ الرابط!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('فشل نسخ الرابط');
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) return;
    try {
      await addShare.mutateAsync({ email: email.trim(), permission });
      setEmail('');
      toast.success('تم إرسال الدعوة!');
    } catch {
      toast.error('فشل إرسال الدعوة');
    }
  };

  const handleVisibilityChange = async (visibility: string) => {
    try {
      await updateBoard.mutateAsync({ id: boardId, visibility } as any);
      toast.success('تم تحديث الخصوصية');
    } catch {
      toast.error('فشل التحديث');
    }
  };

  const permissionLabels: Record<string, string> = {
    read: 'قراءة فقط',
    write: 'كتابة',
    admin: 'إدارة',
    blocked: '🚫 محظور',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          مشاركة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk']">مشاركة اللوحة</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-sm font-medium">الخصوصية</label>
            <Select value={currentVisibility} onValueChange={handleVisibilityChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> خاصة</span>
                </SelectItem>
                <SelectItem value="public">
                  <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> عامة</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">رابط المشاركة</label>
            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'تم النسخ!' : 'نسخ الرابط'}
              </Button>
            </div>
          </div>

          {/* Invite by Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">دعوة مستخدم</label>
            <div className="flex gap-2">
              <Input
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1"
                type="email"
              />
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">قراءة</SelectItem>
                  <SelectItem value="write">كتابة</SelectItem>
                  <SelectItem value="admin">إدارة</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} size="icon" disabled={addShare.isPending}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Shares */}
          {shares.filter(s => s.email || s.user_id).length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">المشاركون</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {shares.filter(s => s.email || s.user_id).map(share => (
                  <div key={share.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {(share.profile?.display_name || share.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{share.profile?.display_name || share.email}</p>
                        <Badge variant="secondary" className="text-xs">{permissionLabels[share.permission]}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        value={share.permission}
                        onValueChange={p => updatePermission.mutate({ id: share.id, permission: p })}
                      >
                        <SelectTrigger className="w-20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">قراءة</SelectItem>
                          <SelectItem value="write">كتابة</SelectItem>
                          <SelectItem value="admin">إدارة</SelectItem>
                          <SelectItem value="blocked">
                            <span className="flex items-center gap-1"><ShieldBan className="h-3 w-3" /> حظر</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeShare.mutate(share.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
