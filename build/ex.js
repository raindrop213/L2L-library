const { JSDOM } = require('jsdom');
const fs = require('fs').promises;

// 提取HTML内容并按行分隔的函数
async function extractAndSaveHTML(lang, selector, outputFileName) {
  try {
    // 读取原始HTML文件
    const originalHTML = await fs.readFile(`${lang}/index.html`, 'utf8');
    const dom = new JSDOM(originalHTML);
    const document = dom.window.document;
    const elements = document.querySelectorAll(selector);
    
    // 提取指定元素并生成新的HTML字符串
    let newHTMLContent = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>Extracted Content</title></head><body>\n';
    elements.forEach(el => {

      // 如果元素是image标签，转换成img标签
      if (el.tagName.toLowerCase() === 'image') {
        const img = document.createElement('img');
        img.src = el.getAttribute('href');
        // 获取图片路径中的文件名，并设置为alt属性
        const srcParts = img.src.split('/');
        const imageName = srcParts[srcParts.length - 1].split('.')[0];
        img.alt = imageName;
        el = img;
        el.setAttribute('height', '70px');
      }

      // 如果元素是img标签，添加alt属性
      if (el.tagName.toLowerCase() === 'img') {
        const srcParts = el.src.split('/');
        const imageName = srcParts[srcParts.length - 1].split('.')[0];
        el.setAttribute('src', `${lang}/${el.src}`);
        el.setAttribute('alt', imageName);
        el.setAttribute('height', '70px');
      }

      el.removeAttribute('class');
      el.removeAttribute('id');

      // 为每个元素添加换行符
      newHTMLContent += `${el.outerHTML}\n`;

    });
    newHTMLContent += '</body>\n</html>';
    
    // 保存新的HTML文件
    await fs.writeFile(outputFileName, newHTMLContent, 'utf8');
    console.log(`File saved as ${outputFileName}`);
  } catch (error) {
    console.error('Error extracting and saving HTML:', error);
  }
}

// 使用示例
extractAndSaveHTML('build/ja', 'h1, p, a, img, image', 'c_ja.html');
extractAndSaveHTML('build/zh', 'h1, p, a, img, image', 'c_zh.html');
