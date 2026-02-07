/**
 * 🧠 QANTUM HYBRID - Run Existing Tests
 * Пуска съществуващите 1000+ теста с новия engine
 */

import { Builder, By } from './adapters/legacy-adapter.js';

/**
 * Пример: Пуска hybrid.test.js логиката с Playwright engine
 */
async function runLegacyTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🧠 QANTUM HYBRID - Running Legacy Tests with PW Engine');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions({ headless: true })
    .build();

  let passed = 0;
  let failed = 0;

  try {
    // ============== TEST 1: Visit Page ==============
    console.log('📝 Test 1: Visit JSONPlaceholder API');
    try {
      await driver.get('https://jsonplaceholder.typicode.com/posts/1');
      const title = await driver.getTitle();
      console.log(`   Title: ${title}`);
      passed++;
      console.log('   ✅ PASSED\n');
    } catch (e) {
      failed++;
      console.log(`   ❌ FAILED: ${e}\n`);
    }

    // ============== TEST 2: Visit Google ==============
    console.log('📝 Test 2: Visit Google');
    try {
      await driver.get('https://www.google.com');
      const title = await driver.getTitle();
      console.log(`   Title: ${title}`);
      passed++;
      console.log('   ✅ PASSED\n');
    } catch (e) {
      failed++;
      console.log(`   ❌ FAILED: ${e}\n`);
    }

    // ============== TEST 3: Find Element ==============
    console.log('📝 Test 3: Find Search Input');
    try {
      await driver.get('https://www.google.com');
      // Google search input
      const searchInput = driver.findElement(By.name('q'));
      const isVisible = await searchInput.isDisplayed();
      console.log(`   Search input visible: ${isVisible}`);
      passed++;
      console.log('   ✅ PASSED\n');
    } catch (e) {
      failed++;
      console.log(`   ❌ FAILED: ${e}\n`);
    }

    // ============== TEST 4: Type & Search ==============
    console.log('📝 Test 4: Type in Search');
    try {
      await driver.get('https://www.google.com');
      const searchInput = driver.findElement(By.name('q'));
      await searchInput.sendKeys('QANTUM QA Framework');
      console.log('   Typed: "QANTUM QA Framework"');
      passed++;
      console.log('   ✅ PASSED\n');
    } catch (e) {
      failed++;
      console.log(`   ❌ FAILED: ${e}\n`);
    }

    // ============== TEST 5: Example.com ==============
    console.log('📝 Test 5: Example.com Basic');
    try {
      await driver.get('https://example.com');
      const h1 = driver.findElement(By.css('h1'));
      const text = await h1.getText();
      console.log(`   H1 Text: ${text}`);
      if (text.includes('Example')) {
        passed++;
        console.log('   ✅ PASSED\n');
      } else {
        failed++;
        console.log('   ❌ FAILED: Wrong text\n');
      }
    } catch (e) {
      failed++;
      console.log(`   ❌ FAILED: ${e}\n`);
    }

    // ============== TEST 6: Screenshot ==============
    console.log('📝 Test 6: Take Screenshot');
    try {
      await driver.get('https://example.com');
      const path = await driver.takeScreenshot();
      console.log(`   Screenshot: ${path}`);
      passed++;
      console.log('   ✅ PASSED\n');
    } catch (e) {
      failed++;
      console.log(`   ❌ FAILED: ${e}\n`);
    }

  } finally {
    await driver.quit();
  }

  // ============== SUMMARY ==============
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  📊 Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLegacyTests().catch(console.error);
