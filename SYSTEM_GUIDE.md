# 匿名員工調查系統 - 系統指南

## 系統概述

本系統是一套完全匿名的線上員工滿意度調查平台，設計用於收集員工意見同時確保隱私保護。系統採用精緻編輯美學，提供高端、知性的用戶體驗。

## 核心特性

### 1. 完全匿名設計
- **不記錄身份識別資訊**：系統不收集 IP 位址、User-Agent、Cookie 或任何其他可識別填寫者身份的資訊
- **匿名回答儲存**：所有回答僅與調查 ID 和題目 ID 關聯，無法追蹤到個人
- **隱私優先**：隱私保護是系統架構的核心原則

### 2. 多題型支援
- **單選題**：員工選擇一個選項
- **多選題**：員工可選擇多個選項
- **評分量表**：1-5 星評分系統
- **開放式文字題**：員工可自由填寫意見

### 3. 管理員後台
- **密碼保護**：使用安全的 JWT 令牌驗證
- **即時統計**：查看調查回覆統計與分佈
- **圖表視覺化**：長條圖和圓餅圖展示數據
- **CSV 匯出**：將結果匯出為 CSV 檔案進行進一步分析

### 4. 高端美學設計
- **乳白色背景**：柔和的 cream 色調
- **Didone 襯線字體**：超大粗體標題（Bodoni Moda）
- **優雅襯線字體**：副標題與正文（Lora）
- **非對稱版面**：大量留白與視覺層級

## 技術架構

### 前端
- **React 19** + **Tailwind CSS 4**：現代化的 UI 框架
- **tRPC**：端到端類型安全的 API 調用
- **Recharts**：數據視覺化圖表
- **Wouter**：輕量級路由

### 後端
- **Express 4**：Web 伺服器
- **tRPC 11**：RPC 框架
- **Drizzle ORM**：資料庫 ORM
- **JWT (jose)**：令牌驗證
- **bcryptjs**：密碼雜湊

### 資料庫
- **MySQL/TiDB**：關聯式資料庫
- **表結構**：
  - `surveys`：調查問卷基本資訊
  - `questions`：調查題目
  - `responses`：匿名回答（不包含身份識別欄位）
  - `adminPasswords`：管理員密碼雜湊

## 使用流程

### 員工端
1. 訪問調查連結（例：`/survey/survey-slug`）
2. 查看調查標題與描述
3. 逐題填寫回答（支援多題型）
4. 提交調查（無需登入）
5. 收到成功提交確認

### 管理員端
1. 訪問 `/admin` 進入登入頁面
2. 輸入管理密碼（首次登入時設定）
3. 進入儀表板查看統計結果
4. 查看圖表、列表與開放式回答
5. 匯出 CSV 檔案進行分析
6. 登出

## API 端點

### 公開端點（無需驗證）

#### `survey.getBySlug`
獲取調查問卷及其題目
```
POST /api/trpc/survey.getBySlug
{
  "json": { "slug": "survey-slug" }
}
```

#### `survey.submitResponse`
提交匿名調查回答
```
POST /api/trpc/survey.submitResponse
{
  "json": {
    "slug": "survey-slug",
    "responses": [
      { "questionId": 1, "answer": "選項 A" },
      { "questionId": 2, "answer": "5" }
    ]
  }
}
```

#### `admin.verifyPassword`
驗證管理員密碼
```
POST /api/trpc/admin.verifyPassword
{
  "json": { "password": "admin-password" }
}
```

### 受保護端點（需要 JWT 令牌）

#### `survey.getStats`
獲取調查統計結果
```
POST /api/trpc/survey.getStats
Headers: Authorization: Bearer <token>
{
  "json": { "surveyId": 1 }
}
```

#### `admin.changePassword`
變更管理員密碼
```
POST /api/trpc/admin.changePassword
Headers: Authorization: Bearer <token>
{
  "json": {
    "oldPassword": "old-password",
    "newPassword": "new-password"
  }
}
```

## 隱私與安全

### 隱私保護措施
1. **不收集身份識別資訊**：系統架構從根本上排除了 IP、User-Agent 等識別資訊
2. **匿名回答儲存**：回答表中無用戶 ID 或身份欄位
3. **無 Cookie 追蹤**：不使用 Cookie 追蹤填寫者
4. **無 Session 綁定**：每份回答都是獨立的匿名記錄

### 安全措施
1. **密碼雜湊**：使用 bcryptjs 進行密碼雜湊（10 rounds）
2. **JWT 令牌**：使用 HS256 算法簽署，有效期 7 天
3. **HTTPS 加密**：所有通訊都通過 HTTPS 加密
4. **SQL 注入防護**：使用 Drizzle ORM 防止 SQL 注入
5. **CSRF 防護**：使用 SameSite Cookie 屬性

## 部署與配置

### 環境變數
```
DATABASE_URL=mysql://user:password@host/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
```

### 首次部署
1. 建立資料庫表：`pnpm drizzle-kit migrate`
2. 啟動開發伺服器：`pnpm dev`
3. 訪問 `/admin` 設定管理員密碼

### 生產部署
1. 執行 `pnpm build`
2. 執行 `pnpm start` 啟動生產伺服器
3. 配置反向代理（Nginx、Cloudflare 等）

## 常見問題

### Q: 系統如何確保完全匿名？
A: 系統在多個層面確保匿名性：
- 後端不記錄 IP 或其他識別資訊
- 資料庫中回答表無身份欄位
- 前端不發送任何識別資訊
- 每份回答都是獨立的匿名記錄

### Q: 管理員密碼丟失怎麼辦？
A: 需要直接訪問資料庫，刪除 `adminPasswords` 表中的記錄，然後重新設定密碼。

### Q: 如何備份調查結果？
A: 可以通過管理員後台匯出 CSV 檔案，或直接備份資料庫。

### Q: 系統支援多少個調查同時進行？
A: 理論上無限制，但建議根據伺服器資源進行評估。

## 故障排除

### 調查無法提交
- 檢查調查是否為 `active` 狀態
- 檢查題目是否正確配置
- 查看瀏覽器控制台錯誤訊息

### 管理員無法登入
- 確認密碼輸入正確
- 檢查 JWT_SECRET 環境變數是否正確配置
- 清除瀏覽器 localStorage 重試

### 統計數據不顯示
- 確認調查 ID 正確
- 檢查是否有回答提交
- 查看伺服器日誌中的錯誤

## 支援與反饋

如有任何問題或建議，請聯絡系統管理員或提交 Issue。

---

**From Life To Lines | 匿名調查系統**
隱私優先，設計精緻，數據安全。
