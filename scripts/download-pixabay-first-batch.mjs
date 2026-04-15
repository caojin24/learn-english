import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.PIXABAY_KEY;

if (!API_KEY) {
  console.error("Missing PIXABAY_KEY environment variable.");
  process.exit(1);
}

const projectRoot = process.cwd();
const imagesRoot = path.join(projectRoot, "public", "images");

const plan = [
  { slug: "app-icon", folder: "home", query: "cute teddy bear logo cartoon pastel", type: "illustration", note: "软件主图标" },
  { slug: "listening-icon", folder: "home", query: "kids headphones cartoon icon pastel", type: "illustration", note: "分级听力图标" },
  { slug: "speaking-icon", folder: "home", query: "cute microphone cartoon icon pastel", type: "illustration", note: "跟读练习图标" },
  { slug: "words-icon", folder: "home", query: "kids puzzle alphabet cartoon icon", type: "illustration", note: "看图识词图标" },
  { slug: "phrases-icon", folder: "home", query: "speech bubble cartoon icon kids pastel", type: "illustration", note: "日常短句图标" },
  { slug: "videos-icon", folder: "home", query: "movie clapboard cartoon icon kids pastel", type: "illustration", note: "绘本动画图标" },
  { slug: "home-decor-rainbow", folder: "home", query: "pastel rainbow clouds kids illustration", type: "illustration", note: "首页装饰图" },
  { slug: "home-decor-stars", folder: "home", query: "cute stars moon pastel cartoon illustration", type: "illustration", note: "首页装饰图" },

  { slug: "hello", folder: "listening", query: "kids waving hello cartoon", type: "illustration", note: "Hello" },
  { slug: "apple", folder: "listening", query: "red apple cartoon illustration", type: "illustration", note: "Apple" },
  { slug: "i-see-a-cat", folder: "listening", query: "cute cat cartoon illustration", type: "illustration", note: "I see a cat" },
  { slug: "hi", folder: "listening", query: "happy sun cartoon illustration", type: "illustration", note: "Hi" },
  { slug: "a-red-ball", folder: "listening", query: "red ball cartoon illustration", type: "illustration", note: "A red ball" },
  { slug: "whats-your-name", folder: "listening", query: "kids meeting cartoon illustration", type: "illustration", note: "What's your name?" },
  { slug: "i-like-apples", folder: "listening", query: "child eating apples cartoon", type: "illustration", note: "I like apples" },
  { slug: "this-is-a-dog", folder: "listening", query: "cute dog cartoon illustration", type: "illustration", note: "This is a dog" },
  { slug: "lets-play-together", folder: "listening", query: "kids playing together cartoon", type: "illustration", note: "Let's play together" },
  { slug: "thank-you-mom", folder: "listening", query: "mother child hug cartoon", type: "illustration", note: "Thank you, Mom" },

  { slug: "cat", folder: "words/animals", query: "cute cat cartoon illustration", type: "illustration", note: "cat" },
  { slug: "dog", folder: "words/animals", query: "cute dog cartoon illustration", type: "illustration", note: "dog" },
  { slug: "bird", folder: "words/animals", query: "cute bird cartoon illustration", type: "illustration", note: "bird" },
  { slug: "apple-word", folder: "words/fruits", query: "red apple cartoon illustration", type: "illustration", note: "apple" },
  { slug: "banana", folder: "words/fruits", query: "banana cartoon illustration", type: "illustration", note: "banana" },
  { slug: "pear", folder: "words/fruits", query: "pear cartoon illustration", type: "illustration", note: "pear" },
  { slug: "red", folder: "words/colors", query: "red color splash cartoon illustration", type: "illustration", note: "red" },
  { slug: "blue", folder: "words/colors", query: "blue color splash cartoon illustration", type: "illustration", note: "blue" },
  { slug: "yellow", folder: "words/colors", query: "yellow color splash cartoon illustration", type: "illustration", note: "yellow" },
  { slug: "one", folder: "words/numbers", query: "number one cartoon illustration", type: "illustration", note: "one" },
  { slug: "two", folder: "words/numbers", query: "number two cartoon illustration", type: "illustration", note: "two" },
  { slug: "three", folder: "words/numbers", query: "number three cartoon illustration", type: "illustration", note: "three" },
  { slug: "cup", folder: "words/daily", query: "cup cartoon illustration", type: "illustration", note: "cup" },
  { slug: "book", folder: "words/daily", query: "book cartoon illustration", type: "illustration", note: "book" },
  { slug: "chair", folder: "words/daily", query: "chair cartoon illustration", type: "illustration", note: "chair" },
  { slug: "bag", folder: "words/daily", query: "school bag cartoon illustration", type: "illustration", note: "bag" },
  { slug: "brush", folder: "words/daily", query: "toothbrush cartoon illustration", type: "illustration", note: "brush" },
  { slug: "run", folder: "words/actions", query: "kid running cartoon illustration", type: "illustration", note: "run" },
  { slug: "jump", folder: "words/actions", query: "kid jumping cartoon illustration", type: "illustration", note: "jump" },
  { slug: "clap", folder: "words/actions", query: "kid clapping cartoon illustration", type: "illustration", note: "clap" },

  { slug: "wake-up", folder: "phrases", query: "kid waking up cartoon illustration", type: "illustration", note: "Wake up!" },
  { slug: "wash-your-hands", folder: "phrases", query: "kid washing hands cartoon illustration", type: "illustration", note: "Wash your hands" },
  { slug: "lets-eat", folder: "phrases", query: "kids eating cartoon illustration", type: "illustration", note: "Let's eat" },
  { slug: "it-is-yummy", folder: "phrases", query: "cute food yummy cartoon illustration", type: "illustration", note: "It is yummy" },
  { slug: "lets-play", folder: "phrases", query: "kids playing cartoon illustration", type: "illustration", note: "Let's play" },
  { slug: "kick-the-ball", folder: "phrases", query: "kid kicking ball cartoon illustration", type: "illustration", note: "Kick the ball" },
  { slug: "it-is-a-bear", folder: "phrases", query: "cute bear cartoon illustration", type: "illustration", note: "It is a bear" },
  { slug: "the-bird-can-fly", folder: "phrases", query: "bird flying cartoon illustration", type: "illustration", note: "The bird can fly" },
  { slug: "it-is-red", folder: "phrases", query: "red object cartoon illustration", type: "illustration", note: "It is red" },
  { slug: "yellow-is-bright", folder: "phrases", query: "bright yellow sun cartoon illustration", type: "illustration", note: "Yellow is bright" },
  { slug: "i-see-one-star", folder: "phrases", query: "single star cartoon illustration", type: "illustration", note: "I see one star" },
  { slug: "count-to-three", folder: "phrases", query: "counting numbers cartoon illustration", type: "illustration", note: "Count to three" },

  { slug: "the-very-hungry-caterpillar", folder: "videos", query: "caterpillar cartoon illustration", type: "illustration", note: "The Very Hungry Caterpillar" },
  { slug: "brown-bear", folder: "videos", query: "brown bear cartoon illustration", type: "illustration", note: "Brown Bear" },
  { slug: "maisy", folder: "videos", query: "cute mouse cartoon illustration", type: "illustration", note: "Maisy" },
];

function scoreHit(hit) {
  let score = 0;
  score += Math.min(hit.imageWidth ?? 0, hit.imageHeight ?? 0) / 10;
  score += (hit.downloads ?? 0) / 5;
  score += (hit.likes ?? 0) * 8;
  score += hit.type === "illustration" ? 60 : 0;
  score += hit.type === "vector/svg" ? 20 : 0;
  const tags = String(hit.tags ?? "").toLowerCase();
  if (tags.includes("cartoon")) score += 40;
  if (tags.includes("cute")) score += 30;
  if (tags.includes("kid")) score += 20;
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

async function searchBestHit(item) {
  const endpoint = new URL("https://pixabay.com/api/");
  endpoint.searchParams.set("key", API_KEY);
  endpoint.searchParams.set("q", item.query);
  endpoint.searchParams.set("image_type", "illustration");
  endpoint.searchParams.set("safesearch", "true");
  endpoint.searchParams.set("per_page", "10");
  endpoint.searchParams.set("orientation", "horizontal");
  endpoint.searchParams.set("editors_choice", "true");

  const data = await fetchJson(endpoint.toString());
  const hits = Array.isArray(data.hits) ? data.hits : [];
  if (hits.length === 0) {
    return null;
  }

  return hits
    .filter((hit) => hit.largeImageURL || hit.webformatURL)
    .sort((a, b) => scoreHit(b) - scoreHit(a))[0] ?? null;
}

async function main() {
  const results = [];

  for (const item of plan) {
    const folderPath = path.join(imagesRoot, item.folder);
    await ensureDir(folderPath);
    const filePath = path.join(folderPath, `${item.slug}.jpg`);

    try {
      const hit = await searchBestHit(item);

      if (!hit) {
        results.push({ ...item, status: "missing" });
        console.log(`MISS  ${item.note} -> ${item.query}`);
        continue;
      }

      const imageUrl = hit.largeImageURL || hit.webformatURL;
      await downloadBinary(imageUrl, filePath);

      results.push({
        ...item,
        status: "downloaded",
        file: path.relative(projectRoot, filePath),
        source: hit.pageURL,
        imageUrl,
        tags: hit.tags,
        pixabayId: hit.id,
        author: hit.user,
      });

      console.log(`OK    ${item.note} -> ${path.relative(projectRoot, filePath)}`);
    } catch (error) {
      results.push({
        ...item,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`ERROR ${item.note} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const summaryPath = path.join(projectRoot, "public", "images", "pixabay-first-batch.json");
  await fs.writeFile(summaryPath, JSON.stringify(results, null, 2), "utf8");

  const markdownLines = [
    "# Pixabay 首版图片下载清单",
    "",
    "| 状态 | 说明 | 文件 | 查询词 | 来源 |",
    "|---|---|---|---|---|",
    ...results.map((item) => {
      const status = item.status === "downloaded" ? "已下载" : item.status === "missing" ? "未找到" : "失败";
      const file = item.file ?? "-";
      const source = item.source ? `[Pixabay](${item.source})` : "-";
      return `| ${status} | ${item.note} | ${file} | ${item.query} | ${source} |`;
    }),
    "",
  ];

  const markdownPath = path.join(projectRoot, "public", "images", "pixabay-first-batch.md");
  await fs.writeFile(markdownPath, markdownLines.join("\n"), "utf8");

  const counts = results.reduce(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      return accumulator;
    },
    { downloaded: 0, missing: 0, error: 0 },
  );

  console.log("");
  console.log(`Downloaded: ${counts.downloaded}, Missing: ${counts.missing}, Error: ${counts.error}`);
  console.log(`Summary JSON: ${path.relative(projectRoot, summaryPath)}`);
  console.log(`Summary MD:   ${path.relative(projectRoot, markdownPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
