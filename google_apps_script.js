/**
 * 伯堅股份有限公司 - 員工滿意度調查表 - Google Apps Script 後端腳本
 *
 * 【設定說明】
 * 1. 開啟您的 Google 雲端硬碟，建立一個新的「Google 試算表」。
 * 2. 點擊選單的「擴充功能」 > 「Apps Script」。
 * 3. 刪除原本的 `myFunction` 程式碼，並將此檔案內容完整複製貼上。
 * 4. 修改下方 `ADMIN_PASSWORD` 為您的管理密碼（用來在網頁解鎖看圖表）。
 * 5. 點擊右上角「部署」 > 「新增部署」。
 * 6. 選取類型為「網頁應用程式」。
 * 7. 「誰有權存取」設定為「所有人」(Anyone)。
 * 8. 點擊「部署」，授予必要的 Google 帳號權限，並複製產生的「網頁應用程式 URL」。
 * 9. 將該 URL 貼回 `index.html` 中的 `API_URL` 變數中即可。
 */

// 🔒 請在此處設定您的管理者登入密碼
const ADMIN_PASSWORD = "Bg20840381";

// 處理跨網域 (CORS) 的回應輔助函式
function createCorsResponse(data) {
  try {
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    // 萬一序列化失敗，回傳最基礎的錯誤 JSON，確保瀏覽器不會因為 CORS 阻擋而看不到錯誤訊息
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: "序列化回應失敗: " + err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 處理 OPTIONS 預檢請求
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// 處理 POST 請求
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createCorsResponse({ success: false, message: "無效的請求內容" });
    }

    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // 1. 提交問卷
    if (action === "submit") {
      // 避免使用 getActiveSheet()（因為管理者若開著其他分頁，會寫錯分頁），一律使用第一個分頁
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      
      // 如果試算表是空的，寫入標題列 (15 題 + 提交時間)
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "提交時間",
          "1. 任職時間 (單選)",
          "2. 目前工作量看法 (單選)",
          "3. 薪資福利考慮因素 (複選)",
          "4. 公司最大吸引力 (複選)",
          "5. 希望的培訓方向 (複選)",
          "6. 對部門主管認同度 (單選)",
          "7. 主管工作分配公平性 (單選)",
          "8. 清楚明白工作目標 (單選)",
          "9. 部門存在的主要問題 (複選)",
          "10. 公司存在的主要問題 (複選)",
          "11. 公司硬體設備改善 (複選)",
          "12. 對公司總體感覺 (單選)",
          "13. 希望人資部門給予幫助 (單選)",
          "14. 希望福委會增加福利 (複選)",
          "15. 具體建議與意見 (開放式)"
        ]);
      }

      // 寫入問卷內容 (完全不記錄 IP、Email 等個人資訊)
      sheet.appendRow([
        new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
        postData.q1 || "",
        postData.q2 || "",
        postData.q3 || "",
        postData.q4 || "",
        postData.q5 || "",
        postData.q6 || "",
        postData.q7 || "",
        postData.q8 || "",
        postData.q9 || "",
        postData.q10 || "",
        postData.q11 || "",
        postData.q12 || "",
        postData.q13 || "",
        postData.q14 || "",
        postData.q15 || ""
      ]);

      return createCorsResponse({ success: true, message: "問卷提交成功！感謝您的寶貴意見。" });
    }

    // 2. 管理者讀取統計數據
    if (action === "fetchData") {
      const password = postData.password;
      if (password !== ADMIN_PASSWORD) {
        return createCorsResponse({ success: false, message: "密碼錯誤！無法載入數據。" });
      }

      // 一律讀取第一個分頁，避免受到管理者當前在 Google 試算表網頁開啟哪個分頁影響
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
      const lastRow = sheet.getLastRow();
      
      if (lastRow <= 1) {
        return createCorsResponse({ success: true, data: [] }); // 沒有數據
      }

      // 取得第 2 列到最後一列，動態讀取欄位數，避免欄位不足時崩潰
      const lastColumn = Math.max(sheet.getLastColumn(), 1);
      const range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
      const values = range.getValues();

      // 安全地轉換每一列數據為字串，防止包含非 JSON 格式物件（例如 Date、錯誤物件等）導致 JSON.stringify 崩潰
      const data = values.map(row => {
        let timestampStr = "";
        if (row[0]) {
          if (row[0] instanceof Date) {
            try {
              timestampStr = Utilities.formatDate(row[0], "Asia/Taipei", "yyyy/MM/dd HH:mm:ss");
            } catch (dateErr) {
              timestampStr = row[0].toString();
            }
          } else {
            timestampStr = row[0].toString();
          }
        }
        
        // 輔助函式，確保儲存格內容轉為乾淨的字串
        const cellToStr = (val) => {
          if (val === null || val === undefined) return "";
          return val.toString();
        };

        return {
          timestamp: timestampStr,
          q1: cellToStr(row[1]),
          q2: cellToStr(row[2]),
          q3: cellToStr(row[3]),
          q4: cellToStr(row[4]),
          q5: cellToStr(row[5]),
          q6: cellToStr(row[6]),
          q7: cellToStr(row[7]),
          q8: cellToStr(row[8]),
          q9: cellToStr(row[9]),
          q10: cellToStr(row[10]),
          q11: cellToStr(row[11]),
          q12: cellToStr(row[12]),
          q13: cellToStr(row[13]),
          q14: cellToStr(row[14]),
          q15: cellToStr(row[15])
        };
      });

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
