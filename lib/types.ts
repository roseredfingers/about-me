export interface Blog {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Post {
  id: string;
  blogId: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImageId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MediaFile {
  id: string;
  postId: string;
  name: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
}

export interface SerializedMediaFile {
  id: string;
  postId: string;
  name: string;
  mimeType: string;
  base64: string;
  createdAt: number;
}

export interface BackupPayload {
  version: 1;
  exportedAt: number;
  blogs: Blog[];
  posts: Post[];
  media: SerializedMediaFile[];
}
