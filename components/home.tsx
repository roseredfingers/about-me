"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import type { Blog } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface HomeProps {
  blogs: Blog[];
  onCreateBlog: (name: string, description?: string) => Promise<void>;
  onOpenBlog: (blogId: string) => void;
}

export function Home({ blogs, onCreateBlog, onOpenBlog }: HomeProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await onCreateBlog(name, description);
    setName("");
    setDescription("");
    setOpen(false);
  };

  return (
    <div className="pageWrap">
      <motion.div
        className="homeHero"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="heroRule" />
        <h1 className="displayHeading">
          Sanctuary
        </h1>
        <p className="heroSub">Private space &mdash; no performance, no audience</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="composerLabel">
          <span>&#8212;</span> New blog space
        </div>

        {!open ? (
          <div style={{ marginBottom: "3.5rem" }}>
            <button type="button" className="btnPrimary" onClick={() => setOpen(true)}>
              Create a space
            </button>
          </div>
        ) : (
          <form className="blogComposer" onSubmit={submit}>
            <input
              placeholder="What is this space for?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="A quiet note about what belongs here (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="composerFooter">
              <button
                type="button"
                className="btnGhost"
                onClick={() => setOpen(false)}
                style={{ marginRight: "0.5rem" }}
              >
                Cancel
              </button>
              <button type="submit" className="btnPrimary">
                Create
              </button>
            </div>
          </form>
        )}

        {blogs.length > 0 && (
          <>
            <div className="blogGridLabel">
              <span>Your spaces</span>
              <span>{blogs.length}</span>
            </div>
            <div className="blogGrid">
              {blogs.map((blog, index) => (
                <motion.div
                  key={blog.id}
                  className="blogCard"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenBlog(blog.id)}
                  onKeyDown={(e) => e.key === "Enter" && onOpenBlog(blog.id)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.07 }}
                >
                  <span className="blogCardIndex">0{index + 1}</span>
                  <div className="blogCardBody">
                    <h2>{blog.name}</h2>
                    {blog.description && <p>{blog.description}</p>}
                  </div>
                  <span className="blogCardDate">{formatDate(blog.updatedAt)}</span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
