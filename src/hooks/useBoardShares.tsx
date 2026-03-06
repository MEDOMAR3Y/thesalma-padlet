import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { encodeBoardId } from '@/lib/shortBoardId';
import { sendEmail, buildBoardInviteEmail } from '@/lib/email';
import { useAuth } from '@/hooks/useAuth';

export interface BoardShare {
  id: string;
  board_id: string;
  user_id: string | null;
  email: string | null;
  permission: 'read' | 'write' | 'admin' | 'blocked';
  share_token: string;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useBoardShares(boardId: string) {
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: ['board-shares', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_shares')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as BoardShare[];
      const userIds = [...new Set(rows.filter(s => s.user_id).map(s => s.user_id!))];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]));
        return rows.map(s => ({ ...s, profile: s.user_id ? profileMap[s.user_id] : undefined }));
      }

      return rows;
    },
    enabled: !!boardId,
  });

  const addShare = useMutation({
    mutationFn: async ({ identifier, permission }: { identifier: string; permission: BoardShare['permission'] }) => {
      const value = identifier.trim();
      if (!value) throw new Error('empty_identifier');

      const isEmail = EMAIL_REGEX.test(value);
      let targetUserId: string | null = null;
      let targetEmail: string | null = null;

      if (isEmail) {
        targetEmail = value.toLowerCase();
      } else {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_id')
          .ilike('display_name', value)
          .limit(1)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile?.user_id) throw new Error('user_not_found');
        targetUserId = profile.user_id;
      }

      let existingQuery = supabase
        .from('board_shares')
        .select('id')
        .eq('board_id', boardId)
        .limit(1);

      existingQuery = targetUserId
        ? existingQuery.eq('user_id', targetUserId)
        : existingQuery.eq('email', targetEmail!);

      const { data: existing, error: existingError } = await existingQuery.maybeSingle();
      if (existingError) throw existingError;

      if (existing?.id) {
        const { error } = await supabase.from('board_shares').update({ permission }).eq('id', existing.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('board_shares').insert({
        board_id: boardId,
        permission,
        user_id: targetUserId,
        email: targetEmail,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-shares', boardId] }),
  });

  const updatePermission = useMutation({
    mutationFn: async ({ id, permission }: { id: string; permission: BoardShare['permission'] }) => {
      const { error } = await supabase.from('board_shares').update({ permission }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-shares', boardId] }),
  });

  const removeShare = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('board_shares').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board-shares', boardId] }),
  });

  const getShareLink = async () => `/b/${encodeBoardId(boardId)}`;

  return {
    shares: sharesQuery.data ?? [],
    isLoading: sharesQuery.isLoading,
    addShare,
    updatePermission,
    removeShare,
    getShareLink,
  };
}


