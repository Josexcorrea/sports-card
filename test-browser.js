const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testApp() {
  console.log('Starting browser test...');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  try {
    console.log('\n=== TEST 1: Navigate to http://localhost:5173/ ===');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'screenshot-1-initial.png', fullPage: true });
    console.log('✓ Screenshot saved: screenshot-1-initial.png');
    
    // Check for login page
    const loginTitle = await page.textContent('h1, h2').catch(() => null);
    console.log(`\nPage title/heading: ${loginTitle}`);
    
    const hasLoginForm = await page.locator('form').count() > 0;
    const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').count() > 0;
    
    console.log(`\n✓ Login form present: ${hasLoginForm}`);
    console.log(`✓ Email input present: ${hasEmailInput}`);
    console.log(`✓ Password input present: ${hasPasswordInput}`);
    
    if (hasLoginForm && hasEmailInput && hasPasswordInput) {
      console.log('\n=== TEST 2: Attempting to login ===');
      
      // Try to login - assuming test credentials
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
      await page.fill('input[type="password"], input[name="password"]', 'password123');
      
      await page.screenshot({ path: 'screenshot-2-login-filled.png', fullPage: true });
      console.log('✓ Screenshot saved: screenshot-2-login-filled.png');
      
      // Click login button
      const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      await loginButton.click();
      
      // Wait for navigation or error
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'screenshot-3-after-login.png', fullPage: true });
      console.log('✓ Screenshot saved: screenshot-3-after-login.png');
      
      // Check for dashboard
      console.log('\n=== TEST 3: Check for Dashboard ===');
      const hasDashboard = await page.locator('div, main').count() > 0;
      console.log(`✓ Dashboard/main content present: ${hasDashboard}`);
      
      // Check for game cards
      const gameCards = await page.locator('[class*="card"], [class*="game"]').count();
      console.log(`✓ Game cards found: ${gameCards}`);
      
      // Look for EV percentages
      const evElements = await page.locator('text=/[+-]?\\d+\\.?\\d*%/').count();
      console.log(`✓ Elements with % values: ${evElements}`);
      
      // Try to find specific EV indicators
      const positiveEV = await page.locator('text=/\\+\\d+\\.?\\d*%/').count();
      const negativeEV = await page.locator('text=/-\\d+\\.?\\d*%/').count();
      console.log(`✓ Positive EV indicators (+%): ${positiveEV}`);
      console.log(`✓ Negative EV indicators (-%): ${negativeEV}`);
      
      if (gameCards > 0) {
        console.log('\n=== TEST 4: Click on a game card ===');
        
        // Take screenshot before click
        await page.screenshot({ path: 'screenshot-4-before-click.png', fullPage: true });
        
        // Click first card
        const firstCard = await page.locator('[class*="card"], [class*="game"]').first();
        await firstCard.click();
        
        // Wait for modal
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'screenshot-5-modal-open.png', fullPage: true });
        console.log('✓ Screenshot saved: screenshot-5-modal-open.png');
        
        // Check for Kelly calculations in modal
        const hasModal = await page.locator('[role="dialog"], [class*="modal"]').count() > 0;
        console.log(`✓ Modal present: ${hasModal}`);
        
        const kellyText = await page.locator('text=/kelly/i').count();
        console.log(`✓ "Kelly" mentions found: ${kellyText}`);
        
        const calculationElements = await page.locator('text=/calculation/i, text=/kelly/i, text=/optimal/i').count();
        console.log(`✓ Calculation-related elements: ${calculationElements}`);
      }
    } else {
      console.log('\n⚠ Login form not found. Page might already be logged in or have different structure.');
    }
    
    // Final full page screenshot
    await page.screenshot({ path: 'screenshot-6-final.png', fullPage: true });
    console.log('\n✓ Final screenshot saved: screenshot-6-final.png');
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    await page.screenshot({ path: 'screenshot-error.png', fullPage: true });
    errors.push(`Test Error: ${error.message}`);
  }
  
  // Print console logs
  console.log('\n=== BROWSER CONSOLE LOGS ===');
  if (consoleLogs.length > 0) {
    consoleLogs.forEach(log => console.log(log));
  } else {
    console.log('(No console logs)');
  }
  
  // Print errors
  console.log('\n=== ERRORS ===');
  if (errors.length > 0) {
    errors.forEach(error => console.log(error));
  } else {
    console.log('(No errors)');
  }
  
  await browser.close();
  console.log('\n✓ Browser closed. Test complete!');
}

testApp().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
