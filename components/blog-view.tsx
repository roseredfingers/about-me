"use client";

import { motion } from "framer-motion";

import type { Blog, Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface BlogViewProps {
  blog: Blog;
  posts: Post[];
  onOpenPost: (postId: string) => void;
}

export function BlogView({ blog, posts, onOpenPost }: BlogViewProps) {
  return (
    <div className="pageWrap">
      <motion.div
        className="blogViewHeader"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <span className="eyebrow">Blog space</span>
        <h1 className="sectionHeading">{blog.name}</h1>
        {blog.description && <p className="softLead">{blog.description}</p>}
      </motion.div>

      <div className="postList">
        {posts.length === 0 ? (
          <p className="emptyState">No entries yet. Begin when you are ready.</p>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              className="postCard"
              role="button"
              tabIndex={0}
              onClick={() => onOpenPost(post.id)}
              onKeyDown={(e) => e.key === "Enter" && onOpenPost(post.id)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
            >
              <span className="postCardIndex">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="postCardBody">
                <h2>{post.title || "Untitled reflection"}</h2>
                {post.excerpt && <p>{post.excerpt}</p>}
                <span className="postCardDate">{formatDate(post.updatedAt)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
