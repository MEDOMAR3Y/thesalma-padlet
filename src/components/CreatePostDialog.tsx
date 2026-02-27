import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Loader2, Type, Image, Link2, FileUp } from 'lucide-react';
import { usePosts, uploadPostFile } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const POST_COLORS = ['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#f3e8ff', '#fed7d7', '#e0e7ff'];

interface CreatePostDialogProps {
  boardId: string;
  trigger?: React.ReactNode;
}

export default function CreatePostDialog({ boardId, trigger }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('text');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [color, setColor] = useState(POST_COLORS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { createPost } = usePosts(boardId);
  const { user } = useAuth();

  const reset = () => {
    setContent(''); setLinkUrl(''); setColor(POST_COLORS[0]); setFile(null); setTab('text');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'text' && !content.trim()) { toast.error('اكتب محتوى البوست'); return; }
    if (tab === 'link' && !linkUrl.trim()) { toast.error('أدخل الرابط'); return; }
    if ((tab === 'image' || tab === 'file') && !file) { toast.error('اختار ملف'); return; }

    setLoading(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;
      if (file && user) {
        fileUrl = await uploadPostFile(file, user.id);
        fileName = file.name;
      }
      await createPost.mutateAsync({
        board_id: boardId,
        content: content.trim() || null,
        post_type: tab as any,
        color,
        link_url: tab === 'link' ? linkUrl.trim() : null,
        file_url: fileUrl ?? null,
        file_name: fileName ?? null,
      });
      toast.success('تم إضافة البوست!');
      setOpen(false);
      reset();
    } catch {
      toast.error('حصل خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-5 w-5 ml-2" /> إضافة بوست
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl">إضافة بوست جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="text" className="flex gap-1"><Type className="h-4 w-4" /> نص</TabsTrigger>
              <TabsTrigger value="image" className="flex gap-1"><Image className="h-4 w-4" /> صورة</TabsTrigger>
              <TabsTrigger value="link" className="flex gap-1"><Link2 className="h-4 w-4" /> رابط</TabsTrigger>
              <TabsTrigger value="file" className="flex gap-1"><FileUp className="h-4 w-4" /> ملف</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-3 mt-3">
              <Textarea placeholder="اكتب محتوى البوست..." value={content} onChange={e => setContent(e.target.value)} rows={4} />
            </TabsContent>

            <TabsContent value="image" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label>اختار صورة</Label>
                <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                {file && <p className="text-sm text-muted-foreground">{file.name}</p>}
              </div>
              <Textarea placeholder="وصف الصورة (اختياري)..." value={content} onChange={e => setContent(e.target.value)} rows={2} />
            </TabsContent>

            <TabsContent value="link" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label>الرابط</Label>
                <Input type="url" placeholder="https://example.com" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} dir="ltr" />
              </div>
              <Textarea placeholder="وصف الرابط (اختياري)..." value={content} onChange={e => setContent(e.target.value)} rows={2} />
            </TabsContent>

            <TabsContent value="file" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label>اختار ملف</Label>
                <Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                {file && <p className="text-sm text-muted-foreground">{file.name}</p>}
              </div>
              <Textarea placeholder="وصف الملف (اختياري)..." value={content} onChange={e => setContent(e.target.value)} rows={2} />
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>لون البوست</Label>
            <div className="flex gap-2 flex-wrap">
              {POST_COLORS.map(c => (
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

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'أضف البوست'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
