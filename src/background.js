// Background script for Tab Organizer extension
import { StorageService } from './services/storageService.js';
import { TabService } from './services/tabService.js';
import { shouldSkipUrl } from './utils/domainUtils.js';

// State management
let isAutoOrganizeEnabled = true;

// Initialize extension
async function initialize() {
  try {
    isAutoOrganizeEnabled = await StorageService.getAutoOrganize();
    console.log('Tab Organizer initialized. Auto-organize:', isAutoOrganizeEnabled);
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// Message handler for communication with popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep the message channel open for async responses
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'setAutoOrganize':
        isAutoOrganizeEnabled = message.enabled;
        await StorageService.setAutoOrganize(message.enabled);
        sendResponse({ success: true });
        break;
      
      case 'organizeAllTabs':
        const result = await TabService.organizeAllTabs();
        sendResponse({ success: true, result });
        break;
      
      case 'closeDuplicates':
        const closedCount = await TabService.closeDuplicates();
        sendResponse({ success: true, closedCount });
        break;
      
      case 'sortByDomain':
        await TabService.sortByDomain();
        sendResponse({ success: true });
        break;
      
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Auto-organization event listeners
chrome.tabs.onCreated.addListener((tab) => {
  if (!isAutoOrganizeEnabled || shouldSkipUrl(tab.url)) return;
  setTimeout(() => {
    TabService.organizeSingleTab(tab.id, tab.windowId);
  }, 300);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isAutoOrganizeEnabled || shouldSkipUrl(tab.url)) return;
  if (changeInfo.status === 'complete') {
    TabService.organizeSingleTab(tabId, tab.windowId);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!isAutoOrganizeEnabled || windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const tabs = await chrome.tabs.query({ windowId });
    const ungroupedTabs = tabs.filter(tab => 
      tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE && 
      tab.url && 
      !tab.url.startsWith('chrome://') && 
      !tab.url.startsWith('edge://')
    );

    // Only organize if there are ungrouped tabs
    if (ungroupedTabs.length > 0) {
      for (const tab of ungroupedTabs) {
        await organizeTab(tab.id, windowId);
      }
    }
  } catch (error) {
    console.error('Error organizing window tabs:', error);
  }
});

// Initialize the extension
initialize(); 