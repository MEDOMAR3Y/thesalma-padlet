import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { Button } from '@/components/ui/button';
import { LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateBoardDialog from '@/components/CreateBoardDialog';
import BoardCard from '@/components/BoardCard';
import { Skeleton } from '@/components/ui/skeleton';
import ThemeToggle from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { boards, isLoading } = useBoards();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            The Salma Padlet
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <h2 className="text-3xl font-bold font-['Space_Grotesk']">لوحاتي</h2>
          <CreateBoardDialog />
        </motion.div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden">
                <Skeleton className="h-24 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 font-['Space_Grotesk']">ماعندك لوحات لسه</h3>
            <p className="text-muted-foreground mb-6">ابدأ بإنشاء أول لوحة إبداعية لك</p>
            <CreateBoardDialog />
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards.map((board, i) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <BoardCard board={board} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
