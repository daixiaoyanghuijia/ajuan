# 个人主页

一个纯静态的个人主页：只用 HTML + CSS + 原生 JavaScript，没有任何第三方依赖，也不需要构建工具，双击 `ajuan.html` 就能打开。

## 目录结构

```
个人主页/
├── ajuan.html        # 页面结构与内容（入口，所有文字都改这里）
├── css/
│   └── style.css     # 样式表：设计变量在最上方，改主题色只改这里
├── js/
│   └── main.js       # 交互脚本：主题切换、导航、滚动动画、表单校验
├── assets/
│   ├── avatar.svg    # 头像占位图，换成自己的照片时替换此文件
│   └── favicon.svg   # 浏览器标签页图标
└── README.md
```

## 怎么改成自己的内容

所有需要替换的文字都集中在 `ajuan.html`，按顺序改这几处即可：

1. `<head>` 里的 `description` 和 `<title>`。
2. 头部 `logo__text` 与首屏 `hero__title`（名字）。
3. 首屏的 `hero__subtitle`、`hero__intro`、`hero__meta`（身份、简介、所在地等）。
4. 项目区块里三张 `.project-card` 的标题、描述、技术标签和链接。
5. 关于我（`.about`）、技能（`.skill-group`）、联系方式三块。
6. 页脚的版权信息与链接。

头像替换：把 `assets/avatar.svg` 换名为 `assets/avatar.jpg`（或保留 SVG），再同步修改 `ajuan.html` 中 `<img class="avatar">` 的 `src`。

## 换配色

打开 `css/style.css`，文件最上方的 `:root` 与 `[data-theme="dark"]` 定义了全部颜色变量。改 `--color-primary`、`--color-accent` 就能整体换色，其余样式会自动跟随。

## 内置功能

- 深色 / 浅色主题切换，记忆用户选择，未选择时跟随系统设置
- 响应式布局：桌面、平板、手机三档；手机上导航折叠为下拉菜单
- 滚动时自动高亮当前栏目，内容区块淡入出现
- 返回顶部按钮、键盘可访问（跳转链接、焦点样式、Esc 关闭菜单）
- 尊重系统「减少动态效果」设置
- 联系表单做前端校验，通过后唤起本机邮件客户端（纯静态站点无后端）

## 打开方式

- 直接双击 `ajuan.html`。
- 或者在当前目录启动一个本地服务（任意静态服务器均可），例如 `python -m http.server`，然后访问 `http://localhost:8000/ajuan.html`。

## 想上线的话

把这个文件夹传到 GitHub 仓库，在仓库 Settings → Pages 中选择分支根目录即可发布。若希望访问根路径就打开主页，把 `ajuan.html` 复制一份命名为 `index.html`。
