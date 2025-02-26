<div id="top" align="center" style="text-align:center;">
<h1>
  <img src="./public/logo.png" alt="electron-vue" width="428" />
  <br> 即时通讯应用 - Electron+Vue+Vite+TypeScript

  ![electron version](https://img.shields.io/github/package-json/dependency-version/heliomarpm/electron-vuevite-quick-start/dev/electron)
  ![electron builder version](https://img.shields.io/github/package-json/dependency-version/heliomarpm/electron-vuevite-quick-start/dev/electron-builder)
  ![vite version](https://img.shields.io/github/package-json/dependency-version/heliomarpm/electron-vuevite-quick-start/dev/vite)
  ![vue version](https://img.shields.io/github/package-json/dependency-version/heliomarpm/electron-vuevite-quick-start/vue)
  ![typescript version](https://img.shields.io/github/package-json/dependency-version/heliomarpm/electron-vuevite-quick-start/dev/typescript)
  ![electron vite version](https://img.shields.io/github/package-json/dependency-version/heliomarpm/electron-vuevite-quick-start/dev/sass)
</h1>

<p>
  <!-- PixMe -->
  <a href="https://www.pixme.bio/heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="pixme url" src="https://img.shields.io/badge/donate%20on-pixme-1C1E26?style=for-the-badge&labelColor=1C1E26&color=28f4f4"/>
  </a>
  <!-- PayPal -->
  <a href="https://bit.ly/paypal-sponsor-heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="paypal url" src="https://img.shields.io/badge/paypal-1C1E26?style=for-the-badge&labelColor=1C1E26&color=0475fe"/>
  </a>
  <!-- Ko-fi -->
  <a href="https://ko-fi.com/heliomarpm" target="_blank" rel="noopener noreferrer">
    <img alt="kofi url" src="https://img.shields.io/badge/kofi-1C1E26?style=for-the-badge&labelColor=1C1E26&color=ff5f5f"/>
  </a>
  <!-- LiberaPay -->  
  <a href="https://liberapay.com/heliomarpm" target="_blank" rel="noopener noreferrer">
     <img alt="liberapay url" src="https://img.shields.io/badge/liberapay-1C1E26?style=for-the-badge&labelColor=1C1E26&color=f6c915"/>
  </a>
  <!-- Version -->
  <a href="https://github.com/heliomarpm/electron-vuevite-quick-start/releases" target="_blank" rel="noopener noreferrer">
     <img alt="releases url" src="https://img.shields.io/github/v/release/heliomarpm/electron-vuevite-quick-start?style=for-the-badge&labelColor=1C1E26&color=2ea043"/>
  </a>  
  <!-- License -->
  <a href="https://github.com/heliomarpm/electron-vuevite-quick-start/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
    <img alt="license url" src="https://img.shields.io/badge/license%20-MIT-1C1E26?style=for-the-badge&labelColor=1C1E26&color=61ffca"/>
  </a>
</p>
</div>

# 即时通讯应用

这是一个基于 Electron + Vue 3 + Vite + TypeScript 构建的现代化即时通讯应用程序。它提供了丰富的聊天功能、联系人管理和实时消息传递能力。

## 功能特点

- **用户认证**：登录、注册和用户信息管理
- **联系人管理**：
  - 好友列表展示
  - 组织架构浏览
  - 添加好友功能
  - 好友请求处理
- **即时通讯**：
  - 实时消息发送和接收
  - 消息状态跟踪（发送中、已发送、已送达、已读、发送失败）
  - 消息重发功能
  - 输入状态提示（"正在输入..."）
- **UI 组件**：
  - 自定义 Toast 通知系统
  - 异步图片加载
  - 响应式布局

## 技术栈

- **前端框架**：Vue 3 + TypeScript
- **构建工具**：Vite
- **桌面应用框架**：Electron
- **样式**：Tailwind CSS
- **状态管理**：Pinia
- **实时通信**：Socket.IO
- **UI 组件**：自定义组件 + shadcn-vue

## 项目结构

```
src/
├── api/                 # API 请求模块
├── assets/              # 静态资源
├── components/          # 通用组件
│   └── ui/              # UI 组件库
│       └── toast/       # Toast 通知组件
├── router/              # 路由配置
├── services/            # 服务层
│   ├── message.ts       # 消息服务
│   ├── toast.ts         # Toast 服务
│   └── ws.ts            # WebSocket 服务
├── stores/              # Pinia 状态管理
│   ├── chat.ts          # 聊天状态
│   ├── message.ts       # 消息状态
│   └── user.ts          # 用户状态
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数
└── views/               # 页面组件
    ├── Contacts/        # 联系人页面
    └── Home/            # 主页/聊天页面
```

## 核心功能实现

### WebSocket 通信

应用使用 Socket.IO 实现实时通信，主要功能包括：

- 消息发送和接收
- 好友请求通知
- 输入状态同步
- 消息状态更新

### 状态管理

使用 Pinia 进行状态管理，主要包括：

- `chatStore`：管理聊天会话列表和未读消息计数
- `messageStore`：管理消息存储、状态更新和重发功能
- `userStore`：管理用户信息和认证状态

### UI 组件

自定义了一套 UI 组件，包括：

- Toast 通知系统：支持成功、错误、警告和信息提示
- 异步图片加载组件
- 消息气泡组件
- 组织架构树形组件

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm start
```

### 构建应用

```bash
npm run build
```

### 发布应用

```bash
npm run deploy
```

## 贡献指南

请阅读 [贡献指南](https://github.com/heliomarpm/electron-vuevite-quick-start/blob/master/docs/CONTRIBUTING.md) 了解如何为项目做出贡献。

## 许可证

[MIT © Heliomar P. Marques](https://github.com/heliomarpm/electron-vuevite-quick-start/blob/main/LICENSE) <a href="#top">🔝</a>
