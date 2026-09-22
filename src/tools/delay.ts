export function simulateDelay(ms = 320): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
