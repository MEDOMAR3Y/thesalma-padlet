import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Image, FileUp, X, Trash2 } from 'lucide-react';
import { Post, usePosts, uploadPostFile } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
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
  const { updatePost } = usePosts(boardId);
  const { user } = useAuth();

  // File management
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFileType, setNewFileType] = useState<'image' | 'file' | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  const currentFileUrl = removeFile ? null : (post.file_url);
  const hasFile = !!currentFileUrl || !!newFile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      
      let file_url: string | null | undefined = undefined;
      let file_name: string | null | undefined = undefined;
      let post_type: string | undefined = undefined;

      // Handle file changes
      if (newFile && user) {
        const uploadedUrl = await uploadPostFile(newFile, user.id);
        file_url = uploadedUrl;
        file_name = newFile.name;
        post_type = newFileType === 'image' ? 'image' : 'file';
      } else if (removeFile) {
        file_url = null;
        file_name = null;
        // Determine new type based on remaining content
        post_type = linkUrl.trim() ? 'link' as const : 'text' as const;
      }

      await updatePost.mutateAsync({
        id: post.id,
        content: textContent ? content : null,
        color,
        link_url: linkUrl.trim() || null,
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

          {/* Link */}
          <div className="space-y-1">
            <Label className="text-sm">الرابط</Label>
            <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." dir="ltr" />
          </div>

          {/* Current file / image */}
          {currentFileUrl && !newFile && (
            <div className="space-y-1">
              <Label className="text-sm">المرفق الحالي</Label>
              <div className="relative rounded-lg border border-border overflow-hidden">
                {post.post_type === 'image' ? (
                  <img src={currentFileUrl} alt="" className="w-full max-h-32 object-cover" />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30">
                    <FileUp className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{post.file_name || 'ملف مرفق'}</span>
                  </div>
                )}
                <Button type="button" variant="destructive" size="icon" className="absolute top-1 left-1 h-6 w-6"
                  onClick={() => setRemoveFile(true)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* New file preview */}
          {newFile && (
            <div className="space-y-1">
              <Label className="text-sm">المرفق الجديد</Label>
              <div className="relative rounded-lg border border-border overflow-hidden">
                {newFileType === 'image' ? (
                  <img src={URL.createObjectURL(newFile)} alt="" className="w-full max-h-32 object-cover" />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/30">
                    <FileUp className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{newFile.name}</span>
                  </div>
                )}
                <Button type="button" variant="destructive" size="icon" className="absolute top-1 left-1 h-6 w-6"
                  onClick={() => { setNewFile(null); setNewFileType(null); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Add/replace file buttons */}
          {!newFile && (
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-sm text-muted-foreground">{hasFile ? 'استبدال:' : 'إضافة مرفق:'}</Label>
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
            </div>
          )}

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
