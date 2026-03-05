export const encodeBoardId = (uuid: string): string => {
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) return uuid;

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const decodeBoardId = (shortId: string): string | null => {
  try {
    const padded = shortId.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((shortId.length + 3) % 4);
    const binary = atob(padded);
    if (binary.length !== 16) return null;

    let hex = '';
    for (let i = 0; i < binary.length; i += 1) {
      hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
    }

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } catch {
    return null;
  }
};
