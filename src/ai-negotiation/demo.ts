/**
 * 🤖 AI-to-AI Negotiation Demo
 * Copyright © 2025 Dimitar Prodromov. All rights reserved.
 */

import NegotiationEngine, { AgentFactory } from './index';

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║     🤖 QANTUM AI-TO-AI NEGOTIATION ENGINE                                    ║');
  console.log('║     "Машини преговарят. Хора печелят."                                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const engine = new NegotiationEngine();
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE AGENTS
  // ─────────────────────────────────────────────────────────────────────────────
  
  console.log('🤖 CREATING AI AGENTS');
  console.log('─'.repeat(60));
  
  const seller = AgentFactory.createQAntumSalesAgent('ENTERPRISE');
  const buyer = AgentFactory.createBuyerAgent(250, ['Ghost Protocol', 'Self-Healing', 'API Access']);
  const mediator = AgentFactory.createMediatorAgent();
  
  console.log(`\n  🔵 ${seller.name} (${seller.role})`);
  console.log(`     Objectives: ${seller.objectives.slice(0, 2).join(', ')}`);
  console.log(`     Personality: Aggressive ${Math.round(seller.personality.aggressiveness * 100)}%, Flexible ${Math.round(seller.personality.flexibility * 100)}%`);
  
  console.log(`\n  🔴 ${buyer.name} (${buyer.role})`);
  console.log(`     Budget: $${buyer.knowledge.budget}/month`);
  console.log(`     Pain Points: ${buyer.knowledge.painPoints.join(', ')}`);
  console.log(`     Personality: Aggressive ${Math.round(buyer.personality.aggressiveness * 100)}%, Flexible ${Math.round(buyer.personality.flexibility * 100)}%`);
  
  console.log(`\n  ⚪ ${mediator.name} (${mediator.role})`);
  console.log(`     Role: Facilitate fair deal`);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE SESSION
  // ─────────────────────────────────────────────────────────────────────────────
  
  console.log('\n');
  console.log('📋 CREATING NEGOTIATION SESSION');
  console.log('─'.repeat(60));
  
  const session = engine.createSession('enterprise-contract', [seller, buyer, mediator]);
  console.log(`  Session ID: ${session.id}`);
  console.log(`  Type: ${session.type}`);
  console.log(`  Agents: ${session.agents.length}`);
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RUN NEGOTIATION
  // ─────────────────────────────────────────────────────────────────────────────
  
  console.log('\n');
  console.log('🎭 RUNNING NEGOTIATION');
  console.log('─'.repeat(60));
  
  const result = await engine.runNegotiation(session.id, 8);
  
  // Print transcript
  console.log('\n  📜 TRANSCRIPT:\n');
  const transcript = engine.getTranscript(session.id);
  
  transcript.forEach((msg, i) => {
    const time = msg.timestamp.toLocaleTimeString();
    const agentIcon = msg.fromAgent.includes('sales') ? '🔵' : 
                      msg.fromAgent.includes('buyer') ? '🔴' : 
                      msg.fromAgent === 'system' ? '⚡' : '⚪';
    
    console.log(`  ${agentIcon} [${time}] ${msg.type.toUpperCase()}`);
    console.log(`     ${msg.content.split('\n').join('\n     ')}`);
    console.log('');
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DEAL SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  
  console.log('\n');
  console.log('📊 DEAL SUMMARY');
  console.log('─'.repeat(60));
  
  const summary = engine.getDealSummary(session.id);
  
  if (summary) {
    const statusIcon = summary.status === 'agreed' ? '✅' : summary.status === 'failed' ? '❌' : '🔄';
    console.log(`\n  Status: ${statusIcon} ${summary.status.toUpperCase()}`);
    console.log(`  Rounds: ${summary.rounds}`);
    
    if (summary.finalTerms) {
      console.log('\n  Final Terms:');
      console.log(`    • Price: $${summary.finalTerms.monthlyPrice}/month`);
      console.log(`    • Contract: ${summary.finalTerms.contractLength} months`);
      console.log(`    • SLA: ${summary.finalTerms.sla}%`);
      console.log(`    • Payment: ${summary.finalTerms.paymentTerms}`);
      
      if (summary.savings && summary.savings > 0) {
        console.log(`\n  💰 Buyer Savings: $${summary.savings}/month`);
      }
    }
    
    console.log('\n  Agent Satisfaction:');
    Object.entries(summary.agentSatisfaction).forEach(([name, satisfaction]) => {
      const bar = '█'.repeat(Math.round(satisfaction * 10)) + '░'.repeat(10 - Math.round(satisfaction * 10));
      console.log(`    ${name}: ${bar} ${Math.round(satisfaction * 100)}%`);
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // REVENUE IMPACT
  // ─────────────────────────────────────────────────────────────────────────────
  
  console.log('\n');
  console.log('💰 REVENUE IMPACT');
  console.log('─'.repeat(60));
  
  if (summary?.status === 'agreed' && summary.finalTerms) {
    const monthlyRevenue = summary.finalTerms.monthlyPrice;
    const contractValue = monthlyRevenue * summary.finalTerms.contractLength;
    const annualRevenue = monthlyRevenue * 12;
    
    console.log(`\n  Contract Value: $${contractValue.toLocaleString()}`);
    console.log(`  Annual Revenue: $${annualRevenue.toLocaleString()}`);
    console.log(`  Deal Probability: ${Math.round(result.agents[1].state.dealProbability * 100)}%`);
    
    // ROI calculation
    const negotiationTime = 0.5; // hours (AI negotiation)
    const humanTime = 4; // hours (human negotiation average)
    const hourlyRate = 100;
    const savedTime = humanTime - negotiationTime;
    const savedCost = savedTime * hourlyRate;
    
    console.log(`\n  ⏱️ Time Saved: ${savedTime} hours`);
    console.log(`  💵 Cost Saved: $${savedCost}`);
  }
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║     🤖 AI-TO-AI NEGOTIATION - COMPLETE                                       ║');
  console.log('║     "Сделката е затворена. Автоматично."                                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
}

// Run
runDemo().catch(console.error);
