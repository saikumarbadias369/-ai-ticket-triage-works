async function withRetry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err) {
            attempt++;
            const status = err.response?.status;
            const isRetryable = !status || status === 429 || status >= 500;
            if (!isRetryable || attempt > retries) throw err;
            const delay = baseDelayMs * 2 ** (attempt - 1);
            console.warn(`Attempt ${attempt} failed (${status || err.code}), retrying in ${delay}ms`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
}

module.exports = { withRetry };