import { ImageCacheEntry } from "../types/SearchTypes";

export class ImageCache {
  private static instance: ImageCache;
  private cache = new Map<string, ImageCacheEntry>();

  private constructor() {}

  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  public get(key: string): ImageCacheEntry | undefined {
    return this.cache.get(key);
  }

  public set(key: string, entry: ImageCacheEntry): void {
    this.cache.set(key, entry);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}