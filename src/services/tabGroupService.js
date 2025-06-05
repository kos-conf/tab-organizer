// Tab group service for managing tab group operations
export class TabGroupService {
  /**
   * Get all tab groups in the current window
   * @returns {Promise<Array>} Array of tab groups
   */
  static async getCurrentWindowGroups() {
    return chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  }

  /**
   * Expand all tab groups
   */
  static async expandAllGroups() {
    const groups = await this.getCurrentWindowGroups();
    
    for (const group of groups) {
      if (group.collapsed) {
        await chrome.tabGroups.update(group.id, { collapsed: false });
      }
    }
  }

  /**
   * Collapse all tab groups
   */
  static async collapseAllGroups() {
    const groups = await this.getCurrentWindowGroups();
    
    for (const group of groups) {
      if (!group.collapsed) {
        await chrome.tabGroups.update(group.id, { collapsed: true });
      }
    }
  }

  /**
   * Ungroup all tab groups
   */
  static async ungroupAllGroups() {
    const groups = await this.getCurrentWindowGroups();
    
    for (const group of groups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      const tabIds = tabs.map(tab => tab.id);
      
      if (tabIds.length > 0) {
        await chrome.tabs.ungroup(tabIds);
      }
    }
  }

  /**
   * Get tab count for each group
   * @returns {Promise<Array>} Array of group info with tab counts
   */
  static async getGroupStats() {
    const groups = await this.getCurrentWindowGroups();
    const groupStats = [];

    for (const group of groups) {
      const tabs = await chrome.tabs.query({ groupId: group.id });
      groupStats.push({
        id: group.id,
        title: group.title,
        color: group.color,
        collapsed: group.collapsed,
        tabCount: tabs.length
      });
    }

    return groupStats;
  }

  /**
   * Rename a tab group
   * @param {number} groupId - The group ID to rename
   * @param {string} newTitle - The new title for the group
   */
  static async renameGroup(groupId, newTitle) {
    await chrome.tabGroups.update(groupId, { title: newTitle });
  }

  /**
   * Change group color
   * @param {number} groupId - The group ID to change color
   * @param {string} color - The new color for the group
   */
  static async changeGroupColor(groupId, color) {
    await chrome.tabGroups.update(groupId, { color });
  }
} 