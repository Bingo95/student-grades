# H5 移动端项目 · AI 开发约束文档（正式版 v1.0）

> 技术栈：Umi Max 4 · React 19 · antd-mobile 5 · TypeScript 5.9 ｜ 生效日期：2026-08-16 ｜ 适用：AI 代码生成 / 修改 / 评审
>
> 本文件为约束 AI 在 `antd_demo/H5` 仓库内行为的正式规范，所有约定均从现有代码反向提炼并经人工校正。AI 不得引入与本文冲突的模式。

---

## 1 · 项目概览

| 维度   | 选型                            |
| ------ | ------------------------------- |
| 框架   | @umijs/max 4.3.24               |
| UI 库  | antd-mobile 5.41                |
| 视图层 | React 19.1                      |
| 语言   | TypeScript 5.9（strict）        |
| 图表   | @antv/f2 5                      |
| 请求   | @umijs/max request + useRequest |
| 状态   | Umi useModel                    |
| 样式   | Less + postcss px→vw            |

**约束基线**：Node ≥ 20；构建产物输出到 `./pay` 目录（`outputPath:'./pay'`）；路由使用 `browser` 历史模式；日期统一使用 `dayjs`（已通过 `moment2dayjs` 插件替换 moment）。

---

## 2 · 目录结构与职责

```
H5/
├─ config/                # 配置层
│  ├─ config.ts           # 主配置（路由/别名/插件/define 入口）
│  ├─ config.dev.ts       # 开发环境变量 + proxy
│  ├─ config.test.ts      # 测试环境变量
│  ├─ config.prod.ts      # 生产环境变量
│  ├─ define.config.ts    # 全局常量/枚举（OSS、响应码、页面路径）
│  ├─ router.config.ts    # 路由表（页面注册入口）
│  └─ request.config.ts   # 全局请求拦截器/错误处理
└─ src/
   ├─ assets/             # 常量 & 正则（constant.ts / regExp.ts）
   ├─ components/         # 通用组件（每组件一个文件夹 + index.tsx/less）
   ├─ layouts/            # 布局（BlankLayout 根布局）
   ├─ models/             # 全局 useModel 数据流（如 useLayouts）
   ├─ pages/              # 页面；页级 model 在 pages/<Page>/model.ts
   ├─ services/           # 接口层（按业务域分文件夹）
   ├─ themes/             # Less 变量与 mixins（colors/default/mixins）
   ├─ utils/              # 工具函数（utils/env/wechat）
   ├─ app.tsx             # 运行时入口（request/路由钩子）
   ├─ global.less         # 全局样式（@import themes）
   └─ typings.d.ts        # 全局类型 & define 注入常量声明
```

| 层 | 职责 | AI 操作边界 |
| --- | --- | --- |
| `config/` | 环境、路由、请求、构建配置 | 路由/常量新增走此层；勿改 `request.config.ts` 签名逻辑 |
| `services/` | 纯 HTTP 封装，按业务域分文件夹 | 每个域 `index.ts` + `types.ts`，函数名 `fetchXxx` |
| `pages/<Page>/model.ts` & `models/` | useRequest 封装的数据流 | 导出 `useXxx` 钩子；消费键为 `'<page>.model'` |
| `components/` | 可复用 UI | 默认导出 + `index.less`；优先 CSS Modules |
| `utils/` | 无状态工具（路由/UA/正则/微信） | 纯函数；新增工具按文件归类 |
| `themes/` | 设计 token（颜色/间距/字体） | 新颜色/尺寸须追加变量，禁止硬编码散落 |

---

## 3 · 架构约定（必须遵守）

### 3.1 路由

- 页面必须在 `config/router.config.ts` 注册；根布局为 `../layouts/BlankLayout`。
- 跳转一律使用 `@/utils/utils` 的 `router.push / router.replace`（内部封装 `history` + query 拼接），**禁止**在业务中直接 `window.location` 跳转。
- 获取路由参数用 `getUrlParams()`，拼参用 `queryParams()`。

### 3.2 接口层（services）

- 每个业务域一个文件夹（如 `user/`、`recharge/`），含 `index.ts` 与 `types.ts`。
- `index.ts`：**在文件顶部** `export * from './types'`，随后导出 `fetchXxx` 函数。
- 请求参数统一：**GET 用 `params`，POST 用 `data`**；表单类请求须带 `requestType:'form'`。**不要**把 POST 写成 `params`。

```ts
// services/user/login.ts
import { request } from '@umijs/max';
// 顶部导出类型
export * from './types';

// ✅ POST 表单：用 data + requestType:'form'
export async function fetchGetSmsCode(data: any) {
  return request(`/api-common/v1/login/sendH5SmsCode`, {
    method: 'POST',
    data,
    requestType: 'form',
  });
}

// ✅ GET：用 params
export async function fetchGetUserInfo(params: any) {
  return request(`/api-app/v1/user/getUserByUserNoOrNiceNo`, {
    method: 'GET',
    params,
  });
}
```

> **参数传递统一规则**：同一接口只允许一种传参风格。遇到既有代码把 POST 写成 `params` 的情况，AI 应统一改为 `data`，保持 `GET→params / POST→data` 一致。

### 3.3 数据流（models）

- 页面级数据流放在 `src/pages/<Page>/model.ts`（**单数 `model.ts`**，非 `models.ts`），导出 `useXxx` 钩子。
- 命名空间 = `'<page>.model'`，例如 `src/pages/pageA/model.ts` → 通过 `useModel('pageA.model')` 消费。
- `useRequest` 默认 `manual:true`；数据清洗用 `formatResult`。

```ts
// src/pages/pageA/model.ts
import { useRequest } from '@umijs/max';
import { fetchXxxx } from '@/services/xxx';

export default function useXxxx() {
  // 解构命名约定：data 小写开头 + Data；run 用 load 前缀；mutate 用 mutate 前缀
  const {
    data: xxxxData = {}, // 小写开头，语义 + Data 后缀
    run: loadXxxx, // load + 语义
    mutate: mutateXxxx, // mutate + 语义
  } = useRequest(fetchXxxx, {
    manual: true,
    onSuccess: (data: any) => {
      console.log(data);
    },
  });

  return { xxxxData, loadXxxx, mutateXxxx };
}
```

> **解构命名三要素（强制）**：`data` → `xxxxData`（小写开头，`Data` 后缀）；`run` → `loadXxxx`；`mutate` → `mutateXxxx`。组件内消费时保持同名透传。

### 3.4 组件

- 组件文件夹 = 组件名（PascalCase），含 `index.tsx`（默认导出）与 `index.less`。
- Props 用 `interface XxxProps` 显式声明，关键字段加 JSDoc 注释。
- 样式优先 CSS Modules（`import styles from './index.less'`）；确需全局类时遵循既有 `btn_primary` / `wd_footer_*` 命名风格。

### 3.5 样式与适配

- 静态样式写 px，由 `postcss-px-to-viewport-8-plugin` 自动转 vw（设计基准见 §7）。
- JS 动态尺寸使用 `pxToVw(px)` 工具函数（来自 `@/utils/utils`）。
- 设计 token 集中在 `themes/`，组件内用 `@color-primary` 等变量，**禁止散硬编码颜色**。

---

## 4 · 命名规范

| 对象 | 约定 | 示例 |
| --- | --- | --- |
| 业务页面文件夹 | PascalCase | `Login/` `Page/` `Recharge/` |
| 通用组件文件夹 | PascalCase | `Popup/` `UserCard/` `FooterFixed/` |
| services 域文件夹 | camelCase | `user/` `recharge/` |
| 页级 model 文件 | `<Page>/model.ts`（单数） | `pages/pageA/model.ts` |
| model 命名空间 | `'<page>.model'` | `useModel('pageA.model')` |
| 接口函数 | `fetch` + 业务语义 | `fetchGetUserInfo` `fetchSmsCodeLogin` |
| 数据流钩子 | `use` + 语义 | `useLogin` `useLayouts` |
| useRequest 解构 | `data:xxxxData` / `run:loadXxxx` / `mutate:mutateXxxx` | 见 §3.3 |
| 常量 / 枚举 / 正则 | SCREAMING_SNAKE_CASE | `OSS_BASE_URL` `PHONE_REGEX` `RESPONSE_CODE` |
| 普通变量 / 函数 | camelCase | `imageCodeData` `handleSendCode` |
| TypeScript 类型 | PascalCase + `Props/Params/Data` 后缀 | `PopupProps` `ImageCodeData` |
| 全局 CSS 类 | 小写 + 下划线（BEM 风） | `btn_primary` `wd_footer_block` `popup_title` |
| CSS Modules 类 | camelCase | `styles.login` `styles.input` |

---

## 5 · 代码质量门禁

| 项                 | 选型                             |
| ------------------ | -------------------------------- |
| Linter / Formatter | Biome 2.1                        |
| 格式化器           | Prettier 2                       |
| Less 校验          | stylelint 13                     |
| 提交门禁           | husky + lint-staged + commitlint |

Biome 关键规则（来自 `biome.json`）：

- 缩进：空格（`indentStyle:space`）；字符串：**单引号**（`quoteStyle:'single'`）。
- `recommended` 全开；`noExplicitAny` 已关闭（允许 `any`，但应尽量减少）。
- JSX 运行时声明为 `reactClassic`（与 `tsconfig` 的 `react-jsx` 存在差异，AI 不要擅自改任一处）。
- 提交信息遵循 `@commitlint/config-conventional`（如 `feat:` `fix:` `chore:`）。

> **AI 生成代码要求**：输出代码应通过 `npx @biomejs/biome lint` 与 `prettier --check`；避免引入 ESLint 风格注释（项目已无 ESLint）。不要在生成文件中追加 `.eslintrc` 之类配置。

---

## 6 · 请求与错误处理

- 所有请求经 `config/request.config.ts` 统一拦截：自动注入 `pkg` 鉴权头（CryptoJS 签名 + Base64）。
- 业务约定：响应 `code === 'OK'` 为成功；否则拦截器抛错并 Toast 提示。
- `code === 'A00004'` 视为登录过期，AI 不得将其当作普通错误吞掉。
- Loading Toast 默认由拦截器管理，单请求可用 `showLoading:false` 关闭。
- 表单提交统一 `requestType:'form'`，由拦截器做 `queryString.stringify`。
- 错误提示统一走拦截器 / `toast()`，**不要**在业务组件里重复写 `Toast.show` 错误分支。

---

## 7 · 环境配置

环境变量通过 `define` 注入（非 `.env`），分 dev / test / prod 三套，由 `UMI_ENV` 切换。

| 变量           | 含义             | 说明                                 |
| -------------- | ---------------- | ------------------------------------ |
| `UMI_ENV`      | 当前环境         | `dev` / `test` / `prod`              |
| `API_BASE_URL` | 请求 baseURL     | dev 空（走 proxy）；test/prod 填域名 |
| `OSS_FILE_URL` | 图片资源基址     | 图片地址拼接用 `checkImgUrl()`       |
| `DESIGN_WIDTH` | px→vw 设计稿宽度 | 定义为 **750**（供 `pxToVw` 使用）   |
| `HTML_TITLE`   | 页面标题         | dev/测试/prod 不同                   |

> **⚠ 适配基准不一致（重点）**：`postcss.config.js` 的 `viewportWidth` 为 **375**，而 `config/define.config.ts` 与 `pxToVw` 使用的 `DESIGN_WIDTH` 为 **750**。AI 新增样式：静态 CSS 写 px 交给 postcss（按 375 基准转换）；JS 动态尺寸用 `pxToVw`（按 750 基准）。两者并存，AI 不要"统一"成其中一个而破坏既有页面。

---

## 8 · 已知反模式（AI 必须规避）

以下为从现有仓库提炼的"坑"，AI 在生成/修改代码时**不得复刻或加剧**：

1. **悬空路由**：`router.config.ts` 将 `/` 重定向到 `/payRecharge`，但仓库中**不存在该路由与页面**（`src/pages` 仅有 404/Login/Page）。AI 不应假设 `/payRecharge` 可用；新增充值页需先补路由 + 页面，或修正重定向目标。
2. **幽灵 model 引用**：`components/UserCard` 调用 `useModel('useUser')`，但全局/页级均无 `useUser` model，运行时会报错。AI 新增 `useModel('xxx.model')` 前必须确认对应 `<page>/model.ts` 存在（遵循 §3.3 命名空间）。
3. **复制粘贴的类型文件**：`services/recharge/types.ts` 与 `services/user/types.ts` 内容完全相同（均为无意义的 `ActivityMedalListParams`）。AI 不要复制无关类型；每个域的 `types.ts` 应定义真实接口，且需与 `index.ts` 中函数参数对齐。
4. **静态密钥硬编码**：`constant.ts` 含 `AUTH_SECRET_KEY='cccccc'`、`AMAP_KEY='aaaaaaaa'`；`wechat.ts` 含 appId；`request.config.ts` 含写死的 `di` 设备号。AI 不要新增明文密钥；确需新增时放入 `define.config.ts` 或环境变量，并加注释说明来源。
5. **过度使用 @ts-nocheck / @ts-ignore**：多处文件（BarChart、Page、BlankLayout、loading、404、request.config、app.tsx）顶部整文件 `// @ts-nocheck`，与 `tsconfig` 的 `strict` 冲突。AI 优先补全真实类型，仅在不可避免的第三方/全局类型缺失时使用局部 `@ts-ignore`。
6. **混合样式策略**：部分组件用 CSS Modules（`styles.xxx`），部分用全局类名（`btn_primary` 等写在 `global.less`）。AI 新增组件**优先 CSS Modules**，避免污染全局作用域。
7. **文档与代码漂移**：`README.md` 描述的结构（`assets/img`、`utils/bridge`、独立 `models` 目录等）与实际仓库不一致。AI 以**实际代码**为准，不要按 README 创建不存在的目录。
8. **既有 model 命名未对齐新规范（迁移项）**：既有 `pages/Login/models.ts` + `useModel('useLogin')` 与本文 §3.3 规定的 `pages/<Page>/model.ts` + `useModel('<page>.model')` 不一致。AI 生成**新**页面须严格遵循新规范；既有页面建议后续迁移，迁移时同步更新所有 `useModel` 调用点。

---

## 9 · AI 修改检查清单

AI 完成任意代码改动前，逐项自检：

| # | 检查项 | 通过标准 |
| --- | --- | --- |
| 1 | 路由/页面新增 | 已在 `router.config.ts` 注册，路径非空悬 |
| 2 | 接口封装 | 落在 `services/<域>/index.ts`，**顶部** `export * from './types'`，导出 `fetchXxx` |
| 3 | 参数传参 | GET→`params`，POST→`data`；表单请求带 `requestType:'form'`，无混用 |
| 4 | 页级 model | 文件 `pages/<Page>/model.ts`（单数）；命名空间 `'<page>.model'`；无幽灵键 |
| 5 | useRequest 解构 | `data:xxxxData` / `run:loadXxxx` / `mutate:mutateXxxx` |
| 6 | 样式适配 | 静态 CSS 写 px 交 postcss；动态尺寸用 `pxToVw`；颜色用 theme 变量 |
| 7 | 命名 | 符合 §4 表（组件 PascalCase、service camelCase、常量 SCREAMING_SNAKE） |
| 8 | 类型 | 尽量真实类型，不整文件 `@ts-nocheck`，不复制无关类型 |
| 9 | 错误处理 | 仅走统一拦截器 / `toast()`，不重复写 Toast 错误分支 |
| 10 | 密钥 | 无新增明文密钥；如需则用 define/环境变量 |
| 11 | 质量 | 单引号、空格缩进，能通过 Biome + Prettier |
| 12 | 跳转 | 使用 `router.push/replace`，无 `window.location` 直跳 |

> **一句话总纲**：新增代码"长得像"现有代码：Umi Max 约定优先、service/model/component 分层清晰、Less + px→vw 适配、Biome 单引号、`fetchXxx`/`useXxx` 命名、`<page>.model` 命名空间、解构 `xxxxData/loadXxxx/mutateXxxx`，且绝不复刻 §8 的反模式。

---

## 10 · 修订记录

本版（v1.0）相对预览版的关键修正：

- **§3.2** 修正：`export * from './types'` 位置由"尾部"改为**顶部**（与现有 `services/user/index.ts` 实际写法一致）。
- **§3.2** 新增：参数统一规则 `GET→params / POST→data`，明确禁止 POST 用 `params`，补充正/反例。
- **§3.3** 修正：页级 model 路径由 `pages/X/models.ts` 改为**单数** `pages/<Page>/model.ts`；命名空间由 `useXxx` 改为 `'<page>.model'`，消费示例 `useModel('pageA.model')`。
- **§3.3** 新增：`useRequest` 解构命名三要素 `data:xxxxData` / `run:loadXxxx` / `mutate:mutateXxxx`（小写开头 + 前缀约定）。
- **§8** 新增第 ⑧ 条：标注既有 `Login/models.ts` + `useModel('useLogin')` 未对齐新规范，列为迁移项。
