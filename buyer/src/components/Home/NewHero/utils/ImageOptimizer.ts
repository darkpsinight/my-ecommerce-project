export class ImageOptimizer {
  public static optimizeImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Check if it's an ImageKit.io URL
    if (url.includes("imagekit.io")) {
      // Add ImageKit transformations for small thumbnails
      // tr=f-webp,q-80 means:
      // - format: webp (smaller file size)
      // - quality: 80 (good balance of quality/size)
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}tr=f-webp,q-80`;
    }

    return url;
  }
}