const fs = require('fs');

const lines = fs.readFileSync('C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\ffb66a87-bbe6-4de5-9890-4fbb621fba31\\.system_generated\\logs\\transcript_full.jsonl', 'utf-8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT' && data.content.includes('QUY TRÌNH & KIẾN THỨC BÁN HÀNG GETA TÂY NINH')) {
      const match = data.content.match(/# QUY TRÌNH & KIẾN THỨC BÁN HÀNG GETA TÂY NINH[\s\S]+/);
      if (match) {
        let script = match[0].split('</USER_REQUEST>')[0];
        // The script also contains the markdown table `# BẢNG DỮ LIỆU SẢN PHẨM (PRODUCT_MASTER)`. We can remove it or keep it.
        // We will remove the PRODUCT_MASTER table since the user mentioned they made it dynamic.
        const productMasterIndex = script.indexOf('# BẢNG DỮ LIỆU SẢN PHẨM (PRODUCT_MASTER)');
        if (productMasterIndex !== -1) {
          script = script.substring(0, productMasterIndex).trim();
        }
        
        // Remove trailing JS formatting if they pasted the ts file
        script = script.replace(/`;\n  }\)\n\];/g, '').trim();

        fs.writeFileSync('d:\\geta_workspace\\erp-crm-service\\src\\ai-agent\\rules.txt', script);
        console.log('Script extracted successfully to rules.txt!');
        break;
      }
    }
  } catch (e) {
  }
}
