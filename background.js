// Constants
const SUPPORTED_COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
const TLD_PATTERN = /\.(com|org|net|io|edu|gov|co|me|app|dev|us)(\.[a-z]{2})?$/;

// State
let isAutoOrganizeEnabled = true; // Default to true

// Load initial state
chrome.storage.sync.get(['autoOrganize'], (result) => {
  isAutoOrganizeEnabled = result.autoOrganize !== false;
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'setAutoOrganize') {
    isAutoOrganizeEnabled = message.enabled;
  }
});

// Function to extract main domain name
function getMainDomain(hostname) {
  try {
    const withoutTld = hostname.replace(TLD_PATTERN, '');
    const parts = withoutTld.split('.');
    return parts[parts.length - 1];
  } catch (error) {
    console.error('Error extracting domain:', error);
    return hostname;
  }
}

// Function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

// Function to get random available color for tab groups
function getRandomAvailableColor(usedColors) {
  const availableColors = SUPPORTED_COLORS.filter(color => !usedColors.has(color));
  if (availableColors.length === 0) {
    return SUPPORTED_COLORS[Math.floor(Math.random() * SUPPORTED_COLORS.length)];
  }
  const selectedColor = availableColors[Math.floor(Math.random() * availableColors.length)];
  usedColors.add(selectedColor);
  return selectedColor;
}

// Function to organize a single tab
async function organizeTab(tabId, windowId) {
  if (!isAutoOrganizeEnabled) return;

  try {
    // Get the tab details
    const tab = await chrome.tabs.get(tabId);
    
    // Skip if tab is already in a group or if it's not a valid URL
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE || !tab.url) {
      return;
    }

    // Get the domain
    const url = new URL(tab.url);
    const mainDomain = getMainDomain(url.hostname);

    // Get existing groups in the window
    const existingGroups = await chrome.tabGroups.query({ windowId });
    const usedColors = new Set(existingGroups.map(group => group.color));

    // Check if there's already a group for this domain
    const matchingGroup = existingGroups.find(group => 
      group.title && group.title.toLowerCase() === capitalizeFirstLetter(mainDomain).toLowerCase()
    );

    if (matchingGroup) {
      // Add to existing group
      await chrome.tabs.group({
        tabIds: tabId,
        groupId: matchingGroup.id
      });
    } else {
      // Create new group
      const groupId = await chrome.tabs.group({
        tabIds: tabId
      });
      await chrome.tabGroups.update(groupId, {
        title: capitalizeFirstLetter(mainDomain),
        color: getRandomAvailableColor(usedColors)
      });
    }
  } catch (error) {
    console.error('Error organizing tab:', error);
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only organize when the tab has finished loading and has a URL
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip chrome:// and edge:// URLs
    if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      organizeTab(tabId, tab.windowId);
    }
  }
});

// Listen for window focus changes to organize any ungrouped tabs
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

    for (const tab of ungroupedTabs) {
      await organizeTab(tab.id, windowId);
    }
  } catch (error) {
    console.error('Error organizing window tabs:', error);
  }
});
