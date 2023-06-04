/**
 * 睡眠
 * @param ms - 睡眠的时间(毫秒)
 * @return {Promise<void>}
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
