// Storage service for managing extension preferences
export class StorageService {
  /**
   * Get auto-organize preference
   * @returns {Promise<boolean>} The auto-organize setting
   */
  static async getAutoOrganize() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['autoOrganize'], (result) => {
        resolve(result.autoOrganize !== false); // Default to true
      });
    });
  }

  /**
   * Set auto-organize preference
   * @param {boolean} enabled - Whether auto-organize is enabled
   */
  static async setAutoOrganize(enabled) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ autoOrganize: enabled }, resolve);
    });
  }

  /**
   * Get all settings
   * @returns {Promise<Object>} All stored settings
   */
  static async getAllSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, resolve);
    });
  }

  /**
   * Save settings
   * @param {Object} settings - Settings object to save
   */
  static async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, resolve);
    });
  }

  /**
   * Clear all settings
   */
  static async clearSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });
  }

  // === RULES MANAGEMENT ===

  /**
   * Get all rules
   * @returns {Promise<Array>} Array of rule objects
   */
  static async getRules() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['rules'], (result) => {
        resolve(Array.isArray(result.rules) ? result.rules : []);
      });
    });
  }

  /**
   * Add a new rule
   * @param {Object} rule - Rule object
   * @returns {Promise<void>}
   */
  static async addRule(rule) {
    const rules = await this.getRules();
    rules.push(rule);
    return new Promise((resolve) => {
      chrome.storage.sync.set({ rules }, resolve);
    });
  }

  /**
   * Update a rule by index
   * @param {number} index - Index of the rule to update
   * @param {Object} updatedRule - Updated rule object
   * @returns {Promise<void>}
   */
  static async updateRule(index, updatedRule) {
    const rules = await this.getRules();
    if (index >= 0 && index < rules.length) {
      rules[index] = updatedRule;
      return new Promise((resolve) => {
        chrome.storage.sync.set({ rules }, resolve);
      });
    }
  }

  /**
   * Delete a rule by index
   * @param {number} index - Index of the rule to delete
   * @returns {Promise<void>}
   */
  static async deleteRule(index) {
    const rules = await this.getRules();
    if (index >= 0 && index < rules.length) {
      rules.splice(index, 1);
      return new Promise((resolve) => {
        chrome.storage.sync.set({ rules }, resolve);
      });
    }
  }
} 