# 制作与打包

脚本以自身位置定位仓库，可在 Windows、macOS、Linux 使用，不依赖原作者的本机目录、Codex 安装路径、登录状态或 API 密钥。

## 环境

- Node.js 20.9 或更新的兼容版本；`sharp` 版本锁定在 package.json。
- Python 3.9 或更新版本，仅打包时需要，使用标准库。
- 系统图标牌面的少量文字优先使用 DejaVu Sans 字体；缺少时字体回退可能造成轻微差异。

在仓库根目录运行：

```sh
npm install
npm run validate
npm run build
npm run preview
python scripts/package.py
```

## 每个命令做什么

- `validate`：检查当前 `whalechan/` 的 106 个图标、PNG 尺寸/透明通道、空白占位、配置引用、23 个功能角标及原素材哈希。
- `build`：从 `assets/` 的最终原画、系统标志和 SVG 角标重建 102 个角色图标，输出到 `build/whalechan/`，并验证结果。背景、选中框、箭头、鼠标、透明占位直接从 `whalechan/` 复制。不会覆盖当前成品目录。
- `preview`：用当前 `whalechan/` 更新 `docs/icon-catalog.html`，包含全部系统及功能图标。查看构建结果可运行 `node scripts/preview.cjs build/whalechan`。
- `package.py`：输出 `dist/refind-theme-whalechan-GitHub.zip`（仓库与原素材）和 `dist/Whale-chan-rEFInd-theme.zip`（安装主题），并逐文件验证压缩包。安装包默认取当前 `whalechan/`，只包含运行资源；版权文件放在压缩包根目录，不进入主题目录。

原画的 AI 生成步骤不由脚本自动重跑；仓库保存最终原画与提示词，构建流程只负责 SVG 排版、缩放与打包。不同系统字体或图形库可能导致重建 PNG 的字节不同；已发布图片可直接使用。

## 修改素材后的流程

1. 编辑 `assets/art/`、`assets/badges/` 或 `assets/os-logos/` 中相应文件。
2. 确认改动后运行 `npm run manifest` 更新素材哈希。
3. 运行 `npm run build`，用 `node scripts/preview.cjs build/whalechan` 查看结果。
4. 满意后把 `build/whalechan/` 中的成品复制回 `whalechan/`，再打包，使仓库与安装包一致。

如果只想打包测试用安装包，可使用 `python scripts/package.py --theme build/whalechan`；此时 GitHub 包仍包含当前已签入的 `whalechan/`，不会自动将测试结果写回仓库。

新增文件时还需同步修改 `assets/icon-map.json`、素材清单和验证器的预期覆盖数量；当前脚本以本主题的 106 个图标为明确范围。

`docs/function-icons.png` 是发布时的功能图标总览；日常重新预览用 HTML 图鉴，不要求安装浏览器或中文字体截图工具。
