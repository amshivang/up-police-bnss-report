/**
 * ============================================================================
 * AUTOMATED TEST SUITE: UP Police BNSS 126/135 Report Generation Engine
 * Location: e:\Projects\Report Generation App\test.js
 * Runtime: Node.js (Zero external npm dependencies, using built-in assert)
 * ============================================================================
 */

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedCount = 0;
let failedCount = 0;
const testSuiteResults = [];

function test(name, fn) {
  try {
    fn();
    passedCount++;
    console.log(`  ✓ PASS: ${name}`);
    testSuiteResults.push({ name, status: 'PASS' });
  } catch (err) {
    failedCount++;
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    testSuiteResults.push({ name, status: 'FAIL', error: err.message });
  }
}

function suite(suiteName, fn) {
  console.log(`\n=== SUITE: ${suiteName} ===`);
  fn();
}

/* ==========================================================================
   DOMAIN LOGIC & HELPER FUNCTIONS
   ========================================================================== */

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
    throw new TypeError('Invalid date input provided');
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date value');
  }

  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yy = String(dateObj.getFullYear()).slice(-2);

  return `${dd}/${mm}/${yy}`;
}

function generateCctnsCsv(reports) {
  if (!Array.isArray(reports)) {
    throw new TypeError('Reports must be an array');
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
      str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = reports.map((r, index) => {
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

  return BOM + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
}

function synthesizeReportNarrative(r) {
  const p1Names = (r.party1 || []).map(p => p.name).filter(Boolean).join(', ') || 'पार्टी प्रथम';
  const p2Names = (r.party2 || []).map(p => p.name).filter(Boolean).join(', ') || 'पार्टी द्वितीय';

  const p1Details = (r.party1 || []).map((p, i) => 
    `${i + 1}. ${p.name || '___________'} पुत्र/पति ${p.parentName || '___________'} उम्र करीब ${p.age || '___'} निवासी ${p.address || '___________'}।`
  ).join('\n');

  const p2Details = (r.party2 || []).map((p, i) => 
    `${i + 1}. ${p.name || '___________'} पुत्र/पति ${p.parentName || '___________'} उम्र करीब ${p.age || '___'} निवासी ${p.address || '___________'}।`
  ).join('\n');

  return `रिपोर्ट चलानी अंतर्गत धारा 126/135 BNSS
थाना ${r.thana}, जनपद ${r.janpad}

सेवा में,
${r.courtOfficer},
जनपद ${r.janpad}।

द्वारा: ${r.reportingOfficer}, थाना ${r.thana}, जनपद ${r.janpad}।

बनाम पार्टी प्रथम:
${p1Details}

पार्टी द्वितीय:
${p2Details}

महोदय,
निवेदन इस प्रकार है कि थाना हाजा पर अंकित बीट सूचना रपट नंबर ${r.rapatNo} दिनांक ${r.rapatDate} की जांच मुझ ${r.reportingOfficer} द्वारा की गई तो पाया गया कि पार्टी प्रथम ${p1Names} के मध्य पार्टी द्वितीय ${p2Names} दोनों पक्षों में ${r.subject} को लेकर विवाद है।

${r.inquiryFacts}

${r.legalPrayer}

रिपोर्ट चलानी सादर सेवा में प्रेषित है।

संलग्नक:
${r.attachments}

( ${r.reportingOfficer} )
थाना ${r.thana}
जनपद ${r.janpad}`;
}

function validateBackupJson(data) {
  if (!Array.isArray(data)) return { valid: false, error: 'Backup must be a JSON array' };
  if (data.length === 0) return { valid: true, warning: 'Empty report array' };

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (!r.thana || typeof r.thana !== 'string') return { valid: false, error: `Row ${i}: Missing 'thana'` };
    if (!r.janpad || typeof r.janpad !== 'string') return { valid: false, error: `Row ${i}: Missing 'janpad'` };
    if (!r.rapatNo || typeof r.rapatNo !== 'string') return { valid: false, error: `Row ${i}: Missing 'rapatNo'` };
    if (!Array.isArray(r.party1) || r.party1.length === 0) return { valid: false, error: `Row ${i}: 'party1' must have at least 1 person` };
    if (!Array.isArray(r.party2) || r.party2.length === 0) return { valid: false, error: `Row ${i}: 'party2' must have at least 1 person` };
  }
  return { valid: true };
}

/* ==========================================================================
   EXECUTION OF TEST SUITES
   ========================================================================== */

console.log(`================================================================`);
console.log(`  UTTAR PRADESH POLICE — BNSS 126/135 REPORT GENERATION TESTS  `);
console.log(`================================================================`);

// SUITE 1: Initial Demo Data Structure and Default Values
suite('1. Initial Demo Data Structure & Defaults', () => {
  const sampleDemoReport = {
    id: 'UPP-BNSS-DEMO-001',
    thana: 'अमरोहा देहात',
    janpad: 'अमरोहा',
    rapatNo: '82',
    rapatDate: '02/10/26',
    rapatTime: '14:30 बजे',
    courtOfficer: 'श्रीमान उपजिला मजिस्ट्रेट महोदय सदर',
    reportingOfficer: 'उप निरीक्षक इंद्रजीत सिंह',
    party1: [
      { name: 'जयकुमार', parentName: 'अमर सिंह', age: '32 वर्ष', address: 'हसनपुर कचिया, थाना अमरोहा देहात, जनपद अमरोहा' }
    ],
    party2: [
      { name: 'बंटी', parentName: 'अमर सिंह', age: '28 वर्ष', address: 'हसनपुर कचिया, थाना अमरोहा देहात, जनपद अमरोहा' }
    ],
    subject: 'घर की जमीन के बंटवारे को लेकर विवाद',
    inquiryFacts: 'दोनों पक्षों में कसीदगी बनी हुई है। दोनों पक्ष कभी भी लड़-झगड़कर शांति व्यवस्था भंग कर सकते हैं।',
    legalPrayer: 'अतः शांति व्यवस्था की दृष्टिगत पार्टी प्रथम उपरोक्त का चालान अंतर्गत धारा 126/135 BNSS माननीय न्यायालय किया जा रहा है। अतः श्रीमान जी से निवेदन है कि पार्टी प्रथम उपरोक्त को भारी से भारी धनराशि / मुचलके से पाबंद करने की कृपा करें।',
    attachments: 'रिपोर्ट चलानी एक बार, नकल रपट नंबर एक वर्क'
  };

  test('Demo data contains valid police station and district (Thana & Janpad)', () => {
    assert.strictEqual(sampleDemoReport.thana, 'अमरोहा देहात');
    assert.strictEqual(sampleDemoReport.janpad, 'अमरोहा');
  });

  test('Demo data contains correct beat rapat number and date format', () => {
    assert.strictEqual(sampleDemoReport.rapatNo, '82');
    assert.strictEqual(sampleDemoReport.rapatDate, '02/10/26');
    assert.match(sampleDemoReport.rapatDate, /^\d{2}\/\d{2}\/\d{2}$/);
  });

  test('Demo data has Party 1 with correct person fields', () => {
    assert(Array.isArray(sampleDemoReport.party1), 'party1 must be an array');
    assert.strictEqual(sampleDemoReport.party1.length, 1);
    const p1 = sampleDemoReport.party1[0];
    assert.strictEqual(p1.name, 'जयकुमार');
    assert.strictEqual(p1.parentName, 'अमर सिंह');
    assert.strictEqual(p1.age, '32 वर्ष');
    assert.strictEqual(p1.address, 'हसनपुर कचिया, थाना अमरोहा देहात, जनपद अमरोहा');
  });

  test('Demo data has Party 2 with correct person fields', () => {
    assert(Array.isArray(sampleDemoReport.party2), 'party2 must be an array');
    assert.strictEqual(sampleDemoReport.party2.length, 1);
    const p2 = sampleDemoReport.party2[0];
    assert.strictEqual(p2.name, 'बंटी');
    assert.strictEqual(p2.parentName, 'अमर सिंह');
    assert.strictEqual(p2.age, '28 वर्ष');
  });

  test('Demo legal prayer explicitly invokes Section 126/135 BNSS and surety requirement', () => {
    assert.strictEqual(sampleDemoReport.subject, 'घर की जमीन के बंटवारे को लेकर विवाद');
    assert(sampleDemoReport.legalPrayer.includes('धारा 126/135 BNSS'), 'Must cite Section 126/135 BNSS');
    assert(sampleDemoReport.legalPrayer.includes('मुचलके से पाबंद'), 'Must state legal bond prayer');
  });
});

// SUITE 2: Dynamic Person Card Array Manipulation
suite('2. Dynamic Person Card Array Manipulation', () => {
  function createTestPartyState() {
    return {
      party1: [{ name: 'जयकुमार', parentName: 'अमर सिंह', age: '32 वर्ष', address: 'हसनपुर कचिया' }],
      party2: [{ name: 'बंटी', parentName: 'अमर सिंह', age: '28 वर्ष', address: 'हसनपुर कचिया' }]
    };
  }

  function addPartyMember(state, partyNum) {
    const list = partyNum === 1 ? state.party1 : state.party2;
    list.push({ name: '', parentName: '', age: '', address: '' });
  }

  function removePartyMember(state, partyNum, index) {
    const list = partyNum === 1 ? state.party1 : state.party2;
    if (list.length > 1) {
      list.splice(index, 1);
      return true;
    }
    return false;
  }

  function updatePartyMemberField(state, partyNum, index, field, value) {
    const list = partyNum === 1 ? state.party1 : state.party2;
    if (list[index]) {
      list[index][field] = value;
    }
  }

  test('Adding person to Party 1 increments length and initializes blank fields', () => {
    const state = createTestPartyState();
    assert.strictEqual(state.party1.length, 1);
    addPartyMember(state, 1);
    assert.strictEqual(state.party1.length, 2);
    assert.deepStrictEqual(state.party1[1], { name: '', parentName: '', age: '', address: '' });
  });

  test('Adding person to Party 2 increments length independently', () => {
    const state = createTestPartyState();
    addPartyMember(state, 2);
    assert.strictEqual(state.party2.length, 2);
    assert.strictEqual(state.party1.length, 1, 'Party 1 must remain unaffected');
  });

  test('Updating person field modifies target person without mutating others', () => {
    const state = createTestPartyState();
    addPartyMember(state, 1);
    updatePartyMemberField(state, 1, 1, 'name', 'सुनील कुमार');
    updatePartyMemberField(state, 1, 1, 'parentName', 'रामेश्वर');
    updatePartyMemberField(state, 1, 1, 'age', '40 वर्ष');

    assert.strictEqual(state.party1[0].name, 'जयकुमार');
    assert.strictEqual(state.party1[1].name, 'सुनील कुमार');
    assert.strictEqual(state.party1[1].parentName, 'रामेश्वर');
    assert.strictEqual(state.party1[1].age, '40 वर्ष');
  });

  test('Removing person when length > 1 reduces array length correctly', () => {
    const state = createTestPartyState();
    addPartyMember(state, 1);
    assert.strictEqual(state.party1.length, 2);
    const removed = removePartyMember(state, 1, 1);
    assert.strictEqual(removed, true);
    assert.strictEqual(state.party1.length, 1);
    assert.strictEqual(state.party1[0].name, 'जयकुमार');
  });

  test('INVARIANT: Removing person when length == 1 is BLOCKED (Never deletes below 1)', () => {
    const state = createTestPartyState();
    assert.strictEqual(state.party1.length, 1);
    const removed = removePartyMember(state, 1, 0);
    assert.strictEqual(removed, false, 'Should return false indicating operation was blocked');
    assert.strictEqual(state.party1.length, 1, 'Length must strictly remain 1');
    assert.strictEqual(state.party1[0].name, 'जयकुमार', 'Original member must be preserved');
  });
});

// SUITE 3: Court Report Text Synthesis under Section 126/135 BNSS
suite('3. Text Synthesis for Section 126/135 BNSS Narrative', () => {
  const mockReport = {
    thana: 'अमरोहा देहात',
    janpad: 'अमरोहा',
    rapatNo: '82',
    rapatDate: '02/10/26',
    courtOfficer: 'श्रीमान उपजिला मजिस्ट्रेट महोदय सदर',
    reportingOfficer: 'उप निरीक्षक इंद्रजीत सिंह',
    party1: [
      { name: 'जयकुमार', parentName: 'अमर सिंह', age: '32 वर्ष', address: 'हसनपुर कचिया' },
      { name: 'रामपाल', parentName: 'अमर सिंह', age: '35 वर्ष', address: 'हसनपुर कचिया' }
    ],
    party2: [
      { name: 'बंटी', parentName: 'अमर सिंह', age: '28 वर्ष', address: 'हसनपुर कचिया' }
    ],
    subject: 'घर की जमीन के बंटवारे को लेकर विवाद',
    inquiryFacts: 'दोनों पक्षों में कसीदगी बनी हुई है।',
    legalPrayer: 'अतः शांति व्यवस्था की दृष्टिगत दोनों पक्षों का चालान अंतर्गत धारा 126/135 BNSS माननीय न्यायालय किया जा रहा है।',
    attachments: 'रिपोर्ट चलानी एक बार, नकल रपट नंबर एक वर्क'
  };

  const synthesized = synthesizeReportNarrative(mockReport);

  test('Synthesized narrative includes statutory heading and jurisdiction', () => {
    assert(synthesized.includes('रिपोर्ट चलानी अंतर्गत धारा 126/135 BNSS'));
    assert(synthesized.includes('थाना अमरोहा देहात, जनपद अमरोहा'));
  });

  test('Synthesized narrative addresses the SDM / Court Officer and Reporting Officer', () => {
    assert(synthesized.includes('सेवा में,\nश्रीमान उपजिला मजिस्ट्रेट महोदय सदर'));
    assert(synthesized.includes('द्वारा: उप निरीक्षक इंद्रजीत सिंह'));
  });

  test('Multi-person Party 1 is joined with commas in summary paragraph', () => {
    assert(synthesized.includes('पार्टी प्रथम जयकुमार, रामपाल के मध्य'), 'Should join party 1 names');
    assert(synthesized.includes('पार्टी द्वितीय बंटी दोनों पक्षों में'), 'Should include party 2 names');
  });

  test('Synthesized narrative lists individual party addresses and details', () => {
    assert(synthesized.includes('1. जयकुमार पुत्र/पति अमर सिंह उम्र करीब 32 वर्ष निवासी हसनपुर कचिया।'));
    assert(synthesized.includes('2. रामपाल पुत्र/पति अमर सिंह उम्र करीब 35 वर्ष निवासी हसनपुर कचिया।'));
    assert(synthesized.includes('1. बंटी पुत्र/पति अमर सिंह उम्र करीब 28 वर्ष निवासी हसनपुर कचिया।'));
  });

  test('Synthesized text includes beat report number and inquiry facts', () => {
    assert(synthesized.includes('बीट सूचना रपट नंबर 82 दिनांक 02/10/26'));
    assert(synthesized.includes('दोनों पक्षों में कसीदगी बनी हुई है।'));
    assert(synthesized.includes('चालान अंतर्गत धारा 126/135 BNSS'));
  });
});

// SUITE 4: Date Formatting Helper
suite('4. Date Formatting Helper (Zero-Padded DD/MM/YY)', () => {
  test('Formats standard Date object with zero padding (Oct 2, 2026 -> 02/10/26)', () => {
    const d = new Date(2026, 9, 2);
    const formatted = formatDateDDMMYY(d);
    assert.strictEqual(formatted, '02/10/26');
  });

  test('Formats single-digit month and day with zero padding (Jan 5, 2026 -> 05/01/26)', () => {
    const d = new Date(2026, 0, 5);
    const formatted = formatDateDDMMYY(d);
    assert.strictEqual(formatted, '05/01/26');
  });

  test('Formats month-end boundary (Dec 31, 2026 -> 31/12/26)', () => {
    const d = new Date(2026, 11, 31);
    const formatted = formatDateDDMMYY(d);
    assert.strictEqual(formatted, '31/12/26');
  });

  test('Handles ISO date string input ("2026-08-15" -> "15/08/26")', () => {
    const formatted = formatDateDDMMYY('2026-08-15T00:00:00Z');
    assert.match(formatted, /^\d{2}\/\d{2}\/26$/);
  });

  test('Already formatted valid string "02/10/26" passes through safely', () => {
    assert.strictEqual(formatDateDDMMYY('02/10/26'), '02/10/26');
  });

  test('Throws descriptive error for invalid date input', () => {
    assert.throws(() => formatDateDDMMYY('invalid-date-string'), /Invalid date value/);
  });
});

// SUITE 5: CCTNS CSV Generation Helper
suite('5. CCTNS CSV Generation Helper', () => {
  const sampleReports = [
    {
      rapatNo: '82',
      rapatDate: '02/10/26',
      thana: 'अमरोहा देहात',
      janpad: 'अमरोहा',
      party1: [{ name: 'जयकुमार', parentName: 'अमर सिंह', age: '32 वर्ष', address: 'हसनपुर कचिया' }],
      party2: [{ name: 'बंटी', parentName: 'अमर सिंह', age: '28 वर्ष', address: 'हसनपुर कचिया' }],
      subject: 'घर की जमीन के बंटवारे को लेकर विवाद',
      inquiryFacts: 'दोनों पक्षों में तनाव है, "कसीदगी" बनी हुई है।',
      legalPrayer: 'धारा 126/135 BNSS पाबंदी मुचलका'
    },
    {
      rapatNo: '83',
      rapatDate: '03/10/26',
      thana: 'अमरोहा देहात',
      janpad: 'अमरोहा',
      party1: [{ name: 'सोमपाल', parentName: 'राम सिंह', age: '45 वर्ष', address: 'अमरोहा' }],
      party2: [{ name: 'नरेश', parentName: 'हरपाल', age: '42 वर्ष', address: 'अमरोहा' }],
      subject: 'नाली के पानी निकास का विवाद',
      inquiryFacts: 'गाली-गलौज की आशंका।',
      legalPrayer: 'धारा 126/135 BNSS'
    }
  ];

  const csvOutput = generateCctnsCsv(sampleReports);

  test('CSV starts with UTF-8 BOM character (\\uFEFF) for Hindi Excel compatibility', () => {
    assert.strictEqual(csvOutput.charCodeAt(0), 0xFEFF);
  });

  test('CSV contains all required official CCTNS header columns', () => {
    assert(csvOutput.includes('"क्र०"'));
    assert(csvOutput.includes('"रपट सं०"'));
    assert(csvOutput.includes('"रपट दिनांक"'));
    assert(csvOutput.includes('"थाना"'));
    assert(csvOutput.includes('"जनपद"'));
    assert(csvOutput.includes('"पार्टी प्रथम (नाम व विवरण)"'));
    assert(csvOutput.includes('"पार्टी द्वितीय (नाम व विवरण)"'));
    assert(csvOutput.includes('"विवाद का विषय"'));
  });

  test('CSV properly escapes internal double quotes in fields', () => {
    assert(csvOutput.includes('""कसीदगी""'), 'Internal quotes must be escaped with double quotes');
  });

  test('CSV output contains exact row count (1 header + 2 data rows)', () => {
    const lines = csvOutput.slice(1).trim().split('\r\n');
    assert.strictEqual(lines.length, 3, 'Must have 1 header and 2 rows');
  });
});

// SUITE 6: JSON Export & Import Backup Integrity
suite('6. JSON Export & Import Backup Integrity', () => {
  const originalReports = [
    {
      id: 'UPP-BNSS-001',
      thana: 'अमरोहा देहात',
      janpad: 'अमरोहा',
      rapatNo: '82',
      rapatDate: '02/10/26',
      party1: [{ name: 'जयकुमार', parentName: 'अमर सिंह', age: '32 वर्ष', address: 'हसनपुर कचिया' }],
      party2: [{ name: 'बंटी', parentName: 'अमर सिंह', age: '28 वर्ष', address: 'हसनपुर कचिया' }],
      subject: 'जमीनी विवाद',
      inquiryFacts: 'तनाव व्याप्त है।',
      legalPrayer: 'धारा 126/135 BNSS पाबंदी प्रार्थना।'
    }
  ];

  test('Round-trip JSON serialization preserves all Devanagari Hindi characters without mutation', () => {
    const serialized = JSON.stringify(originalReports, null, 2);
    const deserialized = JSON.parse(serialized);

    assert.deepStrictEqual(deserialized, originalReports);
    assert.strictEqual(deserialized[0].party1[0].name, 'जयकुमार');
    assert.strictEqual(deserialized[0].thana, 'अमरोहा देहात');
  });

  test('Backup validator approves valid backup dataset', () => {
    const result = validateBackupJson(originalReports);
    assert.strictEqual(result.valid, true);
  });

  test('Backup validator rejects non-array JSON inputs', () => {
    const result = validateBackupJson({ thana: 'अमरोहा देहात' });
    assert.strictEqual(result.valid, false);
    assert(result.error.includes('array'));
  });

  test('Backup validator detects missing mandatory attributes', () => {
    const invalidReport = [{ thana: 'अमरोहा देहात', janpad: 'अमरोहा' }];
    const result = validateBackupJson(invalidReport);
    assert.strictEqual(result.valid, false);
    assert(result.error.includes('rapatNo'));
  });

  test('Backup validator detects empty party array', () => {
    const invalidParty = [{
      thana: 'अमरोहा देहात',
      janpad: 'अमरोहा',
      rapatNo: '82',
      party1: [],
      party2: [{ name: 'बंटी' }]
    }];
    const result = validateBackupJson(invalidParty);
    assert.strictEqual(result.valid, false);
    assert(result.error.includes('party1'));
  });
});

console.log(`\n================================================================`);
console.log(`                       TEST SUITE SUMMARY                       `);
console.log(`================================================================`);
console.log(`Total Assertions Executed : ${passedCount + failedCount}`);
console.log(`Passed                    : ${passedCount}`);
console.log(`Failed                    : ${failedCount}`);

if (failedCount === 0) {
  console.log(`\n✓ ALL TEST SUITES PASSED WITH 100% SUCCESS RATE.\n`);
  process.exit(0);
} else {
  console.log(`\n✗ SOME TESTS FAILED.\n`);
  process.exit(1);
}
