// Settings page logic for Tab Organizer
// Future settings and features will be implemented here.

console.log('Settings page loaded.');

import { StorageService } from '../services/storageService.js';

const main = document.getElementById('settingsMain');
const addRuleBtn = document.getElementById('addRuleBtn');

addRuleBtn.addEventListener('click', () => showAddRuleForm());

let rulesCache = [];

async function loadAndShowRules() {
  rulesCache = await StorageService.getRules();
  showRulesTable();
}

function showRulesTable() {
  const colorMap = {
    grey: '#9e9e9e', blue: '#1a73e8', red: '#ea4335', yellow: '#fbbc04', green: '#34a853', pink: '#ff80ab', purple: '#a142f4', cyan: '#00bcd4', orange: '#ff9800', teal: '#26a69a', lime: '#cddc39', indigo: '#3f51b5', brown: '#795548', black: '#222', white: '#fff'
  };
  let rows = '';
  if (rulesCache.length === 0) {
    rows = '<tr><td colspan="4" class="empty-table">No rules yet. Click \"Add Rule\" to create one.</td></tr>';
  } else {
    rows = rulesCache.map((rule, idx) => `
      <tr>
        <td style="font-weight:500;">${rule.ruleName}</td>
        <td>
          <label class="switch" style="vertical-align:middle;">
            <input type="checkbox" class="rule-enable-toggle" data-idx="${idx}" ${rule.enabled !== false ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <span style="margin-left:8px;${rule.enabled === false ? 'color:#d93025;' : 'color:#188038;'}">
            ${rule.enabled !== false ? '<svg class="status-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#188038"/></svg> Enabled' : '<svg class="status-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#d93025"/></svg> Disabled'}
          </span>
        </td>
        <td>
          <button class="action-btn edit-btn" data-idx="${idx}" title="Edit"><svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg></button>
          <button class="action-btn delete-btn" data-idx="${idx}" title="Delete"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
        </td>
      </tr>
    `).join('');
  }
  main.innerHTML = `
    <style>
      .rules-table { width: 100%; border-collapse: separate; border-spacing: 0; background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(60,64,67,0.06); overflow: hidden; font-size: 15px; }
      .rules-table th, .rules-table td { padding: 14px 16px; text-align: left; }
      .rules-table th { background: #f1f3f4; color: #333; font-size: 15px; font-weight: 600; border-bottom: 1px solid #e0e0e0; }
      .rules-table td { color: #444; border-bottom: 1px solid #f1f3f4; vertical-align: middle; }
      .rules-table tr:last-child td { border-bottom: none; }
      .color-badge { display:inline-block; width:18px; height:18px; border-radius:50%; border:1.5px solid #e0e0e0; margin-right:8px; vertical-align:middle; }
      .switch { position: relative; display: inline-block; width: 32px; height: 16px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 16px; }
      .slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
      input:checked + .slider { background-color: #1a73e8; }
      input:checked + .slider:before { transform: translateX(16px); }
      .action-btn { border: none; border-radius: 4px; padding: 6px 10px; font-size: 15px; font-weight: 500; cursor: pointer; margin-right: 4px; background: #f1f3f4; color: #1a73e8; display: inline-flex; align-items: center; transition: background 0.2s; }
      .action-btn svg { width: 18px; height: 18px; fill: currentColor; }
      .edit-btn:hover { background: #e8f0fe; }
      .delete-btn { color: #d93025; }
      .delete-btn:hover { background: #fde8e8; }
      .empty-table { color: #888; text-align: center; padding: 32px 0; font-size: 15px; }
      .status-icon { width: 14px; height: 14px; vertical-align: middle; margin-right: 2px; }
    </style>
    <div class="settings-header-row">
      <h2 class="settings-title">Rules</h2>
      <button class="add-rule-btn" id="addRuleBtn">Add Rule</button>
    </div>
    <table class="rules-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="rulesTableBody">
        ${rows}
      </tbody>
    </table>
  `;
  document.getElementById('addRuleBtn').addEventListener('click', () => showAddRuleForm());
  document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => {
    const idx = parseInt(e.target.closest('.edit-btn').getAttribute('data-idx'));
    showAddRuleForm(rulesCache[idx], idx);
  }));
  document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', async (e) => {
    const idx = parseInt(e.target.getAttribute('data-idx'));
    if (confirm('Delete this rule?')) {
      await StorageService.deleteRule(idx);
      await loadAndShowRules();
    }
  }));
  document.querySelectorAll('.rule-enable-toggle').forEach(toggle => toggle.addEventListener('change', async (e) => {
    const idx = parseInt(e.target.getAttribute('data-idx'));
    rulesCache[idx].enabled = e.target.checked;
    await StorageService.updateRule(idx, rulesCache[idx]);
    await loadAndShowRules();
  }));
}

function showAddRuleForm(rule = null, editIdx = null) {
  // Prepare initial conditions array
  let conditions = rule && Array.isArray(rule.conditions) && rule.conditions.length > 0
    ? rule.conditions.map(c => ({ ...c }))
    : [{
        conditionType: 'hostname',
        matchType: 'contains',
        conditionValue: ''
      }];

  // Store form state
  let formState = {
    ruleName: rule ? rule.ruleName : '',
    action: rule ? rule.action : 'group',
    groupColor: rule ? rule.groupColor : '',
    enabled: rule ? rule.enabled !== false : true
  };

  renderForm();

  function renderForm() {
    main.innerHTML = `
      <div class="rule-form">
        <div class="form-header">
          <button class="back-btn" id="backToRules" title="Back">
            <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <h2 class="form-title">${editIdx !== null ? 'Edit Rule' : 'Add New Rule'}</h2>
        </div>
        <form id="addRuleForm" autocomplete="off">
          <div class="form-card">
            <div class="form-group">
              <label class="form-label">Rule Name</label>
              <input type="text" name="ruleName" class="form-input" required placeholder="E.g. Shopping" value="${formState.ruleName}">
              <div class="error-msg" id="ruleNameError">Rule name is required</div>
            </div>
            <div class="form-group">
              <label class="form-label">Action</label>
              <select name="action" class="form-select" required>
                <option value="group" ${formState.action === 'group' ? 'selected' : ''}>Group tabs</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tab Group Color</label>
              <select name="groupColor" class="form-select">
                <option value="" ${formState.groupColor === '' ? 'selected' : ''}>Default</option>
                <option value="grey" ${formState.groupColor === 'grey' ? 'selected' : ''}>Grey</option>
                <option value="blue" ${formState.groupColor === 'blue' ? 'selected' : ''}>Blue</option>
                <option value="red" ${formState.groupColor === 'red' ? 'selected' : ''}>Red</option>
                <option value="yellow" ${formState.groupColor === 'yellow' ? 'selected' : ''}>Yellow</option>
                <option value="green" ${formState.groupColor === 'green' ? 'selected' : ''}>Green</option>
                <option value="pink" ${formState.groupColor === 'pink' ? 'selected' : ''}>Pink</option>
                <option value="purple" ${formState.groupColor === 'purple' ? 'selected' : ''}>Purple</option>
                <option value="cyan" ${formState.groupColor === 'cyan' ? 'selected' : ''}>Cyan</option>
                <option value="orange" ${formState.groupColor === 'orange' ? 'selected' : ''}>Orange</option>
                <option value="teal" ${formState.groupColor === 'teal' ? 'selected' : ''}>Teal</option>
                <option value="lime" ${formState.groupColor === 'lime' ? 'selected' : ''}>Lime</option>
                <option value="indigo" ${formState.groupColor === 'indigo' ? 'selected' : ''}>Indigo</option>
                <option value="brown" ${formState.groupColor === 'brown' ? 'selected' : ''}>Brown</option>
                <option value="black" ${formState.groupColor === 'black' ? 'selected' : ''}>Black</option>
                <option value="white" ${formState.groupColor === 'white' ? 'selected' : ''}>White</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="display:flex;align-items:center;gap:12px;">
                Enabled
                <span class="toggle-switch">
                  <input type="checkbox" name="enabled" id="enabledToggle" ${formState.enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </span>
              </label>
            </div>
          </div>

          <div class="form-card">
            <div class="form-group">
              <label class="form-label">Conditions</label>
              <div class="conditions-list" id="conditionsList">
                ${conditions.map((cond, i) => `
                  <div class="condition-item" data-cond-idx="${i}">
                    <select class="form-select cond-type">
                      <option value="hostname" ${cond.conditionType==='hostname' ? 'selected' : ''}>hostname</option>
                      <option value="url" ${cond.conditionType==='url' ? 'selected' : ''}>url</option>
                      <option value="title" ${cond.conditionType==='title' ? 'selected' : ''}>title</option>
                    </select>
                    <select class="form-select cond-match">
                      <option value="contains" ${cond.matchType==='contains' ? 'selected' : ''}>contains</option>
                      <option value="not_contains" ${cond.matchType==='not_contains' ? 'selected' : ''}>not contains</option>
                    </select>
                    <input type="text" class="form-input cond-value" required placeholder="E.g. amazon" value="${cond.conditionValue}">
                    ${conditions.length > 1 ? `
                      <button type="button" class="remove-condition" data-remove-idx="${i}" title="Remove condition">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
              <div class="error-msg" id="condError">All condition values are required</div>
              <button type="button" class="add-condition" id="addCondBtn">
                <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Add Condition
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" id="cancelBtn">Cancel</button>
            <button type="submit" class="save-btn" id="saveBtn" disabled>Save Rule</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById('backToRules').onclick = loadAndShowRules;
    document.getElementById('cancelBtn').onclick = loadAndShowRules;
    document.getElementById('addCondBtn').onclick = () => {
      conditions.push({ conditionType: 'hostname', matchType: 'contains', conditionValue: '' });
      renderForm();
    };

    document.querySelectorAll('.remove-condition').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.closest('.condition-item').getAttribute('data-cond-idx'));
        conditions.splice(idx, 1);
        renderForm();
      };
    });

    // Sync changes from UI to conditions array
    document.querySelectorAll('.condition-item').forEach((row, i) => {
      row.querySelector('.cond-type').onchange = (e) => { conditions[i].conditionType = e.target.value; };
      row.querySelector('.cond-match').onchange = (e) => { conditions[i].matchType = e.target.value; };
      row.querySelector('.cond-value').oninput = (e) => { conditions[i].conditionValue = e.target.value; validate(); };
    });

    const form = document.getElementById('addRuleForm');
    const saveBtn = document.getElementById('saveBtn');
    const condError = document.getElementById('condError');
    const ruleNameError = document.getElementById('ruleNameError');

    // Update form state when inputs change
    form.ruleName.addEventListener('input', (e) => {
      formState.ruleName = e.target.value;
      validate();
    });
    form.action.addEventListener('change', (e) => {
      formState.action = e.target.value;
    });
    form.groupColor.addEventListener('change', (e) => {
      formState.groupColor = e.target.value;
    });
    form.enabled.addEventListener('change', (e) => {
      formState.enabled = e.target.checked;
    });

    function validate() {
      const ruleName = form.ruleName.value.trim();
      const allFilled = conditions.every(c => c.conditionValue.trim());
      saveBtn.disabled = !ruleName || !allFilled;
      condError.style.display = allFilled ? 'none' : 'block';
      ruleNameError.style.display = ruleName ? 'none' : 'block';
      form.ruleName.classList.toggle('input-error', !ruleName);
      document.querySelectorAll('.cond-value').forEach((input, i) => {
        input.classList.toggle('input-error', !conditions[i].conditionValue.trim());
      });
      return saveBtn.disabled;
    }

    validate();

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!validate()) return;

      const newRule = {
        ruleName: formState.ruleName,
        action: formState.action,
        enabled: formState.enabled,
        conditions: conditions,
        groupColor: formState.groupColor
      };

      if (editIdx !== null) {
        await StorageService.updateRule(editIdx, newRule);
      } else {
        await StorageService.addRule(newRule);
      }
      await loadAndShowRules();
    };
  }
}

// Initial load
loadAndShowRules(); 