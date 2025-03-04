// DOM Elements
const clipboardListElement = document.getElementById('clipboard-list');
const searchInput = document.getElementById('search-input');
const headerTitle = document.querySelector('.header h1');
const shortcuts = document.querySelector('.shortcuts');

// State
let clipboardItems = [];
let filteredItems = [];
let selectedIndex = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // 初始化国际化文本
  initializeI18n();
  
  // Request clipboard items when the window is loaded
  getClipboardItems();
  
  // Focus search input when window is shown
  searchInput.focus();
  selectedIndex = 0;
  updateSelectedItem();
  
  // Set up event listeners
  setupEventListeners();
});

// 初始化国际化文本
function initializeI18n() {
  // 设置页面标题
  document.title = window.i18n.t('appName');
  
  // 设置标题
  headerTitle.textContent = window.i18n.t('clipboardHistory');
  
  // 设置搜索框占位符
  searchInput.placeholder = window.i18n.t('searchPlaceholder');
  
  // 设置快捷键提示
  shortcuts.innerHTML = `
    <span>${window.i18n.t('navigateShortcut')}</span>
    <span>${window.i18n.t('selectShortcut')}</span>
    <span>${window.i18n.t('closeShortcut')}</span>
  `;
}

// 获取剪贴板历史
async function getClipboardItems() {
  try {
    const items = await window.clipboard.getHistory();
    clipboardItems = items;
    filteredItems = [...items];
    renderClipboardItems();
    updateSelectedItem();
  } catch (error) {
    console.error('Failed to get clipboard items:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', () => {
    filterClipboardItems();
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', handleKeyDown);
  
  // Click on clipboard item
  clipboardListElement.addEventListener('click', (event) => {
    const item = event.target.closest('.clipboard-item');
    if (item) {
      const index = parseInt(item.dataset.index, 10);
      selectItem(index);
    }
  });
}

// Render clipboard items
function renderClipboardItems() {
  clipboardListElement.innerHTML = '';
  
  if (filteredItems.length === 0) {
    clipboardListElement.innerHTML = `<div class="no-items">${window.i18n.t('noItemsFound')}</div>`;
    return;
  }
  
  filteredItems.forEach((item, index) => {
    const clipboardItem = document.createElement('div');
    clipboardItem.className = 'clipboard-item';
    clipboardItem.dataset.index = index;
    
    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = item.content;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp(item.timestamp);
    
    clipboardItem.appendChild(content);
    clipboardItem.appendChild(timestamp);
    clipboardListElement.appendChild(clipboardItem);
  });
}

// Filter clipboard items based on search input
function filterClipboardItems() {
  const searchTerm = searchInput.value.toLowerCase();
  
  if (!searchTerm) {
    filteredItems = [...clipboardItems];
  } else {
    filteredItems = clipboardItems.filter(item => 
      item.content.toLowerCase().includes(searchTerm)
    );
  }
  
  renderClipboardItems();
  selectedIndex = 0;
  updateSelectedItem();
}

// Handle keyboard navigation
function handleKeyDown(event) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (selectedIndex < filteredItems.length - 1) {
        selectedIndex++;
        updateSelectedItem();
        ensureSelectedItemVisible();
      }
      break;
      
    case 'ArrowUp':
      event.preventDefault();
      if (selectedIndex > 0) {
        selectedIndex--;
        updateSelectedItem();
        ensureSelectedItemVisible();
      }
      break;
      
    case 'Enter':
      event.preventDefault();
      if (filteredItems.length > 0) {
        selectItem(selectedIndex);
      }
      break;
      
    case 'Escape':
      event.preventDefault();
      // 使用IPC发送消息关闭窗口
      try {
        window.clipboard.hideWindow();
      } catch (error) {
        console.error('Failed to hide window:', error);
        // 如果IPC方法失败，尝试直接关闭窗口
        window.close();
      }
      break;
  }
}

// Update the selected item in the UI
function updateSelectedItem() {
  const items = document.querySelectorAll('.clipboard-item');
  
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Ensure the selected item is visible in the viewport
function ensureSelectedItemVisible() {
  const selectedItem = document.querySelector('.clipboard-item.selected');
  if (selectedItem) {
    selectedItem.scrollIntoView({ block: 'nearest' });
  }
}

// Select an item and send it to the main process
function selectItem(index) {
  if (index >= 0 && index < filteredItems.length) {
    const selectedItem = filteredItems[index];
    window.clipboard.useItem(selectedItem.content);
  }
}

// Format timestamp to a readable date
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  
  // 获取当前语言
  const locale = window.i18n.getCurrentLocale();
  
  // If today, show time only
  if (date.toDateString() === now.toDateString()) {
    return `${window.i18n.t('today')} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `${window.i18n.t('yesterday')} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise show date and time
  return date.toLocaleString(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });
} 