import path from 'path';
import fs from 'fs';
import * as rfs from 'rotating-file-stream';

const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Daily rotating file stream for general application & socket logs (14-day retention)
export const appLogStream = rfs.createStream('app.log', {
  interval: '1d',
  path: logsDir,
  maxFiles: 14,
  compress: 'gzip',
});

// Daily rotating file stream for error logs (30-day retention)
export const errorLogStream = rfs.createStream('error.log', {
  interval: '1d',
  path: logsDir,
  maxFiles: 30,
  compress: 'gzip',
});

// Daily rotating file stream for HTTP access logs (14-day retention)
export const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  path: logsDir,
  maxFiles: 14,
  compress: 'gzip',
});

function getTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: string, message: string, ...args: any[]): string {
  const formattedArgs =
    args.length > 0
      ? ' ' +
        args
          .map((a) => {
            if (a instanceof Error) return a.stack || a.message;
            if (typeof a === 'object') {
              try {
                return JSON.stringify(a);
              } catch {
                return String(a);
              }
            }
            return String(a);
          })
          .join(' ')
      : '';
  return `[${getTimestamp()}] [${level}] ${message}${formattedArgs}\n`;
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    const formatted = formatMessage('INFO', message, ...args);
    process.stdout.write(formatted);
    try {
      appLogStream.write(formatted);
    } catch {
      // Ignore file write errors
    }
  },
  warn: (message: string, ...args: any[]) => {
    const formatted = formatMessage('WARN', message, ...args);
    process.stderr.write(formatted);
    try {
      appLogStream.write(formatted);
    } catch {
      // Ignore file write errors
    }
  },
  error: (message: string, ...args: any[]) => {
    const formatted = formatMessage('ERROR', message, ...args);
    process.stderr.write(formatted);
    try {
      appLogStream.write(formatted);
      errorLogStream.write(formatted);
    } catch {
      // Ignore file write errors
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = formatMessage('DEBUG', message, ...args);
      process.stdout.write(formatted);
      try {
        appLogStream.write(formatted);
      } catch {
        // Ignore file write errors
      }
    }
  },
};
