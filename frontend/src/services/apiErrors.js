export const getApiErrorMessage = (err, fallback) => {
  const candidate = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message;

  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate;
  }

  if (candidate && typeof candidate === 'object') {
    if (typeof candidate.message === 'string' && candidate.message.trim()) {
      return candidate.message;
    }
    if (typeof candidate.code === 'string' && candidate.code.trim()) {
      return candidate.code;
    }
    try {
      return JSON.stringify(candidate);
    } catch {
      return fallback;
    }
  }

  return fallback;
};
