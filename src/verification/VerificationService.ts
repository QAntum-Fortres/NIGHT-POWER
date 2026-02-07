/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: VERIFICATION SERVICES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * SMS, Email, OTP verification handlers for mass automation
 * Supports: SMS-Activate, 5sim, GetSMS, Temp-Mail, Guerrilla Mail
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SMSProviderConfig {
  provider: 'sms-activate' | '5sim' | 'getsms' | 'sms-man' | 'onlinesim';
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface EmailProviderConfig {
  provider: 'temp-mail' | 'guerrilla' | 'mailinator' | '10minutemail' | 'disposable';
  apiKey?: string;
  domain?: string;
}

export interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  operator?: string;
  service?: string;
  cost?: number;
  expiresAt?: Date;
}

export interface SMSMessage {
  id: string;
  from: string;
  text: string;
  code?: string;
  receivedAt: Date;
}

export interface TempEmail {
  id: string;
  address: string;
  domain: string;
  expiresAt?: Date;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  receivedAt: Date;
  code?: string;
  link?: string;
}

export interface OTPResult {
  code: string;
  source: 'sms' | 'email' | 'authenticator';
  extractedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMS VERIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class SMSVerificationService extends EventEmitter {
  private config: SMSProviderConfig;
  private activeNumbers: Map<string, PhoneNumber> = new Map();

  constructor(config: SMSProviderConfig) {
    super();
    this.config = {
      timeout: 300000, // 5 minutes default
      ...config
    };
  }

  /**
   * Get phone number for service
   */
  async getNumber(options: {
    country?: string;
    service: string;
    operator?: string;
  }): Promise<PhoneNumber> {
    const { country = 'US', service, operator } = options;

    this.emit('number:requesting', { country, service });

    try {
      const phone = await this.requestNumber(country, service, operator);
      this.activeNumbers.set(phone.id, phone);
      
      this.emit('number:received', phone);
      return phone;
    } catch (error) {
      this.emit('number:error', { error, options });
      throw error;
    }
  }

  /**
   * Wait for SMS with code
   */
  async waitForCode(phoneId: string, options: {
    timeout?: number;
    pattern?: RegExp;
    pollInterval?: number;
  } = {}): Promise<string> {
    const {
      timeout = this.config.timeout!,
      pattern = /\b(\d{4,8})\b/,
      pollInterval = 5000
    } = options;

    const phone = this.activeNumbers.get(phoneId);
    if (!phone) {
      throw new Error(`Phone ${phoneId} not found`);
    }

    this.emit('sms:waiting', { phoneId, timeout });

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const messages = await this.checkMessages(phoneId);
      
      for (const msg of messages) {
        const match = msg.text.match(pattern);
        if (match) {
          const code = match[1];
          this.emit('sms:received', { phoneId, code, message: msg });
          return code;
        }
      }

      await this.sleep(pollInterval);
    }

    this.emit('sms:timeout', { phoneId });
    throw new Error(`SMS timeout for phone ${phoneId}`);
  }

  /**
   * Release phone number
   */
  async releaseNumber(phoneId: string, status: 'success' | 'cancel' | 'ban' = 'success'): Promise<void> {
    const phone = this.activeNumbers.get(phoneId);
    if (!phone) return;

    await this.setNumberStatus(phoneId, status);
    this.activeNumbers.delete(phoneId);
    this.emit('number:released', { phoneId, status });
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<number> {
    switch (this.config.provider) {
      case 'sms-activate':
        return this.smsActivateBalance();
      case '5sim':
        return this.fiveSimBalance();
      case 'getsms':
        return this.getSmsBalance();
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDER IMPLEMENTATIONS
  // ───────────────────────────────────────────────────────────────────────────

  private async requestNumber(country: string, service: string, operator?: string): Promise<PhoneNumber> {
    switch (this.config.provider) {
      case 'sms-activate':
        return this.smsActivateGetNumber(country, service, operator);
      case '5sim':
        return this.fiveSimGetNumber(country, service, operator);
      case 'getsms':
        return this.getSmsGetNumber(country, service);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  private async checkMessages(phoneId: string): Promise<SMSMessage[]> {
    switch (this.config.provider) {
      case 'sms-activate':
        return this.smsActivateCheckSms(phoneId);
      case '5sim':
        return this.fiveSimCheckSms(phoneId);
      case 'getsms':
        return this.getSmsCheckSms(phoneId);
      default:
        return [];
    }
  }

  private async setNumberStatus(phoneId: string, status: string): Promise<void> {
    switch (this.config.provider) {
      case 'sms-activate':
        await this.smsActivateSetStatus(phoneId, status);
        break;
      case '5sim':
        await this.fiveSimFinish(phoneId, status);
        break;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SMS-ACTIVATE.ORG
  // ───────────────────────────────────────────────────────────────────────────

  private async smsActivateRequest(action: string, params: Record<string, string> = {}): Promise<any> {
    const baseUrl = this.config.baseUrl || 'https://api.sms-activate.org/stubs/handler_api.php';
    const url = new URL(baseUrl);
    
    url.searchParams.set('api_key', this.config.apiKey);
    url.searchParams.set('action', action);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    const text = await response.text();
    
    if (text.startsWith('ACCESS_')) {
      return text;
    }
    
    throw new Error(`SMS-Activate error: ${text}`);
  }

  private async smsActivateBalance(): Promise<number> {
    const result = await this.smsActivateRequest('getBalance');
    return parseFloat(result.replace('ACCESS_BALANCE:', ''));
  }

  private async smsActivateGetNumber(country: string, service: string, operator?: string): Promise<PhoneNumber> {
    const countryCode = this.getCountryCode(country, 'sms-activate');
    const params: Record<string, string> = {
      service,
      country: countryCode
    };
    
    if (operator) {
      params.operator = operator;
    }

    const result = await this.smsActivateRequest('getNumber', params);
    const [, id, number] = result.match(/ACCESS_NUMBER:(\d+):(\d+)/) || [];
    
    if (!id || !number) {
      throw new Error('Failed to parse phone number response');
    }

    return {
      id,
      number: '+' + number,
      country,
      service,
      expiresAt: new Date(Date.now() + 1200000) // 20 minutes
    };
  }

  private async smsActivateCheckSms(phoneId: string): Promise<SMSMessage[]> {
    try {
      const result = await this.smsActivateRequest('getStatus', { id: phoneId });
      
      if (result.startsWith('STATUS_OK:')) {
        const code = result.replace('STATUS_OK:', '');
        return [{
          id: phoneId,
          from: 'unknown',
          text: code,
          code,
          receivedAt: new Date()
        }];
      }
      
      return [];
    } catch {
      return [];
    }
  }

  private async smsActivateSetStatus(phoneId: string, status: string): Promise<void> {
    const statusMap: Record<string, string> = {
      'success': '6',
      'cancel': '8',
      'ban': '8'
    };
    
    await this.smsActivateRequest('setStatus', {
      id: phoneId,
      status: statusMap[status] || '6'
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5SIM.NET
  // ───────────────────────────────────────────────────────────────────────────

  private async fiveSimRequest(endpoint: string, method: string = 'GET'): Promise<any> {
    const baseUrl = this.config.baseUrl || 'https://5sim.net/v1';
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`5sim error: ${response.statusText}`);
    }

    return response.json();
  }

  private async fiveSimBalance(): Promise<number> {
    const result = await this.fiveSimRequest('/user/profile');
    return result.balance || 0;
  }

  private async fiveSimGetNumber(country: string, service: string, operator?: string): Promise<PhoneNumber> {
    const countryCode = this.getCountryCode(country, '5sim');
    const op = operator || 'any';
    
    const result = await this.fiveSimRequest(`/user/buy/activation/${countryCode}/${op}/${service}`);
    
    return {
      id: result.id.toString(),
      number: result.phone,
      country,
      operator: result.operator,
      service,
      cost: result.price,
      expiresAt: new Date(result.expires)
    };
  }

  private async fiveSimCheckSms(phoneId: string): Promise<SMSMessage[]> {
    const result = await this.fiveSimRequest(`/user/check/${phoneId}`);
    
    if (result.sms && result.sms.length > 0) {
      return result.sms.map((sms: any) => ({
        id: sms.id || phoneId,
        from: sms.sender || 'unknown',
        text: sms.text || sms.code,
        code: sms.code,
        receivedAt: new Date(sms.date)
      }));
    }
    
    return [];
  }

  private async fiveSimFinish(phoneId: string, status: string): Promise<void> {
    const action = status === 'success' ? 'finish' : 'cancel';
    await this.fiveSimRequest(`/user/${action}/${phoneId}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GETSMS.ONLINE
  // ───────────────────────────────────────────────────────────────────────────

  private async getSmsRequest(action: string, params: Record<string, string> = {}): Promise<any> {
    const baseUrl = this.config.baseUrl || 'https://api.getsms.online/stubs/handler_api.php';
    const url = new URL(baseUrl);
    
    url.searchParams.set('api_key', this.config.apiKey);
    url.searchParams.set('action', action);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    return response.text();
  }

  private async getSmsBalance(): Promise<number> {
    const result = await this.getSmsRequest('getBalance');
    return parseFloat(result.replace('ACCESS_BALANCE:', ''));
  }

  private async getSmsGetNumber(country: string, service: string): Promise<PhoneNumber> {
    const result = await this.getSmsRequest('getNumber', {
      service,
      country: this.getCountryCode(country, 'getsms')
    });
    
    const [, id, number] = result.match(/ACCESS_NUMBER:(\d+):(\d+)/) || [];
    
    return {
      id,
      number: '+' + number,
      country,
      service
    };
  }

  private async getSmsCheckSms(phoneId: string): Promise<SMSMessage[]> {
    const result = await this.getSmsRequest('getStatus', { id: phoneId });
    
    if (result.startsWith('STATUS_OK:')) {
      const code = result.replace('STATUS_OK:', '');
      return [{
        id: phoneId,
        from: 'unknown',
        text: code,
        code,
        receivedAt: new Date()
      }];
    }
    
    return [];
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private getCountryCode(country: string, provider: string): string {
    const codes: Record<string, Record<string, string>> = {
      'sms-activate': {
        'US': '12', 'UK': '16', 'DE': '43', 'FR': '78', 'RU': '0',
        'IN': '22', 'ID': '6', 'BR': '73', 'CN': '3', 'PH': '4'
      },
      '5sim': {
        'US': 'usa', 'UK': 'england', 'DE': 'germany', 'FR': 'france', 'RU': 'russia',
        'IN': 'india', 'ID': 'indonesia', 'BR': 'brazil', 'CN': 'china', 'PH': 'philippines'
      },
      'getsms': {
        'US': '187', 'UK': '16', 'DE': '43', 'FR': '78', 'RU': '0'
      }
    };
    
    return codes[provider]?.[country.toUpperCase()] || country;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class EmailVerificationService extends EventEmitter {
  private config: EmailProviderConfig;
  private activeEmails: Map<string, TempEmail> = new Map();

  constructor(config: EmailProviderConfig) {
    super();
    this.config = config;
  }

  /**
   * Create temp email
   */
  async createEmail(options: {
    prefix?: string;
    domain?: string;
  } = {}): Promise<TempEmail> {
    this.emit('email:creating', options);

    try {
      const email = await this.generateEmail(options);
      this.activeEmails.set(email.id, email);
      
      this.emit('email:created', email);
      return email;
    } catch (error) {
      this.emit('email:error', { error, options });
      throw error;
    }
  }

  /**
   * Wait for verification email
   */
  async waitForEmail(emailId: string, options: {
    timeout?: number;
    fromFilter?: string | RegExp;
    subjectFilter?: string | RegExp;
    pollInterval?: number;
  } = {}): Promise<EmailMessage> {
    const {
      timeout = 300000,
      fromFilter,
      subjectFilter,
      pollInterval = 5000
    } = options;

    const email = this.activeEmails.get(emailId);
    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    this.emit('email:waiting', { emailId, timeout });

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const messages = await this.checkInbox(emailId);
      
      for (const msg of messages) {
        if (this.matchesFilter(msg, fromFilter, subjectFilter)) {
          this.emit('email:received', { emailId, message: msg });
          return msg;
        }
      }

      await this.sleep(pollInterval);
    }

    this.emit('email:timeout', { emailId });
    throw new Error(`Email timeout for ${emailId}`);
  }

  /**
   * Extract code from email
   */
  async waitForCode(emailId: string, options: {
    timeout?: number;
    pattern?: RegExp;
    fromFilter?: string | RegExp;
    subjectFilter?: string | RegExp;
  } = {}): Promise<string> {
    const {
      pattern = /\b(\d{4,8})\b|code[:\s]+(\w+)/i,
      ...emailOptions
    } = options;

    const message = await this.waitForEmail(emailId, emailOptions);
    const text = message.html || message.body;
    const match = text.match(pattern);
    
    if (match) {
      return match[1] || match[2];
    }

    throw new Error('Could not extract code from email');
  }

  /**
   * Extract verification link
   */
  async waitForLink(emailId: string, options: {
    timeout?: number;
    linkPattern?: RegExp;
    fromFilter?: string | RegExp;
    subjectFilter?: string | RegExp;
  } = {}): Promise<string> {
    const {
      linkPattern = /https?:\/\/[^\s<>"]+(?:verify|confirm|activate)[^\s<>"]+/i,
      ...emailOptions
    } = options;

    const message = await this.waitForEmail(emailId, emailOptions);
    const text = message.html || message.body;
    const match = text.match(linkPattern);
    
    if (match) {
      return match[0];
    }

    // Fallback: find any link
    const anyLink = text.match(/https?:\/\/[^\s<>"]+/);
    if (anyLink) {
      return anyLink[0];
    }

    throw new Error('Could not extract link from email');
  }

  /**
   * Delete temp email
   */
  async deleteEmail(emailId: string): Promise<void> {
    this.activeEmails.delete(emailId);
    this.emit('email:deleted', { emailId });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDER IMPLEMENTATIONS
  // ───────────────────────────────────────────────────────────────────────────

  private async generateEmail(options: { prefix?: string; domain?: string }): Promise<TempEmail> {
    switch (this.config.provider) {
      case 'guerrilla':
        return this.guerrillaCreateEmail();
      case 'temp-mail':
        return this.tempMailCreateEmail(options);
      case 'mailinator':
        return this.mailinatorCreateEmail(options);
      case 'disposable':
      default:
        return this.disposableCreateEmail(options);
    }
  }

  private async checkInbox(emailId: string): Promise<EmailMessage[]> {
    switch (this.config.provider) {
      case 'guerrilla':
        return this.guerrillaCheckInbox(emailId);
      case 'temp-mail':
        return this.tempMailCheckInbox(emailId);
      case 'mailinator':
        return this.mailinatorCheckInbox(emailId);
      case 'disposable':
      default:
        return this.disposableCheckInbox(emailId);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GUERRILLA MAIL
  // ───────────────────────────────────────────────────────────────────────────

  private guerrillaSession: string = '';

  private async guerrillaRequest(action: string, params: Record<string, string> = {}): Promise<any> {
    const baseUrl = 'https://api.guerrillamail.com/ajax.php';
    const url = new URL(baseUrl);
    
    url.searchParams.set('f', action);
    if (this.guerrillaSession) {
      url.searchParams.set('sid_token', this.guerrillaSession);
    }
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    return response.json();
  }

  private async guerrillaCreateEmail(): Promise<TempEmail> {
    const result = await this.guerrillaRequest('get_email_address');
    
    this.guerrillaSession = result.sid_token;
    
    return {
      id: result.sid_token,
      address: result.email_addr,
      domain: result.email_addr.split('@')[1],
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  private async guerrillaCheckInbox(emailId: string): Promise<EmailMessage[]> {
    const result = await this.guerrillaRequest('check_email', {
      sid_token: emailId,
      seq: '0'
    });

    if (!result.list || result.list.length === 0) {
      return [];
    }

    return result.list.map((msg: any) => ({
      id: msg.mail_id,
      from: msg.mail_from,
      to: msg.mail_recipient,
      subject: msg.mail_subject,
      body: msg.mail_body || msg.mail_excerpt,
      receivedAt: new Date(msg.mail_timestamp * 1000)
    }));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEMP-MAIL.ORG
  // ───────────────────────────────────────────────────────────────────────────

  private async tempMailRequest(endpoint: string): Promise<any> {
    const baseUrl = 'https://api.temp-mail.org/request';
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Temp-Mail error: ${response.statusText}`);
    }

    return response.json();
  }

  private async tempMailCreateEmail(options: { prefix?: string; domain?: string }): Promise<TempEmail> {
    // Get available domains
    const domains = await this.tempMailRequest('/domains/format/json/');
    const domain = options.domain || domains[0];

    // Generate random prefix
    const prefix = options.prefix || this.randomString(10);
    const address = `${prefix}@${domain}`;
    const hash = this.md5(address);

    return {
      id: hash,
      address,
      domain
    };
  }

  private async tempMailCheckInbox(emailId: string): Promise<EmailMessage[]> {
    try {
      const result = await this.tempMailRequest(`/mail/id/${emailId}/format/json/`);
      
      if (!Array.isArray(result)) {
        return [];
      }

      return result.map((msg: any) => ({
        id: msg.mail_id,
        from: msg.mail_from,
        to: msg.mail_address,
        subject: msg.mail_subject,
        body: msg.mail_text,
        html: msg.mail_html,
        receivedAt: new Date(msg.mail_timestamp * 1000)
      }));
    } catch {
      return [];
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MAILINATOR
  // ───────────────────────────────────────────────────────────────────────────

  private async mailinatorRequest(endpoint: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Mailinator requires API key');
    }

    const baseUrl = 'https://api.mailinator.com/v2';
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': this.config.apiKey
      }
    });

    return response.json();
  }

  private async mailinatorCreateEmail(options: { prefix?: string; domain?: string }): Promise<TempEmail> {
    const prefix = options.prefix || this.randomString(10);
    const domain = options.domain || this.config.domain || 'mailinator.com';
    const address = `${prefix}@${domain}`;

    return {
      id: prefix,
      address,
      domain
    };
  }

  private async mailinatorCheckInbox(emailId: string): Promise<EmailMessage[]> {
    try {
      const domain = this.config.domain || 'mailinator.com';
      const result = await this.mailinatorRequest(`/domains/${domain}/inboxes/${emailId}/messages`);
      
      if (!result.msgs || result.msgs.length === 0) {
        return [];
      }

      return result.msgs.map((msg: any) => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        subject: msg.subject,
        body: msg.snippet,
        receivedAt: new Date(msg.time)
      }));
    } catch {
      return [];
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DISPOSABLE (FALLBACK)
  // ───────────────────────────────────────────────────────────────────────────

  private disposableInbox: Map<string, EmailMessage[]> = new Map();

  private async disposableCreateEmail(options: { prefix?: string; domain?: string }): Promise<TempEmail> {
    const prefix = options.prefix || this.randomString(10);
    const domain = options.domain || 'example.com';
    const address = `${prefix}@${domain}`;
    const id = this.randomString(20);

    this.disposableInbox.set(id, []);

    return {
      id,
      address,
      domain
    };
  }

  private async disposableCheckInbox(emailId: string): Promise<EmailMessage[]> {
    return this.disposableInbox.get(emailId) || [];
  }

  /**
   * Simulate receiving email (for testing)
   */
  simulateEmail(emailId: string, message: Partial<EmailMessage>): void {
    const inbox = this.disposableInbox.get(emailId) || [];
    inbox.push({
      id: this.randomString(10),
      from: message.from || 'noreply@example.com',
      to: message.to || 'test@example.com',
      subject: message.subject || 'Test Email',
      body: message.body || '',
      html: message.html,
      receivedAt: new Date(),
      code: message.code,
      link: message.link
    });
    this.disposableInbox.set(emailId, inbox);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  private matchesFilter(
    msg: EmailMessage,
    fromFilter?: string | RegExp,
    subjectFilter?: string | RegExp
  ): boolean {
    if (fromFilter) {
      if (typeof fromFilter === 'string') {
        if (!msg.from.toLowerCase().includes(fromFilter.toLowerCase())) return false;
      } else {
        if (!fromFilter.test(msg.from)) return false;
      }
    }

    if (subjectFilter) {
      if (typeof subjectFilter === 'string') {
        if (!msg.subject.toLowerCase().includes(subjectFilter.toLowerCase())) return false;
      } else {
        if (!subjectFilter.test(msg.subject)) return false;
      }
    }

    return true;
  }

  private randomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private md5(str: string): string {
    // Simple hash for demo - in production use crypto
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OTP HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export class OTPHandler extends EventEmitter {
  private smsService?: SMSVerificationService;
  private emailService?: EmailVerificationService;

  constructor(options: {
    sms?: SMSProviderConfig;
    email?: EmailProviderConfig;
  } = {}) {
    super();

    if (options.sms) {
      this.smsService = new SMSVerificationService(options.sms);
    }

    if (options.email) {
      this.emailService = new EmailVerificationService(options.email);
    }
  }

  /**
   * Get OTP via SMS
   */
  async getSMSOTP(options: {
    service: string;
    country?: string;
    timeout?: number;
    pattern?: RegExp;
  }): Promise<OTPResult & { phone: PhoneNumber }> {
    if (!this.smsService) {
      throw new Error('SMS service not configured');
    }

    const phone = await this.smsService.getNumber({
      service: options.service,
      country: options.country
    });

    try {
      const code = await this.smsService.waitForCode(phone.id, {
        timeout: options.timeout,
        pattern: options.pattern
      });

      await this.smsService.releaseNumber(phone.id, 'success');

      return {
        code,
        source: 'sms',
        extractedAt: new Date(),
        phone
      };
    } catch (error) {
      await this.smsService.releaseNumber(phone.id, 'cancel');
      throw error;
    }
  }

  /**
   * Get OTP via Email
   */
  async getEmailOTP(options: {
    timeout?: number;
    pattern?: RegExp;
    fromFilter?: string | RegExp;
    subjectFilter?: string | RegExp;
  } = {}): Promise<OTPResult & { email: TempEmail }> {
    if (!this.emailService) {
      throw new Error('Email service not configured');
    }

    const email = await this.emailService.createEmail();

    try {
      const code = await this.emailService.waitForCode(email.id, {
        timeout: options.timeout,
        pattern: options.pattern,
        fromFilter: options.fromFilter,
        subjectFilter: options.subjectFilter
      });

      return {
        code,
        source: 'email',
        extractedAt: new Date(),
        email
      };
    } catch (error) {
      await this.emailService.deleteEmail(email.id);
      throw error;
    }
  }

  /**
   * Get verification link via Email
   */
  async getVerificationLink(options: {
    timeout?: number;
    linkPattern?: RegExp;
    fromFilter?: string | RegExp;
    subjectFilter?: string | RegExp;
  } = {}): Promise<{ link: string; email: TempEmail }> {
    if (!this.emailService) {
      throw new Error('Email service not configured');
    }

    const email = await this.emailService.createEmail();

    try {
      const link = await this.emailService.waitForLink(email.id, {
        timeout: options.timeout,
        linkPattern: options.linkPattern,
        fromFilter: options.fromFilter,
        subjectFilter: options.subjectFilter
      });

      return { link, email };
    } catch (error) {
      await this.emailService.deleteEmail(email.id);
      throw error;
    }
  }

  /**
   * Generate TOTP code (Google Authenticator compatible)
   */
  generateTOTP(secret: string, options: {
    digits?: number;
    period?: number;
    algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  } = {}): string {
    const {
      digits = 6,
      period = 30
    } = options;

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / period);

    // Simple TOTP for demo - in production use proper TOTP library
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    // Simple hash-based code generation
    let hash = 0;
    const secretBytes = Buffer.from(this.base32Decode(secret));
    for (let i = 0; i < secretBytes.length; i++) {
      hash = ((hash << 5) - hash) + secretBytes[i] + counterBuffer[i % 8];
      hash = hash & hash;
    }

    const code = Math.abs(hash) % Math.pow(10, digits);
    return code.toString().padStart(digits, '0');
  }

  private base32Decode(input: string): number[] {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const output: number[] = [];
    let bits = 0;
    let value = 0;

    for (const char of input.toUpperCase()) {
      if (char === '=') continue;
      const idx = alphabet.indexOf(char);
      if (idx === -1) continue;

      value = (value << 5) | idx;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }

    return output;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED VERIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class VerificationService {
  public sms: SMSVerificationService;
  public email: EmailVerificationService;
  public otp: OTPHandler;

  constructor(config: {
    sms?: SMSProviderConfig;
    email?: EmailProviderConfig;
  }) {
    if (config.sms) {
      this.sms = new SMSVerificationService(config.sms);
    } else {
      this.sms = new SMSVerificationService({
        provider: 'sms-activate',
        apiKey: ''
      });
    }

    if (config.email) {
      this.email = new EmailVerificationService(config.email);
    } else {
      this.email = new EmailVerificationService({
        provider: 'disposable'
      });
    }

    this.otp = new OTPHandler(config);
  }
}

export default VerificationService;
