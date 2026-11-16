/*
 * 在第一次繪製前套用使用者的主題與語系偏好，避免先閃一下預設深色再切換。
 * 必須是同步載入的外部檔：全站規則不允許 dangerouslySetInnerHTML 的行內腳本。
 * 鍵名與 src/i18n/prefs.ts 的 THEME_KEY / LOCALE_KEY 保持一致。
 */
(function () {
  var root = document.documentElement;
  try {
    var theme = localStorage.getItem("ihm:ui:theme");
    // 沒選過就維持站台原本的深色外觀，只有使用者主動切換才改成淺色。
    if (theme !== "light") {
      theme = "dark";
    }
    root.setAttribute("data-theme", theme);
    if (localStorage.getItem("ihm:ui:locale") === "en") {
      root.setAttribute("lang", "en");
    }
  } catch (error) {
    root.setAttribute("data-theme", "dark");
  }
})();
