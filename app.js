// Vaccine Guide Application
class VaccineGuide {
  constructor() {
    this.data = null;
    this.currentAge = 2;
    this.currentTab = 'timeline';
    this.searchQuery = '';
    this.categoryFilter = 'all';

    this.init();
  }

  async init() {
    await this.loadData();
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
    const ageSlider = document.getElementById('ageSlider');
    const maxAge = 162;

    ageInput.addEventListener('input', (e) => {
      let value = parseInt(e.target.value) || 0;
      value = Math.max(0, Math.min(maxAge, value));
      this.currentAge = value;
      ageSlider.value = value;
      this.updateCurrentVaccines();
      this.updateTimeline();
    });

    ageSlider.addEventListener('input', (e) => {
      this.currentAge = parseInt(e.target.value);
      ageInput.value = this.currentAge;
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

    modalClose.addEventListener('click', () => this.closeModal());
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) this.closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Load saved age from localStorage
    const savedAge = localStorage.getItem('vaccineGuideAge');
    if (savedAge) {
      this.currentAge = parseInt(savedAge);
      ageInput.value = this.currentAge;
      ageSlider.value = this.currentAge;
    }
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

              return `
                <span class="timeline-vaccine ${typeClass}" data-id="${v.id}">
                  ${v.name}
                  ${doseText ? `<span class="dose">${doseText}</span>` : ''}
                </span>
              `;
            }).join('')}
            ${allVaccines.length === 0 ? '<span style="color: var(--foreground-tertiary); font-size: 13px;">-</span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Bind click events
    container.querySelectorAll('.timeline-vaccine').forEach(el => {
      el.addEventListener('click', () => {
        const vaccineId = el.dataset.id;
        this.openModal(vaccineId);
      });
    });
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

    // Free vaccines
    const freeVaccines = this.data.vaccines.filter(v => v.type === 'free');
    freeList.innerHTML = freeVaccines.map(v => `
      <div class="compare-item" data-id="${v.id}">
        <div class="compare-item-name">${v.name}</div>
        <div class="compare-item-diseases">${v.diseases.join('、')}</div>
        <div class="compare-item-price">免费 · ${v.totalDoses}剂次</div>
      </div>
    `).join('');

    // Paid vaccines
    const paidVaccines = this.data.vaccines.filter(v => v.type === 'paid');
    paidList.innerHTML = paidVaccines.map(v => `
      <div class="compare-item" data-id="${v.id}">
        <div class="compare-item-name">${v.name}</div>
        <div class="compare-item-diseases">${v.diseases.join('、')}</div>
        <div class="compare-item-price">${this.getPriceLabel(v, true)} · ${v.totalDoses}剂次</div>
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new VaccineGuide();
});
