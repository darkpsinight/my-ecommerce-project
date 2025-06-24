export type Category = {
  title: string;
  id: string | number;
  img: string;
  imageUrl?: string; // Support both properties for API compatibility
  description?: string;
};
