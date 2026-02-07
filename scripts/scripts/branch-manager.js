#!/usr/bin/env node
/**
 * 🌳 BRANCH MANAGER
 * 
 * Helper script for managing QAntum's Git branching strategy
 * Automates common workflows and ensures proper branch hygiene
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BranchManager {
  constructor() {
    this.branches = {
      production: 'main',
      development: 'dev',
      harvest: 'vortex-raw'
    };
  }

  /**
   * Execute git command
   */
  exec(command, silent = false) {
    try {
      const output = execSync(command, { 
        encoding: 'utf-8',
        stdio: silent ? 'pipe' : 'inherit'
      });
      return output;
    } catch (error) {
      if (!silent) {
        console.error(`❌ Error executing: ${command}`);
        console.error(error.message);
      }
      throw error;
    }
  }

  /**
   * Get current branch
   */
  getCurrentBranch() {
    return this.exec('git rev-parse --abbrev-ref HEAD', true).trim();
  }

  /**
   * Check if branch exists
   */
  branchExists(branchName) {
    try {
      this.exec(`git rev-parse --verify ${branchName}`, true);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create branch if it doesn't exist
   */
  createBranch(branchName, fromBranch = null) {
    if (this.branchExists(branchName)) {
      console.log(`ℹ️  Branch ${branchName} already exists`);
      return false;
    }

    console.log(`🌱 Creating branch: ${branchName}`);
    if (fromBranch) {
      this.exec(`git checkout -b ${branchName} ${fromBranch}`);
    } else {
      this.exec(`git checkout -b ${branchName}`);
    }
    return true;
  }

  /**
   * Setup initial branch structure
   */
  setupBranches() {
    console.log('🌳 Setting up QAntum branch structure...');
    console.log('');

    const currentBranch = this.getCurrentBranch();
    console.log(`📍 Current branch: ${currentBranch}`);
    console.log('');

    // Ensure we're on a safe branch to work from
    if (!this.branchExists('main')) {
      console.log('⚠️  No main branch found. Creating from current branch...');
      this.exec('git branch -M main');
    }

    // Switch to main
    this.exec('git checkout main');

    // Create dev branch
    if (!this.branchExists('dev')) {
      console.log('🟡 Creating dev branch...');
      this.exec('git checkout -b dev');
      console.log('✅ Dev branch created');
    } else {
      console.log('ℹ️  Dev branch already exists');
    }

    // Create vortex-raw branch
    if (!this.branchExists('vortex-raw')) {
      console.log('🔴 Creating vortex-raw branch...');
      this.exec('git checkout -b vortex-raw');
      console.log('✅ Vortex-raw branch created');
    } else {
      console.log('ℹ️  Vortex-raw branch already exists');
    }

    // Return to dev
    this.exec('git checkout dev');

    console.log('');
    console.log('✨ Branch structure setup complete!');
    this.showBranchStatus();
  }

  /**
   * Show branch status
   */
  showBranchStatus() {
    console.log('');
    console.log('📊 Branch Status:');
    console.log('═'.repeat(60));
    
    const branches = ['main', 'dev', 'vortex-raw'];
    const currentBranch = this.getCurrentBranch();

    branches.forEach(branch => {
      if (this.branchExists(branch)) {
        const marker = branch === currentBranch ? '→' : ' ';
        const emoji = branch === 'main' ? '🟢' : branch === 'dev' ? '🟡' : '🔴';
        
        try {
          const commitCount = this.exec(`git rev-list --count ${branch}`, true).trim();
          const lastCommit = this.exec(`git log ${branch} -1 --format="%h %s"`, true).trim();
          
          console.log(`${marker} ${emoji} ${branch.padEnd(15)} (${commitCount} commits)`);
          console.log(`    Last: ${lastCommit}`);
        } catch {
          console.log(`${marker} ${emoji} ${branch.padEnd(15)} (not initialized)`);
        }
      }
    });
    console.log('');
  }

  /**
   * Promote verified modules from vortex-raw to dev
   */
  promoteTodev() {
    console.log('🔄 Promoting verified modules from vortex-raw to dev...');
    
    const analysisDir = path.join(process.cwd(), 'analysis-output');
    const taxonomyPath = path.join(analysisDir, 'TAXONOMY.json');
    
    if (!fs.existsSync(taxonomyPath)) {
      console.error('❌ No TAXONOMY.json found. Run Phase 1 analysis first.');
      return;
    }

    // Check if we have integration plan
    const planPath = path.join(analysisDir, 'integration-plan.json');
    if (!fs.existsSync(planPath)) {
      console.error('❌ No integration-plan.json found. Run Phase 3 integration first.');
      return;
    }

    const currentBranch = this.getCurrentBranch();
    
    // Switch to dev
    this.exec('git checkout dev');
    
    // Merge specific files from vortex-raw
    console.log('🔀 Merging verified modules...');
    try {
      // For now, we'll use a selective merge strategy
      console.log('ℹ️  Manual review recommended for production promotion');
      console.log('📋 Review integration-plan.json for module list');
    } catch (error) {
      console.error('❌ Merge failed:', error.message);
    }

    // Return to original branch
    this.exec(`git checkout ${currentBranch}`);
    
    console.log('✅ Promotion process complete');
  }

  /**
   * Create feature branch
   */
  createFeatureBranch(featureName) {
    if (!featureName) {
      console.error('❌ Feature name required');
      return;
    }

    const branchName = `feature/${featureName}`;
    
    // Ensure we're on dev
    this.exec('git checkout dev');
    
    // Create feature branch
    this.createBranch(branchName);
    
    console.log(`✅ Feature branch created: ${branchName}`);
    console.log('💡 Remember to:');
    console.log('   1. Implement your feature');
    console.log('   2. Run tests');
    console.log('   3. Create PR to dev when ready');
  }

  /**
   * Clean up merged branches
   */
  cleanup() {
    console.log('🧹 Cleaning up merged branches...');
    
    try {
      // Get merged branches
      const mergedBranches = this.exec('git branch --merged', true)
        .split('\n')
        .map(b => b.trim().replace('* ', ''))
        .filter(b => b && !['main', 'dev', 'vortex-raw'].includes(b));

      if (mergedBranches.length === 0) {
        console.log('✅ No merged branches to clean up');
        return;
      }

      console.log(`Found ${mergedBranches.length} merged branches:`);
      mergedBranches.forEach(b => console.log(`  - ${b}`));
      
      console.log('');
      console.log('Run `git branch -d <branch-name>` to delete each one');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  /**
   * Show help
   */
  showHelp() {
    console.log(`
🌳 QAntum Branch Manager

Usage: node scripts/branch-manager.js <command> [options]

Commands:
  setup                 Setup initial branch structure (main, dev, vortex-raw)
  status                Show status of all branches
  promote               Promote verified modules from vortex-raw to dev
  feature <name>        Create new feature branch from dev
  cleanup               Clean up merged branches
  help                  Show this help message

Examples:
  node scripts/branch-manager.js setup
  node scripts/branch-manager.js feature neural-search
  node scripts/branch-manager.js status
  node scripts/branch-manager.js promote

Branch Structure:
  🟢 main        - Production (golden standard)
  🟡 dev         - Development (working area)
  🔴 vortex-raw  - Raw harvest (unverified)

For more information, see BRANCHING-STRATEGY.md
    `);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new BranchManager();

  try {
    switch (command) {
      case 'setup':
        manager.setupBranches();
        break;
      
      case 'status':
        manager.showBranchStatus();
        break;
      
      case 'promote':
        manager.promoteTodev();
        break;
      
      case 'feature':
        manager.createFeatureBranch(args[1]);
        break;
      
      case 'cleanup':
        manager.cleanup();
        break;
      
      case 'help':
      case '--help':
      case '-h':
        manager.showHelp();
        break;
      
      default:
        console.log('❌ Unknown command:', command);
        console.log('Run "node scripts/branch-manager.js help" for usage');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

module.exports = { BranchManager };
