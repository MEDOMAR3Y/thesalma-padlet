import { Board } from '@/hooks/useBoards';
import { Layout, Grid3X3, Columns3, Network, MoreVertical, Trash2, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBoards } from '@/hooks/useBoards';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const layoutIcons = { wall: Layout, grid: Grid3X3, column: Columns3, map: Network };
const layoutLabels = { wall: 'حائط', grid: 'شبكة', column: 'أعمدة', map: 'خريطة' };

export default function BoardCard({ board }: { board: Board }) {
  const { deleteBoard, updateBoard } = useBoards();
  const Icon = layoutIcons[board.layout];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="h-24 relative" style={{ backgroundColor: board.background_color }}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
          <Icon className="h-3 w-3" />
          {layoutLabels[board.layout]}
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
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchive}><Archive className="h-4 w-4 ml-2" /> أرشفة</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4 ml-2" /> حذف</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {new Date(board.updated_at).toLocaleDateString('ar-SA')}
        </p>
      </div>
    </motion.div>
  );
}
