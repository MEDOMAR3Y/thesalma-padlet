import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Board } from '@/hooks/useBoards';
import { Layout, Grid3X3, Columns3, Network, MoreVertical, Trash2, Archive, Settings, Copy, Globe, Lock, Eye, Pencil } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBoards } from '@/hooks/useBoards';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { encodeBoardId } from '@/lib/shortBoardId';
import BoardSettingsDialog from '@/components/BoardSettingsDialog';
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

const layoutIcons = { wall: Layout, grid: Grid3X3, column: Columns3, map: Network };
const layoutLabels = { wall: 'حائط', grid: 'شبكة', column: 'أعمدة', map: 'خريطة' };

export default function BoardCard({ board }: { board: Board }) {
  const { deleteBoard, updateBoard } = useBoards();
  const navigate = useNavigate();
  const Icon = layoutIcons[board.layout];
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteBoard.mutateAsync(board.id);
      toast.success('تم حذف اللوحة');
    } catch { toast.error('حصل خطأ'); }
  };

  const handleArchive = async () => {
    try {
      await updateBoard.mutateAsync({ id: board.id, is_archived: true });
      toast.success('تم أرشفة اللوحة');
    } catch { toast.error('حصل خطأ'); }
  };

  const handleCopyLink = async () => {
    const shortLink = `${window.location.origin}/b/${encodeBoardId(board.id)}`;
    await navigator.clipboard.writeText(shortLink);
    toast.success('تم نسخ الرابط');
  };

  const handleToggleVisibility = async () => {
    const newVisibility = board.visibility === 'public' ? 'private' : 'public';
    try {
      await updateBoard.mutateAsync({ id: board.id, visibility: newVisibility } as any);
      toast.success(newVisibility === 'public' ? 'اللوحة أصبحت عامة' : 'اللوحة أصبحت خاصة');
    } catch { toast.error('حصل خطأ'); }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate(`/board/${board.id}`)}
        className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div className="h-24 relative" style={{ backgroundColor: board.background_color }}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            <Icon className="h-3 w-3" />
            {layoutLabels[board.layout]}
          </div>
          <div className="absolute top-2 left-3">
            {board.visibility === 'public' ? (
              <div className="bg-black/30 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                <Globe className="h-3 w-3" /> عامة
              </div>
            ) : (
              <div className="bg-black/30 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                <Lock className="h-3 w-3" /> خاصة
              </div>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold font-['Space_Grotesk'] text-lg truncate">{board.title}</h3>
              {board.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{board.description}</p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onClick={e => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => navigate(`/board/${board.id}`)}>
                  <Eye className="h-4 w-4 ml-2" /> فتح اللوحة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSettingsOpen(true); }}>
                  <Settings className="h-4 w-4 ml-2" /> إعدادات اللوحة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 ml-2" /> نسخ الرابط
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleToggleVisibility}>
                  {board.visibility === 'public' ? (
                    <><Lock className="h-4 w-4 ml-2" /> جعلها خاصة</>
                  ) : (
                    <><Globe className="h-4 w-4 ml-2" /> جعلها عامة</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 ml-2" /> أرشفة
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 ml-2" /> حذف اللوحة
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {new Date(board.updated_at).toLocaleDateString('ar-SA')}
          </p>
        </div>
      </motion.div>

      <BoardSettingsDialog board={board} externalOpen={settingsOpen} onExternalOpenChange={setSettingsOpen} />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف اللوحة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف "{board.title}"؟ سيتم حذف جميع المنشورات والتعليقات. لا يمكن التراجع.</AlertDialogDescription>
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
