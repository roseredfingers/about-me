export type AppRoute =
  | { name: "home" }
  | { name: "blog"; blogId: string }
  | { name: "post"; blogId: string; postId: string }
  | { name: "write-new"; blogId: string }
  | { name: "write-edit"; blogId: string; postId: string };

export const parseHashRoute = (hashValue: string): AppRoute => {
  const normalized = hashValue.replace(/^#/, "").trim();
  const clean = normalized.startsWith("/") ? normalized.slice(1) : normalized;
  const parts = clean.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { name: "home" };
  }

  if (parts[0] === "blog" && parts.length === 2) {
    return { name: "blog", blogId: parts[1] };
  }

  if (parts[0] === "blog" && parts.length === 3) {
    return { name: "post", blogId: parts[1], postId: parts[2] };
  }

  if (parts[0] === "write" && parts.length === 2) {
    return { name: "write-new", blogId: parts[1] };
  }

  if (parts[0] === "write" && parts.length === 3) {
    return { name: "write-edit", blogId: parts[1], postId: parts[2] };
  }

  return { name: "home" };
};

export const buildHashRoute = (route: AppRoute) => {
  switch (route.name) {
    case "home":
      return "#/";
    case "blog":
      return `#/blog/${route.blogId}`;
    case "post":
      return `#/blog/${route.blogId}/${route.postId}`;
    case "write-new":
      return `#/write/${route.blogId}`;
    case "write-edit":
      return `#/write/${route.blogId}/${route.postId}`;
    default:
      return "#/";
  }
};
