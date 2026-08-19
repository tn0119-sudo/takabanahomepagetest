/* ==========================================================================
   rehab.js

   【このファイルの役割】
   リハビリ紹介ページ(rehab.html)だけで使うJavaScript。
   data/rehab.json を読み込み、各セクションの中身を描画する。

   全ページ共通の処理(ヘッダーのスクロール検知・site.jsonの読み込みなど)は
   common.js が担当しているため、このファイルは
   「rehab.json の内容をどう画面に表示するか」だけに専念している。
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     0. 共通ヘルパー
     ------------------------------------------------------------------------
     rehab.json は "hero.title" のように階層を持つデータのため、
     "hero.title" のようなドット区切りの文字列から値を取り出す関数を用意する。 */
  function getValueByPath(data, path) {
    return path.split(".").reduce(function (value, key) {
      return value && value[key] !== undefined ? value[key] : undefined;
    }, data);
  }

  /* ------------------------------------------------------------------------
     1. rehab.json の読み込み
     ------------------------------------------------------------------------ */
  function loadRehabData() {
    fetch("data/rehab.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("rehab.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (rehabData) {
        applyRehabData(rehabData);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function applyRehabData(rehabData) {
    // data-rehab="hero.title" のような属性を持つ要素すべてに、
    // 対応するテキストを流し込む(common.jsのdata-site属性と同じ考え方)。
    document.querySelectorAll("[data-rehab]").forEach(function (el) {
      var path = el.getAttribute("data-rehab");
      var value = getValueByPath(rehabData, path);
      if (value !== undefined) {
        el.textContent = value;
      }
    });

    // ファーストビューの背景写真
    var heroImageEl = document.querySelector(".js-rehab-hero-image");
    if (heroImageEl && rehabData.hero && rehabData.hero.image) {
      heroImageEl.style.backgroundImage = "url('" + rehabData.hero.image + "')";
    }

    renderTechniqueExtras(rehabData);
    renderProfessionals(rehabData);
  }

  /* ------------------------------------------------------------------------
     2. ③④⑤マシントレーニング/レッドコード/個別リハビリ・マッサージの描画
     ------------------------------------------------------------------------
     タイトルと説明文は data-rehab="techniques.0.title" のような属性で
     (0. の共通ヘルパーによって)すでに反映されている。
     ここでは、data-rehabの仕組みでは表現できない「写真の背景設定」と
     「タグ一覧(items)の描画」だけを担当する。
     各要素の data-technique-index 属性(0/1/2)で、
     rehab.json の techniques配列の何番目を使うかを対応させている。 */
  function renderTechniqueExtras(rehabData) {
    if (!rehabData.techniques) return;

    document.querySelectorAll(".js-technique-image").forEach(function (el) {
      var index = parseInt(el.getAttribute("data-technique-index"), 10);
      var technique = rehabData.techniques[index];
      if (technique && technique.image) {
        el.style.backgroundImage = "url('" + technique.image + "')";
      }
    });

    document.querySelectorAll(".js-technique-items").forEach(function (el) {
      var index = parseInt(el.getAttribute("data-technique-index"), 10);
      var technique = rehabData.techniques[index];
      if (technique && technique.items) {
        el.innerHTML = technique.items
          .map(function (item) {
            return "<li>" + item + "</li>";
          })
          .join("");
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. ⑥専門職紹介の描画
     ------------------------------------------------------------------------
     役割の違い(病院/接骨院など)を強調するのではなく、
     「国家資格を持つ専門職が在籍している」という安心感を
     写真+資格名+説明文のひとまとまりとして伝える。 */
  function renderProfessionals(rehabData) {
    var containerEl = document.querySelector(".js-professionals-content");
    if (!containerEl || !rehabData.professionals) return;

    var professionals = rehabData.professionals;
    var qualificationsHtml = (professionals.qualifications || [])
      .map(function (qualification) {
        return "<li>" + qualification + "</li>";
      })
      .join("");

    containerEl.innerHTML =
      '<div class="professionals__image" style="background-image: url(\'' + professionals.image + "');\"></div>" +
      '<div class="professionals__body">' +
      '<ul class="professionals__qualifications tag-list">' + qualificationsHtml + "</ul>" +
      '<p class="professionals__text">' + professionals.text + "</p>" +
      "</div>";
  }

  /* ------------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    loadRehabData();
  });
})();
