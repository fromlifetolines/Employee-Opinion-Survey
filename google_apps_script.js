/**
 * 員工意見調查 - Google Apps Script 後端腳本
 *
 * 【設定說明】
 * 1. 開啟您的 Google 雲端硬碟，建立一個新的「Google 試算表」。
 * 2. 點擊選單的「擴充功能」 > 「Apps Script」。
 * 3. 刪除原本的 `myFunction` 程式碼，並將此檔案內容完整複製貼上。
 * 4. 修改下方 `ADMIN_PASSWORD` 為您的管理密碼（用來在網頁解鎖看圖表）。
 * 5. 點擊右上角「部署」 > 「新增部署」。
 * 6. 選取類型為「網頁應用程式」。
 * 7. 「誰有權存取」設定為「所有人」(Anyone)（這樣員工才能匿名提交）。
 * 8. 點擊「部署」，授予必要的 Google 帳號權限，並複製產生的「網頁應用程式 URL」。
 * 9. 將該 URL 貼回 `index.html` 中的 `API_URL` 變數中即可。
 */

// 🔒 請在此處設定您的管理者登入密碼（可用於解鎖網頁圖表與導出數據）
const ADMIN_PASSWORD = "admin-survey-pwd";

// 處理跨網域 (CORS) 的回應輔助函式
function createCorsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// 處理 OPTIONS 請求（瀏覽器 CORS 預檢請求）
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// 處理 POST 請求
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // 1. 提交問卷
    if (action === "submit") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      
      // 如果試算表是空的，先寫入標題列
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "提交時間", 
          "整體工作滿意度", 
          "工作環境與資源", 
          "團隊溝通與協作", 
          "具體意見與改進建議"
        ]);
      }

      // 寫入問卷內容 (完全不記錄 IP、Email 等個人資訊)
      sheet.appendRow([
        new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
        postData.q1, // 整體滿意度 (數字 1-5)
        postData.q2, // 工作環境 (數字 1-5)
        postData.q3, // 團隊溝通 (數字 1-5)
        postData.q4  // 開放式建議 (字串)
      ]);

      return createCorsResponse({ success: true, message: "問卷提交成功！感謝您的寶貴意見。" });
    }

    // 2. 管理者讀取統計數據
    if (action === "fetchData") {
      const password = postData.password;
      if (password !== ADMIN_PASSWORD) {
        return createCorsResponse({ success: false, message: "密碼錯誤！無法載入數據。" });
      }

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const lastRow = sheet.getLastRow();
      
      if (lastRow <= 1) {
        return createCorsResponse({ success: true, data: [] }); // 沒有數據
      }

      const range = sheet.getRange(2, 1, lastRow - 1, 5); // 取得第 2 列到最後一列，共 5 欄
      const values = range.getValues();

      const data = values.map(row => ({
        timestamp: row[0],
        q1: Number(row[1]),
        q2: Number(row[2]),
        q3: Number(row[3]),
        q4: row[4]
      }));

      return createCorsResponse({ success: true, data: data });
    }

    return createCorsResponse({ success: false, message: "未知的操作指令" });

  } catch (error) {
    return createCorsResponse({ success: false, message: "伺服器錯誤: " + error.toString() });
  }
}

// 支援 GET 請求，方便管理測試
function doGet(e) {
  return createCorsResponse({ 
    status: "ok", 
    message: "Google Apps Script 運作正常！請使用 POST 方法進行提交與查詢。" 
  });
}
