
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
};

export const isUrlSafe = (url: string, allowedDomains?: string[]): boolean => {
  if (!url) return false;
  
  const defaultAllowedDomains = [
    'youtube.com', 'www.youtube.com', 'youtu.be',
    'vimeo.com', 'www.vimeo.com',
    'microsoft.com', 'www.microsoft.com', 'microsoftonline.com',
    'sharepoint.com',
    'onedrive.live.com',
    'stream.microsoft.com',
    'localhost',
    window.location.hostname
  ];
  
  const domains = allowedDomains || defaultAllowedDomains;
  
  try {
    const urlObj = new URL(url);
    return domains.some(domain => 
      urlObj.hostname === domain || 
      urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch (e) {
    return false;
  }
};

export const sanitizeUrl = (url: string, allowedDomains?: string[]): string => {
  return isUrlSafe(url, allowedDomains) ? url : '';
};

export const getYoutubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split(/[?&]/)[0] || '';
    }
    if (!videoId) {
      return '';
    }
    return `https://www.youtube.com/embed/${videoId}`;
  } catch (e) {
    return '';
  }
}; 