import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Image, FileUp, X, Video } from 'lucide-react';
import { usePosts, uploadPostFile } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { isVideoUrl } from '@/lib/videoEmbed';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import ColorPicker from '@/components/ColorPicker';

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

  const reset = () => {
    setContent('');
    setLinkUrl('');
    setColor(POST_COLORS[0]);
    setFile(null);
    setFileType(null);
    setShowLinkInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedLink = linkUrl.trim();
    const normalizedLink = trimmedLink
      ? (/^https?:\/\//i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`)
      : '';

    // Strip HTML tags to check if there's actual content
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    if (!textContent && !file && !normalizedLink) {
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
        content: textContent ? content : null,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl">إضافة منشور جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="اكتب محتوى المنشور... حدد نص واضغط على الأزرار للتنسيق"
          />

          {/* Attachments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm text-muted-foreground">أضف:</Label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1 h-8" asChild>
                  <span><Image className="h-3.5 w-3.5" /> صورة</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => { setFile(e.target.files?.[0] ?? null); setFileType('image'); }} />
              </label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1 h-8" asChild>
                  <span><FileUp className="h-3.5 w-3.5" /> ملف</span>
                </Button>
                <input type="file" className="hidden" onChange={e => { setFile(e.target.files?.[0] ?? null); setFileType('file'); }} />
              </label>
              <Button type="button" variant="outline" size="sm" className="gap-1 h-8" onClick={() => setShowLinkInput(!showLinkInput)}>
                <Video className="h-3.5 w-3.5" /> رابط / فيديو
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
                  placeholder="youtube.com/watch?v=... أو أي رابط"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  dir="ltr"
                  className="flex-1 h-9"
                />
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {linkUrl && isVideoUrl(/^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`) && (
              <p className="text-xs text-primary">✓ سيتم تضمين الفيديو تلقائياً</p>
            )}
          </div>

          <ColorPicker color={color} onChange={setColor} label="لون المنشور" />

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'نشر'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
