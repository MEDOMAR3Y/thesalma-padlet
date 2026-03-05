import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Loader2, Copy, Check, UserPlus, Trash2, ShieldBan, Globe, Lock } from 'lucide-react';
import { useBoards, type Board } from '@/hooks/useBoards';
import { useBoardShares, type BoardShare } from '@/hooks/useBoardShares';
import { toast } from 'sonner';

interface BoardSettingsDialogProps {
  board: Board;
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function BoardSettingsDialog({ board }: BoardSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || '');
  const [layout, setLayout] = useState(board.layout);
  const [visibility, setVisibility] = useState(board.visibility);
  const [color, setColor] = useState(board.background_color || COLORS[0]);
  const { updateBoard } = useBoards();

  // Sharing
  const { shares, addShare, removeShare, updatePermission, getShareLink } = useBoardShares(board.id);
  const [identifier, setIdentifier] = useState('');
  const [permission, setPermission] = useState<BoardShare['permission']>('read');
  const [copied, setCopied] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('اكتب عنوان اللوحة');
      return;
    }

    try {
      await updateBoard.mutateAsync({
        id: board.id,
        title: title.trim(),
        description: description.trim() || null,
        layout,
        visibility,
        background_color: color,
      } as Partial<Board> & { id: string });
      toast.success('تم حفظ إعدادات اللوحة');
      setOpen(false);
    } catch {
      toast.error('فشل حفظ الإعدادات');
    }
  };

  const handleCopyLink = async () => {
    try {
      const shortPath = await getShareLink();
      const url = `${window.location.origin}${shortPath}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('تم نسخ رابط المشاركة!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('فشل نسخ الرابط');
    }
  };

  const handleInvite = async () => {
    if (!identifier.trim()) return;
    try {
      await addShare.mutateAsync({ identifier: identifier.trim(), permission });
      setIdentifier('');
      toast.success(permission === 'blocked' ? 'تم الحظر بنجاح' : 'تمت الإضافة بنجاح!');
    } catch (err: any) {
      if (err?.message === 'user_not_found') {
        toast.error('اسم المستخدم غير موجود');
        return;
      }
      toast.error('فشل تنفيذ العملية');
    }
  };

  const permissionLabels: Record<string, string> = {
    read: 'قراءة',
    write: 'كتابة',
    admin: 'إدارة',
    blocked: '🚫 محظور',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          إعدادات
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk']">إعدادات اللوحة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>العنوان</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>الوصف</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
          </div>

          {/* Layout & Visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>التخطيط</Label>
              <Select value={layout} onValueChange={v => setLayout(v as Board['layout'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wall">حائط</SelectItem>
                  <SelectItem value="grid">شبكة</SelectItem>
                  <SelectItem value="column">أعمدة</SelectItem>
                  <SelectItem value="map">خريطة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>الخصوصية</Label>
              <Select value={visibility} onValueChange={v => setVisibility(v as Board['visibility'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2"><Lock className="h-3 w-3" /> خاصة</span>
                  </SelectItem>
                  <SelectItem value="public">
                    <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> عامة (لأي شخص بالرابط)</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1">
            <Label>لون الخلفية</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-border'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={updateBoard.isPending}>
            {updateBoard.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التعديلات'}
          </Button>
        </form>

        {/* Sharing Section */}
        <div className="border-t border-border pt-5 mt-2 space-y-4">
          <h3 className="font-semibold font-['Space_Grotesk']">المشاركة</h3>

          {/* Copy Link */}
          <Button onClick={handleCopyLink} variant="outline" className="w-full gap-2">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? 'تم النسخ!' : 'نسخ رابط اللوحة'}
          </Button>

          {/* Invite / Block */}
          <div className="space-y-2">
            <Label>دعوة أو حظر مستخدم</Label>
            <div className="flex gap-2">
              <Input
                placeholder="username أو email@example.com"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="flex-1"
                dir="ltr"
              />
              <Select value={permission} onValueChange={v => setPermission(v as BoardShare['permission'])}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">قراءة</SelectItem>
                  <SelectItem value="write">كتابة</SelectItem>
                  <SelectItem value="admin">إدارة</SelectItem>
                  <SelectItem value="blocked">حظر</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} size="icon" disabled={addShare.isPending} type="button">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Shares List */}
          {shares.filter(s => s.email || s.user_id).length > 0 && (
            <div className="space-y-2">
              <Label>المشاركون</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {shares.filter(s => s.email || s.user_id).map(share => (
                  <div key={share.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {(share.profile?.display_name || share.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{share.profile?.display_name || share.email}</p>
                        <Badge variant="secondary" className="text-xs">{permissionLabels[share.permission]}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={share.permission} onValueChange={p => updatePermission.mutate({ id: share.id, permission: p as BoardShare['permission'] })}>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeShare.mutate(share.id)} type="button">
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
