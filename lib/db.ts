import Dexie, { type Table } from "dexie";

import type {
  BackupPayload,
  Blog,
  MediaFile,
  Post,
  SerializedMediaFile,
} from "@/lib/types";
import { base64ToBlob, blobToBase64, makeId, now } from "@/lib/utils";

class SanctuaryDatabase extends Dexie {
  blogs!: Table<Blog, string>;
  posts!: Table<Post, string>;
  media!: Table<MediaFile, string>;

  constructor() {
    super("sanctuary-db");
    this.version(1).stores({
      blogs: "id, updatedAt",
      posts: "id, blogId, updatedAt",
      media: "id, postId, mimeType",
    });
  }
}

export const db = new SanctuaryDatabase();

export const createBlog = async (name: string, description?: string) => {
  const timestamp = now();
  const blog: Blog = {
    id: makeId(),
    name: name.trim(),
    description: description?.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.blogs.add(blog);
  return blog;
};

export const listBlogs = async () => db.blogs.orderBy("updatedAt").reverse().toArray();

export const getBlog = async (id: string) => db.blogs.get(id);

export const createPost = async (blogId: string) => {
  const timestamp = now();
  const post: Post = {
    id: makeId(),
    blogId,
    title: "Untitled reflection",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "" }],
        },
      ],
    }),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.posts.add(post);
  await db.blogs.update(blogId, { updatedAt: timestamp });
  return post;
};

export const listPostsByBlog = async (blogId: string) =>
  db.posts.where("blogId").equals(blogId).sortBy("updatedAt").then((posts) => posts.reverse());

export const getPost = async (id: string) => db.posts.get(id);

export const savePost = async (
  postId: string,
  updates: Partial<Pick<Post, "title" | "content" | "excerpt" | "coverImageId">>,
) => {
  const post = await db.posts.get(postId);
  if (!post) {
    return undefined;
  }
  const updated: Post = {
    ...post,
    ...updates,
    updatedAt: now(),
  };
  await db.posts.put(updated);
  await db.blogs.update(post.blogId, { updatedAt: updated.updatedAt });
  return updated;
};

export const upsertMediaFile = async (
  postId: string,
  file: File,
  existingId?: string,
): Promise<MediaFile> => {
  const media: MediaFile = {
    id: existingId ?? makeId(),
    postId,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    blob: file,
    createdAt: now(),
  };
  await db.media.put(media);
  return media;
};

export const getMediaForPost = async (postId: string) =>
  db.media.where("postId").equals(postId).toArray();

export const getMediaById = async (id: string) => db.media.get(id);

export const exportBackup = async (): Promise<BackupPayload> => {
  const blogs = await db.blogs.toArray();
  const posts = await db.posts.toArray();
  const media = await db.media.toArray();

  const serializedMedia: SerializedMediaFile[] = await Promise.all(
    media.map(async (item) => ({
      id: item.id,
      postId: item.postId,
      name: item.name,
      mimeType: item.mimeType,
      base64: await blobToBase64(item.blob),
      createdAt: item.createdAt,
    })),
  );

  return {
    version: 1,
    exportedAt: now(),
    blogs,
    posts,
    media: serializedMedia,
  };
};

export const importBackup = async (payload: BackupPayload) => {
  if (payload.version !== 1) {
    throw new Error("Unsupported backup version.");
  }

  await db.transaction("rw", db.blogs, db.posts, db.media, async () => {
    await db.blogs.clear();
    await db.posts.clear();
    await db.media.clear();

    await db.blogs.bulkAdd(payload.blogs);
    await db.posts.bulkAdd(payload.posts);

    const media = payload.media.map((item) => ({
      id: item.id,
      postId: item.postId,
      name: item.name,
      mimeType: item.mimeType,
      blob: base64ToBlob(item.base64, item.mimeType),
      createdAt: item.createdAt,
    }));
    await db.media.bulkAdd(media);
  });
};
