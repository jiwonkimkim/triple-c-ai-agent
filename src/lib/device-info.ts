import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
}

export function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      device: 'Unknown Device',
      browser: 'Unknown Browser',
      os: 'Unknown OS',
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Build device string
  let device = 'Unknown Device';
  if (result.device.vendor && result.device.model) {
    device = `${result.device.vendor} ${result.device.model}`;
  } else if (result.device.type) {
    device = result.device.type.charAt(0).toUpperCase() + result.device.type.slice(1);
  } else if (result.os.name) {
    // Use OS as device hint
    if (result.os.name.includes('Mac')) {
      device = 'Mac';
    } else if (result.os.name.includes('Windows')) {
      device = 'Windows PC';
    } else if (result.os.name.includes('Linux')) {
      device = 'Linux PC';
    } else if (result.os.name.includes('iOS')) {
      device = 'iPhone/iPad';
    } else if (result.os.name.includes('Android')) {
      device = 'Android Device';
    }
  }

  // Build browser string
  let browser = 'Unknown Browser';
  if (result.browser.name) {
    browser = result.browser.name;
    if (result.browser.version) {
      const majorVersion = result.browser.version.split('.')[0];
      browser += ` ${majorVersion}`;
    }
  }

  // Build OS string
  let os = 'Unknown OS';
  if (result.os.name) {
    os = result.os.name;
    if (result.os.version) {
      os += ` ${result.os.version}`;
    }
  }

  return { device, browser, os };
}

// Get IP address from headers (works with various proxies)
export function getClientIP(headers: Headers): string {
  // Check common proxy headers
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'Unknown';
}
