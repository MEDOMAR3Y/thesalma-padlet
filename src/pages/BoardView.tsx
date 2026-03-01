import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { ArrowRight, Layout, Grid3X3, Columns3, Network, Settings, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

const layoutIcons = { wall: Layout, grid: Grid3X3, column: Columns3, map: Network };

export default function BoardView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shares } = useBoardShares(id!);

  const userShare = shares.find(s => s.user_id === user?.id);
  const hasWriteAccess = userShare?.permission === 'write' || userShare?.permission === 'admin';

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
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border" style={{ backgroundColor: `${board.background_color}20` }}>
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-bold font-['Space_Grotesk'] truncate max-w-[200px] sm:max-w-none">{board.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {(isOwner || userShare?.permission === 'admin') && <ShareBoardDialog boardId={board.id} currentVisibility={board.visibility} />}
            {(isOwner || hasWriteAccess) && <CreatePostDialog boardId={board.id} />}
          </div>
        </div>
      </header>

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
            {isOwner && <CreatePostDialog boardId={board.id} />}
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
