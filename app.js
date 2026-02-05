// Vaccine Guide Application
const I18N = {
  zh: {
    appTitle: '儿童疫苗接种指南 - 深圳社康', logoTitle: '疫苗接种指南', headerBadge: '深圳社康', languageLabel: '语言',
    themeToggleDark: '暗黑模式', themeToggleLight: '浅色模式', heroTitle: '宝宝该打什么疫苗？', heroSubtitle: '按月龄查看推荐接种项，快速找到当月重点疫苗',
    heroButton: '查看月龄推荐', tabTimeline: '接种时间轴', tabCompare: '免费 vs 自费', tabAll: '全部疫苗',
    legendFree: '免费疫苗', legendPaid: '自费推荐', legendOptional: '可选', compareFree: '免费疫苗', compareFreeBadge: '国家免疫规划',
    comparePaid: '自费疫苗', comparePaidBadge: '自愿接种', groupsTitle: '替代关系对比', searchPlaceholder: '搜索疫苗名称或预防疾病...',
    allCategory: '全部', thName: '疫苗名称', thType: '类型', thDisease: '预防疾病', thDose: '接种剂次', thPrice: '参考价格',
    tipsTitle: '接种小贴士', footerDisclaimer: '本页面信息仅供参考，具体接种方案请咨询当地社康中心或医生。<br>数据来源：深圳市卫健委、广东省非免疫规划疫苗接种方案（2024版）、国家免疫规划疫苗儿童免疫程序（2021版）',
    linkShenzhen: '深圳卫健委', linkCdc: '中国疾控中心', ageModalTitle: '月龄推荐', ageModalSubtitle: '输入宝宝月龄，查看当月应接种疫苗',
    agePlaceholder: '月龄', ageUnit: '月龄', currentSectionTitle: '当前应接种', loadError: '无法加载疫苗数据，请确保 data/vaccines.json 文件存在',
    free: '免费', paid: '自费', pendingPrice: '价格待确认', doseUnit: '剂', doseCount: '剂次', ageBirth: '出生时', ageMonth: '{n}月龄', ageYear: '{n}岁',
    noneRequired: '该月龄暂无必须接种的疫苗', doseNo: '第{n}剂', replaced: '已替代', noneSelected: '未勾选任何疫苗',
    selectedCount: '已勾选 {selected} 项', replacedCount: ' · 已替代 {disabled} 项', clear: '清空', noResult: '没有找到匹配的疫苗',
    detail: '详情', freeVaccine: '免费疫苗', paidVaccine: '自费疫苗', fullCourse: '全程{doses}剂，约需 ¥{price}', selected: '已勾选',
    replacedLong: '已被替代', disease: '预防疾病', intro: '疫苗说明', schedule: '接种程序', priceTitle: '参考价格', sideEffects: '不良反应',
    alternatives: '替代方案', canReplace: '可替代', recommendation: '接种建议', ageLimit: '年龄限制'
  },
  en: {
    appTitle: 'Childhood Vaccine Guide - Shenzhen Community Health', logoTitle: 'Vaccine Guide', headerBadge: 'Shenzhen CHC', languageLabel: 'Lang',
    themeToggleDark: 'Dark', themeToggleLight: 'Light', heroTitle: 'What vaccine should my child get?', heroSubtitle: 'Check recommended vaccines by age in months.',
    heroButton: 'View age guidance', tabTimeline: 'Timeline', tabCompare: 'Free vs Paid', tabAll: 'All Vaccines',
    legendFree: 'Free', legendPaid: 'Paid recommended', legendOptional: 'Optional', compareFree: 'Free Vaccines', compareFreeBadge: 'National Program',
    comparePaid: 'Paid Vaccines', comparePaidBadge: 'Voluntary', groupsTitle: 'Alternative comparison', searchPlaceholder: 'Search vaccine name or disease...',
    allCategory: 'All', thName: 'Vaccine', thType: 'Type', thDisease: 'Disease', thDose: 'Doses', thPrice: 'Price', tipsTitle: 'Tips',
    footerDisclaimer: 'This page is for reference only. Please consult your local clinic or doctor for vaccination plans.<br>Sources: Shenzhen Health Commission and national schedules.',
    linkShenzhen: 'Shenzhen Health', linkCdc: 'China CDC', ageModalTitle: 'Age Guidance', ageModalSubtitle: 'Enter age in months to view recommended vaccines',
    agePlaceholder: 'Months', ageUnit: 'months', currentSectionTitle: 'Recommended now', loadError: 'Failed to load data. Please ensure data/vaccines.json exists.',
    free: 'Free', paid: 'Paid', pendingPrice: 'TBD', doseUnit: 'dose', doseCount: 'doses', ageBirth: 'At birth', ageMonth: '{n} mo', ageYear: '{n} y',
    noneRequired: 'No required vaccine for this age.', doseNo: 'Dose {n}', replaced: 'Replaced', noneSelected: 'No vaccines selected',
    selectedCount: 'Selected {selected}', replacedCount: ' · Replaced {disabled}', clear: 'Clear', noResult: 'No vaccines matched', detail: 'Details',
    freeVaccine: 'Free vaccine', paidVaccine: 'Paid vaccine', fullCourse: 'Total {doses} doses, about ¥{price}', selected: 'Selected', replacedLong: 'Replaced',
    disease: 'Disease', intro: 'Description', schedule: 'Schedule', priceTitle: 'Price', sideEffects: 'Side effects', alternatives: 'Alternatives',
    canReplace: 'Can replace', recommendation: 'Recommendation', ageLimit: 'Age limit'
  }
};

class VaccineGuide {
  constructor() {
    this.data = null;
    this.currentAge = 2;
    this.currentTab = 'timeline';
    this.searchQuery = '';
    this.categoryFilter = 'all';
    this.selectedVaccines = new Set();
    this.alternativeMap = new Map();
    this.language = localStorage.getItem('vaccineGuideLang') || 'zh';
    this.theme = localStorage.getItem('vaccineGuideTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    this.init();
  }

  async init() {
    await this.loadData();
    this.buildAlternativeMap();
    this.loadSelectedVaccines();
    this.applyTheme();
    this.bindEvents();
    this.render();
  }

  async loadData() {
    try {
      const response = await fetch('data/vaccines.json');
      this.data = await response.json();
    } catch (error) {
      console.error('Failed to load vaccine data:', error);
      // Fallback: try to load from same directory
      try {
        const response = await fetch('./data/vaccines.json');
        this.data = await response.json();
      } catch (e) {
        console.error('Fallback also failed:', e);
        this.showError();
      }
    }
  }

  showError() {
    document.querySelector('.app').innerHTML = `
      <div class="empty-state" style="padding: 100px 24px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>${this.t('loadError')}</p>
      </div>
    `;
  }

  bindEvents() {
    // Age input and slider
    const ageInput = document.getElementById('ageInput');
    const maxAge = 162;

    const languageSelect = document.getElementById('languageSelect');
    const themeToggle = document.getElementById('themeToggle');
    if (languageSelect) {
      languageSelect.value = this.language;
      languageSelect.addEventListener('change', (e) => {
        this.language = e.target.value;
        localStorage.setItem('vaccineGuideLang', this.language);
        this.render();
      });
    }
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('vaccineGuideTheme', this.theme);
        this.applyTheme();
      });
    }

    ageInput.addEventListener('input', (e) => {
      let value = parseInt(e.target.value) || 0;
      value = Math.max(0, Math.min(maxAge, value));
      this.currentAge = value;
      this.updateCurrentVaccines();
      this.updateTimeline();
    });

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderAllVaccines();
      });
    }

    // Modal
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const ageModalOverlay = document.getElementById('ageModalOverlay');
    const ageModalClose = document.getElementById('ageModalClose');
    const ageModalTrigger = document.getElementById('openAgeModal');

    modalClose.addEventListener('click', () => this.closeModal());
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) this.closeModal();
    });

    ageModalClose.addEventListener('click', () => this.closeAgeModal());
    ageModalOverlay.addEventListener('click', (e) => {
      if (e.target === ageModalOverlay) this.closeAgeModal();
    });

    ageModalTrigger.addEventListener('click', () => this.openAgeModal());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeAgeModal();
      }
    });

    // Load saved age from localStorage
    const savedAge = localStorage.getItem('vaccineGuideAge');
    if (savedAge) {
      this.currentAge = parseInt(savedAge);
      ageInput.value = this.currentAge;
    }
  }

  buildAlternativeMap() {
    if (!this.data?.vaccines) return;

    this.data.vaccines.forEach(vaccine => {
      const alternatives = [
        ...(vaccine.replaces || []),
        ...(vaccine.alternatives || [])
      ];

      alternatives.forEach(altId => {
        if (!this.alternativeMap.has(vaccine.id)) {
          this.alternativeMap.set(vaccine.id, new Set());
        }
        if (!this.alternativeMap.has(altId)) {
          this.alternativeMap.set(altId, new Set());
        }
        this.alternativeMap.get(vaccine.id).add(altId);
        this.alternativeMap.get(altId).add(vaccine.id);
      });
    });
  }

  loadSelectedVaccines() {
    const stored = localStorage.getItem('vaccineGuideSelected');
    if (!stored) return;
    try {
      const ids = JSON.parse(stored);
      if (Array.isArray(ids)) {
        this.selectedVaccines = new Set(ids);
      }
    } catch (error) {
      console.warn('Failed to parse stored selections', error);
    }
  }

  saveSelectedVaccines() {
    localStorage.setItem('vaccineGuideSelected', JSON.stringify([...this.selectedVaccines]));
  }

  getDisabledVaccines() {
    const disabled = new Set();
    this.selectedVaccines.forEach(id => {
      const alternatives = this.alternativeMap.get(id);
      if (alternatives) {
        alternatives.forEach(altId => {
          if (!this.selectedVaccines.has(altId)) {
            disabled.add(altId);
          }
        });
      }
    });
    return disabled;
  }

  getPriceLabel(vaccine, withUnit = true) {
    if (vaccine.type === 'free') return this.t('free');
    if (vaccine.price === null || vaccine.price === undefined) return this.t('pendingPrice');
    return withUnit ? `¥${vaccine.price}/${this.t('doseUnit')}` : `¥${vaccine.price}`;
  }



  t(key, vars = {}) {
    const dict = I18N[this.language] || I18N.zh;
    const fallback = I18N.zh[key] || key;
    let text = dict[key] || fallback;
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  }

  getVaccineName(vaccine) {
    return this.language === 'en' ? (vaccine.nameEn || vaccine.name) : vaccine.name;
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = this.theme === 'dark' ? this.t('themeToggleLight') : this.t('themeToggleDark');
    }
  }

  applyTranslations() {
    document.documentElement.lang = this.language === 'en' ? 'en' : 'zh-CN';
    document.title = this.t('appTitle');
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const txt = this.t(key);
      if (key === 'footerDisclaimer') {
        el.innerHTML = txt;
      } else if (!el.querySelector('svg')) {
        el.textContent = txt;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    this.applyTheme();
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }

  render() {
    this.applyTranslations();
    this.updateCurrentVaccines();
    this.renderTimeline();
    this.renderCompare();
    this.renderAllVaccines();
    this.renderTips();
    this.renderCategoryFilters();
  }

  getAgeLabel(months) {
    if (months === 0) return this.t('ageBirth');
    if (months < 12) return this.t('ageMonth', { n: months });
    if (months === 12) return this.t('ageYear', { n: 1 });
    if (months < 24) return this.t('ageMonth', { n: months });
    if (months === 24) return this.t('ageYear', { n: 2 });
    if (months === 36) return this.t('ageYear', { n: 3 });
    if (months === 48) return this.t('ageYear', { n: 4 });
    if (months === 60) return this.t('ageYear', { n: 5 });
    if (months === 72) return this.t('ageYear', { n: 6 });
    if (months >= 108) return this.t('ageYear', { n: Math.floor(months / 12) });
    return this.t('ageMonth', { n: months });
  }

  updateCurrentVaccines() {
    const container = document.getElementById('currentVaccines');
    const ageDisplay = document.getElementById('currentAgeDisplay');

    // Save to localStorage
    localStorage.setItem('vaccineGuideAge', this.currentAge);

    // Update age display
    ageDisplay.textContent = this.getAgeLabel(this.currentAge);

    // Find vaccines for current age
    const currentGuide = this.data.ageGuide.find(g => g.ageMonths === this.currentAge);
    const nearbyGuides = this.data.ageGuide.filter(g =>
      g.ageMonths >= this.currentAge && g.ageMonths <= this.currentAge + 3
    );

    let vaccineIds = new Set();

    if (currentGuide) {
      currentGuide.mustHave.forEach(id => vaccineIds.add(id));
      currentGuide.recommended.forEach(id => vaccineIds.add(id));
    }

    // Also check vaccines that can be started at this age
    this.data.vaccines.forEach(v => {
      v.schedule.forEach(s => {
        if (s.ageMonths === this.currentAge) {
          vaccineIds.add(v.id);
        }
      });
    });

    const vaccines = Array.from(vaccineIds)
      .map(id => this.data.vaccines.find(v => v.id === id))
      .filter(Boolean);

    if (vaccines.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8"/>
          </svg>
          <p>${this.t('noneRequired')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = vaccines.map(v => this.renderVaccineCard(v)).join('');

    // Bind click events
    container.querySelectorAll('.vaccine-card').forEach(card => {
      card.addEventListener('click', () => {
        const vaccineId = card.dataset.id;
        this.openModal(vaccineId);
      });
    });
  }

  renderVaccineCard(vaccine) {
    const typeClass = vaccine.type === 'free' ? 'free' : 'paid';
    const typeLabel = vaccine.type === 'free' ? this.t('free') : this.t('paid');
    const price = this.getPriceLabel(vaccine, true);

    return `
      <div class="vaccine-card ${typeClass}" data-id="${vaccine.id}">
        <div class="vaccine-card-header">
          <span class="vaccine-card-title">${this.getVaccineName(vaccine)}</span>
          <span class="vaccine-card-badge ${typeClass}">${typeLabel}</span>
        </div>
        <div class="vaccine-card-diseases">${vaccine.diseases.join(this.language === 'en' ? ', ' : '、')}</div>
        <div class="vaccine-card-meta">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            </svg>
            ${vaccine.totalDoses}剂次
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            ${price}
          </span>
        </div>
      </div>
    `;
  }

  renderTimeline() {
    const container = document.getElementById('timelineView');
    const disabledVaccines = this.getDisabledVaccines();
    this.renderSelectionSummary(disabledVaccines);

    const html = this.data.ageGuide.map(guide => {
      const isCurrent = guide.ageMonths === this.currentAge;

      // Get must-have vaccines
      const mustHaveVaccines = guide.mustHave
        .map(id => this.data.vaccines.find(v => v.id === id))
        .filter(Boolean);

      // Get recommended vaccines
      const recommendedVaccines = guide.recommended
        .map(id => this.data.vaccines.find(v => v.id === id))
        .filter(Boolean);

      const allVaccines = [
        ...mustHaveVaccines.map(v => ({ ...v, priority: 'must' })),
        ...recommendedVaccines.map(v => ({ ...v, priority: 'recommended' }))
      ];

      return `
        <div class="timeline-row">
          <div class="timeline-age ${isCurrent ? 'current' : ''}">${guide.ageLabel}</div>
          <div class="timeline-vaccines">
            ${allVaccines.map(v => {
              let typeClass = v.type === 'free' ? 'free' : 'paid';
              if (v.priority === 'recommended' && v.type === 'paid') {
                typeClass = 'paid';
              }

              const schedule = v.schedule.find(s => s.ageMonths === guide.ageMonths);
              const doseText = schedule ? `${this.t('doseNo', { n: schedule.dose })}` : '';
              const isSelected = this.selectedVaccines.has(v.id);
              const isDisabled = !isSelected && disabledVaccines.has(v.id);
              const statusBadge = isDisabled ? `<span class="disabled-reason">${this.t('replaced')}</span>` : '';

              return `
                <div class="timeline-vaccine ${typeClass} ${isDisabled ? 'is-disabled' : ''} ${isSelected ? 'is-selected' : ''}" data-id="${v.id}">
                  <input class="vaccine-check" type="checkbox" data-id="${v.id}" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                  <button type="button" class="vaccine-detail" data-id="${v.id}">
                    ${this.getVaccineName(v)}
                  </button>
                  ${doseText ? `<span class="dose">${doseText}</span>` : ''}
                  ${statusBadge}
                </div>
              `;
            }).join('')}
            ${allVaccines.length === 0 ? '<span style="color: var(--foreground-tertiary); font-size: 13px;">-</span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Bind click events
    container.querySelectorAll('.vaccine-detail').forEach(el => {
      el.addEventListener('click', () => {
        const vaccineId = el.dataset.id;
        this.openModal(vaccineId);
      });
    });

    container.querySelectorAll('.vaccine-check').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const vaccineId = checkbox.dataset.id;
        if (checkbox.checked) {
          this.selectedVaccines.add(vaccineId);
        } else {
          this.selectedVaccines.delete(vaccineId);
        }
        this.saveSelectedVaccines();
        this.renderTimeline();
        this.renderCompare();
      });
    });
  }

  renderSelectionSummary(disabledVaccines) {
    const container = document.getElementById('selectionSummary');
    if (!container) return;

    const selected = [...this.selectedVaccines]
      .map(id => this.data.vaccines.find(v => v.id === id))
      .filter(Boolean);

    if (selected.length === 0) {
      container.innerHTML = `
        <span class="selection-empty">${this.t('noneSelected')}</span>
      `;
      return;
    }

    const disabledCount = disabledVaccines.size;

    container.innerHTML = `
      <div class="selection-chips">
        ${selected.map(vaccine => `
          <button class="selection-chip" data-id="${vaccine.id}" type="button">
            ${this.getVaccineName(vaccine)}
            <span aria-hidden="true">×</span>
          </button>
        `).join('')}
      </div>
      <div class="selection-actions">
        <span class="selection-count">${this.t('selectedCount', { selected: selected.length })}${disabledCount ? this.t('replacedCount', { disabled: disabledCount }) : ''}</span>
        <button class="selection-clear" type="button">${this.t('clear')}</button>
      </div>
    `;

    container.querySelectorAll('.selection-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const vaccineId = chip.dataset.id;
        this.selectedVaccines.delete(vaccineId);
        this.saveSelectedVaccines();
        this.renderTimeline();
        this.renderCompare();
      });
    });

    const clearButton = container.querySelector('.selection-clear');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.selectedVaccines.clear();
        this.saveSelectedVaccines();
        this.renderTimeline();
        this.renderCompare();
      });
    }
  }

  updateTimeline() {
    this.renderTimeline();
  }

  renderCompare() {
    const freeList = document.getElementById('freeVaccinesList');
    const paidList = document.getElementById('paidVaccinesList');
    const groupsGrid = document.getElementById('vaccineGroups');
    const disabledVaccines = this.getDisabledVaccines();

    // Free vaccines
    const freeVaccines = this.data.vaccines.filter(v => v.type === 'free');
    freeList.innerHTML = freeVaccines.map(v => `
      <div class="compare-item ${this.selectedVaccines.has(v.id) ? 'is-selected' : ''} ${!this.selectedVaccines.has(v.id) && disabledVaccines.has(v.id) ? 'is-disabled' : ''}" data-id="${v.id}">
        <div class="compare-item-name">${this.getVaccineName(v)}</div>
        <div class="compare-item-diseases">${v.diseases.join(this.language === 'en' ? ', ' : '、')}</div>
        <div class="compare-item-price">${this.t('free')} · ${v.totalDoses}${this.t('doseCount')}</div>
        ${!this.selectedVaccines.has(v.id) && disabledVaccines.has(v.id) ? `<div class="compare-item-status">${this.t('replacedLong')}</div>` : ''}
      </div>
    `).join('');

    // Paid vaccines
    const paidVaccines = this.data.vaccines.filter(v => v.type === 'paid');
    paidList.innerHTML = paidVaccines.map(v => `
      <div class="compare-item ${this.selectedVaccines.has(v.id) ? 'is-selected' : ''} ${!this.selectedVaccines.has(v.id) && disabledVaccines.has(v.id) ? 'is-disabled' : ''}" data-id="${v.id}">
        <div class="compare-item-name">${this.getVaccineName(v)}</div>
        <div class="compare-item-diseases">${v.diseases.join(this.language === 'en' ? ', ' : '、')}</div>
        <div class="compare-item-price">${this.getPriceLabel(v, true)} · ${v.totalDoses}${this.t('doseCount')}</div>
        ${!this.selectedVaccines.has(v.id) && disabledVaccines.has(v.id) ? `<div class="compare-item-status">${this.t('replacedLong')}</div>` : ''}
      </div>
    `).join('');

    // Groups
    groupsGrid.innerHTML = this.data.vaccineGroups.map(group => `
      <div class="group-card">
        <div class="group-card-title">${group.name}</div>
        <div class="group-card-desc">${group.description}</div>
        <div class="group-card-comparison">${group.comparison}</div>
        <div class="group-card-recommendation">${group.recommendation}</div>
      </div>
    `).join('');

    // Bind click events
    [freeList, paidList].forEach(list => {
      list.querySelectorAll('.compare-item').forEach(el => {
        el.addEventListener('click', () => {
          this.openModal(el.dataset.id);
        });
      });
    });
  }

  renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    const categories = [...new Set(this.data.vaccines.map(v => v.category))];

    container.innerHTML = `
      <button class="chip active" data-category="all">${this.t('allCategory')}</button>
      ${categories.map(cat => `
        <button class="chip" data-category="${cat}">${cat}</button>
      `).join('')}
    `;

    container.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.categoryFilter = chip.dataset.category;
        this.renderAllVaccines();
      });
    });
  }

  renderAllVaccines() {
    const tbody = document.getElementById('allVaccinesBody');

    let vaccines = this.data.vaccines;

    // Filter by category
    if (this.categoryFilter !== 'all') {
      vaccines = vaccines.filter(v => v.category === this.categoryFilter);
    }

    // Filter by search
    if (this.searchQuery) {
      vaccines = vaccines.filter(v =>
        v.name.toLowerCase().includes(this.searchQuery) ||
        v.nameEn.toLowerCase().includes(this.searchQuery) ||
        v.diseases.some(d => d.toLowerCase().includes(this.searchQuery))
      );
    }

    if (vaccines.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <p>${this.t('noResult')}</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = vaccines.map(v => {
      const typeClass = v.type === 'free' ? 'free' : 'paid';
      const typeLabel = v.type === 'free' ? this.t('free') : this.t('paid');
      const price = this.getPriceLabel(v, false);

      return `
        <tr>
          <td class="name-cell">${this.getVaccineName(v)}</td>
          <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
          <td class="diseases-cell">${v.diseases.join(this.language === 'en' ? ', ' : '、')}</td>
          <td>${v.totalDoses}${this.t('doseUnit')}</td>
          <td class="price-cell">${price}</td>
          <td class="action-cell">
            <button class="detail-btn" data-id="${v.id}">${this.t('detail')}</button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind click events
    tbody.querySelectorAll('.detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openModal(btn.dataset.id);
      });
    });
  }

  renderTips() {
    const container = document.getElementById('tipsGrid');

    container.innerHTML = this.data.tips.map(tip => `
      <div class="tip-card">
        <div class="tip-card-title">${tip.title}</div>
        <div class="tip-card-content">${tip.content}</div>
      </div>
    `).join('');
  }

  openModal(vaccineId) {
    const vaccine = this.data.vaccines.find(v => v.id === vaccineId);
    if (!vaccine) return;

    const modalContent = document.getElementById('modalContent');
    const modalOverlay = document.getElementById('modalOverlay');

    const typeClass = vaccine.type === 'free' ? 'free' : 'paid';
    const typeLabel = vaccine.type === 'free' ? this.t('freeVaccine') : this.t('paidVaccine');
    const priceDisplay = this.getPriceLabel(vaccine, false);
    const totalPrice = vaccine.price === null || vaccine.price === undefined
      ? null
      : this.t('fullCourse', { doses: vaccine.totalDoses, price: vaccine.price * vaccine.totalDoses });
    const disabledVaccines = this.getDisabledVaccines();
    const isSelected = this.selectedVaccines.has(vaccine.id);
    const isDisabled = !isSelected && disabledVaccines.has(vaccine.id);
    const statusBadge = isSelected
      ? `<span class="badge badge-selected">${this.t('selected')}</span>`
      : (isDisabled ? `<span class="badge badge-disabled">${this.t('replacedLong')}</span>` : '');

    // Find alternatives
    const alternatives = vaccine.replaces
      ? vaccine.replaces.map(id => this.data.vaccines.find(v => v.id === id)).filter(Boolean)
      : (vaccine.alternatives || []).map(id => this.data.vaccines.find(v => v.id === id)).filter(Boolean);

    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${this.getVaccineName(vaccine)}</h2>
        <p class="modal-subtitle">${vaccine.nameEn}</p>
        <div class="modal-badges">
          <span class="badge ${typeClass}">${typeLabel}</span>
          ${vaccine.note ? `<span class="badge" style="background: var(--accent-success-light); color: #0a8f4d;">${vaccine.note}</span>` : ''}
          ${statusBadge}
        </div>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">${this.t('disease')}</h3>
        <p class="modal-section-content">${vaccine.diseases.join(this.language === 'en' ? ', ' : '、')}</p>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">${this.t('intro')}</h3>
        <p class="modal-section-content">${vaccine.description}</p>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">${this.t('schedule')}</h3>
        <div class="schedule-list">
          ${vaccine.schedule.map(s => `
            <div class="schedule-item">
              <span class="schedule-dose">${s.dose}</span>
              <div class="schedule-info">
                <div class="schedule-age">${s.note || this.getAgeLabel(s.ageMonths)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">${this.t('priceTitle')}</h3>
        <div class="modal-price ${typeClass}">${priceDisplay}</div>
        ${vaccine.type === 'paid' && totalPrice ? `<p class="modal-price-note">${totalPrice}</p>` : ''}
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">${this.t('sideEffects')}</h3>
        <p class="modal-section-content">${vaccine.sideEffects}</p>
      </div>

      ${alternatives.length > 0 ? `
        <div class="modal-section">
          <h3 class="modal-section-title">${vaccine.replaces ? this.t('canReplace') : this.t('alternatives')}</h3>
          <div class="alternatives-list">
            ${alternatives.map(a => `
              <span class="alternative-chip" data-id="${a.id}">${a.name}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="modal-section">
        <h3 class="modal-section-title">${this.t('recommendation')}</h3>
        <div class="recommendation-box">${vaccine.recommendations}</div>
      </div>

      ${vaccine.ageLimit ? `
        <div class="modal-section">
          <h3 class="modal-section-title">${this.t('ageLimit')}</h3>
          <p class="modal-section-content" style="color: var(--accent-error);">${vaccine.ageLimit.note}</p>
        </div>
      ` : ''}
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Bind alternative clicks
    modalContent.querySelectorAll('.alternative-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.openModal(chip.dataset.id);
      });
    });
  }

  closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  openAgeModal() {
    const ageModalOverlay = document.getElementById('ageModalOverlay');
    ageModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.updateCurrentVaccines();
  }

  closeAgeModal() {
    const ageModalOverlay = document.getElementById('ageModalOverlay');
    if (!ageModalOverlay.classList.contains('active')) return;
    ageModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new VaccineGuide();
});
