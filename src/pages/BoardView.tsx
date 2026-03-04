import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useBoardShares } from '@/hooks/useBoardShares';
import { Board } from '@/hooks/useBoards';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CreatePostDialog from '@/components/CreatePostDialog';
import BoardSettingsDialog from '@/components/BoardSettingsDialog';
import { ArrowRight, Layout, Grid3X3, Columns3, Network, Plus, UserCircle, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import PostCard from '@/components/PostCard';
import logo from '@/assets/logo.png';

const layoutIcons = { wall: Layout, grid: Grid3X3, column: Columns3, map: Network };

export default function BoardView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { shares } = useBoardShares(id!);

  // Auto-associate logged-in user with board shares by email
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      if (user.email) {
        await supabase
          .from('board_shares')
          .update({ user_id: user.id })
          .eq('board_id', id)
          .is('user_id', null)
          .ilike('email', user.email);
      }
    })();
  }, [user, id]);

  const userShare = shares.find(s => s.user_id === user?.id || (user?.email && s.email?.toLowerCase() === user.email.toLowerCase()));

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
        <Button asChild><Link to="/">الرئيسية</Link></Button>
      </div>
    );
  }

  const Icon = layoutIcons[board.layout];
  const isOwner = user?.id === board.user_id;
  const isBlocked = userShare?.permission === 'blocked';
  const hasWriteAccess = !isBlocked && (isOwner || userShare?.permission === 'write' || userShare?.permission === 'admin' || board.visibility === 'public');
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
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/"><img src={logo} alt="Logo" className="h-14 object-contain" /></Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-muted-foreground">{user.email}</span>
                <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="md:hidden" title="البروفايل">
                  <UserCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="md:hidden" title="خروج">
                  <LogOut className="h-5 w-5" />
                </Button>
                <Button variant="ghost" onClick={() => navigate('/profile')} className="hidden md:inline-flex gap-2">
                  <UserCircle className="h-4 w-4" /> البروفايل
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="hidden md:inline-flex gap-2">
                  <LogOut className="h-4 w-4" /> خروج
                </Button>
              </>
            ) : (
              <Button asChild variant="default" size="sm"><Link to="/auth/login">تسجيل دخول</Link></Button>
            )}
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-muted/30"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(user ? '/profile' : '/')} className="h-8 w-8">
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg font-bold font-['Space_Grotesk'] truncate max-w-[220px] sm:max-w-none">{board.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasAdminAccess && <BoardSettingsDialog board={board} />}
            {hasWriteAccess && user && <CreatePostDialog boardId={board.id} />}
          </div>
        </div>
      </motion.div>

      <main className="container mx-auto px-4 py-8">
        {board.description && <p className="text-muted-foreground mb-6 text-center">{board.description}</p>}

        {postsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-['Space_Grotesk']">اللوحة فاضية</h3>
            <p className="text-muted-foreground mb-4">أضف أول منشور في اللوحة</p>
            {hasWriteAccess && user && <CreatePostDialog boardId={board.id} />}
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
