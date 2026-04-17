# AGENTS.md

这个文件用于帮助编码代理在当前仓库中基于“现有实现”安全、稳定地协作。

## 项目概览

- 项目类型：面向低龄儿童的英语启蒙单页前端应用
- 技术栈：Vite + React 18 + TypeScript + Tailwind CSS
- 包管理器：npm
- 文案语言：界面以简体中文为主，英文内容主要来自单词、短句和视频标题
- 路由方式：未使用 `react-router`，而是在 `src/App.tsx` 中通过本地 `route` 状态切换页面
- 数据来源：当前核心内容来自本地静态文件，主要包括 `src/data/content.ts` 和 `src/data/word.json`
- 持久化方式：通过 `usePersistentState` + `localStorage` 保存设置和学习进度

## 当前产品范围

当前代码中的页面和能力如下：

- 首页：展示 6 个入口卡片，分别是分级听力、看图识词、日常短句、魔法口袋、绘本动画、游戏模块
- 家长设置：独立页面，通过首页右上角齿轮进入
- 分级听力：默认“全部分类”，支持切换场景分类、逐词高亮、上下句切换和分类顺序浏览
- 跟读练习：页面已实现，支持录音和回放，但当前首页没有直接入口
- 游戏模块：已实现独立入口，当前玩法为“英文单词 + 中文短释义”配对消消乐
- 看图识词：支持“点击识词”和“配对游戏”两种模式
- 日常短句：支持推荐 5 句、分类切换、逐词高亮和手动刷新推荐
- 魔法口袋：可收集暂时不会的单词和短句，并在独立页面里重复复习
- 绘本动画：展示 15 条视频资源，当前通过 B 站 `iframe` 和外链播放

不要假设需求文档里的所有历史设想都已经落地，改动前请以代码现状为准。

## 核心实现事实

- 首页当前展示 6 张模块卡片，其中包含“魔法口袋”和“游戏模块”，但不包含“跟读练习”入口
- `src/App.tsx` 负责：
  - 页面切换
  - 奖励 toast
  - 星星/徽章累计
  - 推荐短句计算与刷新
  - 各模块浏览位置的持久化
- `魔法口袋` 用于收集孩子暂时不会的内容，当前支持单词和短句两类
- 听力和短句内容共用同一批场景句子来源，均从 `rawPhraseScenes` 派生
- 当前听力与短句都统一使用 `basic` 难度，对应完整 88 句句库
- 跟读页复用听力句子数据，而不是单独维护一套口语内容
- 游戏模块词库来自 `src/data/word.json`，保留原 `meaning`，并通过 `gameMeaningZh` 提供更适合配对游戏的中文短释义
- 游戏模块当前每局默认 6 组卡片，同一局会避免英文重复和中文短释义重复
- 游戏模块匹配成功后会显示成功提示，并只请求播放一个有道单词发音地址
- 单词、短句和视频封面当前主展示素材都是 emoji，不再依赖本地图片目录
- 视频页当前不是本地 MP4 播放，而是 B 站封面列表 + `iframe` 播放器 + 外链兜底
- 当前 `/api/tts` 已由 Vercel Python Function 实现，底层直接调用 `edge-tts`；失败时会回退到浏览器 `speechSynthesis`
- 听力和短句切换上一句、下一句或分类时，会停止当前语音播放；如果 `/api/tts` 请求未完成，也会取消
- 分级听力在具体分类的最后一句点击“下一句”时，会直接进入下一个分类，并提前展示提示
- 分级听力的“下一句”会按固定节奏插入复习：每正常前进 4 句后，插入 1 句当前范围内已听过的内容

## 重要目录

- `src/App.tsx`：应用总入口，维护全局页面状态、奖励逻辑和进度写回
- `src/pages/*`：各业务页面
- `src/components/*`：通用展示组件和壳组件
- `src/data/content.ts`：模块卡片、单词、短句、视频等静态内容
- `src/data/word.json`：游戏模块原始词库，保留原 `meaning` 并新增 `gameMeaningZh`
- `src/data/gameWords.ts`：游戏模块词库适配
- `src/config/storage.ts`：本地存储 key、默认设置、默认进度和进度归一化
- `src/hooks/usePersistentState.ts`：本地持久化 Hook
- `src/lib/audio.ts`：音频播放、TTS、单词发音兜底逻辑
- `src/lib/recommendations.ts`：短句推荐逻辑
- `src/styles/index.css`：全局样式、主题变量和动画
- `api/tts.py`：Vercel Python TTS 接口，直接调用 `edge-tts`
- `requirements.txt`：Vercel Python 依赖

## 当前数据模型

`SettingsState`

- `listeningDifficulty`
- `speakingDifficulty`
- `phraseDifficulty`
- `selectedWordCategory`
- `accent`
- `maxVideoMinutes`

`LearningProgressState`

- `listenedIds`
- `spokenIds`
- `solvedWordIds`
- `completedPhraseIds`
- `pocketWordIds`
- `pocketPhraseIds`
- `rewards.stars`
- `rewards.badges`
- `recommendedPhraseIds`
- `moduleState.listening.category`
- `moduleState.listening.currentId`
- `moduleState.speakingCurrentId`
- `moduleState.phrases`
- `moduleState.words`
- `moduleState.pocket`

注意：

- `phraseRotationSeed` 已存在于类型和默认值中，但当前推荐逻辑并未真正使用它驱动页面行为
- 修改进度结构前，要同步检查 `defaultProgress`、`normalizeProgress`、`types.ts` 和 `App.tsx`

## 协作约定

- 优先做小而聚焦的改动，避免无关重构
- 修改共享状态前，先阅读 `src/App.tsx`、`src/config/storage.ts`、`src/types.ts`
- 修改学习内容前，先阅读 `src/data/content.ts`，不要在多个地方重复维护静态数据
- 修改游戏模块词库或出题逻辑前，先阅读 `src/data/word.json`、`src/data/gameWords.ts`、`src/pages/GamesPage.tsx`
- 除非用户明确要求，否则不要引入新的 UI 组件库、状态库或路由库
- 继续沿用当前 Tailwind 工具类写法和圆角卡片视觉语言
- 编辑中文文案时，保持温和、鼓励式、适合儿童场景
- 新增“复习收集类”功能时，优先接入现有 `魔法口袋` 流程，而不是再造平行入口

## UI 与交互指南

- 交互优先面向触屏，保证按钮大、反馈直接、路径短
- 保持温暖、轻松、低压力的产品气质，避免考试化和惩罚式表达
- 优先复用已有组件模式，例如：
  - `AppShell`
  - `ModuleCard`
  - `RewardToast`
  - `ProgressStars`
  - `SettingSelect`
  - `WordChips`
- 新样式优先写在组件局部的 Tailwind class 中；只有出现明显复用时再扩展全局样式

## 已知产品边界

- 跟读页虽然已实现，但当前没有首页入口，也没有从短句页跳转进入
- 游戏模块已接入首页，但当前不接入星星/徽章奖励，也不接入魔法口袋
- 视频页依赖外部 B 站资源，和“纯本地视频播放”设想不一致
- 当前仓库已去掉图片资源目录，展示层统一走 emoji 和文字
- 家长设置页中的听力、跟读、短句难度当前为固定展示，不再提供“入门 / 基础”切换
- 当前线上句子 TTS 不再依赖自建 Python 常驻服务，而是托管在 Vercel Function 中
- 项目当前没有自动化测试，默认以 `npm run build` 作为基础验证

## 改动边界

- 不要擅自把本地状态路由改成正式路由系统
- 不要随意更改 `localStorage` key
- 不要在没有迁移方案的情况下重构持久化数据结构
- 不要把静态内容拆散到多个零散文件，除非用户明确要求做内容系统改造
- 不要默认把“隐藏中的跟读页”重新接回首页；这属于产品流转调整，需结合用户意图处理
- 不要为“不会的内容复习”再新增第二套收集模型，除非用户明确要求替换 `魔法口袋`

## 常用命令

- 安装依赖：`npm install`
- 启动开发：`npm run dev`
- 生产构建：`npm run build`
- 本地预览：`npm run preview`

## 验证要求

- 只要有实质性代码改动，优先执行 `npm run build`
- 如果改动涉及：
  - `src/App.tsx`
  - `src/config/storage.ts`
  - `src/types.ts`
  - `src/data/content.ts`
  需要额外留意页面切换、持久化兼容和内容生成是否仍然正常
- 如果无法完成验证，要明确说明未验证部分和风险点

## 文档同步原则

- 更新需求文档、README 或其他说明时，优先描述“当前代码已实现的状态”
- 如果要保留未来规划，请单独标记为“待迭代”或“规划项”，不要与现状混写
