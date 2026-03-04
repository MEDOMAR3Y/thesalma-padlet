import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Board {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  background_color: string;
  background_image: string | null;
  layout: 'wall' | 'grid' | 'column' | 'map';
  visibility: 'public' | 'private' | 'password';
  is_archived: boolean;
  folder: string | null;
  created_at: string;
  updated_at: string;
}

export function useBoards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const boardsQuery = useQuery({
    queryKey: ['boards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Board[];
    },
    enabled: !!user,
  });

  const createBoard = useMutation({
    mutationFn: async (board: { title: string; description?: string; background_color?: string; layout?: string }) => {
      const { data, error } = await supabase
        .from('boards')
        .insert({ ...board, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const updateBoard = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Board>) => {
      const { error } = await supabase.from('boards').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('boards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  return { boards: boardsQuery.data ?? [], isLoading: boardsQuery.isLoading, createBoard, updateBoard, deleteBoard };
}
