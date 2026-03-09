import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Image, FileUp, X, Video } from 'lucide-react';
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
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'file' | null>(
    post.post_type === 'image' ? 'image' : post.post_type === 'file' ? 'file' : null
  );
  const [removeFile, setRemoveFile] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(!!post.link_url);
  const [loading, setLoading] = useState(false);
  const { updatePost } = usePosts(boardId);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      const trimmedLink = linkUrl.trim();
      const normalizedLink = trimmedLink
        ? (/^https?:\/\//i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`)
        : '';

      let fileUrl: string | null | undefined = undefined;
      let fileName: string | null | undefined = undefined;

      if (removeFile) {
        fileUrl = null;
        fileName = null;
      } else if (file && user) {
        fileUrl = await uploadPostFile(file, user.id);
        fileName = file.name;
      }

      // Determine post type
      let postType: string | undefined;
      if (file) {
        postType = fileType === 'image' ? 'image' : 'file';
      } else if (removeFile && normalizedLink) {
        postType = 'link';
      } else if (removeFile) {
        postType = 'text';
      } else if (normalizedLink && !post.file_url) {
        postType = 'link';
      }

      await updatePost.mutateAsync({
        id: post.id,
        content: textContent ? content : null,
        color,
        link_url: normalizedLink || null,
        ...(fileUrl !== undefined ? { file_url: fileUrl, file_name: fileName } : {}),
        ...(postType ? { post_type: postType as any } : {}),
      });
      toast.success('تم تعديل المنشور');
      onOpenChange(false);
    } catch {
      toast.error('حصل خطأ أثناء التعديل');
    } finally {
      setLoading(false);
    }
  };

  const currentFileUrl = removeFile ? null : (file ? URL.createObjectURL(file) : post.file_url);

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

          {/* Attachments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm text-muted-foreground">مرفقات:</Label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1 h-8" asChild>
                  <span><Image className="h-3.5 w-3.5" /> صورة</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setFileType('image'); setRemoveFile(false); }
                }} />
              </label>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="gap-1 h-8" asChild>
                  <span><FileUp className="h-3.5 w-3.5" /> ملف</span>
                </Button>
                <input type="file" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setFileType('file'); setRemoveFile(false); }
                }} />
              </label>
              <Button type="button" variant="outline" size="sm" className="gap-1 h-8" onClick={() => setShowLinkInput(!showLinkInput)}>
                <Video className="h-3.5 w-3.5" /> رابط / فيديو
              </Button>
            </div>

            {/* Current or new file preview */}
            {currentFileUrl && !removeFile && (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {(fileType === 'image' || post.post_type === 'image') && !file ? (
                  <img src={currentFileUrl} alt="" className="w-full max-h-32 object-cover" />
                ) : file && fileType === 'image' ? (
                  <img src={currentFileUrl} alt="" className="w-full max-h-32 object-cover" />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 text-sm">
                    <FileUp className="h-4 w-4 text-primary" />
                    <span className="flex-1 truncate">{file?.name || post.file_name}</span>
                  </div>
                )}
                <Button type="button" variant="destructive" size="icon" className="absolute top-1 left-1 h-6 w-6" onClick={() => { setRemoveFile(true); setFile(null); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {file && !removeFile && (
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
