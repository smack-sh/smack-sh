export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

export function isMobile() {
  // we use sm: as the breakpoint for mobile. It's currently set to 640px
  return globalThis.innerWidth < 640 || isIOS() || isAndroid();
}
