// Vaccine Guide Application
class VaccineGuide {
  constructor() {
    this.data = null;
    this.currentAge = 2;
    this.currentTab = 'timeline';
    this.searchQuery = '';
    this.categoryFilter = 'all';
    this.selectedVaccines = new Set();
    this.alternativeMap = new Map();

    this.init();
  }

  async init() {
    await this.loadData();
    this.buildAlternativeMap();
    this.loadSelectedVaccines();
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
        <p>无法加载疫苗数据，请确保 data/vaccines.json 文件存在</p>
      </div>
    `;
  }

  bindEvents() {
    // Age input and slider
    const ageInput = document.getElementById('ageInput');
    const maxAge = 162;

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
    if (vaccine.type === 'free') return '免费';
    if (vaccine.price === null || vaccine.price === undefined) return '价格待确认';
    return withUnit ? `¥${vaccine.price}/剂` : `¥${vaccine.price}`;
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
    this.updateCurrentVaccines();
    this.renderTimeline();
    this.renderCompare();
    this.renderAllVaccines();
    this.renderTips();
    this.renderCategoryFilters();
  }

  getAgeLabel(months) {
    if (months === 0) return '出生时';
    if (months < 12) return `${months}月龄`;
    if (months === 12) return '1岁';
    if (months < 24) return `${months}月龄`;
    if (months === 24) return '2岁';
    if (months === 36) return '3岁';
    if (months === 48) return '4岁';
    if (months === 60) return '5岁';
    if (months === 72) return '6岁';
    if (months >= 108) return `${Math.floor(months / 12)}岁`;
    return `${months}月龄`;
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
          <p>该月龄暂无必须接种的疫苗</p>
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
    const typeLabel = vaccine.type === 'free' ? '免费' : '自费';
    const price = this.getPriceLabel(vaccine, true);

    return `
      <div class="vaccine-card ${typeClass}" data-id="${vaccine.id}">
        <div class="vaccine-card-header">
          <span class="vaccine-card-title">${vaccine.name}</span>
          <span class="vaccine-card-badge ${typeClass}">${typeLabel}</span>
        </div>
        <div class="vaccine-card-diseases">${vaccine.diseases.join('、')}</div>
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
              const doseText = schedule ? `第${schedule.dose}剂` : '';
              const isSelected = this.selectedVaccines.has(v.id);
              const isDisabled = !isSelected && disabledVaccines.has(v.id);
              const statusBadge = isDisabled ? '<span class="disabled-reason">已替代</span>' : '';

              return `
                <div class="timeline-vaccine ${typeClass} ${isDisabled ? 'is-disabled' : ''} ${isSelected ? 'is-selected' : ''}" data-id="${v.id}">
                  <input class="vaccine-check" type="checkbox" data-id="${v.id}" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                  <button type="button" class="vaccine-detail" data-id="${v.id}">
                    ${v.name}
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
        <span class="selection-empty">未勾选任何疫苗</span>
      `;
      return;
    }

    const disabledCount = disabledVaccines.size;

    container.innerHTML = `
      <div class="selection-chips">
        ${selected.map(vaccine => `
          <button class="selection-chip" data-id="${vaccine.id}" type="button">
            ${vaccine.name}
            <span aria-hidden="true">×</span>
          </button>
        `).join('')}
      </div>
      <div class="selection-actions">
        <span class="selection-count">已勾选 ${selected.length} 项${disabledCount ? ` · 已替代 ${disabledCount} 项` : ''}</span>
        <button class="selection-clear" type="button">清空</button>
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
    // Just update the current indicator
    document.querySelectorAll('.timeline-age').forEach(el => {
      const ageText = el.textContent;
      const guide = this.data.ageGuide.find(g => g.ageLabel === ageText);
      if (guide) {
        el.classList.toggle('current', guide.ageMonths === this.currentAge);
      }
    });
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
        <div class="compare-item-name">${v.name}</div>
        <div class="compare-item-diseases">${v.diseases.join('、')}</div>
        <div class="compare-item-price">免费 · ${v.totalDoses}剂次</div>
        ${!this.selectedVaccines.has(v.id) && disabledVaccines.has(v.id) ? '<div class="compare-item-status">已被替代</div>' : ''}
      </div>
    `).join('');

    // Paid vaccines
    const paidVaccines = this.data.vaccines.filter(v => v.type === 'paid');
    paidList.innerHTML = paidVaccines.map(v => `
      <div class="compare-item ${this.selectedVaccines.has(v.id) ? 'is-selected' : ''} ${!this.selectedVaccines.has(v.id) && disabledVaccines.has(v.id) ? 'is-disabled' : ''}" data-id="${v.id}">
        <div class="compare-item-name">${v.name}</div>
        <div class="compare-item-diseases">${v.diseases.join('、')}</div>
        <div class="compare-item-price">${this.getPriceLabel(v, true)} · ${v.totalDoses}剂次</div>
        ${!this.selectedVaccines.has(v.id) && disabledVaccines.has(v.id) ? '<div class="compare-item-status">已被替代</div>' : ''}
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
      <button class="chip active" data-category="all">全部</button>
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
              <p>没有找到匹配的疫苗</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = vaccines.map(v => {
      const typeClass = v.type === 'free' ? 'free' : 'paid';
      const typeLabel = v.type === 'free' ? '免费' : '自费';
      const price = this.getPriceLabel(v, false);

      return `
        <tr>
          <td class="name-cell">${v.name}</td>
          <td><span class="type-badge ${typeClass}">${typeLabel}</span></td>
          <td class="diseases-cell">${v.diseases.join('、')}</td>
          <td>${v.totalDoses}剂</td>
          <td class="price-cell">${price}</td>
          <td class="action-cell">
            <button class="detail-btn" data-id="${v.id}">详情</button>
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
    const typeLabel = vaccine.type === 'free' ? '免费疫苗' : '自费疫苗';
    const priceDisplay = this.getPriceLabel(vaccine, false);
    const totalPrice = vaccine.price === null || vaccine.price === undefined
      ? null
      : `全程${vaccine.totalDoses}剂，约需 ¥${vaccine.price * vaccine.totalDoses}`;
    const disabledVaccines = this.getDisabledVaccines();
    const isSelected = this.selectedVaccines.has(vaccine.id);
    const isDisabled = !isSelected && disabledVaccines.has(vaccine.id);
    const statusBadge = isSelected
      ? '<span class="badge badge-selected">已勾选</span>'
      : (isDisabled ? '<span class="badge badge-disabled">已被替代</span>' : '');

    // Find alternatives
    const alternatives = vaccine.replaces
      ? vaccine.replaces.map(id => this.data.vaccines.find(v => v.id === id)).filter(Boolean)
      : (vaccine.alternatives || []).map(id => this.data.vaccines.find(v => v.id === id)).filter(Boolean);

    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">${vaccine.name}</h2>
        <p class="modal-subtitle">${vaccine.nameEn}</p>
        <div class="modal-badges">
          <span class="badge ${typeClass}">${typeLabel}</span>
          ${vaccine.note ? `<span class="badge" style="background: var(--accent-success-light); color: #0a8f4d;">${vaccine.note}</span>` : ''}
          ${statusBadge}
        </div>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">预防疾病</h3>
        <p class="modal-section-content">${vaccine.diseases.join('、')}</p>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">疫苗说明</h3>
        <p class="modal-section-content">${vaccine.description}</p>
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">接种程序</h3>
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
        <h3 class="modal-section-title">参考价格</h3>
        <div class="modal-price ${typeClass}">${priceDisplay}</div>
        ${vaccine.type === 'paid' && totalPrice ? `<p class="modal-price-note">${totalPrice}</p>` : ''}
      </div>

      <div class="modal-section">
        <h3 class="modal-section-title">不良反应</h3>
        <p class="modal-section-content">${vaccine.sideEffects}</p>
      </div>

      ${alternatives.length > 0 ? `
        <div class="modal-section">
          <h3 class="modal-section-title">${vaccine.replaces ? '可替代' : '替代方案'}</h3>
          <div class="alternatives-list">
            ${alternatives.map(a => `
              <span class="alternative-chip" data-id="${a.id}">${a.name}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="modal-section">
        <h3 class="modal-section-title">接种建议</h3>
        <div class="recommendation-box">${vaccine.recommendations}</div>
      </div>

      ${vaccine.ageLimit ? `
        <div class="modal-section">
          <h3 class="modal-section-title">年龄限制</h3>
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
