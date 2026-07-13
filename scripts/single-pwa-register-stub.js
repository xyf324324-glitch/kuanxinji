// The portable single-file build has no service worker to register.
export function registerSW() {
  return () => {}
}
