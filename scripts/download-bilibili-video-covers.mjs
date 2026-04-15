import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "public", "images", "videos");

const items = [
  { id: "video-caterpillar", bvid: "BV1jE411u7nD", slug: "the-very-hungry-caterpillar-cover" },
  { id: "video-guess-love", bvid: "BV1Fx411n7XQ", slug: "guess-how-much-i-love-you-cover" },
  { id: "video-my-dad", bvid: "BV17x411779E", slug: "my-dad-cover" },
  { id: "video-my-mum", bvid: "BV17x411779F", slug: "my-mum-cover" },
  { id: "video-brownbear", bvid: "BV1YK4y177NQ", slug: "brown-bear-brown-bear-cover" },
  { id: "video-no-david", bvid: "BV18p4y1x7nK", slug: "no-david-cover" },
  { id: "video-goodnight-moon", bvid: "BV12K4y1Z7mN", slug: "goodnight-moon-cover" },
  { id: "video-gruffalo", bvid: "BV17K4y1C7fE", slug: "the-gruffalo-cover" },
  { id: "video-bear-hunt", bvid: "BV12p4y1x7nZ", slug: "were-going-on-a-bear-hunt-cover" },
  { id: "video-green-monster", bvid: "BV18K4y1s7hM", slug: "go-away-big-green-monster-cover" },
  { id: "video-chicka", bvid: "BV17x411779D", slug: "chicka-chicka-boom-boom-cover" },
  { id: "video-mouse-cookie", bvid: "BV12K4y1Z7mL", slug: "if-you-give-a-mouse-a-cookie-cover" },
  { id: "video-napping-house", bvid: "BV18p4y1x7nL", slug: "the-napping-house-cover" },
  { id: "video-giraffe-dance", bvid: "BV17K4y1C7fF", slug: "giraffes-cant-dance-cover" },
  { id: "video-little-blue-yellow", bvid: "BV12p4y1x7nM", slug: "little-blue-and-little-yellow-cover" },
];

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: "https://www.bilibili.com/",
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadBinary(url, filePath) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      referer: "https://www.bilibili.com/",
    },
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function main() {
  await ensureDir(outputDir);
  const results = [];

  for (const item of items) {
    try {
      const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(item.bvid)}`;
      const payload = await fetchJson(apiUrl);
      const coverUrl = payload?.data?.pic;
      if (!coverUrl) {
        throw new Error("Missing cover URL");
      }

      const targetPath = path.join(outputDir, `${item.slug}.jpg`);
      const normalizedCoverUrl = coverUrl.startsWith("//") ? `https:${coverUrl}` : coverUrl;
      await downloadBinary(normalizedCoverUrl, targetPath);

      results.push({
        ...item,
        status: "downloaded",
        coverUrl: normalizedCoverUrl,
        file: path.relative(projectRoot, targetPath),
      });
      console.log(`OK    ${item.bvid} -> ${path.relative(projectRoot, targetPath)}`);
    } catch (error) {
      results.push({
        ...item,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`ERROR ${item.bvid} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const summaryJson = path.join(projectRoot, "public", "images", "bilibili-video-covers.json");
  const summaryMd = path.join(projectRoot, "public", "images", "bilibili-video-covers.md");
  await fs.writeFile(summaryJson, JSON.stringify(results, null, 2), "utf8");

  const md = [
    "# Bilibili 视频封面下载清单",
    "",
    "| 状态 | BV | 文件 | 封面地址 |",
    "|---|---|---|---|",
    ...results.map((item) => {
      const status = item.status === "downloaded" ? "已下载" : "失败";
      const file = item.file ?? "-";
      const url = item.coverUrl ?? "-";
      return `| ${status} | ${item.bvid} | ${file} | ${url} |`;
    }),
    "",
  ].join("\n");
  await fs.writeFile(summaryMd, md, "utf8");

  const success = results.filter((item) => item.status === "downloaded").length;
  const failed = results.length - success;
  console.log("");
  console.log(`Downloaded: ${success}, Error: ${failed}`);
  console.log(`Summary JSON: ${path.relative(projectRoot, summaryJson)}`);
  console.log(`Summary MD:   ${path.relative(projectRoot, summaryMd)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
