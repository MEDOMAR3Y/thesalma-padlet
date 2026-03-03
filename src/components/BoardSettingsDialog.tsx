import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Loader2 } from 'lucide-react';
import { useBoards, type Board } from '@/hooks/useBoards';
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          إعدادات اللوحة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk']">تعديل اللوحة</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label>الخصوصية</Label>
            <Select value={visibility} onValueChange={v => setVisibility(v as Board['visibility'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">خاصة</SelectItem>
                <SelectItem value="public">عامة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
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
      </DialogContent>
    </Dialog>
  );
}
