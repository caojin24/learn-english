# 宝贝英语启蒙

一个面向儿童英语启蒙的单页前端应用，聚焦“听、说、玩”三类低门槛练习。当前版本强调简单、轻量、可直接上手，适合孩子独立点按，也方便家长快速调整设置。

## 项目特点

- 基于 `Vite + React 18 + TypeScript + Tailwind CSS`
- 采用单页本地状态切换，不使用 `react-router`
- 界面文案以简体中文为主，交互风格偏温暖、鼓励式
- 设置和学习进度会自动保存在浏览器本地
- 当前主流程以“单词/短句 + emoji”驱动，仓库中的图片资源大多尚未接入核心学习页

## 当前功能

### 1. 分级听力

- 按难度筛选句子内容：`starter` / `basic`
- 使用浏览器 TTS 播放句子
- 播放时按单词高亮显示
- 每完成 5 句可获得 1 颗星星

### 2. 跟读练习

- 复用听力句子内容进行跟读
- 调用浏览器麦克风权限录音
- 支持录音回放
- 不做打分，只提供鼓励式反馈

### 3. 看图识词

- 包含“点击识词”和“配对游戏”两种模式
- 支持按分类筛选：全部、动物、水果、颜色、数字、日常用品、动作
- 单词发音优先使用有道词典语音地址，失败时回退浏览器 TTS
- 每完成 3 个单词奖励 1 颗星星，每累计 15 个有徽章奖励
- 当前页面展示的是 emoji，不是本地图片资源

### 4. 日常短句

- 按难度筛选短句
- 提供“推荐”入口和分类切换
- 支持每日推荐短句刷新
- 播放时按单词高亮
- 可从短句页直接跳转到跟读页

### 5. 绘本动画

- 提供绘本动画列表和封面
- 当前使用 B 站链接与站内 `iframe` 播放
- 支持家长设置单次观看时长上限：5 / 10 / 15 分钟
- 超过时长后会提示休息

### 6. 家长设置

- 分级听力难度
- 跟读练习难度
- 日常短句难度
- 看图识词分类
- 发音偏好：美式 / 英式
- 单次动画观看时长

## 技术实现说明

### 页面组织

项目没有引入路由库，而是在 [`src/App.tsx`](/Users/caojin/项目/tool/learn-english/src/App.tsx) 中通过本地状态控制页面切换。首页、设置页、听力页、跟读页、识词页、短句页、视频页都由同一个应用状态统一调度。

### 数据来源

主要静态内容定义在 [`src/data/content.ts`](/Users/caojin/项目/tool/learn-english/src/data/content.ts)：

- `listeningItems`：听力与跟读内容
- `phraseItems`：短句练习内容
- `wordItems`：识词内容
- `videoItems`：绘本动画列表
- `moduleCards`：首页模块卡片

当前 `wordItems` 和 `phraseItems` 的 `image` 字段由代码生成 emoji，因此虽然 `public/images` 下已经有不少图片资源，但目前并未作为主展示资源接入识词/短句页面。

### 本地持久化

项目通过 [`src/hooks/usePersistentState.ts`](/Users/caojin/项目/tool/learn-english/src/hooks/usePersistentState.ts) 进行本地存储封装，相关默认值和 key 定义在 [`src/config/storage.ts`](/Users/caojin/项目/tool/learn-english/src/config/storage.ts)。

当前持久化内容包括：

- 家长设置
- 听过的句子 ID
- 跟读完成的句子 ID
- 做过的单词 ID
- 完成的短句 ID
- 星星和徽章奖励
- 当前推荐短句 ID

### 音频能力

- 单词发音：优先有道词典语音地址，失败时回退浏览器 TTS
- 句子播放：浏览器 TTS
- 跟读录音：浏览器 `MediaRecorder`

## 目录结构

```text
src/
  App.tsx                     应用入口和全局状态
  main.tsx                    挂载入口
  types.ts                    类型定义
  data/content.ts             静态内容
  config/storage.ts           默认设置与存储 key
  hooks/usePersistentState.ts 本地持久化 Hook
  lib/audio.ts                语音与音频工具
  lib/recommendations.ts      短句推荐逻辑
  components/                 通用组件
  pages/                      页面组件
  styles/index.css            全局样式

public/images/
  home/                       首页图标与装饰图
  videos/                     视频封面
  words/                      单词图片资源（当前未接入主流程）
  phrases/                    短句图片资源（当前未接入主流程）
  listening/                  听力图片资源（当前未全面接入）
```

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

### 构建生产包

```bash
npm run build
```

### 预览生产包

```bash
npm run preview
```

## 适合继续迭代的方向

- 把 `public/images/words` 和 `public/images/phrases` 正式接入主流程，并保留 emoji 兜底
- 为跟读加入更明确的节奏提示或句子分段
- 补充更稳定的内容管理方式，降低后续扩展 `content.ts` 的维护成本
- 增加基础自动化测试或数据校验脚本

## 备注

- 当前项目没有测试套件，默认以 `npm run build` 作为基础可用性检查
- 视频资源目前依赖外部 B 站页面与播放器
- 浏览器如果禁用麦克风或 TTS，部分功能会退化或不可用
