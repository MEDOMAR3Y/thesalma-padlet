import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Image, FileUp, Bold, Italic, Underline, List, X, Video } from 'lucide-react';
import { usePosts, uploadPostFile } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { isVideoUrl } from '@/lib/videoEmbed';
import { toast } from 'sonner';

const POST_COLORS = ['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#f3e8ff', '#fed7d7', '#e0e7ff'];

interface CreatePostDialogProps {
  boardId: string;
  trigger?: React.ReactNode;
}

export default function CreatePostDialog({ boardId, trigger }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [color, setColor] = useState(POST_COLORS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'file' | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createPost } = usePosts(boardId);
  const { user } = useAuth();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setContent('');
    setLinkUrl('');
    setColor(POST_COLORS[0]);
    setFile(null);
    setFileType(null);
    setShowLinkInput(false);
  };

  const insertFormat = (prefix: string, suffix: string) => {
    const ta = textRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedLink = linkUrl.trim();
    const normalizedLink = trimmedLink
      ? (/^https?:\/\//i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`)
      : '';

    if (!content.trim() && !file && !normalizedLink) {
      toast.error('أضف محتوى للمنشور');
      return;
    }

    setLoading(true);
    try {
      let fileUrl: string | undefined;
      let fileName: string | undefined;

      if (file && user) {
        fileUrl = await uploadPostFile(file, user.id);
        fileName = file.name;
      }

      const postType = file
        ? (fileType === 'image' ? 'image' : 'file')
        : normalizedLink
          ? 'link'
          : 'text';

      await createPost.mutateAsync({
        board_id: boardId,
        content: content.trim() || null,
        post_type: postType as any,
        color,
        link_url: normalizedLink || null,
        file_url: fileUrl ?? null,
        file_name: fileName ?? null,
      });

      toast.success('تم إضافة المنشور!');
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.message || 'حصل خطأ أثناء النشر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-5 w-5" /> إضافة منشور
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl">إضافة منشور جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-muted/30">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('**', '**')} title="عريض">
              <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('*', '*')} title="مائل">
              <Italic className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('__', '__')} title="تحته خط">
              <Underline className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('\n- ', '')} title="قائمة">
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            ref={textRef}
            placeholder="اكتب محتوى المنشور..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            className="resize-none"
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm text-muted-foreground">أضف:</Label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
                  <span><Image className="h-4 w-4" /> صورة</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => { setFile(e.target.files?.[0] ?? null); setFileType('image'); }} />
              </label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
                  <span><FileUp className="h-4 w-4" /> ملف</span>
                </Button>
                <input type="file" className="hidden" onChange={e => { setFile(e.target.files?.[0] ?? null); setFileType('file'); }} />
              </label>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setShowLinkInput(!showLinkInput)}>
                <Video className="h-4 w-4" /> رابط / فيديو
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                {fileType === 'image' ? <Image className="h-4 w-4 text-primary" /> : <FileUp className="h-4 w-4 text-primary" />}
                <span className="flex-1 truncate">{file.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); setFileType(null); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {showLinkInput && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="youtube.com/watch?v=... أو tiktok.com/..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  dir="ltr"
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {linkUrl && isVideoUrl(/^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`) && (
              <p className="text-xs text-primary">✓ سيتم تضمين الفيديو تلقائياً</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>لون المنشور</Label>
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'نشر'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

