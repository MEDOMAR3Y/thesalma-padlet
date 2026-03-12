import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Post {
  id: string;
  board_id: string;
  user_id: string;
  content: string | null;
  post_type: 'text' | 'image' | 'link' | 'file';
  color: string;
  link_url: string | null;
  file_url: string | null;
  file_name: string | null;
  position_x: number;
  position_y: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
}

export function usePosts(boardId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['posts', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      const posts = data as Post[];
      // Fetch author profiles
      const userIds = [...new Set(posts.map(p => p.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]));
        return posts.map(p => ({ ...p, profile: profileMap[p.user_id] }));
      }
      return posts.map(p => ({ ...p, profile: undefined }));
    },
    enabled: !!boardId,
  });

  const createPost = useMutation({
    mutationFn: async (post: Partial<Post> & { board_id: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({ ...post, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', boardId] }),
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Post>) => {
      const { error } = await supabase.from('posts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', boardId] }),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', boardId] }),
  });

  return { posts: postsQuery.data ?? [], isLoading: postsQuery.isLoading, createPost, updatePost, deletePost };
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Fetch profiles for comments
      const userIds = [...new Set((data as Comment[]).map(c => c.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]));
      return (data as Comment[]).map(c => ({ ...c, profile: profileMap[c.user_id] }));
    },
    enabled: !!postId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  return { comments: commentsQuery.data ?? [], isLoading: commentsQuery.isLoading, addComment, deleteComment };
}

export function useLikes(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const likesQuery = useQuery({
    queryKey: ['likes', postId],
    queryFn: async () => {
      const { data, error } = await supabase.from('likes').select('*').eq('post_id', postId);
      if (error) throw error;
      return data as Like[];
    },
    enabled: !!postId,
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      const existing = likesQuery.data?.find(l => l.user_id === user!.id);
      if (existing) {
        const { error } = await supabase.from('likes').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['likes', postId] }),
  });

  const isLiked = likesQuery.data?.some(l => l.user_id === user?.id) ?? false;
  const count = likesQuery.data?.length ?? 0;

  return { likes: likesQuery.data ?? [], isLiked, count, toggleLike };
}

export const MAX_POST_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function validatePostAttachment(file: File, fileType: 'image' | 'file') {
  if (file.size > MAX_POST_FILE_SIZE_BYTES) {
    return 'حجم المرفق أكبر من 25MB';
  }

  if (fileType === 'image' && !file.type.startsWith('image/')) {
    return 'الملف المختار ليس صورة صالحة';
  }

  return null;
}

export async function uploadPostFile(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 32) || 'file';
  const path = `${userId}/${Date.now()}-${baseName}.${ext}`;
  const { error } = await supabase.storage.from('post-files').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('post-files').getPublicUrl(path);
  return data.publicUrl;
}
