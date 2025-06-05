// Tab service for managing tab operations
import { getMainDomain, capitalizeFirstLetter, getRandomAvailableColor, shouldSkipUrl } from '../utils/domainUtils.js';
import { StorageService } from './storageService.js';

function ruleMatches(tab, rule) {
  let value = '';
  if (rule.conditionType === 'hostname') value = new URL(tab.url).hostname;
  else if (rule.conditionType === 'url') value = tab.url;
  else if (rule.conditionType === 'title') value = tab.title || '';
  value = value.toLowerCase();
  const condVal = rule.conditionValue.toLowerCase();
  if (rule.matchType === 'not_contains') {
    return !value.includes(condVal);
  }
  // Default: contains
  return value.includes(condVal);
}

export class TabService {
  /**
   * Get all tabs in the current window
   * @returns {Promise<Array>} Array of tabs
   */
  static async getCurrentWindowTabs() {
    return chrome.tabs.query({ currentWindow: true });
  }

  /**
   * Get all tab groups in the current window
   * @returns {Promise<Array>} Array of tab groups
   */
  static async getCurrentWindowGroups() {
    return chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  }

  /**
   * Group tabs by domain
   * @param {Array} tabs - Array of tabs to group
   * @returns {Map} Map of domain to tab IDs
   */
  static groupTabsByDomain(tabs) {
    const domainMap = new Map();

    for (const tab of tabs) {
      try {
        if (shouldSkipUrl(tab.url)) continue;

        const url = new URL(tab.url);
        const mainDomain = getMainDomain(url.hostname);

        if (!domainMap.has(mainDomain)) {
          domainMap.set(mainDomain, []);
        }
        domainMap.get(mainDomain).push(tab.id);
      } catch (e) {
        console.warn("Invalid URL:", tab.url, e);
      }
    }

    return domainMap;
  }

  /**
   * Organize all tabs in the current window using rules if available
   * @returns {Promise<Object>} Organization results
   */
  static async organizeAllTabs() {
    const [tabs, existingGroups, rules] = await Promise.all([
      this.getCurrentWindowTabs(),
      this.getCurrentWindowGroups(),
      StorageService.getRules()
    ]);
    const enabledRules = (rules || []).filter(r => r.enabled !== false && Array.isArray(r.conditions) && r.conditions.length > 0);
    const domainMap = new Map();
    const usedColors = new Set(existingGroups.map(group => group.color));
    const sortedTabs = tabs.slice().sort((a, b) => a.index - b.index);
    for (const tab of sortedTabs) {
      if (shouldSkipUrl(tab.url)) continue;
      let matched = false;
      for (const rule of enabledRules) {
        if (rule.conditions.some(c => ruleMatches(tab, c))) {
          if (!domainMap.has(rule.groupName)) domainMap.set(rule.groupName, []);
          domainMap.get(rule.groupName).push(tab.id);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const mainDomain = getMainDomain(new URL(tab.url).hostname);
        if (!domainMap.has(mainDomain)) domainMap.set(mainDomain, []);
        domainMap.get(mainDomain).push(tab.id);
      }
    }
    const sortedDomains = Array.from(domainMap.keys()).sort();
    for (const groupKey of sortedDomains) {
      const tabIds = domainMap.get(groupKey);
      if (tabIds.length > 0) {
        try {
          const groupId = await chrome.tabs.group({ tabIds });
          await chrome.tabGroups.update(groupId, {
            title: capitalizeFirstLetter(groupKey),
            color: getRandomAvailableColor(usedColors)
          });
        } catch (error) {
          console.error(`Error grouping tabs for ${groupKey}:`, error);
        }
      }
    }
    return {
      totalTabs: tabs.length,
      groupsCreated: domainMap.size,
      avgTabsPerGroup: (tabs.length / domainMap.size).toFixed(1)
    };
  }

  /**
   * Organize a single tab using rules if available
   * @param {number} tabId - Tab ID to organize
   * @param {number} windowId - Window ID
   */
  static async organizeSingleTab(tabId, windowId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (shouldSkipUrl(tab.url)) {
        return;
      }
      const rules = await StorageService.getRules();
      const enabledRules = (rules || []).filter(r => r.enabled !== false && Array.isArray(r.conditions) && r.conditions.length > 0);
      let groupName = null;
      for (const rule of enabledRules) {
        if (rule.conditions.some(c => ruleMatches(tab, c))) {
          groupName = rule.groupName;
          break;
        }
      }
      if (!groupName) {
        groupName = getMainDomain(new URL(tab.url).hostname);
      }
      const existingGroups = await chrome.tabGroups.query({ windowId });
      const usedColors = new Set(existingGroups.map(group => group.color));
      const matchingGroup = existingGroups.find(group =>
        group.title && group.title.toLowerCase() === capitalizeFirstLetter(groupName).toLowerCase()
      );
      // If tab is in a group, check if it's the correct group
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        const tabGroup = existingGroups.find(g => g.id === tab.groupId);
        if (!tabGroup || tabGroup.title.toLowerCase() !== capitalizeFirstLetter(groupName).toLowerCase()) {
          // Ungroup and regroup
          await chrome.tabs.ungroup(tabId);
        } else {
          // Already in correct group
          return;
        }
      }
      if (matchingGroup) {
        // Check if group still exists
        try {
          await chrome.tabGroups.get(matchingGroup.id);
          await chrome.tabs.group({ tabIds: tabId, groupId: matchingGroup.id });
        } catch (e) {
          // Group doesn't exist, create a new one
          const groupId = await chrome.tabs.group({ tabIds: tabId });
          await chrome.tabGroups.update(groupId, {
            title: capitalizeFirstLetter(groupName),
            color: getRandomAvailableColor(usedColors)
          });
        }
      } else {
        const groupId = await chrome.tabs.group({ tabIds: tabId });
        await chrome.tabGroups.update(groupId, {
          title: capitalizeFirstLetter(groupName),
          color: getRandomAvailableColor(usedColors)
        });
      }
    } catch (error) {
      console.error('Error organizing tab:', error);
    }
  }

  /**
   * Close duplicate tabs
   * @returns {Promise<number>} Number of tabs closed
   */
  static async closeDuplicates() {
    const tabs = await this.getCurrentWindowTabs();
    const urlMap = new Map();
    const duplicates = [];

    // Find duplicates
    for (const tab of tabs) {
      if (shouldSkipUrl(tab.url)) continue;

      if (urlMap.has(tab.url)) {
        duplicates.push(tab.id);
      } else {
        urlMap.set(tab.url, tab.id);
      }
    }

    // Close duplicates
    if (duplicates.length > 0) {
      await chrome.tabs.remove(duplicates);
    }

    return duplicates.length;
  }

  /**
   * Sort tabs by domain within their groups
   */
  static async sortByDomain() {
    const tabs = await this.getCurrentWindowTabs();
    const sortedTabs = tabs.sort((a, b) => {
      try {
        const domainA = getMainDomain(new URL(a.url).hostname);
        const domainB = getMainDomain(new URL(b.url).hostname);
        return domainA.localeCompare(domainB);
      } catch {
        return 0;
      }
    });

    // Reorder tabs
    for (let i = 0; i < sortedTabs.length; i++) {
      await chrome.tabs.move(sortedTabs[i].id, { index: i });
    }
  }
} 