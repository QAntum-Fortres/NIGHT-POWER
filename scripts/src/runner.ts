/**
 * ⚛️ QANTUM - Test Runner
 * @author dp | QAntum Labs
 */

import { createQA } from './index.js';

async function runBasicTest() {
  console.log('⚛️ QAntum v1.0.0 - Basic Test\n');
  console.log('[ dp ] qantum labs\n');
  
  const qa = createQA({
    baseUrl: 'https://example.com',
    browser: {
      browser: 'chromium',
      headless: true,
      timeout: 30000
    }
  });

  try {
    // 1. Launch browser
    console.log('1️⃣ Launching browser...');
    await qa.launch();
    console.log('   ✅ Browser launched\n');

    // 2. Visit page
    console.log('2️⃣ Visiting https://example.com...');
    await qa.visit('https://example.com');
    console.log('   ✅ Page loaded\n');

    // 3. Get title
    console.log('3️⃣ Getting page title...');
    const title = await qa.getTitle();
    console.log(`   ✅ Title: "${title}"\n`);

    // 4. Check element exists
    console.log('4️⃣ Checking h1 element...');
    const isVisible = await qa.get('h1').isVisible();
    console.log(`   ✅ h1 visible: ${isVisible}\n`);

    // 5. Get text
    console.log('5️⃣ Getting h1 text...');
    const text = await qa.get('h1').getText();
    console.log(`   ✅ Text: "${text}"\n`);

    // 6. Fluent chain assertion
    console.log('6️⃣ Fluent assertion: h1 should contain "Example"...');
    await qa.get('h1').should('contain.text', 'Example');
    console.log('   ✅ Assertion passed\n');

    console.log('═══════════════════════════════════════');
    console.log('⚛️ ALL TESTS PASSED!');
    console.log('[ dp ] qantum labs');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await qa.close();
  }
}

runBasicTest();
