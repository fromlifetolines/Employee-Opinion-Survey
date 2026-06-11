import * as XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/mysql2';
import { surveys, questions } from '../../drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

/**
 * 從 Excel 檔案匯入調查問卷
 * 使用方式: node server/scripts/importSurvey.mjs <excel_path> <survey_slug> <survey_title>
 */
async function importSurvey() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('用法: node importSurvey.mjs <excel_path> <survey_slug> <survey_title>');
    process.exit(1);
  }

  const [excelPath, surveySlug, surveyTitle] = args;

  try {
    // 讀取 Excel 檔案
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    console.log(`📖 讀取 Excel 檔案: ${excelPath}`);
    console.log(`📊 工作表: ${workbook.SheetNames[0]}`);

    // 解析題目結構
    const questions_list = [];
    let currentQuestion = null;
    let currentOptions = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const firstCol = row[0] || '';
      const thirdCol = row[2] || '';
      const fourthCol = row[3] || '';

      // 檢查是否是題號（如 "1、"、"2、" 等）
      if (typeof firstCol === 'string' && firstCol.endsWith('、')) {
        // 保存前一個題目
        if (currentQuestion) {
          questions_list.push({
            ...currentQuestion,
            options: currentOptions,
          });
        }

        // 提取題號與題目
        const questionText = thirdCol;
        let questionType = 'single';
        if (questionText.includes('複選')) {
          questionType = 'multiple';
        } else if (questionText.includes('評分') || questionText.includes('星')) {
          questionType = 'rating';
        } else if (questionText.includes('說明') || questionText.includes('請寫')) {
          questionType = 'text';
        }

        currentQuestion = {
          number: firstCol.trim(),
          text: questionText,
          type: questionType,
        };
        currentOptions = [];
      }
      // 檢查是否是選項
      else if (fourthCol && typeof fourthCol === 'string' && fourthCol.trim()) {
        if (currentQuestion) {
          currentOptions.push(fourthCol.trim());
        }
      }
    }

    // 添加最後一個題目
    if (currentQuestion) {
      questions_list.push({
        ...currentQuestion,
        options: currentOptions,
      });
    }

    console.log(`\n✅ 解析完成，共 ${questions_list.length} 道題目\n`);

    // 建立調查問卷
    const surveyResult = await db.insert(surveys).values({
      slug: surveySlug,
      title: surveyTitle,
      description: `從 Excel 匯入的調查問卷`,
      status: 'active',
    });

    const surveyId = surveyResult[0].insertId;
    console.log(`📝 建立調查: ${surveyTitle} (ID: ${surveyId})`);

    // 建立題目
    let questionOrder = 1;
    for (const q of questions_list) {
      // 建立題目
      const questionResult = await db.insert(questions).values({
        surveyId,
        text: q.text,
        type: q.type,
        order: questionOrder,
      });

      const questionId = questionResult[0].insertId;
      console.log(`  ✓ 題目 ${questionOrder}: ${q.text.substring(0, 50)}...`);

      // 建立選項（如果有的話）
      if (q.options && q.options.length > 0) {
        for (const option of q.options) {
          console.log(`    - ${option}`);
        }
      }

      questionOrder++;
    }

    console.log(`\n✨ 匯入完成！`);
    console.log(`📊 調查代碼: ${surveySlug}`);
    console.log(`🔗 調查連結: /survey/${surveySlug}`);
    console.log(`📈 題目數量: ${questions_list.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 匯入失敗:', error);
    process.exit(1);
  }
}

importSurvey();
