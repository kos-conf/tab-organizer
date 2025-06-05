// Popup script for Tab Organizer extension
import { TabService } from '../services/tabService.js';
import { TabGroupService } from '../services/tabGroupService.js';
import { StorageService } from '../services/storageService.js';

class PopupController {
  constructor() {
    this.elements = {
      autoOrganizeToggle: document.getElementById("autoOrganize"),
      organizeButton: document.getElementById("organize"),
      collapseAllButton: document.getElementById("collapseAll"),
      statsElement: document.getElementById("stats"),
      errorElement: document.getElementById("error"),
      successElement: document.getElementById("success"),
      settingsBtn: document.getElementById("settingsBtn"),
      tabSearch: document.getElementById("tabSearch"),
      searchResults: document.getElementById("searchResults")
    };
    this.isOrganizing = false;
    this.searchTimeout = null;
    this.currentSearchResults = [];
    this.activeResultIndex = -1;
    this.initialize();
  }

  async initialize() {
    await this.loadSettings();
    this.bindEvents();
    await this.updateStats();
    await this.updateButtonStates();
  }

  async loadSettings() {
    try {
      const autoOrganizeEnabled = await StorageService.getAutoOrganize();
      this.elements.autoOrganizeToggle.checked = autoOrganizeEnabled;
      
      // Notify background script of current state
      chrome.runtime.sendMessage({ 
        type: 'setAutoOrganize', 
        enabled: autoOrganizeEnabled 
      });
    } catch (error) {
      this.showError('Error loading settings');
      console.error('Error loading settings:', error);
    }
  }

  bindEvents() {
    // Auto-organize toggle
    this.elements.autoOrganizeToggle.addEventListener('change', () => {
      this.handleAutoOrganizeToggle();
    });

    // Organize button
    this.elements.organizeButton.addEventListener('click', () => {
      this.handleOrganizeTabs();
    });

    // Collapse all button
    this.elements.collapseAllButton.addEventListener('click', () => {
      this.handleCollapseAll();
    });

    // Settings button
    this.elements.settingsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/settings.html') });
    });

    // Tab search
    this.elements.tabSearch.addEventListener('input', () => {
      this.handleTabSearch();
    });

    this.elements.tabSearch.addEventListener('keydown', (e) => {
      this.handleSearchKeydown(e);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.elements.searchResults.contains(e.target) && e.target !== this.elements.tabSearch) {
        this.elements.searchResults.style.display = 'none';
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Don't handle shortcuts if user is typing in search
      if (e.target === this.elements.tabSearch) return;

      // Search shortcut (⌘K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.elements.tabSearch.focus();
        this.elements.tabSearch.select();
      }

      // Organize tabs shortcut (⌘O or Ctrl+O)
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        this.handleOrganizeTabs();
      }

      // Toggle collapse/expand shortcut (⌘E or Ctrl+E)
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        this.handleCollapseAll();
      }

      // Settings shortcut (⌘, or Ctrl+,)
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/settings.html') });
      }
    });
  }

  async handleAutoOrganizeToggle() {
    try {
      const enabled = this.elements.autoOrganizeToggle.checked;
      await StorageService.setAutoOrganize(enabled);
      
      chrome.runtime.sendMessage({ 
        type: 'setAutoOrganize', 
        enabled 
      });
    } catch (error) {
      this.showError('Error saving auto-organize preference');
      console.error('Error saving auto-organize preference:', error);
    }
  }

  async handleOrganizeTabs() {
    if (this.isOrganizing) return;
    
    try {
      this.isOrganizing = true;
      this.updateUIState({ isLoading: true });

      const result = await TabService.organizeAllTabs();
      this.showSuccess('Tabs organized successfully');
      this.updateStats(result);

      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        this.elements.successElement.style.display = 'none';
      }, 2000);

    } catch (error) {
      this.showError('Error organizing tabs');
      console.error('Error organizing tabs:', error);
    } finally {
      this.isOrganizing = false;
      this.updateUIState({ isLoading: false });
      await this.updateButtonStates();
    }
  }

  async handleCollapseAll() {
    if (this.isOrganizing) return;

    try {
      this.isOrganizing = true;
      this.elements.collapseAllButton.disabled = true;

      // Get current groups to determine action
      const groups = await TabGroupService.getCurrentWindowGroups();
      const allCollapsed = groups.every(group => group.collapsed);

      if (allCollapsed) {
        await TabGroupService.expandAllGroups();
        this.showSuccess('All groups expanded');
      } else {
        await TabGroupService.collapseAllGroups();
        this.showSuccess('All groups collapsed');
      }

      // Auto-hide success message after 2 seconds
      setTimeout(() => {
        this.elements.successElement.style.display = 'none';
      }, 2000);

    } catch (error) {
      this.showError('Error toggling groups');
      console.error('Error toggling groups:', error);
    } finally {
      this.isOrganizing = false;
      this.elements.collapseAllButton.disabled = false;
      await this.updateButtonStates();
    }
  }

  updateUIState({ isLoading }) {
    this.elements.organizeButton.disabled = isLoading;
    this.elements.autoOrganizeToggle.disabled = isLoading;
  }

  showError(message) {
    this.elements.errorElement.textContent = message;
    this.elements.errorElement.style.display = 'block';
    this.elements.successElement.style.display = 'none';
  }

  showSuccess(message) {
    this.elements.successElement.textContent = message;
    this.elements.successElement.style.display = 'block';
    this.elements.errorElement.style.display = 'none';
  }

  async updateStats(organizationResult = null) {
    try {
      if (organizationResult) {
        const statsText = `${organizationResult.totalTabs} tabs organized into ${organizationResult.groupsCreated} groups (avg: ${organizationResult.avgTabsPerGroup} tabs per group)`;
        this.elements.statsElement.textContent = statsText;
      } else {
        const tabs = await TabService.getCurrentWindowTabs();
        this.elements.statsElement.textContent = `${tabs.length} tabs open in this window`;
      }
      this.elements.statsElement.style.display = 'block';
    } catch (error) {
      console.error('Error updating stats:', error);
      this.elements.statsElement.style.display = 'none';
    }
  }

  async updateButtonStates() {
    try {
      // Get current groups to determine button states
      const groups = await TabGroupService.getCurrentWindowGroups();
      const hasGroups = groups.length > 0;

      // Update button states based on group existence
      this.elements.collapseAllButton.disabled = !hasGroups;

      // Update button text based on group states if needed
      if (hasGroups) {
        const allCollapsed = groups.every(group => group.collapsed);
        this.elements.collapseAllButton.textContent = allCollapsed ? 'Expand All Groups' : 'Collapse All Groups';
      }
    } catch (error) {
      console.error('Error updating button states:', error);
    }
  }

  async handleTabSearch() {
    const query = this.elements.tabSearch.value.toLowerCase().trim();
    
    if (query.length === 0) {
      this.elements.searchResults.style.display = 'none';
      return;
    }

    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search
    this.searchTimeout = setTimeout(async () => {
      try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
        
        // Create a map of group IDs to group info
        const groupMap = new Map(groups.map(group => [group.id, group]));
        
        // Filter and sort tabs
        const results = tabs
          .filter(tab => {
            const title = tab.title.toLowerCase();
            const url = tab.url.toLowerCase();
            return title.includes(query) || url.includes(query);
          })
          .map(tab => ({
            ...tab,
            groupInfo: tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE ? groupMap.get(tab.groupId) : null
          }));

        this.currentSearchResults = results;
        this.activeResultIndex = -1;
        
        if (results.length > 0) {
          // Show results
          this.elements.searchResults.innerHTML = results.map((tab, index) => `
            <div class="search-result-item" data-index="${index}">
              <img class="favicon" src="${tab.favIconUrl || 'icons/icon.png'}" alt="">
              <div class="tab-info">
                <div class="tab-title">${tab.title}</div>
                <div class="tab-url">${tab.url}</div>
              </div>
              ${tab.groupInfo ? `<span class="group-badge">${tab.groupInfo.title}</span>` : ''}
            </div>
          `).join('');
          
          this.elements.searchResults.style.display = 'block';

          // Add click handlers
          this.elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
              const index = parseInt(item.dataset.index);
              this.switchToTab(this.currentSearchResults[index].id);
            });
          });

          // Set first result as active but don't switch to it
          this.activeResultIndex = 0;
          this.updateActiveResult();
        } else {
          this.elements.searchResults.style.display = 'none';
        }
      } catch (error) {
        console.error('Error searching tabs:', error);
      }
    }, 100);
  }

  handleSearchKeydown(e) {
    if (!this.currentSearchResults.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.activeResultIndex = Math.min(this.activeResultIndex + 1, this.currentSearchResults.length - 1);
        this.updateActiveResult();
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        this.activeResultIndex = Math.max(this.activeResultIndex - 1, 0);
        this.updateActiveResult();
        break;
      
      case 'Enter':
        e.preventDefault();
        if (this.activeResultIndex >= 0) {
          this.switchToTab(this.currentSearchResults[this.activeResultIndex].id);
        }
        break;
      
      case 'Escape':
        this.elements.searchResults.style.display = 'none';
        this.elements.tabSearch.blur();
        break;
    }
  }

  updateActiveResult() {
    const items = this.elements.searchResults.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === this.activeResultIndex);
    });
    
    if (this.activeResultIndex >= 0) {
      const activeItem = items[this.activeResultIndex];
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }

  async switchToTab(tabId) {
    try {
      await chrome.tabs.update(tabId, { active: true });
      window.close(); // Close popup after switching
    } catch (error) {
      console.error('Error switching to tab:', error);
    }
  }
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Add debouncing to auto-organize
let organizeTimeout;
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    clearTimeout(organizeTimeout);
    organizeTimeout = setTimeout(() => {
      TabService.organizeSingleTab(tabId, tab.windowId);
    }, 500);
  }
});

// Add progress tracking
TabService.prototype.organizeAllTabs = async function(progressCallback) {
  const tabs = await this.getCurrentWindowTabs();
  const total = tabs.length;
  let processed = 0;

  for (const tab of tabs) {
    await this.organizeSingleTab(tab.id);
    processed++;
    progressCallback?.(processed / total);
  }
} 