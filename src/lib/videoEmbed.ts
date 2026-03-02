export function getVideoEmbed(url: string): { platform: string; embedUrl: string } | null {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  
  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (ttMatch) return { platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}` };
  
  // Instagram
  const igMatch = url.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/);
  if (igMatch) return { platform: 'instagram', embedUrl: `https://www.instagram.com/p/${igMatch[1]}/embed` };
  
  // Twitter/X
  const twMatch = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
  if (twMatch) return { platform: 'twitter', embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${twMatch[1]}` };
  
  return null;
}

export function isVideoUrl(url: string): boolean {
  return getVideoEmbed(url) !== null;
}
