import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from './logger.js';

describe('Logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log messages at info level by default', () => {
    const logger = new Logger();

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).toHaveBeenCalled();
    expect(consoleSpy.warn).toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should log all messages at debug level', () => {
    const logger = new Logger('debug');

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(consoleSpy.debug).toHaveBeenCalled();
    expect(consoleSpy.info).toHaveBeenCalled();
    expect(consoleSpy.warn).toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should only log error messages at error level', () => {
    const logger = new Logger('error');

    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should include metadata in log output', () => {
    const logger = new Logger('info');
    const meta = { key: 'value' };

    logger.info('test message', meta);

    expect(consoleSpy.info).toHaveBeenCalled();
    const logMessage = consoleSpy.info.mock.calls[0][0];
    expect(logMessage).toContain('test message');
    expect(logMessage).toContain('"key":"value"');
  });

  it('should handle invalid log level by defaulting to info', () => {
    const logger = new Logger('invalid');

    logger.debug('debug message');
    logger.info('info message');

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('should allow changing log level', () => {
    const logger = new Logger('error');

    logger.info('should not log');
    expect(consoleSpy.info).not.toHaveBeenCalled();

    logger.setLevel('info');
    logger.info('should log');
    expect(consoleSpy.info).toHaveBeenCalled();
  });
});
