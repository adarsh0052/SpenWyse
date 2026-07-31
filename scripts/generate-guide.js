const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Create directory if not exists
const scriptsDir = path.join(__dirname);
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

const doc = new PDFDocument({ margin: 50, bufferPages: true });
const outputFilePath = path.join(__dirname, '../Jest_Testing_Study_Guide.pdf');
const stream = fs.createWriteStream(outputFilePath);
doc.pipe(stream);

// Styling Helpers
const colors = {
  primary: '#166534',       // Forest Green
  secondary: '#064E3B',     // Dark Forest Green
  text: '#334155',          // Slate Gray
  darkText: '#0F172A',      // Slate Dark
  codeBg: '#F8FAFC',        // Cool White
  codeBorder: '#E2E8F0',    // Light Gray Border
  accent: '#EA580C',        // Accent orange
  divider: '#E2E8F0'
};

function addTitle(text) {
  doc.fontSize(24).fillColor(colors.primary).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function addSubtitle(text) {
  doc.fontSize(13).fillColor(colors.text).font('Helvetica-Oblique').text(text);
  doc.moveDown(1.5);
}

function addSectionHeader(text) {
  doc.fontSize(16).fillColor(colors.secondary).font('Helvetica-Bold').text(text);
  doc.moveDown(0.5);
}

function addSubsectionHeader(text) {
  doc.fontSize(12).fillColor(colors.primary).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function addText(text) {
  doc.fontSize(10).fillColor(colors.text).font('Helvetica').text(text, { lineGap: 3 });
  doc.moveDown(0.6);
}

function addBullet(text) {
  doc.fontSize(10).fillColor(colors.text).font('Helvetica').text('• ' + text, { indent: 15, lineGap: 3 });
  doc.moveDown(0.4);
}

function addCodeBlock(code) {
  const currentY = doc.y;
  const width = 512;
  const padding = 10;
  
  doc.font('Courier').fontSize(8.5);
  const height = doc.heightOfString(code, { width: width - padding * 2 }) + padding * 2;
  
  doc.save();
  // Draw background and border
  doc.rect(50, currentY, width, height).fill(colors.codeBg);
  doc.rect(50, currentY, width, height).strokeColor(colors.codeBorder).lineWidth(1).stroke();
  doc.restore();
  
  // Write text on top
  doc.fillColor(colors.darkText).text(code, 50 + padding, currentY + padding, { width: width - padding * 2, lineGap: 2 });
  doc.moveDown(1.5);
  doc.font('Helvetica'); // reset
}

function addDivider() {
  doc.moveDown(0.5);
  doc.strokeColor(colors.divider).lineWidth(1).moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.8);
}

function addHeaderFooter() {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    
    // Header (exclude first page)
    if (i > 0) {
      doc.fontSize(8).fillColor('#94A3B8').font('Helvetica');
      doc.text('SpenWyse Finance Engine — Unit Testing & Interview Guide', 50, 25);
      doc.strokeColor('#F1F5F9').lineWidth(0.5).moveTo(50, 36).lineTo(562, 36).stroke();
    }
    
    // Footer
    doc.fontSize(8).fillColor('#94A3B8').font('Helvetica');
    const text = `Page ${i + 1} of ${pages.count}`;
    doc.text(text, 50, 750, { align: 'right', width: 512 });
  }
}

// ==========================================
// PAGE 1: COVER PAGE
// ==========================================
doc.rect(40, 40, 532, 712).strokeColor(colors.primary).lineWidth(2).stroke(); // decorative border
doc.moveDown(6);

doc.fontSize(32).fillColor(colors.primary).font('Helvetica-Bold').text('SPENWYSE', { align: 'center' });
doc.fontSize(16).fillColor(colors.secondary).font('Helvetica').text('FINANCE ENGINE UNIT TESTING', { align: 'center', letterSpacing: 1.5 });
doc.moveDown(2);

doc.strokeColor(colors.primary).lineWidth(3).moveTo(200, doc.y).lineTo(412, doc.y).stroke();
doc.moveDown(2);

doc.fontSize(14).fillColor(colors.darkText).font('Helvetica-Bold').text('Interview Preparation & Study Guide', { align: 'center' });
doc.fontSize(11).fillColor(colors.text).font('Helvetica').text('Implementing robust Jest tests for daily spending pools, safe-to-spend limits, and mid-cycle resource allocations.', { align: 'center', width: 400 });
doc.moveDown(10);

doc.fontSize(10).fillColor(colors.text).font('Helvetica-Bold').text('Key Highlights Covered:', 100);
doc.moveDown(0.3);
doc.fontSize(9).font('Helvetica').text('✓ Deterministic Time Mocking using Jest Fake Timers & setSystemTime', 115);
doc.text('✓ Financial Math & Formula Validation (Safe to Spend Today)', 115);
doc.text('✓ Zero/Negative Balance and Over-budget Capping Edge Cases', 115);
doc.text('✓ Dynamic Mid-Cycle Commitment and Goal-Locker Recalculation', 115);
doc.text('✓ February Leap Year and Month-End Boundary Checks', 115);

// ==========================================
// PAGE 2: CORE ARCHITECTURE & MATH
// ==========================================
doc.addPage();
addTitle('1. Core Math & Calculation Engine');
addSubtitle('Understanding the business logic behind SpenWyse calculations');

addText('SpenWyse guides users towards disciplined spending by calculating a dynamic daily budget known as the "Safe to Spend Today" limit. Rather than enforcing strict categorical caps, the app treats all uncommitted funds as a single flexible pool, distributing it evenly over the remaining days of the current month.');

addSectionHeader('The Core Formulas');

addSubsectionHeader('1. Flexible Pool Calculation');
addText('The Flexible Pool represents the amount of money a user has left that is not yet spent or locked in goals (commitments).');
addCodeBlock('Flexible Pool = Monthly Income - Commitments - Spent');

addSubsectionHeader('2. Remaining Days in Month');
addText('Remaining days includes the current day itself. It dynamically updates as the calendar moves.');
addCodeBlock('Remaining Days = (Total Days in Current Month - Current Day of Month) + 1');

addSubsectionHeader('3. Safe to Spend Today (Daily Limit)');
addText('This is the division of the Flexible Pool by the remaining days of the month. If the Flexible Pool is zero or negative (over-budget), the limit is capped at 0.');
addCodeBlock('Safe to Spend Today = Math.max( Math.floor( Flexible Pool / Remaining Days ), 0 )');

addDivider();

addSectionHeader('Scenario walkthrough');
addText('Suppose a user has a monthly income of ₹30,000. It is July 15th (17 days left in July). They have spent ₹5,000 so far and locked ₹10,000 in goals (commitments).');
addBullet('Flexible Pool = ₹30,000 - ₹10,000 - ₹5,000 = ₹15,000');
doc.moveDown(0.2);
addBullet('Safe to Spend Today = ₹15,000 / 17 days = ₹882.35 (floored to ₹882)');

// ==========================================
// PAGE 3: TESTING STRATEGY & MOCKING
// ==========================================
doc.addPage();
addTitle('2. Unit Testing Strategy');
addSubtitle('How we ensure calculation correctness and deterministic test runs');

addText('Unit testing calculations that depend on the current calendar date presents a major challenge: the test results will change depending on the day they are executed. If a test runs on July 15th, the remaining days will be 17. If it runs on July 25th, the remaining days will be 7, causing assertions to fail.');

addSectionHeader('Mocking System Time');
addText('To achieve determinism, we use Jest\'s fake timer utilities. This allows us to "time travel" to specific dates and verify how the system behaves on those exact days, regardless of the actual date on the host machine.');

addSubsectionHeader('How it works in Jest:');
addBullet('jest.useFakeTimers() tells Jest to intercept native date/time functions.');
doc.moveDown(0.2);
addBullet('jest.setSystemTime(date) sets the system clock to a fixed, specified date.');
doc.moveDown(0.2);
addBullet('jest.useRealTimers() restores the native clock functionality after each test.');

addText('Here is the setup we implement in our test suite:');
addCodeBlock(`beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});`);

addDivider();

addSectionHeader('Deterministic assertions');
addText('By setting the system time, we lock the value of remainingDays to a known constant. For example, setting the clock to July 15th guarantees that remaining days will always evaluate to exactly 17, making our mathematical assertions stable and reliable:');
addCodeBlock(`test('should return 17 remaining days on July 15th', () => {
  jest.setSystemTime(new Date('2026-07-15T12:00:00Z'));
  expect(getRemainingDaysInMonth()).toBe(17);
});`);

// ==========================================
// PAGE 4: EDGE CASES COVERED
// ==========================================
doc.addPage();
addTitle('3. Critical Edge Cases Tested');
addSubtitle('Robustness testing for unusual financial states and calendar configurations');

addText('A reliable financial engine must handle extreme input values, zero states, and calendar variances. Our unit test suite targets three primary edge cases:');

addSectionHeader('1. Zero & Negative Balances');
addText('If a user overspends (Spent > Income) or locks more than they have, the Flexible Pool becomes negative. The Safe to Spend Today limit must not show a negative value; it must be gracefully capped at zero.');
addCodeBlock(`// Spent (20,000) + Commitments (15,000) exceeds Income (30,000)
// Flexible Pool = -5,000. Daily Limit should be 0.
const snapshot = calculateFinanceSnapshot({
  income: 30000,
  commitments: 15000,
  spent: 20000,
});
expect(snapshot.flexiblePool).toBe(-5000);
expect(snapshot.dailySpendLimit).toBe(0);`);

addSectionHeader('2. Mid-Cycle Allocation Changes');
addText('Users frequently lock money into goals (commitments) or make sudden transactions in the middle of a month. The daily limit must recalculate immediately and adjust. Our tests verify that changing commitments on July 15th successfully reduces the daily limit from ₹1,176 down to ₹588:');
addCodeBlock(`// Commitments change mid-cycle from 5,000 to 15,000
let snapshot = calculateFinanceSnapshot({ income: 30000, commitments: 5000, spent: 5000 });
expect(snapshot.dailySpendLimit).toBe(1176); // (20,000 / 17)

snapshot = calculateFinanceSnapshot({ income: 30000, commitments: 15000, spent: 5000 });
expect(snapshot.dailySpendLimit).toBe(588);  // (10,000 / 17)`);

addSectionHeader('3. Calendar Boundaries (Leap Years & Last Days)');
addText('We verify leap year February (29 days) vs non-leap year February (28 days), and the last day of a month (where remaining days = 1, meaning the daily limit equals the entire flexible pool).');
addCodeBlock(`// Feb 15th, 2028 (Leap Year) -> 29 - 15 + 1 = 15 remaining days
jest.setSystemTime(new Date('2028-02-15T12:00:00Z'));
expect(getRemainingDaysInMonth()).toBe(15);

// July 31st (Month-end) -> 1 remaining day
jest.setSystemTime(new Date('2026-07-31T12:00:00Z'));
expect(getRemainingDaysInMonth()).toBe(1);`);

// ==========================================
// PAGE 5: INTERVIEW Q&A CHEAT SHEET
// ==========================================
doc.addPage();
addTitle('4. Mock Interview Q&A');
addSubtitle('How to talk about this project work in technical and behavioral interviews');

addSubsectionHeader('Q1: How did you test calculations that depend on the current date?');
addText('A: "I used Jest\'s fake timer utilities. I implemented jest.useFakeTimers() and jest.setSystemTime() to lock the system clock to specific dates (like July 15th or February 28th). This made the remaining days in a month a fixed constant, allowing the math to be fully deterministic and reproducible on any system."');

addSubsectionHeader('Q2: What boundary conditions did you test for in the calendar logic?');
addText('A: "I tested standard mid-month dates, the last day of the month where remaining days should equal exactly 1 (meaning the daily limit should equal the entire flexible pool), and leap-year boundaries. For instance, I set the fake system date to February 15th in 2028 (a leap year) and verified it counted 15 remaining days, and February 15th in 2029 (non-leap year) and verified it counted 14."');

addSubsectionHeader('Q3: How does the system handle negative pools? What did the tests assert?');
addText('A: "If a user overspends or locks commitments exceeding their income, the flexible pool goes negative. To prevent the user interface from showing a negative daily budget, I asserted that the finance engine caps the daily spend limit at exactly zero, returning Math.max(limit, 0). The test validated that even with a -₹5,000 pool, the daily limit returned was ₹0."');

addSubsectionHeader('Q4: How did you model mid-cycle budget changes in the unit tests?');
addText('A: "I simulated a user lifecycle within a single test. First, I ran the calculation on July 15th with ₹5,000 spent and ₹5,000 locked in goals, verifying a limit of ₹1,176. Then, I simulated the user locking an additional ₹10,000 in a goal mid-month. The test passed when the engine dynamically recalculated the flexible pool and asserted the daily limit successfully dropped to ₹588."');

addSubsectionHeader('Q5: What value did these tests add to the codebase?');
addText('A: "They guaranteed that core calculations—which dictate the main metrics shown to the user on the dashboard—remain 100% accurate. It prevents regressions if another developer edits the finance helper or updates dependencies, and it documents the financial logic rules as executable code."');

// Add Page headers and footers dynamically
addHeaderFooter();

doc.end();

stream.on('finish', () => {
  console.log('PDF generated successfully at:', outputFilePath);
});
