import { useState } from 'react';
import { Post, usePosts, useLikes, useComments } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, MoreVertical, Trash2, FileText, Send, X, User, Pencil, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoEmbed } from '@/lib/videoEmbed';
import EditPostDialog from '@/components/EditPostDialog';
import LinkPreview from '@/components/LinkPreview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function PostLikes({ postId }: { postId: string }) {
  const { isLiked, count, toggleLike } = useLikes(postId);
  return (
    <button onClick={() => toggleLike.mutate()} className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} د`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `منذ ${diffHr} س`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `منذ ${diffDay} ي`;
  return date.toLocaleDateString('ar-SA');
}

function PostComments({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { comments, addComment, deleteComment } = useComments(postId);
  const { user } = useAuth();

  const handleAdd = async () => {
    if (!text.trim() || addComment.isPending) return;
    await addComment.mutateAsync(text.trim());
    setText('');
  };

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
        <MessageCircle className={`h-4 w-4 ${open ? 'fill-primary/20 text-primary' : ''}`} />
        {comments.length > 0 && <span>{comments.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3 border-t border-border pt-3"
          >
            <div className="space-y-3 max-h-52 overflow-y-auto mb-3 scrollbar-thin">
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">لا توجد تعليقات بعد</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2 group">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {c.profile?.avatar_url ? (
                      <img src={c.profile.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                    ) : (
                      <User className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{c.profile?.display_name || 'مستخدم'}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground/80 mt-0.5 break-words [overflow-wrap:anywhere]">{c.content}</p>
                  </div>
                  {c.user_id === user?.id && (
                    deleteConfirmId === c.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { deleteComment.mutate(c.id); setDeleteConfirmId(null); }}
                          className="text-[10px] text-destructive hover:underline"
                        >
                          حذف
                        </button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-[10px] text-muted-foreground hover:underline">
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
            {user ? (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <Input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="اكتب تعليق..."
                  className="text-sm h-8 flex-1"
                  maxLength={500}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAdd}
                  disabled={addComment.isPending || !text.trim()}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  {addComment.isPending ? (
                    <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">سجل دخول لإضافة تعليق</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
      <iframe src={embed.embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" loading="lazy" />
    </div>
  );
}

interface PostCardProps {
  post: Post;
  boardId: string;
}

export default function PostCard({ post, boardId }: PostCardProps) {
  const { deletePost } = usePosts(boardId);
  const { user } = useAuth();
  const isOwner = post.user_id === user?.id;
  const videoEmbed = post.link_url ? getVideoEmbed(post.link_url) : null;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const resolvedBackground = post.color?.toLowerCase() === '#ffffff'
    ? 'hsl(var(--card))'
    : (post.color || 'hsl(var(--card))');

  // Determine text color based on background brightness
  const getTextColorForBg = (hex: string | null | undefined): string | undefined => {
    if (!hex || hex.startsWith('hsl') || hex.toLowerCase() === '#ffffff') return undefined;
    const c = hex.replace('#', '');
    if (c.length !== 6) return undefined;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a1a' : '#f5f5f5';
  };

  const postTextColor = getTextColorForBg(post.color);

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success('تم حذف البوست');
    } catch { toast.error('حصل خطأ'); }
  };

  const handleCopyContent = () => {
    const textContent = post.content?.replace(/<[^>]*>/g, '') || '';
    navigator.clipboard.writeText(textContent);
    toast.success('تم نسخ المحتوى');
  };

  const handleCopyLink = () => {
    if (post.link_url) {
      navigator.clipboard.writeText(post.link_url);
      toast.success('تم نسخ الرابط');
    }
  };


  return (
    <>
      <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-xl border border-border shadow-sm overflow-hidden group"
        style={{ backgroundColor: resolvedBackground, color: postTextColor }}
      >
        {post.post_type === 'image' && post.file_url && (
          <img src={post.file_url} alt={post.content || ''} className="w-full max-h-64 object-cover" />
        )}
        {post.link_url && videoEmbed && <VideoEmbed url={post.link_url} />}

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              {post.profile?.avatar_url ? (
                <img src={post.profile.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
              ) : (
                <User className="h-3 w-3 text-primary" />
              )}
            </div>
            <span className="text-xs font-medium" style={{ color: postTextColor, opacity: 0.7 }}>{post.profile?.display_name || 'مستخدم'}</span>
            <span className="text-xs mr-auto" style={{ color: postTextColor, opacity: 0.5 }}>
              {new Date(post.created_at).toLocaleDateString('ar-SA')}
            </span>
          </div>

          {post.content && (
            <div
              className="text-sm mb-2 prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pr-4 [&>ol]:list-decimal [&>ol]:pr-4 break-words [overflow-wrap:anywhere]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {post.post_type === 'link' && post.link_url && !videoEmbed && (
            <LinkPreview url={post.link_url} />
          )}

          {post.post_type === 'file' && post.file_url && (
            <a href={post.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary text-sm hover:underline mb-2 break-words [overflow-wrap:anywhere]">
              <FileText className="h-4 w-4 shrink-0" /> <span className="min-w-0">{post.file_name || 'ملف مرفق'}</span>
            </a>
          )}

          <div className="flex items-start justify-between gap-3 mt-3 pt-2 border-t border-border/50 flex-nowrap">
            <div className="flex items-start gap-3 min-w-0">
              <PostLikes postId={post.id} />
              <PostComments postId={post.id} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel className="text-xs text-muted-foreground">خيارات المنشور</DropdownMenuLabel>

                {post.content && (
                  <DropdownMenuItem className="gap-2" onClick={handleCopyContent}>
                    <Copy className="h-4 w-4" /> نسخ المحتوى
                  </DropdownMenuItem>
                )}
                {post.link_url && (
                  <DropdownMenuItem className="gap-2" onClick={handleCopyLink}>
                    <ExternalLink className="h-4 w-4" /> نسخ الرابط
                  </DropdownMenuItem>
                )}
                {post.file_url && (
                  <DropdownMenuItem className="gap-2" onClick={() => window.open(post.file_url!, '_blank')}>
                    <ExternalLink className="h-4 w-4" /> فتح الملف
                  </DropdownMenuItem>
                )}

                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2" onClick={() => setEditOpen(true)}>
                      <Pencil className="h-4 w-4" /> تعديل المنشور
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="text-destructive focus:text-destructive gap-2">
                      <Trash2 className="h-4 w-4" /> حذف المنشور
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {isOwner && <EditPostDialog post={post} boardId={boardId} open={editOpen} onOpenChange={setEditOpen} />}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنشور</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
