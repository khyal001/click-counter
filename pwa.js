/* Shared PWA helper: Service Worker registration + install banner.
 * Loaded by both index.html and about.html via ./pwa.js
 * Counter logic in index.html is untouched; this file only handles PWA.
 */
(function () {
  "use strict";

  // 1) Register Service Worker (needs http/https; file:// is skipped silently).
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(function () {});
    });
  }

  var DISMISS_KEY = "pwaBannerDismissedAt";
  var DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  var deferredPrompt = null;

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    } catch (e) {}
    if (window.navigator.standalone === true) return true; // iOS Safari
    return false;
  }

  function wasDismissedRecently() {
    try {
      var t = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10) || 0;
      return t > 0 && Date.now() - t < DISMISS_TTL;
    } catch (e) {
      return false;
    }
  }

  function detectHint() {
    var ua = (navigator.userAgent || "").toLowerCase();
    var isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    var isAndroid = /android/.test(ua);
    var isChrome = /chrome|crios/.test(ua);
    if (isIOS) return "على iPhone / Safari: اضغط زر المشاركة ⎙ ثم «إضافة إلى الشاشة الرئيسية».";
    if (isAndroid && isChrome) return "على Android / Chrome: من قائمة ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».";
    if (isAndroid) return "على Android: من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية».";
    return "من قائمة المتصفح اختر «تثبيت» أو «إضافة إلى الشاشة الرئيسية».";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var banner = document.getElementById("installBanner");
    var closeBtn = document.getElementById("installClose");
    var installBtn = document.getElementById("installBtn");
    var hint = document.getElementById("installHint");
    if (!banner || !closeBtn || !installBtn || !hint) return;

    hint.textContent = detectHint();

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.hidden = false;
    });

    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      if (deferredPrompt.userChoice) {
        deferredPrompt.userChoice
          .then(function () {
            deferredPrompt = null;
            installBtn.hidden = true;
            banner.hidden = true;
          })
          .catch(function () {});
      }
    });

    closeBtn.addEventListener("click", function () {
      banner.hidden = true;
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch (e) {}
    });

    // Do not show when already installed, or when dismissed recently.
    if (isStandalone() || wasDismissedRecently()) return;

    // Small delay so the banner never blocks the first interaction with the counter.
    setTimeout(function () {
      if (!isStandalone()) banner.hidden = false;
    }, 1500);
  });
})();
