/* ==========================================================================
   guide.js

   【このファイルの役割】
   ご利用についてページ(guide.html)だけで使うJavaScript。
   data/guide.json を読み込み、各セクションの中身を描画する。

   共通処理(ヘッダーのスクロール検知・site.jsonの読み込みなど)は
   common.js が担当している(考え方はrehab.js・about.js・flow.jsと同じ)。 */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     0. 共通ヘルパー
     ------------------------------------------------------------------------ */
  function getValueByPath(data, path) {
    return path.split(".").reduce(function (value, key) {
      return value && value[key] !== undefined ? value[key] : undefined;
    }, data);
  }

  /* ------------------------------------------------------------------------
     1. guide.json の読み込み
     ------------------------------------------------------------------------ */
  function loadGuideData() {
    fetch("data/guide.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("guide.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (guideData) {
        applyGuideData(guideData);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function applyGuideData(guideData) {
    // data-guide="hero.title" のような属性を持つ要素すべてに、
    // 対応するテキストを流し込む(common.jsのdata-site属性と同じ考え方)。
    document.querySelectorAll("[data-guide]").forEach(function (el) {
      var path = el.getAttribute("data-guide");
      var value = getValueByPath(guideData, path);
      if (value !== undefined) {
        el.textContent = value;
      }
    });

    // ファーストビューの背景写真
    var heroImageEl = document.querySelector(".js-guide-hero-image");
    if (heroImageEl && guideData.hero && guideData.hero.image) {
      heroImageEl.style.backgroundImage = "url('" + guideData.hero.image + "')";
    }

    renderEligibility(guideData);
    renderSteps(guideData);
    renderFaq(guideData);
  }

  /* ------------------------------------------------------------------------
     2. ②ご利用いただける方の描画
     ------------------------------------------------------------------------ */
  function renderEligibility(guideData) {
    var containerEl = document.querySelector(".js-eligibility");
    if (!containerEl || !guideData.eligibility) return;

    var html = guideData.eligibility.items
      .map(function (item) {
        return (
          '<div class="eligibility-card">' +
          '<span class="eligibility-card__icon"><svg width="32" height="32"><use href="#guide-icon-' + item.icon + '"></use></svg></span>' +
          '<p class="eligibility-card__text">' + item.text + "</p>" +
          "</div>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  /* ------------------------------------------------------------------------
     3. ③ご利用開始までの流れの描画(このページのメインコンテンツ)
     ------------------------------------------------------------------------ */
  function renderSteps(guideData) {
    var containerEl = document.querySelector(".js-steps");
    if (!containerEl || !guideData.steps) return;

    var html = guideData.steps
      .map(function (step, index) {
        return (
          '<li class="step-item">' +
          '<span class="step-item__icon"><svg width="36" height="36"><use href="#guide-icon-' + step.icon + '"></use></svg></span>' +
          '<span class="step-item__number">STEP ' + (index + 1) + "</span>" +
          '<p class="step-item__title">' + step.title + "</p>" +
          '<p class="step-item__text">' + step.text + "</p>" +
          "</li>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  /* ------------------------------------------------------------------------
     4. ⑤よくある質問の描画
     ------------------------------------------------------------------------
     開閉には<details>/<summary>というHTML標準のタグを使う。
     JavaScriptで開閉のクリック処理を書かなくても、ブラウザが標準で
     アコーディオンの開閉を行ってくれるため、シンプルで壊れにくい。 */
  function renderFaq(guideData) {
    var containerEl = document.querySelector(".js-faq");
    if (!containerEl || !guideData.faq) return;

    var html = guideData.faq
      .map(function (item) {
        return (
          '<details class="faq-item">' +
          '<summary class="faq-item__question">Q. ' + item.q + "</summary>" +
          '<p class="faq-item__answer">A. ' + item.a + "</p>" +
          "</details>"
        );
      })
      .join("");

    containerEl.innerHTML = html;
  }

  /* ------------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    loadGuideData();
  });
})();
