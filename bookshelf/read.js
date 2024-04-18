// 复制文本到剪贴板的函数
function copyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("Copy");
  textArea.remove();
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

// 页面加载时创建弹窗
document.addEventListener("DOMContentLoaded", function () {
  // 创建lightbox元素
  const lightbox = document.createElement("div");
  lightbox.id = "lightbox";
  lightbox.style.display = "none"; // 默认隐藏
  lightbox.style.position = "fixed"; // 固定位置
  lightbox.style.top = "50%"; // 垂直居中
  lightbox.style.left = "50%"; // 水平居中
  lightbox.style.transform = "translate(-50%, -50%)"; // 修正位置偏移
  lightbox.style.zIndex = "1000"; // 确保在最前面

  // 在lightbox内部创建图片容器 有无display决定是否横排
  lightbox.innerHTML = `
        <div class="lightbox-content" style="display: flex; justify-content: center; align-items: center; height: 100%; ">
            <img class="lightbox-img" style="max-width: 70%;">
            <img class="lightbox-img" style="max-width: 70%;">
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
      <button class="btn" onclick="toggleSelectCopy()">SelectCopy</button>
      <button class="btn" onclick="toggleMask()">Mask</button>
      <button class="btn" onclick="toggleVerticalLayout()">Vertical</button>
      <button class="btn" onclick="toggleNight()">Night</button>
      <button class="btn" onclick="window.location.href='/'">HOME</button>
    </div>

    <div id="guideModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h3 class="guide">使用指南：</h3>
        <p class="guide">【1】默认高亮点选的句子并且复制日文到剪切板，可点击 <b>SelectCopy</b> 切换成复制选中文本，都是默认去除振假名；</p>
        <p class="guide">【2】键盘方向键 <b>↑</b> 上一句 和 <b>↓</b> 上一句，也会触发复制（受复制开关控制）；</p>
        <p class="guide">【3】蒙版模式 <b>Mark</b> 仅显示选中的文本，其余隐藏。</p>
      </div>
    </div>
  `;
  // 直接将HTML字符串插入到body中
  document.body.insertAdjacentHTML("beforeend", buttonsHTML);
}
window.onload = addButtons;

// 初始化状态变量
let isSelectCopy = false;
let isMask = false;
let isNight = false;
let isguide = false;
let isVerticalLayout = false;

// 切换竖向排版状态
function toggleVerticalLayout() {
  isVerticalLayout = !isVerticalLayout;
  const container = document.querySelector('.scroll-container');
  if (isVerticalLayout) {
    container.classList.add("vertical-rtl");
  } else {
    container.classList.remove("vertical-rtl");
  }

  // 获取当前高亮行的索引
  const currentIndex = window.location.search
    ? parseInt(new URLSearchParams(window.location.search).get("line"))
    : 0;

  // 滚动到当前行
  const highlightedRow = document.getElementById("row-" + currentIndex);
  if (highlightedRow) {
    highlightedRow.classList.add("highlight");
    highlightedRow.scrollIntoView({ behavior: "auto", block: "center" });
  }
}

// 切换亮暗模式的函数
function toggleNight() {
  isNight = !isNight;
  const NightBtn = document.querySelector('.btn[onclick="toggleNight()"]');
  if (isNight) {
    document.body.classList.add("dark-mode");
    NightBtn.classList.add('active');
  } else {
    document.body.classList.remove("dark-mode");
    NightBtn.classList.remove('active');
  }
}

// 切换蒙版模式的函数
function toggleMask() {
  isMask = !isMask;
  const rows = document.querySelectorAll(".row");
  const MaskBtn = document.querySelector('.btn[onclick="toggleMask()"]');
  rows.forEach((row) => {
    if (isMask) {
      row.classList.add("show-mask");
      MaskBtn.classList.add('active');
    } else {
      row.classList.remove("show-mask");
      MaskBtn.classList.remove('active');
    }
  });
}

// 切换复制模式的函数
function toggleSelectCopy() {
  isSelectCopy = !isSelectCopy;
  const SelectCopyBtn = document.querySelector('.btn[onclick="toggleSelectCopy()"]');
  if (isSelectCopy) {
    SelectCopyBtn.classList.add('active');
  } else {
    SelectCopyBtn.classList.remove('active');
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
  }
}


// 更新的点击事件处理程序
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
      imgs[0].src = imgElement.src; // 更新左边图片
      imgs[1].src = row.querySelector(".zh > img").src; // 更新右边图片
      lightbox.style.display = "block"; // 显示弹窗
    }
  }
});


// 更新键盘事件处理程序
let debounceTimer;
document.addEventListener("keydown", function (event) {

  // 禁止方向键会移动窗口
  event.preventDefault();
  // 清除之前的计时器
  clearTimeout(debounceTimer);

  // 设置新的计时器
  debounceTimer = setTimeout(function () {
    const currentIndex = window.location.search
      ? parseInt(new URLSearchParams(window.location.search).get("line"))
      : 0;
    const maxIndex = document.querySelectorAll(".row").length - 1;
    let newIndex = currentIndex;

    const lightbox = document.getElementById("lightbox");
    if (event.key === "Escape") {
      if (lightbox && lightbox.style.display === "block") {
        lightbox.style.display = "none";
      }
    }

    if (event.keyCode === 38 && currentIndex > 0) {
      // 左箭头键
      newIndex = currentIndex - 1;
    } else if (event.keyCode === 40 && currentIndex < maxIndex) {
      // 右箭头键
      newIndex = currentIndex + 1;
    }

    if (newIndex !== currentIndex) {
      window.history.pushState({}, "", "?line=" + newIndex);
      document
        .querySelectorAll(".row")
        .forEach((row) => row.classList.remove("highlight"));
      const highlightedRow = document.getElementById("row-" + newIndex);
      if (highlightedRow) {
        highlightedRow.classList.add("highlight");
        highlightedRow.scrollIntoView({ behavior: "auto", block: "center" });

        // 判断点击的是否为p、a、h1标签
        const textElement = highlightedRow.querySelector(".ja > p, .ja > a, .ja > h1");
        if (textElement && !isSelectCopy) {
          lightbox.style.display = "none"; // 隐藏弹窗
          const text = textElement.innerHTML || textElement.textContent;
          copyTextToClipboard(removeRuby(text));
        }

        // 检查新高亮的行是否包含图片
        const imgElement = highlightedRow.querySelector(".ja > img");
        if (imgElement) {
          const imgs = lightbox.querySelectorAll(".lightbox-img");
          imgs[0].src = imgElement.src; // 更新左边图片
          imgs[1].src = highlightedRow.querySelector(".zh > img").src; // 更新右边图片
          lightbox.style.display = "block"; // 显示弹窗
        } else {
          lightbox.style.display = "none"; // 如果没有图片，则隐藏弹窗
        }
      }
    }
  }, 80); // 防抖时间
});
