/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: DATA GENERATORS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Complete fake data generation for automation - identities, addresses, phones
 * Built-in Faker-like functionality without external dependencies
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DATA POOLS
// ═══════════════════════════════════════════════════════════════════════════════

const FIRST_NAMES_MALE = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Raymond', 'Gregory', 'Frank', 'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry'];

const FIRST_NAMES_FEMALE = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen', 'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com', 'mail.com', 'aol.com', 'zoho.com', 'yandex.com'];

const STREET_NAMES = ['Main', 'Oak', 'Cedar', 'Maple', 'Pine', 'Elm', 'Washington', 'Lake', 'Hill', 'Park', 'Church', 'Mill', 'River', 'Spring', 'Valley', 'Sunset', 'Forest', 'Highland', 'Meadow', 'Ridge'];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Ct', 'Pl', 'Cir'];

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

const US_CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque'];

const COMPANIES = ['Tech Solutions', 'Global Systems', 'Digital Innovations', 'Cloud Services', 'Data Corp', 'Software Inc', 'Web Dynamics', 'Net Solutions', 'Code Masters', 'App Factory', 'Cyber Tech', 'Smart Systems', 'Info Group', 'Digital Works', 'Tech Hub'];

const JOB_TITLES = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Marketing Manager', 'Sales Representative', 'Customer Support', 'HR Manager', 'Financial Analyst', 'Operations Manager', 'Project Manager', 'Designer', 'Developer', 'Consultant', 'Administrator', 'Coordinator'];

const CARD_PREFIXES = {
  visa: ['4'],
  mastercard: ['51', '52', '53', '54', '55'],
  amex: ['34', '37'],
  discover: ['6011', '65']
};

// ═══════════════════════════════════════════════════════════════════════════════
// RANDOM HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function padZero(num: number, length: number = 2): string {
  return num.toString().padStart(length, '0');
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeneratedIdentity {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'male' | 'female';
  email: string;
  username: string;
  password: string;
  phone: string;
  birthDate: Date;
  age: number;
  ssn?: string;
  address: GeneratedAddress;
  company?: string;
  jobTitle?: string;
}

export interface GeneratedAddress {
  street: string;
  city: string;
  state: string;
  stateCode: string;
  zipCode: string;
  country: string;
  countryCode: string;
  formatted: string;
}

export interface GeneratedCard {
  number: string;
  holder: string;
  expiryMonth: string;
  expiryYear: string;
  expiry: string;
  cvv: string;
  type: 'visa' | 'mastercard' | 'amex' | 'discover';
  brand: string;
}

export class IdentityGenerator {
  /**
   * Generate full identity
   */
  static generate(options: {
    gender?: 'male' | 'female' | 'random';
    minAge?: number;
    maxAge?: number;
    country?: string;
    withCompany?: boolean;
  } = {}): GeneratedIdentity {
    const gender = options.gender === 'random' || !options.gender
      ? (randomBoolean() ? 'male' : 'female')
      : options.gender;

    const firstName = gender === 'male'
      ? randomFrom(FIRST_NAMES_MALE)
      : randomFrom(FIRST_NAMES_FEMALE);
    const lastName = randomFrom(LAST_NAMES);

    const minAge = options.minAge || 18;
    const maxAge = options.maxAge || 65;
    const age = random(minAge, maxAge);
    const birthDate = this.generateBirthDate(age);

    const username = this.generateUsername(firstName, lastName);
    const email = this.generateEmail(firstName, lastName);
    const password = this.generatePassword();
    const phone = PhoneGenerator.generateUS();
    const address = AddressGenerator.generateUS();

    const identity: GeneratedIdentity = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      gender,
      email,
      username,
      password,
      phone,
      birthDate,
      age,
      address
    };

    if (options.withCompany) {
      identity.company = randomFrom(COMPANIES);
      identity.jobTitle = randomFrom(JOB_TITLES);
    }

    return identity;
  }

  /**
   * Generate multiple identities
   */
  static generateBulk(count: number, options?: Parameters<typeof IdentityGenerator.generate>[0]): GeneratedIdentity[] {
    return Array.from({ length: count }, () => this.generate(options));
  }

  /**
   * Generate username
   */
  static generateUsername(firstName?: string, lastName?: string): string {
    const first = firstName || randomFrom([...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE]);
    const last = lastName || randomFrom(LAST_NAMES);
    
    const formats = [
      () => `${first.toLowerCase()}${last.toLowerCase()}`,
      () => `${first.toLowerCase()}_${last.toLowerCase()}`,
      () => `${first.toLowerCase()}${random(1, 999)}`,
      () => `${first[0].toLowerCase()}${last.toLowerCase()}${random(1, 99)}`,
      () => `${first.toLowerCase()}.${last.toLowerCase()}`,
      () => `${last.toLowerCase()}${first[0].toLowerCase()}${random(10, 99)}`
    ];

    return randomFrom(formats)();
  }

  /**
   * Generate email
   */
  static generateEmail(firstName?: string, lastName?: string, domain?: string): string {
    const first = firstName || randomFrom([...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE]);
    const last = lastName || randomFrom(LAST_NAMES);
    const emailDomain = domain || randomFrom(EMAIL_DOMAINS);

    const formats = [
      () => `${first.toLowerCase()}.${last.toLowerCase()}@${emailDomain}`,
      () => `${first.toLowerCase()}${last.toLowerCase()}@${emailDomain}`,
      () => `${first.toLowerCase()}_${last.toLowerCase()}@${emailDomain}`,
      () => `${first[0].toLowerCase()}${last.toLowerCase()}@${emailDomain}`,
      () => `${first.toLowerCase()}${random(1, 999)}@${emailDomain}`,
      () => `${last.toLowerCase()}.${first.toLowerCase()}@${emailDomain}`
    ];

    return randomFrom(formats)();
  }

  /**
   * Generate strong password
   */
  static generatePassword(length: number = 12, options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}): string {
    const opts = {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      ...options
    };

    const chars: string[] = [];
    if (opts.lowercase) chars.push('abcdefghijklmnopqrstuvwxyz');
    if (opts.uppercase) chars.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (opts.numbers) chars.push('0123456789');
    if (opts.symbols) chars.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

    const allChars = chars.join('');
    let password = '';

    // Ensure at least one char from each category
    for (const charSet of chars) {
      password += charSet[Math.floor(Math.random() * charSet.length)];
    }

    // Fill rest randomly
    while (password.length < length) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle
    return shuffle(password.split('')).join('');
  }

  /**
   * Generate birth date for given age
   */
  private static generateBirthDate(age: number): Date {
    const now = new Date();
    const year = now.getFullYear() - age;
    const month = random(0, 11);
    const day = random(1, 28);
    return new Date(year, month, day);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADDRESS GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class AddressGenerator {
  /**
   * Generate US address
   */
  static generateUS(): GeneratedAddress {
    const streetNumber = random(100, 9999);
    const streetName = randomFrom(STREET_NAMES);
    const streetType = randomFrom(STREET_TYPES);
    const street = `${streetNumber} ${streetName} ${streetType}`;

    const city = randomFrom(US_CITIES);
    const state = randomFrom(US_STATES);
    const zipCode = padZero(random(10000, 99999), 5);

    return {
      street,
      city,
      state: state.name,
      stateCode: state.code,
      zipCode,
      country: 'United States',
      countryCode: 'US',
      formatted: `${street}, ${city}, ${state.code} ${zipCode}`
    };
  }

  /**
   * Generate UK address
   */
  static generateUK(): GeneratedAddress {
    const ukStreetNames = ['High', 'Station', 'Church', 'London', 'Victoria', 'Park', 'Mill', 'Green', 'Queen', 'King'];
    const ukCities = ['London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Edinburgh', 'Sheffield', 'Newcastle'];
    const ukPostcodes = ['SW1A', 'EC1A', 'W1A', 'N1', 'SE1', 'E1', 'NW1', 'WC1', 'B1', 'M1'];

    const streetNumber = random(1, 200);
    const streetName = randomFrom(ukStreetNames);
    const street = `${streetNumber} ${streetName} Street`;
    const city = randomFrom(ukCities);
    const postcode = `${randomFrom(ukPostcodes)} ${random(1, 9)}${String.fromCharCode(65 + random(0, 25))}${String.fromCharCode(65 + random(0, 25))}`;

    return {
      street,
      city,
      state: '',
      stateCode: '',
      zipCode: postcode,
      country: 'United Kingdom',
      countryCode: 'GB',
      formatted: `${street}, ${city}, ${postcode}`
    };
  }

  /**
   * Generate German address
   */
  static generateDE(): GeneratedAddress {
    const deStreetNames = ['Hauptstraße', 'Bahnhofstraße', 'Schulstraße', 'Gartenstraße', 'Berliner Straße', 'Dorfstraße', 'Bergstraße', 'Lindenstraße'];
    const deCities = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'];

    const streetNumber = random(1, 150);
    const streetName = randomFrom(deStreetNames);
    const street = `${streetName} ${streetNumber}`;
    const city = randomFrom(deCities);
    const zipCode = padZero(random(10000, 99999), 5);

    return {
      street,
      city,
      state: '',
      stateCode: '',
      zipCode,
      country: 'Germany',
      countryCode: 'DE',
      formatted: `${street}, ${zipCode} ${city}`
    };
  }

  /**
   * Generate address for country
   */
  static generate(country: 'US' | 'UK' | 'DE' | string = 'US'): GeneratedAddress {
    switch (country.toUpperCase()) {
      case 'US': return this.generateUS();
      case 'UK':
      case 'GB': return this.generateUK();
      case 'DE': return this.generateDE();
      default: return this.generateUS();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHONE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class PhoneGenerator {
  private static US_AREA_CODES = ['201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '276', '281', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '330', '331', '334', '336', '337', '339', '346', '347', '351', '352', '360', '361', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '530', '531', '534', '539', '540', '541', '551', '559', '561', '562', '563', '567', '570', '571', '573', '574', '575', '580', '585', '586', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '641', '646', '650', '651', '657', '660', '661', '662', '667', '669', '678', '681', '682', '701', '702', '703', '704', '706', '707', '708', '712', '713', '714', '715', '716', '717', '718', '719', '720', '724', '725', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '828', '830', '831', '832', '843', '845', '847', '848', '850', '856', '857', '858', '859', '860', '862', '863', '864', '865', '870', '872', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '928', '929', '930', '931', '934', '936', '937', '938', '940', '941', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '978', '979', '980', '984', '985', '989'];

  /**
   * Generate US phone number
   */
  static generateUS(format: 'dashes' | 'dots' | 'plain' | 'international' = 'plain'): string {
    const areaCode = randomFrom(this.US_AREA_CODES);
    const exchange = padZero(random(200, 999), 3);
    const subscriber = padZero(random(0, 9999), 4);

    switch (format) {
      case 'dashes': return `${areaCode}-${exchange}-${subscriber}`;
      case 'dots': return `${areaCode}.${exchange}.${subscriber}`;
      case 'international': return `+1${areaCode}${exchange}${subscriber}`;
      default: return `${areaCode}${exchange}${subscriber}`;
    }
  }

  /**
   * Generate UK phone number
   */
  static generateUK(format: 'plain' | 'international' = 'plain'): string {
    const prefixes = ['7700', '7800', '7900', '7400', '7500'];
    const prefix = randomFrom(prefixes);
    const number = padZero(random(100000, 999999), 6);

    if (format === 'international') {
      return `+44${prefix}${number}`;
    }
    return `0${prefix}${number}`;
  }

  /**
   * Generate German phone number
   */
  static generateDE(format: 'plain' | 'international' = 'plain'): string {
    const prefixes = ['151', '152', '157', '160', '162', '163', '170', '171', '172', '173', '174', '175', '176', '177', '178', '179'];
    const prefix = randomFrom(prefixes);
    const number = padZero(random(1000000, 9999999), 7);

    if (format === 'international') {
      return `+49${prefix}${number}`;
    }
    return `0${prefix}${number}`;
  }

  /**
   * Generate phone for country
   */
  static generate(country: string = 'US', format?: string): string {
    switch (country.toUpperCase()) {
      case 'US': return this.generateUS(format as any);
      case 'UK':
      case 'GB': return this.generateUK(format as any);
      case 'DE': return this.generateDE(format as any);
      default: return this.generateUS(format as any);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class CardGenerator {
  /**
   * Generate credit card number (Luhn-valid for testing)
   */
  static generate(type: 'visa' | 'mastercard' | 'amex' | 'discover' = 'visa'): GeneratedCard {
    const prefix = randomFrom(CARD_PREFIXES[type]);
    const length = type === 'amex' ? 15 : 16;
    
    // Generate number with Luhn algorithm
    let cardNumber = prefix;
    while (cardNumber.length < length - 1) {
      cardNumber += random(0, 9);
    }
    
    // Add check digit
    cardNumber += this.calculateLuhnCheckDigit(cardNumber);

    // Generate expiry (1-3 years from now)
    const now = new Date();
    const expiryYear = (now.getFullYear() + random(1, 3)).toString();
    const expiryMonth = padZero(random(1, 12), 2);

    // Generate CVV
    const cvvLength = type === 'amex' ? 4 : 3;
    const cvv = padZero(random(0, Math.pow(10, cvvLength) - 1), cvvLength);

    // Generate holder name
    const holder = `${randomFrom(FIRST_NAMES_MALE)} ${randomFrom(LAST_NAMES)}`.toUpperCase();

    return {
      number: cardNumber,
      holder,
      expiryMonth,
      expiryYear,
      expiry: `${expiryMonth}/${expiryYear.slice(-2)}`,
      cvv,
      type,
      brand: type.charAt(0).toUpperCase() + type.slice(1)
    };
  }

  /**
   * Generate Visa card
   */
  static generateVisa(): GeneratedCard {
    return this.generate('visa');
  }

  /**
   * Generate Mastercard
   */
  static generateMastercard(): GeneratedCard {
    return this.generate('mastercard');
  }

  /**
   * Generate Amex card
   */
  static generateAmex(): GeneratedCard {
    return this.generate('amex');
  }

  /**
   * Luhn check digit calculator
   */
  private static calculateLuhnCheckDigit(partialNumber: string): number {
    let sum = 0;
    let isOdd = true;

    for (let i = partialNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(partialNumber[i], 10);

      if (isOdd) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isOdd = !isOdd;
    }

    return (10 - (sum % 10)) % 10;
  }

  /**
   * Validate card number with Luhn
   */
  static validateLuhn(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isOdd = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isOdd) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isOdd = !isOdd;
    }

    return sum % 10 === 0;
  }

  /**
   * Format card number with spaces
   */
  static formatNumber(cardNumber: string, separator: string = ' '): string {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length === 15) {
      // Amex format: 4-6-5
      return `${clean.slice(0, 4)}${separator}${clean.slice(4, 10)}${separator}${clean.slice(10)}`;
    }
    // Standard format: 4-4-4-4
    return clean.match(/.{1,4}/g)?.join(separator) || clean;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOREM IPSUM GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class LoremGenerator {
  private static WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'];

  static word(): string {
    return randomFrom(this.WORDS);
  }

  static words(count: number = 5): string {
    return Array.from({ length: count }, () => this.word()).join(' ');
  }

  static sentence(wordCount: number = random(8, 15)): string {
    const words = this.words(wordCount);
    return words.charAt(0).toUpperCase() + words.slice(1) + '.';
  }

  static sentences(count: number = 3): string {
    return Array.from({ length: count }, () => this.sentence()).join(' ');
  }

  static paragraph(sentenceCount: number = random(3, 7)): string {
    return this.sentences(sentenceCount);
  }

  static paragraphs(count: number = 3): string {
    return Array.from({ length: count }, () => this.paragraph()).join('\n\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class DataGenerator {
  static identity = IdentityGenerator;
  static address = AddressGenerator;
  static phone = PhoneGenerator;
  static card = CardGenerator;
  static lorem = LoremGenerator;

  /**
   * Generate random UUID
   */
  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate random hex string
   */
  static hex(length: number = 32): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  /**
   * Generate random alphanumeric string
   */
  static alphanumeric(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  /**
   * Generate random number in range
   */
  static number(min: number = 0, max: number = 100): number {
    return random(min, max);
  }

  /**
   * Generate random float
   */
  static float(min: number = 0, max: number = 100, decimals: number = 2): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
  }

  /**
   * Generate random boolean
   */
  static boolean(probability: number = 0.5): boolean {
    return randomBoolean(probability);
  }

  /**
   * Generate random date
   */
  static date(start?: Date, end?: Date): Date {
    const startTime = start?.getTime() || new Date(2000, 0, 1).getTime();
    const endTime = end?.getTime() || Date.now();
    return new Date(startTime + Math.random() * (endTime - startTime));
  }

  /**
   * Generate random future date
   */
  static futureDate(yearsAhead: number = 1): Date {
    const now = Date.now();
    const future = now + yearsAhead * 365 * 24 * 60 * 60 * 1000;
    return new Date(now + Math.random() * (future - now));
  }

  /**
   * Generate random past date
   */
  static pastDate(yearsBack: number = 1): Date {
    const now = Date.now();
    const past = now - yearsBack * 365 * 24 * 60 * 60 * 1000;
    return new Date(past + Math.random() * (now - past));
  }

  /**
   * Pick random from array
   */
  static pick<T>(arr: T[]): T {
    return randomFrom(arr);
  }

  /**
   * Pick multiple random from array
   */
  static pickMultiple<T>(arr: T[], count: number): T[] {
    return shuffle(arr).slice(0, count);
  }

  /**
   * Shuffle array
   */
  static shuffle<T>(arr: T[]): T[] {
    return shuffle(arr);
  }
}

export default DataGenerator;
