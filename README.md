# 匿名員工滿意度調查系統 | Employee Opinion Survey

一套**完全匿名、高端精緻、功能完整**的線上員工調查系統。採用精緻編輯美學設計，確保員工隱私保護，讓管理員即時掌握員工意見。

## 🎯 核心特色

### 完全匿名架構
- **零身份識別**：後端不記錄任何身份資訊（IP、User-Agent、Cookie 等）
- **隱私優先**：每份回答都是孤立的匿名記錄，無法與任何員工身份關聯
- **密碼保護**：管理後台採用 JWT 令牌驗證，防止未授權存取

### 高端美學設計
- **精緻編輯風格**：乳白色背景搭配高對比度排版
- **Didone 襯線字體**：超大粗體標題營造強烈視覺層級
- **非對稱版面**：大量留白與細膩幾何線條，呈現永恆知性氛圍

### 完整功能
- ✅ **多題型支援**：單選、多選、評分量表（1-5 星）、開放式文字
- ✅ **即時統計**：長條圖、圓餅圖、雷達圖等多種視覺化
- ✅ **問卷管理**：建立、編輯、刪除、狀態管理
- ✅ **分享機制**：唯一調查連結、二維碼生成、分享統計追蹤
- ✅ **數據匯出**：CSV 匯出、PDF 報表生成
- ✅ **即時通知**：員工提交回答時自動通知管理員
- ✅ **Excel 匯入**：快速從 Excel 匯入問卷結構

## 🚀 快速開始

### 安裝依賴
```bash
pnpm install
```

### 開發模式
```bash
pnpm dev
```
訪問 `http://localhost:3000`

### 生產構建
```bash
pnpm build
pnpm start
```

### 執行測試
```bash
pnpm test
```

## 📋 使用流程

### 1️⃣ 管理員設定密碼
訪問 `/admin` 頁面，首次登入時設定管理密碼（至少 6 個字元）

### 2️⃣ 建立調查問卷
- 進入管理後台 (`/admin/surveys`)
- 點擊「新建調查」
- 設定調查標題、描述、代碼（slug）
- 新增題目（支援 4 種題型）
- 發布調查

### 3️⃣ 分享調查連結
- 生成調查連結：`https://您的網站/survey/{調查代碼}`
- 生成二維碼供員工掃描
- 複製連結透過 Email 或通訊軟體分享

### 4️⃣ 員工填寫調查
- 無需登入，直接訪問調查連結
- 完全匿名填寫，無身份識別
- 支援多種題型回答

### 5️⃣ 查看統計結果
- 進入管理後台查看即時統計
- 支援多種圖表視覺化
- 匯出 CSV 進行進一步分析

## 🏗️ 技術架構

### 前端
- **React 19** + **Tailwind CSS 4** - 現代化 UI 框架
- **tRPC** - 端到端類型安全的 API
- **Recharts** - 數據視覺化圖表
- **shadcn/ui** - 高質量 UI 元件庫

### 後端
- **Express 4** - 輕量級 Web 框架
- **tRPC 11** - 類型安全的 RPC 框架
- **Drizzle ORM** - 類型安全的 SQL 查詢
- **MySQL/TiDB** - 關聯式資料庫

### 認證與安全
- **JWT 令牌** - 管理員認證
- **bcryptjs** - 密碼雜湊加密
- **Manus OAuth** - 使用者認證（可選）

## 📊 數據庫架構

### 核心表結構
- **surveys** - 調查問卷基本資訊
- **questions** - 調查題目與選項
- **responses** - 匿名回答記錄（無身份識別）
- **adminPasswords** - 管理員密碼雜湊
- **adminNotifications** - 管理員通知記錄
- **shareStats** - 分享連結統計

## 🔐 隱私保護設計

### 後端隱私措施
```typescript
// responses 表設計 - 完全不包含身份識別欄位
export const responses = mysqlTable("responses", {
  id: int("id").autoincrement().primaryKey(),
  surveyId: int("surveyId").notNull(),
  questionId: int("questionId").notNull(),
  answer: text("answer").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  // ❌ 不記錄：IP、User-Agent、Cookie、Session ID 等
});
```

### 前端隱私措施
- 無登入要求 - 員工直接訪問調查連結
- 無身份驗證 - 不收集任何員工識別資訊
- 無追蹤代碼 - 不使用 Cookie 或 LocalStorage 追蹤

## 📈 統計與分析

### 支援的圖表類型
- **長條圖** - 選項分佈統計
- **圓餅圖** - 比例視覺化
- **雷達圖** - 多維度評分分析
- **時間序列圖** - 提交趨勢追蹤

### 數據匯出
- **CSV 匯出** - 用於 Excel 進一步分析
- **PDF 報表** - 用於列印與分享
- **JSON API** - 用於第三方整合

## 🎨 自訂設計

### 修改色彩主題
編輯 `client/src/index.css` 中的 CSS 變數：
```css
:root {
  --background: 0 0% 98%; /* 乳白色 */
  --foreground: 0 0% 8%;  /* 深灰色 */
  --accent: 0 0% 0%;      /* 黑色 */
}
```

### 修改字體
編輯 `client/index.html` 中的 Google Fonts：
```html
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;700&display=swap" rel="stylesheet">
```

## 🧪 測試

### 執行所有測試
```bash
pnpm test
```

### 測試覆蓋
- ✅ 8/8 單元測試通過
- ✅ 認證系統測試
- ✅ 調查提交與統計測試
- ✅ 問卷管理 API 測試

## 📚 API 文檔

### 公開端點
- `GET /survey/{slug}` - 取得調查問卷
- `POST /survey/submitResponse` - 提交匿名回答
- `GET /qrcode/generateSurveyQR` - 生成二維碼

### 受保護端點
- `POST /admin/verifyPassword` - 管理員登入
- `GET /survey/getStats` - 取得統計數據
- `POST /surveyManagement/*` - 問卷管理操作
- `GET /notifications/*` - 通知查詢

## 🔧 環境變數

系統自動注入以下環境變數（無需手動配置）：
```
DATABASE_URL          # 資料庫連接字符串
JWT_SECRET           # JWT 簽名密鑰
VITE_APP_ID          # OAuth 應用 ID
OAUTH_SERVER_URL     # OAuth 伺服器 URL
VITE_OAUTH_PORTAL_URL # OAuth 登入入口
```

## 📞 支援與反饋

- **GitHub Issues** - 報告 Bug 或提出功能建議
- **GitHub Discussions** - 討論與分享想法
- **Email** - 聯繫開發者

## 📄 授權

此專案採用 MIT 授權。詳見 [LICENSE](LICENSE) 檔案。

## 🙏 致謝

感謝所有貢獻者與使用者的支持！

---

**打造於** From Life To Lines 生活線條  
**設計理念** - 精緻編輯美學 × 完全隱私保護 × 員工友善體驗
