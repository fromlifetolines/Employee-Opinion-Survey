/**
 * 伯堅股份有限公司 - 員工敬業度暨滿意度調查表 - Google Apps Script 後端腳本
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
const ADMIN_PASSWORD = "admin-survey-pwd";

// 處理跨網域 (CORS) 的回應輔助函式
function createCorsResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// 處理 OPTIONS 預檢請求
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.TEXT
  );
}

// 處理 POST 請求
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    // 1. 提交問卷
    if (action === "submit") {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

      // 如果試算表是空的，寫入標題列 (36 題 + 提交時間 = 37 欄)
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "提交時間",
          "一、在職年資 (單選)",
          "一、所屬部門 (單選)",
          "二-1. 我清楚了解自己的年度目標以及如何衡量我的表現 (5-1分)",
          "二-2. 目前的工作量雖然有挑戰，但在合理的範圍內 (5-1分)",
          "二-3. 我擁有足夠的設備、工具與授權來完成工作 (5-1分)",
          "二-4. 其他關於工作效能與資源的建議 (文字)",
          "三-1. 我的直接主管能提供具體的指導與專業支持 (5-1分)",
          "三-2. 主管在分配工作時是公平且合理的 (5-1分)",
          "三-3. 在部門內，我可以放心提出不同意見而無後顧之憂 (5-1分)",
          "三-4. 其他關於主管管理的建議 (文字)",
          "四-1. 部門間能為了共同目標合作，而非各自為政 (5-1分)",
          "四-2. 我能輕易獲取其他部門的資訊，不會感到溝通斷層 (5-1分)",
          "四-3. 當跨部門意見分歧時，公司有合理的解決機制 (5-1分)",
          "四-4. 其他關於跨部門協作的建議 (文字)",
          "五-1. 公司的各項規章制度在各部門執行標準一致 (5-1分)",
          "五-2. 公司的決策訊息或制度變更，能及時且透明地傳達給員工 (5-1分)",
          "五-3. 公司的績效考核制度是公平、公正且有客觀依據的 (5-1分)",
          "五-4. 我認為目前的請假、報支等行政手續是簡便而不繁瑣的 (5-1分)",
          "五-5. 其他關於管理制度的建議 (文字)",
          "六-1. 我清楚了解公司內部晉升或加薪的路徑與標準 (5-1分)",
          "六-2. 公司的薪資及獎勵制度能反映我的實際貢獻與績效 (5-1分)",
          "六-3. 在伯堅工作，我能看到未來的職涯成長空間 (5-1分)",
          "六-4. 其他關於薪酬與升遷的建議 (文字)",
          "七-1. 我對公司的發展策略有信心，並認同公司文化 (5-1分)",
          "七-2. 我會向親友推薦伯堅是一間值得加入的公司 (5-1分)",
          "七-3. 如果有其他公司提供更高薪水，我仍願意留在伯堅 (5-1分)",
          "七-4. 其他關於公司文化或向心力的建議 (文字)",
          "八-1. 您認為目前最阻礙您發揮效率的因素是？(複選，最多3項)",
          "九-1. 我對公司目前舉辦福利活動的頻率感到滿意 (5-1分)",
          "九-2. 我認為目前的福利活動有助於增進同事間的情感 (5-1分)",
          "九-3. 我對公司提供的節慶禮金/禮品感到滿意 (5-1分)",
          "九-4. 您最感興趣的活動類型是？(複選)",
          "九-5. 其他關於福利活動的建議 (文字)",
          "十-1. 如果明天您可以改變公司的一件事，那會是什麼？(文字)",
          "十-2. 您認為公司目前「最值得保留」的優點是什麼？(文字)",
          "十-3. 其他任何想對董事長說的話 (文字)",
        ]);
      }

      // 寫入問卷內容 (完全不記錄 IP、Email 等個人資訊)
      sheet.appendRow([
        new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
        postData.seniority || "",
        postData.department || "",
        postData.q2_1 || "",
        postData.q2_2 || "",
        postData.q2_3 || "",
        postData.q2_4 || "",
        postData.q3_1 || "",
        postData.q3_2 || "",
        postData.q3_3 || "",
        postData.q3_4 || "",
        postData.q4_1 || "",
        postData.q4_2 || "",
        postData.q4_3 || "",
        postData.q4_4 || "",
        postData.q5_1 || "",
        postData.q5_2 || "",
        postData.q5_3 || "",
        postData.q5_4 || "",
        postData.q5_5 || "",
        postData.q6_1 || "",
        postData.q6_2 || "",
        postData.q6_3 || "",
        postData.q6_4 || "",
        postData.q7_1 || "",
        postData.q7_2 || "",
        postData.q7_3 || "",
        postData.q7_4 || "",
        postData.q8_1 || "",
        postData.q9_1 || "",
        postData.q9_2 || "",
        postData.q9_3 || "",
        postData.q9_4 || "",
        postData.q9_5 || "",
        postData.q10_1 || "",
        postData.q10_2 || "",
        postData.q10_3 || "",
      ]);

      return createCorsResponse({
        success: true,
        message: "問卷提交成功！感謝您的寶貴意見。",
      });
    }

    // 2. 管理者讀取統計數據
    if (action === "fetchData") {
      const password = postData.password;
      if (password !== ADMIN_PASSWORD) {
        return createCorsResponse({
          success: false,
          message: "密碼錯誤！無法載入數據。",
        });
      }

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      const lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return createCorsResponse({ success: true, data: [] }); // 沒有數據
      }

      // 取得第 2 列到最後一列，動態讀取欄位數，避免欄位不足時崩潰
      const lastColumn = Math.max(sheet.getLastColumn(), 1);
      const range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
      const values = range.getValues();

      const data = values.map(row => ({
        timestamp: row[0] || "",
        seniority: row[1] || "",
        department: row[2] || "",
        q2_1: row[3] || "",
        q2_2: row[4] || "",
        q2_3: row[5] || "",
        q2_4: row[6] || "",
        q3_1: row[7] || "",
        q3_2: row[8] || "",
        q3_3: row[9] || "",
        q3_4: row[10] || "",
        q4_1: row[11] || "",
        q4_2: row[12] || "",
        q4_3: row[13] || "",
        q4_4: row[14] || "",
        q5_1: row[15] || "",
        q5_2: row[16] || "",
        q5_3: row[17] || "",
        q5_4: row[18] || "",
        q5_5: row[19] || "",
        q6_1: row[20] || "",
        q6_2: row[21] || "",
        q6_3: row[22] || "",
        q6_4: row[23] || "",
        q7_1: row[24] || "",
        q7_2: row[25] || "",
        q7_3: row[26] || "",
        q7_4: row[27] || "",
        q8_1: row[28] || "",
        q9_1: row[29] || "",
        q9_2: row[30] || "",
        q9_3: row[31] || "",
        q9_4: row[32] || "",
        q9_5: row[33] || "",
        q10_1: row[34] || "",
        q10_2: row[35] || "",
        q10_3: row[36] || "",
      }));

      return createCorsResponse({ success: true, data: data });
    }

    return createCorsResponse({ success: false, message: "未知的操作指令" });
  } catch (error) {
    return createCorsResponse({
      success: false,
      message: "伺服器錯誤: " + error.toString(),
    });
  }
}

// 支援 GET 請求，方便管理測試
function doGet(e) {
  return createCorsResponse({
    status: "ok",
    message: "Google Apps Script 運作正常！請使用 POST 方法進行提交與查詢。",
  });
}
