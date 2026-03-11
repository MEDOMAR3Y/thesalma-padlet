import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Image, FileUp, X, Trash2, Video } from 'lucide-react';
import { Post, usePosts, uploadPostFile } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { isVideoUrl } from '@/lib/videoEmbed';
import { toast } from 'sonner';
import RichTextEditor from '@/components/RichTextEditor';
import ColorPicker from '@/components/ColorPicker';

interface EditPostDialogProps {
  post: Post;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditPostDialog({ post, boardId, open, onOpenChange }: EditPostDialogProps) {
  const [content, setContent] = useState(post.content || '');
  const [linkUrl, setLinkUrl] = useState(post.link_url || '');
  const [color, setColor] = useState(post.color || '#ffffff');
  const [loading, setLoading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(!!post.link_url);
  const { updatePost } = usePosts(boardId);
  const { user } = useAuth();

  // File management
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFileType, setNewFileType] = useState<'image' | 'file' | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  const currentFileUrl = removeFile ? null : post.file_url;
  const hasFile = !!currentFileUrl || !!newFile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const textContent = content.replace(/<[^>]*>/g, '').trim();

      const trimmedLink = linkUrl.trim();
      const normalizedLink = trimmedLink
        ? (/^https?:\/\//i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`)
        : '';

      let file_url: string | null | undefined = undefined;
      let file_name: string | null | undefined = undefined;
      let post_type: Post['post_type'] | undefined = undefined;

      // Handle file changes
      if (newFile && user) {
        const uploadedUrl = await uploadPostFile(newFile, user.id);
        file_url = uploadedUrl;
        file_name = newFile.name;
        post_type = newFileType === 'image' ? 'image' as const : 'file' as const;
      } else if (removeFile) {
        file_url = null;
        file_name = null;
        post_type = normalizedLink ? 'link' as const : 'text' as const;
      }

      await updatePost.mutateAsync({
        id: post.id,
        content: textContent ? content : null,
        color,
        link_url: normalizedLink || null,
        ...(file_url !== undefined ? { file_url } : {}),
        ...(file_name !== undefined ? { file_name } : {}),
        ...(post_type !== undefined ? { post_type } : {}),
      });
      toast.success('تم تعديل المنشور');
      onOpenChange(false);
    } catch {
      toast.error('حصل خطأ أثناء التعديل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-['Space_Grotesk'] text-xl">تعديل المنشور</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="محتوى المنشور..."
          />

          {/* Attachments section - matching CreatePostDialog style */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm text-muted-foreground">{hasFile ? 'استبدال:' : 'أضف:'}</Label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1 h-8" asChild>
                  <span><Image className="h-3.5 w-3.5" /> صورة</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setNewFile(f); setNewFileType('image'); setRemoveFile(false); }
                }} />
              </label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1 h-8" asChild>
                  <span><FileUp className="h-3.5 w-3.5" /> ملف</span>
                </Button>
                <input type="file" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setNewFile(f); setNewFileType('file'); setRemoveFile(false); }
                }} />
              </label>
              <Button type="button" variant="outline" size="sm" className="gap-1 h-8" onClick={() => setShowLinkInput(!showLinkInput)}>
                <Video className="h-3.5 w-3.5" /> رابط / فيديو
              </Button>
            </div>

            {/* Current file */}
            {currentFileUrl && !newFile && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                {post.post_type === 'image' ? <Image className="h-4 w-4 text-primary" /> : <FileUp className="h-4 w-4 text-primary" />}
                <span className="flex-1 truncate">{post.file_name || 'مرفق حالي'}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setRemoveFile(true)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* New file preview */}
            {newFile && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                {newFileType === 'image' ? <Image className="h-4 w-4 text-primary" /> : <FileUp className="h-4 w-4 text-primary" />}
                <span className="flex-1 truncate">{newFile.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setNewFile(null); setNewFileType(null); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Link input */}
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

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التعديلات'}
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
