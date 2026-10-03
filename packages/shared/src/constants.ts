export const ADCE_DIR = ".adce";
export const ADCE_CONFIG_FILE = "config.yaml";
export const ADCE_DB_FILE = "state.db";
export const ADCE_AGENTS_FILE = "AGENTS.md";

export const DEFAULT_IGNORE = [
  ".adce/",
  ".git/",
  "node_modules/",
  "dist/",
  "build/",
  "coverage/",
  ".next/",
  ".turbo/",
  ".vercel/",
  ".cursor/",
  ".vscode/",
  ".idea/",
  // Static media / binaries (not decision artifacts for coding agents)
  "public/**/*.png",
  "public/**/*.jpg",
  "public/**/*.jpeg",
  "public/**/*.gif",
  "public/**/*.webp",
  "public/**/*.ico",
  "public/**/*.svg",
  "public/**/*.woff",
  "public/**/*.woff2",
  "public/**/*.ttf",
  "public/**/*.eot",
  "public/**/*.mp4",
  "public/**/*.webm",
  "public/**/*.pdf",
  // Binary assets anywhere (SVG kept scannable — sometimes used as source)
  "*.png",
  "*.jpg",
  "*.jpeg",
  "*.gif",
  "*.webp",
  "*.ico",
  "*.woff",
  "*.woff2",
  "*.log",
  ".DS_Store",
  "Thumbs.db",
];

