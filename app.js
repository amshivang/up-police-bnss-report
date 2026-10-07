/**
 * UTTAR PRADESH POLICE - BNSS 126/135 REPORT GENERATION ENGINE
 * Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
 */

// Storage Keys
const STORAGE_KEY = 'upp_bnss_reports_v1';
const DRAFT_KEY = 'upp_bnss_active_draft_v1';

// Initial Application State
let appState = {
  activeView: 'dashboard',      // 'dashboard' | 'generator'
  activeMobileTab: 'form',      // 'form' | 'preview'
  editingReportId: null,        // null when creating new, or string ID when editing
  reports: [],
  currentReport: {
    thana: '',
    janpad: '',
    rapatNo: '',
    rapatDate: '',
    rapatTime: '',
    courtOfficer: '',
    reportingOfficer: '',
    party1: [
      { name: '', parentName: '', age: '', address: '' }
    ],
    party2: [
      { name: '', parentName: '', age: '', address: '' }
    ],
    subject: '',
    inquiryFacts: '',
    legalPrayer: '',
    attachments: ''
  }
};

// Initialize Application on Page Load
document.addEventListener('DOMContentLoaded', () => {
  loadReportsFromStorage();
  loadActiveDraft();
  populateFormFromState();
  renderPartyCards(1);
  renderPartyCards(2);
  syncLivePreview();
  renderDashboard();

  switchMainView('dashboard');

  const form = document.getElementById('report-input-form');
  if (form) {
    form.addEventListener('input', () => {
      saveActiveDraft();
    });
  }
});

/* ================= STORAGE MANAGEMENT ================= */
function loadActiveDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const draft = JSON.parse(raw);
      if (draft && typeof draft === 'object') {
        appState.currentReport = { ...appState.currentReport, ...draft };
      }
    }
  } catch (e) {
    console.warn('Draft load error:', e);
  }
}

function saveActiveDraft() {
  try {
    const r = appState.currentReport;
    const hasData = r && (
      r.thana || r.janpad || r.rapatNo || r.subject || r.inquiryFacts ||
      (r.party1 && r.party1.some(p => p.name || p.address)) ||
      (r.party2 && r.party2.some(p => p.name || p.address))
    );
    if (hasData) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(r));
    }
  } catch (e) {
    console.warn('Draft save error:', e);
  }
}

function clearActiveDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {}
}

function loadReportsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      appState.reports = JSON.parse(raw) || [];
    } else {
      appState.reports = [];
    }
    updateSavedBadge();
  } catch (e) {
    console.error('Storage error:', e);
    appState.reports = [];
  }
}

function saveReportsList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.reports));
  updateSavedBadge();
  renderDashboard();
}

function updateSavedBadge() {
  const badge = document.getElementById('saved-count-badge');
  if (badge) {
    badge.innerText = appState.reports ? appState.reports.length : 0;
  }
}

/* ================= VIEW SWITCHING ================= */
function switchMainView(viewName) {
  appState.activeView = viewName;
  const genView = document.getElementById('generator-view');
  const dashView = document.getElementById('dashboard-view');
  const genBtn = document.getElementById('nav-btn-generator');
  const dashBtn = document.getElementById('nav-btn-dashboard');

  if (viewName === 'generator') {
    if (genView) genView.style.display = 'flex';
    if (dashView) dashView.style.display = 'none';
    if (genBtn) genBtn.classList.add('active');
    if (dashBtn) dashBtn.classList.remove('active');
  } else {
    if (genView) genView.style.display = 'none';
    if (dashView) dashView.style.display = 'flex';
    if (genBtn) genBtn.classList.remove('active');
    if (dashBtn) dashBtn.classList.add('active');
    renderDashboard();
  }
}

function switchMobileTab(tab) {
  appState.activeMobileTab = tab;
  const formCol = document.getElementById('form-column');
  const prevCol = document.getElementById('preview-column');
  const btnForm = document.getElementById('mobile-tab-form');
  const btnPrev = document.getElementById('mobile-tab-preview');

  if (tab === 'form') {
    if (formCol) {
      formCol.classList.remove('mobile-tab-hidden');
      formCol.classList.add('mobile-tab-active');
    }
    if (prevCol) {
      prevCol.classList.add('mobile-tab-hidden');
      prevCol.classList.remove('mobile-tab-active');
    }
    if (btnForm) btnForm.classList.add('active');
    if (btnPrev) btnPrev.classList.remove('active');
  } else {
    if (formCol) {
      formCol.classList.add('mobile-tab-hidden');
      formCol.classList.remove('mobile-tab-active');
    }
    if (prevCol) {
      prevCol.classList.remove('mobile-tab-hidden');
      prevCol.classList.add('mobile-tab-active');
    }
    if (btnForm) btnForm.classList.remove('active');
    if (btnPrev) btnPrev.classList.add('active');
    syncLivePreview();
  }
}

/* ================= DYNAMIC PARTY MEMBERS ================= */
function renderPartyCards(partyNum) {
  const container = document.getElementById(`party-${partyNum}-container`);
  if (!container) return;

  const partyList = partyNum === 1 ? appState.currentReport.party1 : appState.currentReport.party2;
  container.innerHTML = '';

  partyList.forEach((person, index) => {
    const card = document.createElement('div');
    card.className = `party-card ${partyNum === 2 ? 'party-2-card' : ''}`;
    
    const canRemove = partyList.length > 1;

    card.innerHTML = `
      <div class="party-card-header">
        <span class="party-card-title">पार्टी ${partyNum === 1 ? 'प्रथम' : 'द्वितीय'} व्यक्ति ${index + 1}</span>
        ${canRemove ? `
          <button type="button" class="btn-remove-member" onclick="removePartyMember(${partyNum}, ${index})">
            &times; हटाएं
          </button>
        ` : ''}
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>नाम</label>
          <input type="text" value="${escapeHtml(person.name || '')}" 
            oninput="updatePartyMemberField(${partyNum}, ${index}, 'name', this.value)">
        </div>
        <div class="form-group">
          <label>पिता/पति का नाम</label>
          <input type="text" value="${escapeHtml(person.parentName || '')}" 
            oninput="updatePartyMemberField(${partyNum}, ${index}, 'parentName', this.value)">
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>उम्र</label>
          <input type="text" value="${escapeHtml(person.age || '')}" 
            oninput="updatePartyMemberField(${partyNum}, ${index}, 'age', this.value)">
        </div>
        <div class="form-group">
          <label>पूरा पता</label>
          <input type="text" value="${escapeHtml(person.address || '')}" 
            oninput="updatePartyMemberField(${partyNum}, ${index}, 'address', this.value)">
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addPartyMember(partyNum) {
  const partyList = partyNum === 1 ? appState.currentReport.party1 : appState.currentReport.party2;
  partyList.push({ name: '', parentName: '', age: '', address: '' });
  renderPartyCards(partyNum);
  syncLivePreview();
}

function removePartyMember(partyNum, index) {
  const partyList = partyNum === 1 ? appState.currentReport.party1 : appState.currentReport.party2;
  if (partyList.length > 1) {
    partyList.splice(index, 1);
    renderPartyCards(partyNum);
    syncLivePreview();
  }
}

function updatePartyMemberField(partyNum, index, field, value) {
  const partyList = partyNum === 1 ? appState.currentReport.party1 : appState.currentReport.party2;
  if (partyList[index]) {
    partyList[index][field] = value;
    syncLivePreview();
  }
}

/* ================= LIVE PREVIEW SYNCHRONIZATION ================= */
function syncLivePreview() {
  // Read scalar values from form
  const r = appState.currentReport;
  r.thana = document.getElementById('f-thana')?.value || '';
  r.janpad = document.getElementById('f-janpad')?.value || '';
  r.rapatNo = document.getElementById('f-rapat-no')?.value || '';
  r.rapatDate = document.getElementById('f-rapat-date')?.value || '';
  r.rapatTime = document.getElementById('f-rapat-time')?.value || '';
  r.courtOfficer = document.getElementById('f-court-officer')?.value || '';
  r.reportingOfficer = document.getElementById('f-reporting-officer')?.value || '';
  r.subject = document.getElementById('f-subject')?.value || '';
  r.inquiryFacts = document.getElementById('f-inquiry-facts')?.value || '';
  r.legalPrayer = document.getElementById('f-legal-prayer')?.value || '';
  r.attachments = document.getElementById('f-attachments')?.value || '';

  // Update Header & Office in Preview
  setElemText('p-thana-top', r.thana || '________');
  setElemText('p-janpad-top', r.janpad || '________');
  setElemText('p-court-officer', r.courtOfficer || '________________________');
  setElemText('p-janpad-court', r.janpad || '________');

  setElemText('p-reporting-officer', r.reportingOfficer || '________________');
  setElemText('p-thana-officer', r.thana || '________');
  setElemText('p-janpad-officer', r.janpad || '________');

  setElemText('p-rapat-no', r.rapatNo || '___');
  setElemText('p-rapat-date', (r.rapatDate || '--/--/----') + (r.rapatTime ? ' समय ' + r.rapatTime : ''));

  // Format Party 1 in Preview
  const p1Container = document.getElementById('p-party-1-list');
  if (p1Container) {
    p1Container.innerHTML = '';
    const hasAnyP1 = (r.party1 || []).some(p => (p.name && p.name.trim()) || (p.parentName && p.parentName.trim()) || (p.age && p.age.trim()) || (p.address && p.address.trim()));
    if (!hasAnyP1) {
      const row = document.createElement('div');
      row.className = 'party-person-row';
      row.innerText = '1. __________________________________________________';
      p1Container.appendChild(row);
    } else {
      (r.party1 || []).forEach((p, idx) => {
        const isPersonEmpty = !p.name && !p.parentName && !p.age && !p.address;
        const row = document.createElement('div');
        row.className = 'party-person-row';
        if (isPersonEmpty) {
          row.innerText = `${idx + 1}. __________________________________________________`;
        } else {
          let text = `${idx + 1}. ${p.name || '___________'}`;
          if (p.parentName) text += ` पुत्र/पति ${p.parentName}`;
          if (p.age) text += ` उम्र करीब ${p.age}`;
          if (p.address) text += ` निवासी ${p.address}।`;
          else text += '।';
          row.innerText = text;
        }
        p1Container.appendChild(row);
      });
    }
  }

  // Format Party 2 in Preview
  const p2Container = document.getElementById('p-party-2-list');
  if (p2Container) {
    p2Container.innerHTML = '';
    const hasAnyP2 = (r.party2 || []).some(p => (p.name && p.name.trim()) || (p.parentName && p.parentName.trim()) || (p.age && p.age.trim()) || (p.address && p.address.trim()));
    if (!hasAnyP2) {
      const row = document.createElement('div');
      row.className = 'party-person-row';
      row.innerText = '1. __________________________________________________';
      p2Container.appendChild(row);
    } else {
      (r.party2 || []).forEach((p, idx) => {
        const isPersonEmpty = !p.name && !p.parentName && !p.age && !p.address;
        const row = document.createElement('div');
        row.className = 'party-person-row';
        if (isPersonEmpty) {
          row.innerText = `${idx + 1}. __________________________________________________`;
        } else {
          let text = `${idx + 1}. ${p.name || '___________'}`;
          if (p.parentName) text += ` पुत्र/पति ${p.parentName}`;
          if (p.age) text += ` उम्र करीब ${p.age}`;
          if (p.address) text += ` निवासी ${p.address}।`;
          else text += '।';
          row.innerText = text;
        }
        p2Container.appendChild(row);
      });
    }
  }

  // Comma separated party names for the narrative paragraph
  const p1Names = (r.party1 || []).map(p => p.name).filter(Boolean).join(', ') || '________________';
  const p2Names = (r.party2 || []).map(p => p.name).filter(Boolean).join(', ') || '________________';
  setElemText('p-party1-names', p1Names);
  setElemText('p-party2-names', p2Names);

  // Extract rank/designation from reporting officer if present
  let rankText = '';
  if (r.reportingOfficer) {
    if (r.reportingOfficer.includes('उप निरीक्षक') || r.reportingOfficer.includes('उ०नि०')) rankText = 'उप निरीक्षक';
    else if (r.reportingOfficer.includes('थाना प्रभारी') || r.reportingOfficer.includes('प्रभारी निरीक्षक')) rankText = 'प्रभारी निरीक्षक';
    else if (r.reportingOfficer.includes('मुख्य आरक्षी') || r.reportingOfficer.includes('हेड कांस्टेबल')) rankText = 'मुख्य आरक्षी';
    else if (r.reportingOfficer.includes('आरक्षी') || r.reportingOfficer.includes('कांस्टेबल')) rankText = 'आरक्षी';
    else rankText = r.reportingOfficer;
  }
  setElemText('p-reporting-by', rankText || '________________');

  // Narrative elements
  setElemText('p-subject', r.subject || '________________________________');
  setElemText('p-inquiry-facts', r.inquiryFacts || '________________________________________________________________________________');
  setElemText('p-legal-prayer', r.legalPrayer || '________________________________________________________________________________');
  setElemText('p-attachments', r.attachments || '________________________');

  // Signatures
  setElemText('p-sig-officer', r.reportingOfficer || '________________');
  setElemText('p-sig-thana', r.thana || '________');
  setElemText('p-sig-janpad', r.janpad || '________');
  saveActiveDraft();
}

function setElemText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

/* ================= POPULATE FORM CONTROLS ================= */
function populateFormFromState() {
  const r = appState.currentReport;
  setInputValue('f-thana', r.thana);
  setInputValue('f-janpad', r.janpad);
  setInputValue('f-rapat-no', r.rapatNo);
  setInputValue('f-rapat-date', r.rapatDate);
  setInputValue('f-rapat-time', r.rapatTime);
  setInputValue('f-court-officer', r.courtOfficer);
  setInputValue('f-reporting-officer', r.reportingOfficer);
  setInputValue('f-subject', r.subject);
  setInputValue('f-inquiry-facts', r.inquiryFacts);
  setInputValue('f-legal-prayer', r.legalPrayer);
  setInputValue('f-attachments', r.attachments);
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

/* ================= QUICK PRESET PILLS ================= */
function applyPresetSubject(subjectText) {
  const subjInput = document.getElementById('f-subject');
  if (subjInput) {
    subjInput.value = subjectText;
    appState.currentReport.subject = subjectText;
  }

  // Pre-fill smart narrative facts if field is standard
  const factsInput = document.getElementById('f-inquiry-facts');
  if (factsInput && (!factsInput.value || factsInput.value.includes('कसीदगी बनी हुई है'))) {
    if (subjectText.includes('जमीनी')) {
      factsInput.value = 'जांच पर पाया गया कि दोनों पक्षों के मध्य खेत की मेड़ व जमीन की पैमाइश को लेकर पुरानी रंजिश चल रही है। दोनों पक्ष कभी भी लाठी-डंडे लेकर आमादा फौजदारी होकर शांति व्यवस्था भंग कर सकते हैं।';
    } else if (subjectText.includes('नाली')) {
      factsInput.value = 'जांच पर पाया गया कि घरों के गंदे पानी के निकास एवं सार्वजनिक नाली को लेकर दोनों पक्षों में गाली-गलौज व तनाव बना हुआ है। कभी भी विवाद गंभीर रूप ले सकता है।';
    } else if (subjectText.includes('रास्ता')) {
      factsInput.value = 'जांच पर पाया गया कि आम रास्ते पर निर्माण सामग्री व छज्जा निकालने को लेकर दोनों पक्षों में भारी कसीदगी है और शांति व्यवस्था भंग होने की प्रबल संभावना है।';
    } else if (subjectText.includes('धमकी')) {
      factsInput.value = 'जांच पर पाया गया कि दोनों पक्ष एक-दूसरे को जान से मारने की धमकी दे रहे हैं तथा सार्वजनिक स्थान पर शांति भंग करने पर आमादा हैं।';
    } else {
      factsInput.value = 'दोनों पक्षों में कसीदगी बनी हुई है। दोनों पक्ष कभी भी लड़-झगड़कर शांति व्यवस्था भंग कर सकते हैं।';
    }
  }

  syncLivePreview();
  showToast('विवाद का विषय एवं विवरण स्वतः भरा गया ✅', 'success');
}

/* ================= CHALLAN TARGET SELECTION ================= */
function setChallanTarget(target) {
  const prayerElem = document.getElementById('f-legal-prayer');
  if (!prayerElem) return;

  ['both', 'p1', 'p2'].forEach(t => {
    const btn = document.getElementById(`btn-target-${t}`);
    if (btn) btn.classList.toggle('active', t === target);
  });

  if (target === 'p1') {
    prayerElem.value = 'अतः शांति व्यवस्था की दृष्टिगत पार्टी प्रथम उपरोक्त का चालान अंतर्गत धारा 126/135 BNSS माननीय न्यायालय किया जा रहा है। अतः श्रीमान जी से निवेदन है कि पार्टी प्रथम उपरोक्त को भारी से भारी धनराशि / मुचलके से पाबंद करने की कृपा करें।';
  } else if (target === 'p2') {
    prayerElem.value = 'अतः शांति व्यवस्था की दृष्टिगत पार्टी द्वितीय उपरोक्त का चालान अंतर्गत धारा 126/135 BNSS माननीय न्यायालय किया जा रहा है। अतः श्रीमान जी से निवेदन है कि पार्टी द्वितीय उपरोक्त को भारी से भारी धनराशि / मुचलके से पाबंद करने की कृपा करें।';
  } else {
    prayerElem.value = 'अतः शांति व्यवस्था की दृष्टिगत पार्टी प्रथम व द्वितीय दोनों पक्षों का चालान अंतर्गत धारा 126/135 BNSS माननीय न्यायालय किया जा रहा है। अतः श्रीमान जी से निवेदन है कि दोनों पक्षों को भारी से भारी धनराशि / मुचलके से पाबंद करने की कृपा करें।';
  }
  syncLivePreview();
  showToast('विधिक प्रार्थना अद्यतन की गई ✅', 'info');
}

/* ================= SPEECH-TO-TEXT / VOICE INPUT ================= */
function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('वॉइस टाइपिंग Google Chrome या समर्थित ब्राउज़र में उपलब्ध है 🎙️', 'error');
    return;
  }
  try {
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    showToast('कृपया हिंदी में बोलें... 🎙️', 'info');
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const factsElem = document.getElementById('f-inquiry-facts');
      if (factsElem) {
        factsElem.value = (factsElem.value ? factsElem.value + ' ' : '') + transcript;
        syncLivePreview();
        showToast('ध्वनि संदेश दर्ज हुआ ✅', 'success');
      }
    };
    recognition.onerror = () => {
      showToast('वॉइस पहचान समय समाप्त या निरस्त ⚠️', 'info');
    };
    recognition.start();
  } catch (e) {
    console.error('Voice input error:', e);
    showToast('माइक्रोफ़ोन एक्सेस की अनुमति दें', 'error');
  }
}

function startNewReportAndSwitch() {
  resetForm();
  switchMainView('generator');
}

/* ================= RESET FORM ================= */
function resetFormWithPrompt() {
  if (confirm('क्या आप नया फॉर्म प्रारंभ करना चाहते हैं? वर्तमान असुरक्षित बदलाव साफ हो जाएंगे।')) {
    resetForm();
  }
}

function resetForm() {
  appState.editingReportId = null;
  appState.currentReport = {
    thana: '',
    janpad: '',
    rapatNo: '',
    rapatDate: '',
    rapatTime: '',
    courtOfficer: '',
    reportingOfficer: '',
    party1: [{ name: '', parentName: '', age: '', address: '' }],
    party2: [{ name: '', parentName: '', age: '', address: '' }],
    subject: '',
    inquiryFacts: '',
    legalPrayer: '',
    attachments: ''
  };

  clearActiveDraft();
  populateFormFromState();
  renderPartyCards(1);
  renderPartyCards(2);
  syncLivePreview();
  showToast('नया रिक्त फॉर्म तैयार है ↺', 'info');
}

/* ================= SAVE REPORT TO STORAGE ================= */
function saveReportToStorage() {
  syncLivePreview();
  const r = appState.currentReport;

  // Basic validation
  if (!r.thana.trim() || !r.janpad.trim() || !r.rapatNo.trim()) {
    showToast('कृपया थाना, जनपद एवं रपट संख्या अनिवार्य रूप से भरें ⚠️', 'error');
    return;
  }

  const p1Valid = r.party1.some(p => p.name.trim().length > 0);
  const p2Valid = r.party2.some(p => p.name.trim().length > 0);
  if (!p1Valid || !p2Valid) {
    showToast('कृपया पार्टी प्रथम एवं पार्टी द्वितीय में कम से कम एक व्यक्ति का नाम भरें ⚠️', 'error');
    return;
  }

  if (appState.editingReportId) {
    // Update existing report
    const index = appState.reports.findIndex(item => item.id === appState.editingReportId);
    if (index !== -1) {
      appState.reports[index] = {
        ...JSON.parse(JSON.stringify(r)),
        id: appState.editingReportId,
        updatedAt: new Date().toISOString()
      };
      saveReportsList();
      showToast('चलानी रिपोर्ट सफलतापूर्वक अपडेट की गई ✅', 'success');
    }
  } else {
    // Create new report
    const newReport = {
      ...JSON.parse(JSON.stringify(r)),
      id: 'UPP-BNSS-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    appState.reports.unshift(newReport);
    appState.editingReportId = newReport.id;
    saveReportsList();
    showToast('नई चलानी रिपोर्ट सुरक्षित कर ली गई ✅', 'success');
  }
}

/* ================= DASHBOARD RENDERING ================= */
function renderDashboard() {
  const tbody = document.getElementById('reports-table-body');
  const emptyState = document.getElementById('reports-empty-state');
  const thanaSelect = document.getElementById('dash-filter-thana');
  if (!tbody) return;

  const searchVal = (document.getElementById('dash-search-input')?.value || '').toLowerCase().trim();
  const thanaFilter = document.getElementById('dash-filter-thana')?.value || '';
  const sortOrder = document.getElementById('dash-sort-order')?.value || 'newest';

  // Populate Thana options dynamically
  const uniqueThanas = [...new Set(appState.reports.map(r => r.thana).filter(Boolean))];
  if (thanaSelect) {
    const currentThanaVal = thanaSelect.value;
    thanaSelect.innerHTML = '<option value="">सभी थाने</option>';
    uniqueThanas.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.innerText = `थाना ${t}`;
      if (t === currentThanaVal) opt.selected = true;
      thanaSelect.appendChild(opt);
    });
  }

  // Filter reports
  let filtered = appState.reports.filter(r => {
    if (thanaFilter && r.thana !== thanaFilter) return false;
    if (!searchVal) return true;

    const p1Names = (r.party1 || []).map(p => `${p.name} ${p.parentName} ${p.address}`).join(' ');
    const p2Names = (r.party2 || []).map(p => `${p.name} ${p.parentName} ${p.address}`).join(' ');
    const searchBlob = `${r.thana} ${r.janpad} ${r.rapatNo} ${r.rapatDate} ${r.subject} ${p1Names} ${p2Names}`.toLowerCase();
    return searchBlob.includes(searchVal);
  });

  // Sort
  if (sortOrder === 'oldest') {
    filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  } else if (sortOrder === 'rapat') {
    filtered.sort((a, b) => (parseInt(a.rapatNo, 10) || 0) - (parseInt(b.rapatNo, 10) || 0));
  } else {
    // newest first
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  // Update Stats
  setElemText('stat-total-reports', appState.reports.length);
  setElemText('stat-sdm-reports', appState.reports.length);
  setElemText('stat-thana-count', uniqueThanas.length);

  const totalPersons = appState.reports.reduce((acc, r) => {
    return acc + (r.party1 ? r.party1.length : 0) + (r.party2 ? r.party2.length : 0);
  }, 0);
  setElemText('stat-pabandi-persons', totalPersons);

  // Render Table
  tbody.innerHTML = '';
  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach((r, idx) => {
      const tr = document.createElement('tr');

      const p1Display = (r.party1 && r.party1[0]?.name) ? `${r.party1[0].name}${r.party1.length > 1 ? ` (+${r.party1.length - 1} अन्य)` : ''}` : '---';
      const p2Display = (r.party2 && r.party2[0]?.name) ? `${r.party2[0].name}${r.party2.length > 1 ? ` (+${r.party2.length - 1} अन्य)` : ''}` : '---';

      tr.innerHTML = `
        <td><strong>${idx + 1}</strong></td>
        <td>
          <div style="font-weight:700; color:var(--up-navy);">रपट सं० ${escapeHtml(r.rapatNo)}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(r.rapatDate || '')}</div>
        </td>
        <td>
          <div>${escapeHtml(r.thana)}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(r.janpad)}</div>
        </td>
        <td class="cell-parties" title="${escapeHtml(p1Display)}">
          <span style="color:var(--up-navy); font-weight:600;">${escapeHtml(p1Display)}</span>
        </td>
        <td class="cell-parties" title="${escapeHtml(p2Display)}">
          <span style="color:var(--up-crimson); font-weight:600;">${escapeHtml(p2Display)}</span>
        </td>
        <td class="cell-subject" title="${escapeHtml(r.subject)}">
          ${escapeHtml(r.subject || '---')}
        </td>
        <td>
          <div class="table-actions">
            <button type="button" class="action-btn-sm" data-action="view" data-id="${escapeHtml(r.id)}" title="दस्तावेज़ देखें">
              👁️ देखें
            </button>
            <button type="button" class="action-btn-sm" data-action="edit" data-id="${escapeHtml(r.id)}" title="संपादित करें">
              ✏️ एडिट
            </button>
            <button type="button" class="action-btn-sm" data-action="print" data-id="${escapeHtml(r.id)}" title="सीधा प्रिंट / PDF">
              🖨️ प्रिंट
            </button>
            <button type="button" class="action-btn-sm" data-action="clone" data-id="${escapeHtml(r.id)}" title="कॉपी करके नई बनाएं">
              📋 कॉपी
            </button>
            <button type="button" class="action-btn-sm action-btn-delete" data-action="delete" data-id="${escapeHtml(r.id)}" title="हटाएं">
              🗑️
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Delegated safe click handler
    tbody.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'view') viewSavedReport(id);
      else if (action === 'edit') editSavedReport(id);
      else if (action === 'print') printSavedReportDirect(id);
      else if (action === 'clone') cloneSavedReport(id);
      else if (action === 'delete') deleteSavedReport(id);
    };
  }
}

function filterReportsList() {
  renderDashboard();
}

/* ================= ACTIONS ON SAVED REPORTS ================= */
function editSavedReport(id) {
  const item = appState.reports.find(r => r.id === id);
  if (!item) return;

  appState.editingReportId = id;
  appState.currentReport = JSON.parse(JSON.stringify(item));
  populateFormFromState();
  renderPartyCards(1);
  renderPartyCards(2);
  syncLivePreview();
  switchMainView('generator');
  showToast(`रिपोर्ट (रपट सं० ${item.rapatNo}) संपादन हेतु लोड की गई ✏️`, 'info');
}

function cloneSavedReport(id) {
  const item = appState.reports.find(r => r.id === id);
  if (!item) return;

  appState.editingReportId = null; // fresh new
  appState.currentReport = JSON.parse(JSON.stringify(item));
  appState.currentReport.rapatNo = ''; // leave rapat blank to assign new
  appState.currentReport.rapatDate = formatDateDDMMYY();
  populateFormFromState();
  renderPartyCards(1);
  renderPartyCards(2);
  syncLivePreview();
  switchMainView('generator');
  showToast('रिपोर्ट की प्रतिलिपि तैयार की गई (नई रपट संख्या दर्ज करें) 📋', 'success');
}

function deleteSavedReport(id) {
  const item = appState.reports.find(r => r.id === id);
  const title = item ? `रपट सं० ${item.rapatNo} (थाना ${item.thana})` : 'यह रिपोर्ट';
  if (confirm(`क्या आप ${title} को सुरक्षित सूची से हटाना चाहते हैं?`)) {
    appState.reports = appState.reports.filter(r => r.id !== id);
    if (appState.editingReportId === id) {
      appState.editingReportId = null;
    }
    saveReportsList();
    showToast('रिपोर्ट सफलतापूर्वक हटाई गई 🗑️', 'info');
  }
}

function viewSavedReport(id) {
  const item = appState.reports.find(r => r.id === id);
  if (!item) return;

  // Temporarily set preview
  const savedCurrent = JSON.parse(JSON.stringify(appState.currentReport));
  appState.currentReport = JSON.parse(JSON.stringify(item));
  syncLivePreview();

  const printElem = document.getElementById('printable-report');
  const modalContainer = document.getElementById('modal-report-container');
  if (printElem && modalContainer) {
    modalContainer.innerHTML = printElem.outerHTML;
  }

  // Restore current report in memory
  appState.currentReport = savedCurrent;
  syncLivePreview();

  document.getElementById('preview-modal').style.display = 'flex';
}

function closePreviewModal() {
  document.getElementById('preview-modal').style.display = 'none';
  document.body.classList.remove('printing-modal');
}

function printModalReport() {
  document.body.classList.add('printing-modal');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('printing-modal');
  }, 500);
}

// Clean up printing class after print dialog closes
window.addEventListener('afterprint', () => {
  document.body.classList.remove('printing-modal');
});

function printSavedReportDirect(id) {
  editSavedReport(id);
  setTimeout(() => {
    printReportDocument();
  }, 200);
}

/* ================= AUTO-SAVE HELPER ================= */
function autoSaveCurrentReportSilently() {
  syncLivePreview();
  const r = appState.currentReport;
  const p1HasName = (r.party1 || []).some(p => p.name && p.name.trim());
  const p2HasName = (r.party2 || []).some(p => p.name && p.name.trim());
  const hasData = (r.thana && r.thana.trim()) || (r.rapatNo && r.rapatNo.trim()) || p1HasName || p2HasName;

  if (!hasData) return;

  if (appState.editingReportId) {
    const index = appState.reports.findIndex(item => item.id === appState.editingReportId);
    if (index !== -1) {
      appState.reports[index] = {
        ...JSON.parse(JSON.stringify(r)),
        id: appState.editingReportId,
        updatedAt: new Date().toISOString()
      };
      saveReportsList();
    }
  } else {
    const newReport = {
      ...JSON.parse(JSON.stringify(r)),
      id: 'UPP-BNSS-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    appState.reports.unshift(newReport);
    appState.editingReportId = newReport.id;
    saveReportsList();
  }
}

/* ================= PRINT / PDF GENERATION ================= */
function printReportDocument() {
  autoSaveCurrentReportSilently();
  syncLivePreview();
  // Native high-fidelity browser print with @media print stylesheet
  window.print();
}

function downloadPdfDirect() {
  autoSaveCurrentReportSilently();
  syncLivePreview();
  const element = document.getElementById('printable-report');
  if (!element) return;
  const r = appState.currentReport;
  const safeThana = (r.thana || 'चलानी').replace(/[\s/\\?%*:|"<>]/g, '_');
  const safeRapat = (r.rapatNo || 'रिपोर्ट').replace(/[\s/\\?%*:|"<>]/g, '_');
  const fileName = `चलानी_रिपोर्ट_रपट_${safeRapat}_थाना_${safeThana}.pdf`;

  if (typeof html2pdf !== 'undefined') {
    showToast('PDF फ़ाइल तैयार हो रही है... ⏳', 'info');
    const opt = {
      margin: [10, 12, 10, 12],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => {
      showToast('PDF सफलतापूर्वक डाउनलोड हुआ! 📥', 'success');
    }).catch(err => {
      console.error('html2pdf fallback to print:', err);
      window.print();
    });
  } else {
    window.print();
  }
}

/* ================= TEXT COPY TO CLIPBOARD ================= */
function copyReportText() {
  syncLivePreview();
  const r = appState.currentReport;

  const p1Text = (r.party1 || []).map((p, i) => `${i + 1}. ${p.name || ''} पुत्र/पति ${p.parentName || ''} उम्र करीब ${p.age || ''} निवासी ${p.address || ''}`).join('\n');
  const p2Text = (r.party2 || []).map((p, i) => `${i + 1}. ${p.name || ''} पुत्र/पति ${p.parentName || ''} उम्र करीब ${p.age || ''} निवासी ${p.address || ''}`).join('\n');

  const p1Names = (r.party1 || []).map(p => p.name).filter(Boolean).join(', ') || '________________';
  const p2Names = (r.party2 || []).map(p => p.name).filter(Boolean).join(', ') || '________________';

  let subjectClause = r.subject ? r.subject.trim() : 'आपसी विवाद';
  if (!subjectClause.includes('विवाद') && !subjectClause.endsWith('है')) {
    subjectClause += ' को लेकर विवाद';
  }
  const subjectEnding = subjectClause.endsWith('है') ? '' : ' है';

  const rapatDateTime = `${r.rapatDate ? r.rapatDate : '--/--/----'}${r.rapatTime ? ' समय ' + r.rapatTime : ''}`;

  const textToCopy = `रिपोर्ट चलानी अंतर्गत धारा 126/135 BNSS
थाना ${r.thana || '________'}, जनपद ${r.janpad || '________'}

सेवा में,
${r.courtOfficer || '________________________'},
जनपद ${r.janpad || '________'}।

द्वारा: ${r.reportingOfficer || '________________'}, थाना ${r.thana || '________'}, जनपद ${r.janpad || '________'}।

बनाम पार्टी प्रथम:
${p1Text}

पार्टी द्वितीय:
${p2Text}

महोदय,
निवेदन इस प्रकार है कि थाना हाजा पर अंकित बीट सूचना रपट नंबर ${r.rapatNo || '___'} दिनांक ${rapatDateTime} की जांच मुझ ${r.reportingOfficer || '________________'} द्वारा की गई तो पाया गया कि पार्टी प्रथम ${p1Names} के मध्य पार्टी द्वितीय ${p2Names} दोनों पक्षों में ${subjectClause}${subjectEnding}।

${r.inquiryFacts || ''}

${r.legalPrayer || ''}

रिपोर्ट चलानी सादर सेवा में प्रेषित है।

संलग्नक:
${r.attachments || ''}

( ${r.reportingOfficer || '________________'} )
थाना ${r.thana || '________'}
जनपद ${r.janpad || '________'}`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast('संपूर्ण रिपोर्ट का पाठ क्लिपबोर्ड में कॉपी कर लिया गया 📋', 'success');
  }).catch(() => {
    showToast('क्लिपबोर्ड एक्सेस विफल, कृपया पुनः प्रयास करें', 'error');
  });
}

/* ================= BACKUP & RESTORE ================= */
function exportReportsBackup() {
  if (!appState.reports || appState.reports.length === 0) {
    showToast('सुरक्षित रखने हेतु कोई रिपोर्ट उपलब्ध नहीं है', 'error');
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.reports, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `UPP_BNSS_Reports_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('बैकअप फ़ाइल डाउनलोड हो गई ✅', 'success');
}

function importReportsBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        appState.reports = imported;
        saveReportsList();
        showToast(`बैकअप सफलतापूर्वक रीस्टोर हुआ (${imported.length} रिपोर्ट्स) ✅`, 'success');
      } else {
        showToast('अमान्य बैकअप फ़ाइल प्रारूप ⚠️', 'error');
      }
    } catch (err) {
      showToast('फ़ाइल लोड करने में त्रुटि ⚠️', 'error');
    }
  };
  reader.readAsText(file);
}

/* ================= TOAST SYSTEM ================= */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ================= DATE NORMALIZATION ================= */
function formatDateDDMMYY(input) {
  let dateObj;
  if (!input) {
    dateObj = new Date();
  } else if (input instanceof Date) {
    dateObj = input;
  } else if (typeof input === 'string') {
    if (/^\d{2}\/\d{2}\/\d{2}$/.test(input)) {
      return input;
    }
    dateObj = new Date(input);
  } else if (typeof input === 'number') {
    dateObj = new Date(input);
  } else {
    dateObj = new Date();
  }

  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yy = String(dateObj.getFullYear()).slice(-2);

  return `${dd}/${mm}/${yy}`;
}

/* ================= CCTNS CSV EXPORT ================= */
function exportCCTNSCsv() {
  if (!appState.reports || appState.reports.length === 0) {
    showToast('CCTNS रजिस्टर हेतु कोई रिपोर्ट उपलब्ध नहीं है', 'error');
    return;
  }

  const BOM = '\uFEFF';
  const headers = [
    'क्र०',
    'रपट सं०',
    'रपट दिनांक',
    'थाना',
    'जनपद',
    'पार्टी प्रथम (नाम व विवरण)',
    'पार्टी द्वितीय (नाम व विवरण)',
    'विवाद का विषय',
    'जांच में पाए गए तथ्य',
    'प्रस्तावित विधिक कार्यवाही'
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str; // Formula injection defense
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = appState.reports.map((r, index) => {
    const p1Formatted = (r.party1 || [])
      .map((p, i) => `${i + 1}. ${p.name || ''} पुत्र/पति ${p.parentName || ''} उम्र ${p.age || ''} निवासी ${p.address || ''}`.trim())
      .join('; ');

    const p2Formatted = (r.party2 || [])
      .map((p, i) => `${i + 1}. ${p.name || ''} पुत्र/पति ${p.parentName || ''} उम्र ${p.age || ''} निवासी ${p.address || ''}`.trim())
      .join('; ');

    return [
      escapeCsv(index + 1),
      escapeCsv(r.rapatNo || ''),
      escapeCsv(r.rapatDate || ''),
      escapeCsv(r.thana || ''),
      escapeCsv(r.janpad || ''),
      escapeCsv(p1Formatted),
      escapeCsv(p2Formatted),
      escapeCsv(r.subject || ''),
      escapeCsv(r.inquiryFacts || ''),
      escapeCsv(r.legalPrayer || '')
    ].join(',');
  });

  const csvContent = BOM + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `UPP_BNSS_126_135_Register_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
  showToast('CCTNS मासिक रजिस्टर (CSV) डाउनलोड हो गया ✅', 'success');
}
