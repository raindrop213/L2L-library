// 复制文本到剪贴板的函数
function copyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("Copy");
  textArea.remove();

  window.speechSynthesis.cancel();
  if (isTTS) {
    const voices = window.speechSynthesis.getVoices();
    const selectedVoiceName = localStorage.getItem('selectedVoice');
    const jaVoice = voices.find(voice => voice.name === selectedVoiceName);

    if (jaVoice) {
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'ja-JP';
      msg.voice = jaVoice;
      msg.rate = 1.1;
      window.speechSynthesis.speak(msg);
    }
  }
}

// 移除注音（ruby标签）并返回纯文本的函数
function removeRuby(text) {
  const div = document.createElement("div");
  div.innerHTML = text;
  // 移除所有ruby元素
  div.querySelectorAll("rt, rp").forEach((tag) => tag.remove());
  return div.textContent.trim() || div.innerText.trim() || "";
}

let tags = "h1, p, a, img";

function loadFile(filePath) {
  return fetch(filePath).then((response) => response.text());
}

function extractContent(htmlString, selector) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const elements = doc.querySelectorAll(selector);
  return Array.from(elements).map((el) => el.outerHTML);
}

function displayContent(startIndex = 0) {
  // 确保startIndex是数字
  startIndex = parseInt(startIndex, 10) || 0;
  Promise.all([loadFile("c_ja.html"), loadFile("c_zh.html")])
    .then(([jaContent, zhContent]) => {
      // 分别处理<hr>标签之前和之后的内容
      const jaContentBeforeHR = jaContent.split("<hr>")[0];
      const zhContentBeforeHR = zhContent.split("<hr>")[0];
      const jaContentAfterHR = jaContent.split("<hr>")[1] || "";
      const zhContentAfterHR = zhContent.split("<hr>")[1] || "";

      const jaElementsBeforeHR = extractContent(jaContentBeforeHR, tags);
      const zhElementsBeforeHR = extractContent(zhContentBeforeHR, tags);

      // 检查数组长度并添加占位符
      const maxLengthBeforeHR = Math.max(
        jaElementsBeforeHR.length,
        zhElementsBeforeHR.length
      );
      for (let i = 0; i < maxLengthBeforeHR; i++) {
        if (!jaElementsBeforeHR[i]) jaElementsBeforeHR[i] = "<p>-</p>";
        if (!zhElementsBeforeHR[i]) zhElementsBeforeHR[i] = "<p>-</p>";
      }

      const contentDiv = document.getElementById("content");
      const scrollContainer = document.createElement("div");
      scrollContainer.className = "scroll-container";
      contentDiv.appendChild(scrollContainer);

      // 处理<hr>标签之前的内容
      jaElementsBeforeHR.forEach((el, index) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "row";
        rowDiv.id = "row-" + index;
        // 添加包含编号的 span 元素
        const numberSpan = document.createElement("span");
        numberSpan.className = "number";
        numberSpan.textContent = index + 1; // 编号从1开始
        rowDiv.appendChild(numberSpan);

        // 创建日文和中文的div
        const jaDiv = document.createElement("div");
        jaDiv.className = "ja";
        jaDiv.innerHTML = el;
        const zhDiv = document.createElement("div");
        zhDiv.className = "zh";
        zhDiv.innerHTML = zhElementsBeforeHR[index];

        rowDiv.appendChild(jaDiv);
        rowDiv.appendChild(zhDiv);
        scrollContainer.appendChild(rowDiv);
      });


      // 处理<hr>标签之后的内容
      if (jaContentAfterHR && zhContentAfterHR) {
        const hrRowDiv = document.createElement("div");
        hrRowDiv.className = "row";
        hrRowDiv.innerHTML = `<div class="ja"><hr>${jaContentAfterHR}</div><div class="zh"><hr>${zhContentAfterHR}</div>`;
        scrollContainer.appendChild(hrRowDiv);
      }

      // 滚动到指定行并且高亮
      const highlightedRow = document.getElementById("row-" + startIndex);
      if (highlightedRow) {
        highlightedRow.classList.add("highlight");
        highlightedRow.scrollIntoView({ behavior: "auto", block: "center" });
      }
    })
    .catch((error) => {
      console.error("Error loading files:", error);
    });
}

// Get the index from the URL if present
const urlParams = new URLSearchParams(window.location.search);
const startIndex = urlParams.get("line");
displayContent(startIndex);

// 页面加载时创建图片弹窗
document.addEventListener("DOMContentLoaded", function () {
  const lightbox = document.createElement("div");
  lightbox.id = "lightbox";

  // 设置lightbox的内部HTML，这部分主要用于布局和内容
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <img class="lightbox-img">
      <img class="lightbox-img">
    </div>
  `;

  document.body.appendChild(lightbox);
});

// 添加按钮到页面
function addButtons() {
  // 使用模板字符串创建按钮和容器的HTML
  const buttonsHTML = `
    <div class="btn-container">
      <button class="btn" onclick="toggleGuide()">Guide</button>
      <button class="btn" onclick="toggleFontSize()">TextSize: ${fontSizes[0]}</button>
      <button class="btn" onclick="toggleTTS()">TTS</button>
      <button class="btn" onclick="toggleSelectCopy()">SelectCopy</button>
      <button class="btn" onclick="toggleMask()">Mask</button>
      <button class="btn" onclick="toggleVertical()">Vertical</button>
      <button class="btn" onclick="toggleNight()">Night</button>
      <button class="btn" onclick="window.location.href='/'">HOME</button>
    </div>

    <button class="btn-prev" onclick="navigateRows(-1)"></button>
    <button class="btn-next" onclick="navigateRows(1)"></button>

    <div id="guideModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2 class="guide">使用指南：</h2>
        <p class="guide">【1】键盘方向键 <b>↑</b> 上一句 和 <b>↓</b> 上一句，或者点击页面上下部分区域也可以逐句跳转，还可以直接点击句子；</p>
        <p class="guide">【2】被框住的句子会复制日文到剪切板；如果想选择文字的话可点击 <b>SelectCopy</b> 切换成复制鼠标选中文本的模式，都是默认去除振假名；</p>
        <p class="guide">【3】蒙版模式 <b>Mark</b> 仅显示选中的文本，其余隐藏；</p>
        <p class="guide">【4】（尚未完善）垂直模式 <b>Vertical</b> 切换至竖排版，从右到左阅读；</p>
        <p class="guide">【5】语音合成 <b>TTS</b> 阅读选中句子；</p>
      </div>
    </div>
  `;
  // 直接将HTML字符串插入到body中
  document.body.insertAdjacentHTML("beforeend", buttonsHTML);
}

// 初始化状态变量
let isTTS = false;
let voiceIndex = 0; // 默认从第一个语音开始
let isSelectCopy = false;
let isMask = false;
let isNight = false;
let isguide = false;
let istoggleVertical = false;
let fontSizeIndex = 0; // 默认从第一个大小开始
const fontSizes = ["24px", "30px", "18px"]; // 可切换的文字大小数组

function toggleTTS() {
  const voices = window.speechSynthesis.getVoices().filter(voice => voice.lang === 'ja-JP');
  const ttsBtn = document.querySelector('.btn[onclick="toggleTTS()"]');

  // 语音索引循环
  voiceIndex = (voiceIndex + 1) % (voices.length + 1);

  // 如果索引超出语音数组范围，则设置为无语音
  if (voiceIndex === voices.length) {
    isTTS = false;
    ttsBtn.classList.remove('active');
    ttsBtn.textContent = 'TTS: 無';
    localStorage.setItem('TTS', 'false');
  } else {
    isTTS = true;
    const selectedVoice = voices[voiceIndex];
    ttsBtn.classList.add('active');
    ttsBtn.textContent = `TTS: ${selectedVoice.name}`;
    localStorage.setItem('TTS', 'true');
    localStorage.setItem('selectedVoice', selectedVoice.name);
  }
}

function toggleFontSize() {
  fontSizeIndex = (fontSizeIndex + 1) % fontSizes.length; // 更新索引循环
  const fontSize = fontSizes[fontSizeIndex]; // 获取当前索引的字体大小
  // 应用新的字体大小到所有相关元素
  document.querySelectorAll(".ja, .zh").forEach(element => {
    element.style.fontSize = fontSize;
  });
  // 更新按钮文本显示当前大小
  const fontSizeBtn = document.querySelector('.btn[onclick="toggleFontSize()"]');
  if (fontSizeBtn) {
    fontSizeBtn.textContent = `Text: ${fontSize}`;
  }
}

// 切换竖向排版状态
function toggleVertical() {
  istoggleVertical = !istoggleVertical;
  const container = document.querySelector('.scroll-container');
  const verticalBtn = document.querySelector('.btn[onclick="toggleVertical()"]');
  if (istoggleVertical) {
    container.classList.add("vertical-rtl");
    verticalBtn.classList.add('active');
  } else {
    container.classList.remove("vertical-rtl");
    verticalBtn.classList.remove('active');
  }

  // 重新定位到当前高亮行
  const currentIndex = getCurrentLine();

  // 滚动到当前行
  const highlightedRow = document.getElementById("row-" + currentIndex);
  if (highlightedRow) {
    highlightedRow.classList.add("highlight");
    highlightedRow.scrollIntoView({ behavior: "auto", block: "center" });
  }
}

// 切换亮暗模式的函数
function toggleNight(forceMode) {
  const nightBtn = document.querySelector('.btn[onclick="toggleNight()"]');
  
  if (forceMode === undefined) {
    isNight = !isNight;
  } else {
    isNight = forceMode;
  }

  if (isNight) {
    document.body.classList.add("dark-mode");
    nightBtn.classList.add('active');
    localStorage.setItem('nightMode', 'true');
  } else {
    document.body.classList.remove("dark-mode");
    nightBtn.classList.remove('active');
    localStorage.setItem('nightMode', 'false');
  }
}

// 切换蒙版模式的函数
function toggleMask() {
  isMask = !isMask;
  const rows = document.querySelectorAll(".row");
  const maskBtn = document.querySelector('.btn[onclick="toggleMask()"]');
  rows.forEach((row) => {
    if (isMask) {
      row.classList.add("show-mask");
      maskBtn.classList.add('active');
    } else {
      row.classList.remove("show-mask");
      maskBtn.classList.remove('active');
    }
  });
}

// 切换复制模式的函数
function toggleSelectCopy() {
  isSelectCopy = !isSelectCopy;
  const selectCopyBtn = document.querySelector('.btn[onclick="toggleSelectCopy()"]');
  if (isSelectCopy) {
    selectCopyBtn.classList.add('active');
    localStorage.setItem('selectCopyMode', 'true');
  } else {
    selectCopyBtn.classList.remove('active');
    localStorage.setItem('selectCopyMode', 'false');
  }
}

document.addEventListener('mouseup', function(event) {
  if (isSelectCopy) {
    // 获取选中的范围
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // 创建一个新的div元素来存储HTML内容 将选中的范围的内容克隆到新的div元素中
      const div = document.createElement('div');
      div.appendChild(range.cloneContents());
      // 使用removeRuby函数处理HTML字符串
      copyTextToClipboard(removeRuby(div.innerHTML));
    }
  }
});


// 切换guide模态弹窗的函数
function toggleGuide() {
  const guideModal = document.getElementById('guideModal');
  const GuideBtn = document.querySelector('.btn[onclick="toggleGuide()"]');
  const closeBtn = guideModal.querySelector('.close');

  // 切换guide模态窗口的显示状态
  isguide = !isguide;
  guideModal.style.display = isguide ? 'block' : 'none';

  // 为关闭按钮添加事件监听器
  closeBtn.onclick = function() {
    guideModal.style.display = 'none';
    GuideBtn.classList.remove('active');
  };

  if (isguide) {
    GuideBtn.classList.add('active');
  } else {
    GuideBtn.classList.remove('active');
  }
}


// 点击行时播放语音的逻辑
document.addEventListener("click", function (event) {
  const row = event.target.closest(".row");
  const lightbox = document.getElementById("lightbox");

  if (row) {
    lightbox.style.display = "none"; // 隐藏弹窗
    const index = Array.from(document.querySelectorAll(".row")).indexOf(row);
    window.history.pushState({}, "", "?line=" + index);
    document
      .querySelectorAll(".row")
      .forEach((row) => row.classList.remove("highlight"));
    row.classList.add("highlight");

    // 判断点击的是否为p、a、h1标签
    const textElement = row.querySelector(".ja > p, .ja > a, .ja > h1");
    if (textElement && !isSelectCopy) {
      const text = textElement.innerHTML || textElement.textContent;
      copyTextToClipboard(removeRuby(text));
    }

    // 判断点击的是否为img标签
    const imgElement = row.querySelector(".ja > img");
    if (imgElement) {
      const imgs = lightbox.querySelectorAll(".lightbox-img");
      imgs[0].src = imgElement.src;
      imgs[1].src = row.querySelector(".zh > img").src;
      lightbox.style.display = "block";
    }
  }
});

// 跳转到某一条的函数
function navigateRows(direction) {
  const currentIndex = getCurrentLine();
  const maxIndex = document.querySelectorAll(".row").length - 1;
  let newIndex = currentIndex + direction;

  if (newIndex < 0) newIndex = 0;
  if (newIndex > maxIndex) newIndex = maxIndex;

  window.history.pushState({}, "", "?line=" + newIndex);
  saveLine(newIndex);

  document.querySelectorAll(".row").forEach(row => row.classList.remove("highlight"));
  const highlightedRow = document.getElementById("row-" + newIndex);
  if (highlightedRow) {
    highlightedRow.classList.add("highlight");
    highlightedRow.scrollIntoView({ behavior: "auto", block: "center" });

    // Handle text and image pop-up
    const textElement = highlightedRow.querySelector(".ja > p, .ja > a, .ja > h1");
    const imgElement = highlightedRow.querySelector(".ja > img");
    const lightbox = document.getElementById("lightbox");

    if (textElement && !isSelectCopy) {
      const text = textElement.innerHTML || textElement.textContent;
      copyTextToClipboard(removeRuby(text));
    }

    if (imgElement) {
      const imgs = lightbox.querySelectorAll(".lightbox-img");
      imgs[0].src = imgElement.src;
      imgs[1].src = highlightedRow.querySelector(".zh > img").src;
      lightbox.style.display = "block";
    } else {
      lightbox.style.display = "none";
    }
  }
}

// 键盘事件处理程序
let debounceTimer;
document.addEventListener("keydown", function (event) {
  // 检查是否按下了Esc键（keyCode 27）
  if (event.keyCode === 27) {
    const lightbox = document.getElementById("lightbox");
    if (lightbox.style.display === "block") {
      lightbox.style.display = "none"; // 关闭lightbox
    }
  }

  // 检查是否按下了上箭头（keyCode 38）或下箭头（keyCode 40）
  if (event.keyCode === 38 || event.keyCode === 40) {
    event.preventDefault(); // 阻止默认滚动行为
    const direction = event.keyCode === 38 ? -1 : 1;
    navigateRows(direction);
  }
});

// 上下句按钮
document.querySelectorAll('.btn-prev, .btn-next').forEach(button => {
  button.addEventListener('click', function() {
    const direction = this.classList.contains('btn-prev') ? -1 : 1;
    navigateRows(direction);
  });
});


function applyInitialSettings() {
  // 应用夜间模式设置
  const nightMode = localStorage.getItem('nightMode') === 'true';
  toggleNight(nightMode);
}


// 保存当前行数到localStorage
function saveLine(lineNumber) {
  localStorage.setItem('currentLine', lineNumber);
}
// 获取当前行数
function getCurrentLine() {
  return window.location.search
    ? parseInt(new URLSearchParams(window.location.search).get("line"), 10)
    : 0;
}
// 读取并导航到上次保存的行数
function navigateToLastLine() {
  const savedLine = localStorage.getItem('currentLine');
  if (savedLine) {
    window.history.pushState({}, "", "?line=" + savedLine);
  }
}

window.onload = function() {
  addButtons(); // 添加按钮
  applyInitialSettings(); // 应用初始设置
  navigateToLastLine(); // 回到上次保存的行
};