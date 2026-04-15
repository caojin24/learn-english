import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.PIXABAY_KEY;

if (!API_KEY) {
  console.error("Missing PIXABAY_KEY environment variable.");
  process.exit(1);
}

const projectRoot = process.cwd();
const imagesRoot = path.join(projectRoot, "public", "images", "words");
const configPath = path.join(projectRoot, "scripts", "pixabay-word-keywords.json");
const summaryJsonPath = path.join(projectRoot, "public", "images", "pixabay-word-keywords-download.json");
const summaryMdPath = path.join(projectRoot, "public", "images", "pixabay-word-keywords-download.md");

const rawConfig = await fs.readFile(configPath, "utf8");
const config = JSON.parse(rawConfig);

function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scoreHit(hit) {
  let score = 0;
  score += Math.min(hit.imageWidth ?? 0, hit.imageHeight ?? 0) / 10;
  score += (hit.downloads ?? 0) / 5;
  score += (hit.likes ?? 0) * 8;
  score += hit.type === "illustration" ? 60 : 0;
  const tags = String(hit.tags ?? "").toLowerCase();
  if (tags.includes("cartoon")) score += 40;
  if (tags.includes("cute")) score += 20;
  if (tags.includes("icon")) score += 12;
  return score;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadBinary(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

async function searchBestHit(keyword) {
  const endpoint = new URL("https://pixabay.com/api/");
  endpoint.searchParams.set("key", API_KEY);
  endpoint.searchParams.set("q", keyword);
  endpoint.searchParams.set("image_type", "illustration");
  endpoint.searchParams.set("safesearch", "true");
  endpoint.searchParams.set("per_page", "10");
  endpoint.searchParams.set("editors_choice", "true");

  const data = await fetchJson(endpoint.toString());
  const hits = Array.isArray(data.hits) ? data.hits : [];

  return (
    hits
      .filter((hit) => hit.largeImageURL || hit.webformatURL)
      .sort((a, b) => scoreHit(b) - scoreHit(a))[0] ?? null
  );
}

async function main() {
  const results = [];

  for (const group of config) {
    const folderPath = path.join(imagesRoot, group.category);
    await ensureDir(folderPath);

    for (const item of group.words) {
      const slug = slugify(item.word);
      const filePath = path.join(folderPath, `${slug}.jpg`);

      try {
        const hit = await searchBestHit(item.keyword);
        if (!hit) {
          results.push({ ...item, category: group.category, status: "missing" });
          console.log(`MISS  ${group.category}/${item.word} -> ${item.keyword}`);
          continue;
        }

        const imageUrl = hit.largeImageURL || hit.webformatURL;
        await downloadBinary(imageUrl, filePath);

        results.push({
          ...item,
          category: group.category,
          file: path.relative(projectRoot, filePath),
          source: hit.pageURL,
          pixabayId: hit.id,
          author: hit.user,
          status: "downloaded",
        });
        console.log(`OK    ${group.category}/${item.word} -> ${path.relative(projectRoot, filePath)}`);
      } catch (error) {
        results.push({
          ...item,
          category: group.category,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
        console.log(`ERROR ${group.category}/${item.word} -> ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await fs.writeFile(summaryJsonPath, JSON.stringify(results, null, 2), "utf8");

  const markdownLines = [
    "# Pixabay 词库关键词下载清单",
    "",
    "| 状态 | 分类 | 单词 | 关键词 | 文件 | 来源 |",
    "|---|---|---|---|---|---|",
    ...results.map((item) => {
      const status = item.status === "downloaded" ? "已下载" : item.status === "missing" ? "未找到" : "失败";
      const file = item.file ?? "-";
      const source = item.source ? `[Pixabay](${item.source})` : "-";
      return `| ${status} | ${item.category} | ${item.word} | ${item.keyword} | ${file} | ${source} |`;
    }),
    "",
  ];

  await fs.writeFile(summaryMdPath, markdownLines.join("\n"), "utf8");

  const counts = results.reduce(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      return accumulator;
    },
    { downloaded: 0, missing: 0, error: 0 },
  );

  console.log("");
  console.log(`Downloaded: ${counts.downloaded}, Missing: ${counts.missing}, Error: ${counts.error}`);
  console.log(`Summary JSON: ${path.relative(projectRoot, summaryJsonPath)}`);
  console.log(`Summary MD:   ${path.relative(projectRoot, summaryMdPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
