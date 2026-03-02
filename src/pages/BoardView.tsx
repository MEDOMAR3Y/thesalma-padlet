import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useBoardShares } from '@/hooks/useBoardShares';
import { Board } from '@/hooks/useBoards';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CreatePostDialog from '@/components/CreatePostDialog';
import PostCard from '@/components/PostCard';
import ShareBoardDialog from '@/components/ShareBoardDialog';
import { ArrowRight, Layout, Grid3X3, Columns3, Network, Plus, Settings, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';

const layoutIcons = { wall: Layout, grid: Grid3X3, column: Columns3, map: Network };

export default function BoardView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shares } = useBoardShares(id!);
  const token = searchParams.get('token');

  // Token-based access: associate token with user
  useEffect(() => {
    if (!token || !user || !id) return;
    (async () => {
      // Find the share by token
      const { data: share } = await supabase
        .from('board_shares')
        .select('*')
        .eq('board_id', id)
        .eq('share_token', token)
        .maybeSingle();
      
      if (share && !share.user_id) {
        // Associate this share with the current user
        await supabase.from('board_shares')
          .update({ user_id: user.id, email: user.email })
          .eq('id', share.id);
      } else if (share && share.user_id !== user.id) {
        // Create a new share for this user with same permission
        const { data: existing } = await supabase
          .from('board_shares')
          .select('id')
          .eq('board_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!existing) {
          await supabase.from('board_shares').insert({
            board_id: id,
            user_id: user.id,
            email: user.email,
            permission: share.permission,
          });
        }
      }
    })();
  }, [token, user, id]);

  const userShare = shares.find(s => s.user_id === user?.id);

  const boardQuery = useQuery({
    queryKey: ['board', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('boards').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Board;
    },
    enabled: !!id,
  });

  const { posts, isLoading: postsLoading } = usePosts(id!);
  const board = boardQuery.data;

  if (boardQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4" dir="rtl">
        <p className="text-xl text-muted-foreground">اللوحة غير موجودة</p>
        <Button asChild><Link to="/dashboard">رجوع للداشبورد</Link></Button>
      </div>
    );
  }

  const Icon = layoutIcons[board.layout];
  const isOwner = user?.id === board.user_id;
  const hasWriteAccess = isOwner || userShare?.permission === 'write' || userShare?.permission === 'admin';
  const hasAdminAccess = isOwner || userShare?.permission === 'admin';

  const getLayoutClasses = () => {
    switch (board.layout) {
      case 'grid': return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
      case 'column': return 'flex flex-col max-w-xl mx-auto gap-4';
      case 'map': return 'grid grid-cols-2 lg:grid-cols-3 gap-6';
      case 'wall': default: return 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4';
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Minimal Header - Logo + Theme Only */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/dashboard"><img src={logo} alt="Logo" className="h-9 object-contain" /></Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Board Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50"
        style={{ backgroundColor: `${board.background_color}10` }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8">
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-bold font-['Space_Grotesk'] truncate max-w-[200px] sm:max-w-none">{board.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasAdminAccess && <ShareBoardDialog boardId={board.id} currentVisibility={board.visibility} />}
            {hasWriteAccess && <CreatePostDialog boardId={board.id} />}
          </div>
        </div>
      </motion.div>

      {/* Board Content */}
      <main className="container mx-auto px-4 py-8">
        {board.description && (
          <p className="text-muted-foreground mb-6 text-center">{board.description}</p>
        )}

        {postsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-['Space_Grotesk']">اللوحة فاضية</h3>
            <p className="text-muted-foreground mb-4">أضف أول بوست على هذي اللوحة</p>
            {hasWriteAccess && <CreatePostDialog boardId={board.id} />}
          </div>
        ) : (
          <div className={getLayoutClasses()}>
            <AnimatePresence>
              {posts.map(post => (
                <div key={post.id} className={board.layout === 'wall' ? 'break-inside-avoid' : ''}>
                  <PostCard post={post} boardId={board.id} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
