import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useBoards } from '@/hooks/useBoards';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [layout, setLayout] = useState('wall');
  const { createBoard } = useBoards();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('اكتب عنوان اللوحة'); return; }
    try {
      await createBoard.mutateAsync({ title: title.trim(), description: description.trim() || undefined, background_color: color, layout });
      toast.success('تم إنشاء اللوحة!');
      setOpen(false);
      setTitle(''); setDescription(''); setColor(COLORS[0]); setLayout('wall');
    } catch {
      toast.error('حصل خطأ، حاول مرة ثانية');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-5 w-5 ml-2" /> لوحة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl">إنشاء لوحة جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="board-title">عنوان اللوحة</Label>
            <Input id="board-title" placeholder="مثلاً: أفكار المشروع" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board-desc">الوصف (اختياري)</Label>
            <Textarea id="board-desc" placeholder="وصف مختصر للوحة..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>شكل العرض</Label>
            <Select value={layout} onValueChange={setLayout}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wall">حائط (Wall)</SelectItem>
                <SelectItem value="grid">شبكة (Grid)</SelectItem>
                <SelectItem value="column">أعمدة (Column)</SelectItem>
                <SelectItem value="map">خريطة ذهنية (Map)</SelectItem>
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
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={createBoard.isPending}>
            {createBoard.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'أنشئ اللوحة'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
