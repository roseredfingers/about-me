"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { BlogView } from "@/components/blog-view";
import { WritingEditor } from "@/components/editor/editor";
import { ExportImport } from "@/components/export-import";
import { Home } from "@/components/home";
import { PostView } from "@/components/post-view";
import {
  createBlog,
  createPost,
  exportBackup,
  getBlog,
  getMediaForPost,
  getPost,
  importBackup,
  listBlogs,
  listPostsByBlog,
  savePost,
  upsertMediaFile,
} from "@/lib/db";
import { buildHashRoute, parseHashRoute, type AppRoute } from "@/lib/router";
import type { Blog, MediaFile, Post } from "@/lib/types";

type NavConfig = {
  left?: { label: string; onClick: () => void };
  right?: { label: string; onClick: () => void };
};

export function AppShell() {
  const [route, setRoute] = useState<AppRoute>({ name: "home" });
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncHash = () => setRoute(parseHashRoute(window.location.hash || "#/"));
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRouteData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (route.name === "home") {
          const nextBlogs = await listBlogs();
          if (!cancelled) {
            setBlogs(nextBlogs);
            setBlog(null);
            setPost(null);
            setPosts([]);
            setMedia([]);
          }
        }

        if (route.name === "blog") {
          const [nextBlog, nextPosts] = await Promise.all([
            getBlog(route.blogId),
            listPostsByBlog(route.blogId),
          ]);
          if (!cancelled) {
            setBlog(nextBlog ?? null);
            setPosts(nextPosts);
            setPost(null);
            setMedia([]);
          }
        }

        if (route.name === "post") {
          const [nextBlog, nextPost] = await Promise.all([
            getBlog(route.blogId),
            getPost(route.postId),
          ]);
          const nextMedia = nextPost ? await getMediaForPost(nextPost.id) : [];
          if (!cancelled) {
            setBlog(nextBlog ?? null);
            setPost(nextPost ?? null);
            setMedia(nextMedia);
          }
        }

        if (route.name === "write-new") {
          const draft = await createPost(route.blogId);
          if (!cancelled) {
            window.location.hash = buildHashRoute({
              name: "write-edit",
              blogId: route.blogId,
              postId: draft.id,
            });
          }
          return;
        }

        if (route.name === "write-edit") {
          const [nextBlog, nextPost] = await Promise.all([
            getBlog(route.blogId),
            getPost(route.postId),
          ]);
          const nextMedia = nextPost ? await getMediaForPost(nextPost.id) : [];
          if (!cancelled) {
            setBlog(nextBlog ?? null);
            setPost(nextPost ?? null);
            setMedia(nextMedia);
          }
        }
      } catch (loadError) {
        if (!cancelled)
          setError(loadError instanceof Error ? loadError.message : "Failed loading data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadRouteData();
    return () => {
      cancelled = true;
    };
  }, [refreshToken, route]);

  const mediaUrls = useMemo(() => {
    const result: Record<string, string> = {};
    for (const item of media) result[item.id] = URL.createObjectURL(item.blob);
    return result;
  }, [media]);

  useEffect(
    () => () => {
      Object.values(mediaUrls).forEach((url) => URL.revokeObjectURL(url));
    },
    [mediaUrls],
  );

  const rerenderFromStorage = () => setRefreshToken((v) => v + 1);

  const navConfig = (): NavConfig => {
    if (route.name === "blog" && blog) {
      return {
        left: {
          label: "All spaces",
          onClick: () => {
            window.location.hash = buildHashRoute({ name: "home" });
          },
        },
        right: {
          label: "+ New entry",
          onClick: () => {
            window.location.hash = buildHashRoute({ name: "write-new", blogId: blog.id });
          },
        },
      };
    }
    if (route.name === "post" && blog && post) {
      return {
        left: {
          label: blog.name,
          onClick: () => {
            window.location.hash = buildHashRoute({ name: "blog", blogId: blog.id });
          },
        },
        right: {
          label: "Edit",
          onClick: () => {
            window.location.hash = buildHashRoute({
              name: "write-edit",
              blogId: blog.id,
              postId: post.id,
            });
          },
        },
      };
    }
    return {};
  };

  const nav = navConfig();
  const isEditorRoute = route.name === "write-new" || route.name === "write-edit";

  const body = () => {
    if (loading) return <p className="emptyState" style={{ padding: "6rem 0 0 clamp(1.2rem,4vw,3rem)" }}>Loading...</p>;
    if (error)   return <p className="emptyState" style={{ padding: "6rem 0 0 clamp(1.2rem,4vw,3rem)" }}>Error: {error}</p>;

    if (route.name === "home") {
      return (
        <>
          <Home
            blogs={blogs}
            onCreateBlog={async (name, description) => {
              const created = await createBlog(name, description);
              window.location.hash = buildHashRoute({ name: "blog", blogId: created.id });
            }}
            onOpenBlog={(blogId) => {
              window.location.hash = buildHashRoute({ name: "blog", blogId });
            }}
          />
          <ExportImport
            onExport={exportBackup}
            onImport={async (payload) => {
              await importBackup(payload);
              rerenderFromStorage();
            }}
          />
        </>
      );
    }

    if (route.name === "blog" && blog) {
      return (
        <BlogView
          blog={blog}
          posts={posts}
          onOpenPost={(postId) => {
            window.location.hash = buildHashRoute({ name: "post", blogId: blog.id, postId });
          }}
        />
      );
    }

    if (route.name === "post" && blog && post) {
      return <PostView blog={blog} post={post} mediaUrls={mediaUrls} />;
    }

    if (route.name === "write-edit" && blog && post) {
      return (
        <WritingEditor
          key={post.id}
          post={post}
          mediaUrls={mediaUrls}
          onBack={() => { window.location.hash = buildHashRoute({ name: "blog", blogId: blog.id }); }}
          onSave={async (input) => { await savePost(post.id, input); }}
          onUploadMedia={async (file) => {
            const stored = await upsertMediaFile(post.id, file);
            const source = URL.createObjectURL(file);
            setMedia((cur) => [...cur.filter((m) => m.id !== stored.id), stored]);
            return { id: stored.id, src: source, mimeType: stored.mimeType, name: stored.name };
          }}
        />
      );
    }

    return <p className="emptyState" style={{ padding: "6rem 0 0 clamp(1.2rem,4vw,3rem)" }}>Page not found.</p>;
  };

  return (
    <div className="appBackdrop">
      {!isEditorRoute && (
        <nav className="siteNav">
          <div className="siteNavInner">
            <a
              href="#/"
              className="siteTitle"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = "#/";
              }}
            >
              Sanctuary
            </a>
            <div className="navActions">
              {nav.left && (
                <button type="button" className="btnGhost" onClick={nav.left.onClick}>
                  {nav.left.label}
                </button>
              )}
              {nav.right && (
                <button type="button" className="btnPrimary" onClick={nav.right.onClick}>
                  {nav.right.label}
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={JSON.stringify(route)}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {body()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
