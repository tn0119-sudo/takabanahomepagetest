/* ==========================================================================
   about.js

   【このファイルの役割】
   施設についてページ(about.html)だけで使うJavaScript。
   data/about.json を読み込み、各セクションの中身を描画する。

   共通処理(ヘッダーのスクロール検知・site.jsonの読み込みなど)は
   common.js が担当しているため、このファイルは
   「about.json の内容をどう画面に表示するか」だけに専念している。
   （考え方はrehab.jsと同じ。ページが増えるたびに、この形をコピーして使う） */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     0. 共通ヘルパー
     ------------------------------------------------------------------------
     about.json は "hero.title" のように階層を持つデータのため、
     ドット区切りの文字列から値を取り出す関数を用意する。 */
  function getValueByPath(data, path) {
    return path.split(".").reduce(function (value, key) {
      return value && value[key] !== undefined ? value[key] : undefined;
    }, data);
  }

  /* ------------------------------------------------------------------------
     1. about.json の読み込み
     ------------------------------------------------------------------------ */
  function loadAboutData() {
    fetch("data/about.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("about.jsonの読み込みに失敗しました: " + response.status);
        }
        return response.json();
      })
      .then(function (aboutData) {
        applyAboutData(aboutData);
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  function applyAboutData(aboutData) {
    // data-about="hero.title" のような属性を持つ要素すべてに、
    // 対応するテキストを流し込む(common.jsのdata-site属性と同じ考え方)。
    document.querySelectorAll("[data-about]").forEach(function (el) {
      var path = el.getAttribute("data-about");
      var value = getValueByPath(aboutData, path);
      if (value !== undefined) {
        el.textContent = value;
      }
    });

    // ファーストビューの背景写真
    var heroImageEl = document.querySelector(".js-about-hero-image");
    if (heroImageEl && aboutData.hero && aboutData.hero.image) {
      heroImageEl.style.backgroundImage = "url('" + aboutData.hero.image + "')";
    }

    renderConceptText(aboutData);
    renderGallery(aboutData);
    renderBusinessHours(aboutData);
  }

  /* ------------------------------------------------------------------------
     2. ②コンセプト紹介:文章と写真の描画
     ------------------------------------------------------------------------
     箇条書きのポイントではなく、自然な文章の流れとして見せるため、
     paragraphsを順番に並べ、2つ目の段落のあとに大きめの写真を1枚挟む。
     (段落が1つしかない場合は、最後の段落のあとに写真を差し込む) */
  function renderConceptText(aboutData) {
    var containerEl = document.querySelector(".js-concept-text");
    if (!containerEl || !aboutData.concept || !aboutData.concept.paragraphs) return;

    var paragraphs = aboutData.concept.paragraphs;
    var photoPath = aboutData.concept.photo;
    var photoAfterIndex = Math.min(1, paragraphs.length - 1);

    var html = paragraphs
      .map(function (text, index) {
        var paragraphHtml = '<p class="concept__paragraph">' + text + "</p>";
        if (photoPath && index === photoAfterIndex) {
          paragraphHtml +=
            '<div class="concept__photo" style="background-image: url(\'' + photoPath + "');\"></div>";
        }
        return paragraphHtml;
      })
      .join("");

    containerEl.innerHTML = html;
  }

  /* ------------------------------------------------------------------------
     3. ③写真ギャラリーの描画
     ------------------------------------------------------------------------
     「一覧で並べる」のではなく、大きな写真を主役にして見せるため、
     大きな写真→説明文→横並びの写真、という順番で組み立てる。 */
  function renderGallery(aboutData) {
    var containerEl = document.querySelector(".js-gallery");
    if (!containerEl || !aboutData.gallery) return;

    var gallery = aboutData.gallery;
    var subImagesHtml = (gallery.subImages || [])
      .map(function (imagePath) {
        return '<div class="gallery-sub-item" style="background-image: url(\'' + imagePath + "');\"></div>";
      })
      .join("");

    // gallery-mainは今後、写真ではなく縦長(9:16)動画を表示する場所として使う。
    // images/about/gallery-main.mp4 を差し替えるだけで表示内容を変更できるように、
    // <video>を data/about.json の gallery.mainVideo から描画する。
    containerEl.innerHTML =
      '<div class="gallery-main">' +
        '<video class="gallery-main__video" src="' + gallery.mainVideo + '" autoplay muted loop playsinline></video>' +
      '</div>' +
      '<p class="gallery-caption">' + gallery.caption + "</p>" +
      '<div class="gallery-sub">' + subImagesHtml + "</div>";
  }

  /* ------------------------------------------------------------------------
     4. ④営業時間カードの描画
     ------------------------------------------------------------------------
     カード自体の組み立ては、common.js の共通ヘルパーに任せている
     (他のページでも同じ形のカードを使うため)。 */
  function renderBusinessHours(aboutData) {
    var containerEl = document.querySelector(".js-business-hours");
    window.SiteUtils.renderInfoCards(containerEl, aboutData.businessHoursCards);
  }

  /* ------------------------------------------------------------------------
     初期化
     ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    loadAboutData();
  });
})();
