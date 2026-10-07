import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

/**
 * 将 Astro 构建生成的文章页面及其关联的所有 JS/CSS/字体打平成一个完全离线独立的单文件 HTML。
 * 用法:
 *   pnpm exec tsx scripts/export-single-html.ts posts/visualization/bezier-to-b-spline [outputPath]
 */

const targetSlug = process.argv[2] || "posts/visualization/bezier-to-b-spline";
const defaultOutput = path.resolve(
  process.env.USERPROFILE || ".",
  "Desktop",
  `${path.basename(targetSlug)}.html`,
);
const outputPath = process.argv[3] || defaultOutput;

const rootDir = process.cwd();
const clientDir = path.join(rootDir, "dist/client");
const astroDir = path.join(clientDir, "_astro");
const htmlPath = path.join(clientDir, targetSlug, "index.html");

if (!fs.existsSync(htmlPath)) {
  console.error(`错误: 找不到页面 ${htmlPath}，请先执行 pnpm build！`);
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, "utf-8");

console.log(`正在打包页面: ${targetSlug}`);

// 1. 提取所有关联的 JS (astro-island 组件与通用布局脚本)
const islandRegex = /(?:component-url|renderer-url)="([^"]+)"/g;
const islandScripts = new Set<string>();
let match: RegExpExecArray | null;
while ((match = islandRegex.exec(html)) !== null) {
  islandScripts.add(path.basename(match[1]));
}

const tagScriptRegex =
  /<script\s+type="module"\s+src="\/_astro\/([^"]+)"><\/script>/g;
const tagScripts = new Set<string>();
while ((match = tagScriptRegex.exec(html)) !== null) {
  tagScripts.add(match[1]);
}

// 2. 生成 esbuild 打包入口
let entryCode = `window.__ASTRO_MODULES__ = window.__ASTRO_MODULES__ || {};\n`;
let idx = 0;
for (const file of islandScripts) {
  const filePath = path.join(astroDir, file).replace(/\\/g, "/");
  if (fs.existsSync(filePath)) {
    entryCode += `import * as mod_${idx} from '${filePath}';\n`;
    entryCode += `window.__ASTRO_MODULES__['/_astro/${file}'] = mod_${idx};\n`;
    idx++;
  }
}
for (const file of tagScripts) {
  const filePath = path.join(astroDir, file).replace(/\\/g, "/");
  if (fs.existsSync(filePath)) {
    entryCode += `import '${filePath}';\n`;
  }
}

const tempDir = path.join(rootDir, ".astro");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
const tempEntry = path.join(tempDir, "single_html_entry.js");
const tempBundle = path.join(tempDir, "single_html_bundle.js");
fs.writeFileSync(tempEntry, entryCode, "utf-8");

console.log(
  "正在打包所有 JavaScript 模块 (包含 React, Three.js, Astro Islands)...",
);
execSync(
  `pnpm dlx esbuild "${tempEntry}" --bundle --format=iife --target=es2020 --outfile="${tempBundle}"`,
  {
    cwd: rootDir,
    stdio: "inherit",
  },
);
const bundleContent = fs.readFileSync(tempBundle, "utf-8");

// 3. 内联 CSS 并将字体/图片等静态资源转为 base64 data URI
console.log("正在内联样式表与字体/资源...");
const cssRegex = /<link rel="stylesheet" href="([^"]+)">/g;
html = html.replace(cssRegex, (linkTag, href) => {
  const cssFile = path.join(clientDir, href);
  if (fs.existsSync(cssFile)) {
    let cssContent = fs.readFileSync(cssFile, "utf-8");
    cssContent = cssContent.replace(
      /url\((['"]?)([^'"()]+)\1\)/g,
      (urlMatch, quote, assetPath) => {
        let cleanPath = assetPath.split("#")[0].split("?")[0];
        if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);
        const fullPath = path.join(clientDir, cleanPath);
        if (fs.existsSync(fullPath)) {
          const ext = path.extname(fullPath).toLowerCase();
          let mime = "application/octet-stream";
          if (ext === ".woff2") mime = "font/woff2";
          else if (ext === ".woff") mime = "font/woff";
          else if (ext === ".ttf") mime = "font/ttf";
          else if (ext === ".svg") mime = "image/svg+xml";
          else if (ext === ".png") mime = "image/png";
          const b64 = fs.readFileSync(fullPath).toString("base64");
          return `url("data:${mime};base64,${b64}")`;
        }
        return urlMatch;
      },
    );
    return `<style>\n${cssContent}\n</style>`;
  }
  return linkTag;
});

// 4. Patch astro-island 模块加载器，直接从内存读取已打包模块，避免 CORS / file:// 报错
const oldMethod =
  "async importWithRetry(e){try{return await import(e)}catch(t){return await new Promise(e=>setTimeout(e,1e3)),import(this.getRetryImportUrl(e))}}";
const newMethod =
  "async importWithRetry(e){if(window.__ASTRO_MODULES__&&window.__ASTRO_MODULES__[e]){return window.__ASTRO_MODULES__[e];}try{return await import(e)}catch(t){return await new Promise(e=>setTimeout(e,1e3)),import(this.getRetryImportUrl(e))}}";
if (html.includes(oldMethod)) {
  html = html.replace(oldMethod, newMethod);
}

// 5. 移除外链 script 标签，将完整 JS 注入 <head>
html = html.replace(
  /<script\s+type="module"\s+src="\/_astro\/[^"]+"><\/script>/g,
  "",
);
const headIdx = html.indexOf("</head>");
if (headIdx !== -1) {
  html =
    html.slice(0, headIdx) +
    `<script>\n${bundleContent}\n</script>\n` +
    html.slice(headIdx);
} else {
  html = `<script>\n${bundleContent}\n</script>\n` + html;
}

// 6. 输出最终独立 HTML
fs.writeFileSync(outputPath, html, "utf-8");
const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
console.log(`\n🎉 打包完成！`);
console.log(`输出路径: ${outputPath}`);
console.log(`文件大小: ${fileSizeMB} MB`);

// 清理临时文件
try {
  if (fs.existsSync(tempEntry)) fs.unlinkSync(tempEntry);
  if (fs.existsSync(tempBundle)) fs.unlinkSync(tempBundle);
} catch {
  // empty
}
