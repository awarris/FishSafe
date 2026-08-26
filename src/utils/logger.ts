/**
 * Structured application logger.
 *
 * Every technical event follows the same shape:
 * [FishSafe][timestamp][level][module][step]
 *
 * The goal is to make debugging reproducible without scattering raw
 * console.log statements across the codebase.
 */

type LogPayload = Record<string, unknown> | undefined;

function write(
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  module: string,
  step: string,
  message: string,
  payload?: LogPayload
) {
  const timestamp = new Date().toISOString();
  const prefix = `[FishSafe][${timestamp}][${level}][${module}][${step}]`;

  if (level === 'ERROR') {
    console.error(prefix, message, payload ?? '');
    return;
  }
  if (level === 'WARN') {
    console.warn(prefix, message, payload ?? '');
    return;
  }
  console.log(prefix, message, payload ?? '');
}

export const logger = {
  info: (module: string, step: string, message: string, payload?: LogPayload) =>
    write('INFO', module, step, message, payload),
  debug: (module: string, step: string, message: string, payload?: LogPayload) =>
    write('DEBUG', module, step, message, payload),
  warn: (module: string, step: string, message: string, payload?: LogPayload) =>
    write('WARN', module, step, message, payload),
  error: (module: string, step: string, message: string, error?: unknown, payload?: LogPayload) => {
    const normalizedError = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error: String(error ?? 'Unknown error') };
    write('ERROR', module, step, message, { ...payload, ...normalizedError });
  },
};
