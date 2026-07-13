// Capacitor 네이티브 쉘 브릿지 — shell-kit 표준. 원격 URL 모드에선 네이티브 런타임이
// 페이지에 주입되므로 npm import 없이 window.Capacitor 전역으로 접근(웹에선 전부 no-op).
type CapApp = {
  exitApp?: () => void;
  addListener?: (ev: "backButton", cb: () => void) => Promise<{ remove: () => void }>;
};
type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { App?: CapApp } };

function cap(): Cap | undefined {
  return (globalThis as { Capacitor?: Cap }).Capacitor;
}

export function isNativeApp(): boolean {
  return !!cap()?.isNativePlatform?.();
}

export function nativePlatform(): string | null {
  return isNativeApp() ? cap()?.getPlatform?.() ?? null : null;
}

export function capacitorApp(): CapApp | null {
  return isNativeApp() ? cap()?.Plugins?.App ?? null : null;
}
