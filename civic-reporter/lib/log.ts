export function log(message: string, data?: unknown) {
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[APP] ${message}`, data);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[APP] ${message}`);
  }
}

export function warn(message: string, data?: unknown) {
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[APP] ${message}`, data);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[APP] ${message}`);
  }
}

export function error(message: string, data?: unknown) {
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.error(`[APP] ${message}`, data);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[APP] ${message}`);
  }
}


