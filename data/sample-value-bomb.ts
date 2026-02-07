/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VALUE BOMB SAMPLE - Ready-to-send security audit
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Това е примерен Value Bomb, генериран от Hunter Mode.
 * Целта: Демонстрация на качеството на автоматично генерирания content.
 * 
 * @author QAntum v34.0 ETERNAL SOVEREIGN
 * @generated ${new Date().toISOString()}
 */

const SAMPLE_VALUE_BOMB = {
  leadId: 'lead_1749761234567_demo12345',
  companyName: 'ExampleStore',
  domain: 'examplestore.bg',
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY GRADE
  // ═══════════════════════════════════════════════════════════════════════════
  securityGrade: 'D',
  securityScore: 58,
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  executiveSummary: `
## 🛡️ Security Assessment: ExampleStore

**Overall Grade: D** (58/100)

При нашия публичен security scan на examplestore.bg, открихме **7 потенциални проблема**, от които **3 са критични**.

### Ключови наблюдения:
- ⚠️ Липсва Content-Security-Policy header
- ⚠️ X-Frame-Options не е конфигуриран (clickjacking риск)
- ⚠️ SSL сертификатът изтича след 14 дни

### Потенциален риск:
🔴 ВИСОК РИСК: Сайтът е уязвим на множество вектори на атака.

### Препоръка:
Препоръчваме незабавна ревизия на security конфигурацията. QAntum може да помогне с пълен audit и автоматизирана защита.
  `,

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL FINDINGS
  // ═══════════════════════════════════════════════════════════════════════════
  criticalFindings: [
    {
      severity: 'CRITICAL',
      title: 'Липсва Content-Security-Policy (CSP)',
      impact: 'Сайтът е уязвим на XSS (Cross-Site Scripting) атаки. Злонамерен код може да бъде инжектиран и да открадне данни на потребители.',
      evidence: 'HTTP Response не съдържа Content-Security-Policy header',
      remediation: 'Добавете CSP header с подходящи директиви. Пример: "default-src \'self\'; script-src \'self\' cdn.example.com"'
    },
    {
      severity: 'CRITICAL', 
      title: 'X-Frame-Options липсва',
      impact: 'Сайтът може да бъде вграден в iframe на злонамерен сайт (clickjacking). Потребителите могат да бъдат подведени да кликнат на скрити бутони.',
      evidence: 'HTTP Response не съдържа X-Frame-Options header',
      remediation: 'Добавете X-Frame-Options: DENY или SAMEORIGIN header'
    },
    {
      severity: 'HIGH',
      title: 'SSL сертификат изтича скоро',
      impact: 'След изтичане на сертификата, посетителите ще виждат "Not Secure" предупреждение. Google ще намали SEO ranking.',
      evidence: 'SSL сертификатът изтича след 14 дни (2024-02-15)',
      remediation: 'Подновете SSL сертификата незабавно чрез вашия хостинг провайдър или Let\'s Encrypt'
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  recommendations: [
    {
      priority: 1,
      title: 'Подновете SSL сертификата',
      description: 'Незабавно подновете сертификата преди изтичане. Препоръчваме автоматизация с Let\'s Encrypt.',
      estimatedEffort: '1-2 часа',
      businessImpact: 'Предотвратява загуба на клиенти поради "Not Secure" предупреждение'
    },
    {
      priority: 2,
      title: 'Конфигурирайте Security Headers',
      description: 'Добавете липсващите headers: CSP, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security',
      estimatedEffort: '2-4 часа',
      businessImpact: 'Защита от XSS, clickjacking, и MIME-sniffing атаки'
    },
    {
      priority: 3,
      title: 'Внедрете HSTS',
      description: 'HTTP Strict Transport Security гарантира, че сайтът винаги се зарежда през HTTPS',
      estimatedEffort: '30 минути',
      businessImpact: 'Предотвратява downgrade атаки и man-in-the-middle'
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  emailSubject: 'ExampleStore: Открихме 3 security проблема (безплатен одит)',
  
  emailBody: `
Здравейте,

Казвам се Димитър Продромов и съм основател на QAntum - платформа за автоматизирано QA и security тестване.

При рутинен мониторинг на публични security индикатори, забелязахме няколко потенциални проблема на examplestore.bg:

**🔴 Критични находки:**
• Липсва Content-Security-Policy (CSP) - Сайтът е уязвим на XSS атаки
• X-Frame-Options липсва - Може да доведе до clickjacking
• SSL сертификат изтича след 14 дни - Google ще намали SEO ranking

**📊 Общ Security Score: 58/100**

Тези проблеми могат да доведат до:
- Компрометиране на потребителски данни
- SEO penalty от Google
- Загуба на доверие от клиенти

---

**🎁 Безплатна оферта:**

Предлагам ви **безплатен пълен security audit** на examplestore.bg, включващ:
✅ SSL/TLS deep analysis
✅ HTTP Security Headers check
✅ DNS security verification
✅ Performance & availability test
✅ Персонализиран action plan

**Без задължения. Без кредитна карта.**

Просто отговорете на този имейл или резервирайте 15-минутен разговор:
📅 https://calendly.com/qantum/security-review

С уважение,
Димитър Продромов
QAntum Founder
"В QAntum не лъжем."

---
P.S. Всички данни в този анализ са от публични източници (SSL сертификати, HTTP headers, DNS записи) - същото като SecurityHeaders.com или SSL Labs.
  `,

  // ═══════════════════════════════════════════════════════════════════════════
  // LINKEDIN MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════
  linkedInMessage: `
Здравейте! 👋

Забелязах examplestore.bg при рутинен security мониторинг.

Вашият security score е 58/100 (Grade D).

Открих 7 потенциални подобрения, включително 3 критични.

Мога да ви изпратя безплатен детайлен отчет, ако ви е интересно?

Димитър от QAntum
  `,

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFER DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  offer: {
    title: '🎁 Безплатен Security Audit + 14-дневен Trial',
    description: 'Пълен security audit на examplestore.bg с Ghost Protocol технология. Включва: SSL анализ, header verification, DNS security check, и персонализирани препоръки.',
    callToAction: 'Резервирайте 15-минутна демонстрация',
    validUntil: '2024-02-08',
    estimatedDealValue: '$4,500'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  metadata: {
    generatedAt: new Date().toISOString(),
    generatedBy: 'QAntum v34.0 ETERNAL SOVEREIGN',
    dataSource: 'PUBLIC_DATA_ONLY',
    legalBasis: 'Same as SecurityHeaders.com, SSL Labs, Qualys',
    compliance: ['CFAA', 'GDPR', 'Ethical']
  }
};

// Pretty print
console.log(JSON.stringify(SAMPLE_VALUE_BOMB, null, 2));

export default SAMPLE_VALUE_BOMB;
