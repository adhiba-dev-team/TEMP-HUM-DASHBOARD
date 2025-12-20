export function initOneSignal() {
  if (!window.OneSignal) return;

  window.OneSignal.push(() => {
    window.OneSignal.init({
      appId: '2688cceb-5140-4779-b06f-e00da0579872',
      notifyButton: { enable: true },
    });
  });
}
