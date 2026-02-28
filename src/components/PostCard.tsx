import { useState } from 'react';
import { Post, usePosts, useLikes, useComments } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, MoreVertical, Trash2, Edit, ExternalLink, FileText, Send, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function PostLikes({ postId }: { postId: string }) {
  const { isLiked, count, toggleLike } = useLikes(postId);
  return (
    <button onClick={() => toggleLike.mutate()} className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

function PostComments({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const { comments, addComment, deleteComment } = useComments(postId);
  const { user } = useAuth();

  const handleAdd = async () => {
    if (!text.trim()) return;
    await addComment.mutateAsync(text.trim());
    setText('');
  };

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm hover:text-primary transition-colors">
        <MessageCircle className="h-4 w-4" />
        {comments.length > 0 && <span>{comments.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 border-t border-border pt-3">
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{c.profile?.display_name || 'مستخدم'}</span>
                    <span className="text-muted-foreground mr-1">{c.content}</span>
                  </div>
                  {c.user_id === user?.id && (
                    <button onClick={() => deleteComment.mutate(c.id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="أضف تعليق..." className="text-sm h-8" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              <Button size="sm" variant="ghost" onClick={handleAdd} disabled={addComment.isPending} className="h-8 px-2">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PostCardProps {
  post: Post;
  boardId: string;
}

export default function PostCard({ post, boardId }: PostCardProps) {
  const { deletePost } = usePosts(boardId);

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success('تم حذف البوست');
    } catch { toast.error('حصل خطأ'); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-border shadow-sm overflow-hidden group"
      style={{ backgroundColor: post.color }}
    >
      {/* Image */}
      {post.post_type === 'image' && post.file_url && (
        <img src={post.file_url} alt={post.content || ''} className="w-full max-h-64 object-cover" />
      )}

      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            {post.profile?.avatar_url ? (
              <img src={post.profile.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
            ) : (
              <User className="h-3 w-3 text-primary" />
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{post.profile?.display_name || 'مستخدم'}</span>
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-foreground text-sm whitespace-pre-wrap mb-2">{post.content}</p>
        )}

        {/* Link */}
        {post.post_type === 'link' && post.link_url && (
          <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary text-sm hover:underline mb-2 break-all">
            <ExternalLink className="h-4 w-4 shrink-0" /> {post.link_url}
          </a>
        )}

        {/* File */}
        {post.post_type === 'file' && post.file_url && (
          <a href={post.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary text-sm hover:underline mb-2">
            <FileText className="h-4 w-4 shrink-0" /> {post.file_name || 'ملف مرفق'}
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <PostLikes postId={post.id} />
            <PostComments postId={post.id} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 ml-2" /> حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
