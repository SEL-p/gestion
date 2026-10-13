export function getProductImageSrc(url: string): string {
  return url.startsWith('/uploads/') ? `/api${url}` : url;
}
