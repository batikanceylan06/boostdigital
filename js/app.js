(function () {
  document.documentElement.classList.add("has-js");

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(id) { return document.getElementById(id); }

  // Year
  var yearEl = byId("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Active nav highlight
  (function(){
    var path = (window.location && window.location.pathname) ? window.location.pathname.split("/").pop() : "";
    if (!path) path = "index.html";
    var links = qsa(".menu a[data-nav], .mobile__inner a[data-nav]");
    for (var i=0;i<links.length;i++){
      var href = links[i].getAttribute("href") || "";
      if (href === path) links[i].classList.add("active");
    }
  })();

  // Mobile menu
  var burger = byId("burger");
  var mobile = byId("mobile");
  function toggleMenu(force) {
    if (!burger || !mobile) return;
    var expanded = (typeof force === "boolean") ? force : (burger.getAttribute("aria-expanded") !== "true");
    burger.setAttribute("aria-expanded", expanded ? "true" : "false");
    mobile.hidden = !expanded;
  }
  if (burger && mobile) {
    burger.addEventListener("click", function () { toggleMenu(); });
    mobile.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (a) toggleMenu(false);
    });
  }

  // Page transition overlay
  var overlay = byId("transition");
  function showOverlay() {
    if (!overlay) return;
    overlay.classList.add("is-on");
    overlay.setAttribute("aria-hidden", "false");
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove("is-on");
    overlay.setAttribute("aria-hidden", "true");
  }
  window.addEventListener("pageshow", hideOverlay);

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[data-nav]") : null;
    if (!a) return;

    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return;
    if (/^https?:\/\//i.test(href)) return;

    e.preventDefault();
    showOverlay();
    toggleMenu(false);
    setTimeout(function () { window.location.href = href; }, 220);
  });

  // Reveal (never hides content)
  (function initReveal(){
    var els = qsa(".reveal");
    if (!els.length) return;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add("is-visible");
            io.unobserve(entries[i].target);
          }
        }
      }, { threshold: 0.12 });
      for (var j = 0; j < els.length; j++) io.observe(els[j]);
    } else {
      for (var k = 0; k < els.length; k++) els[k].classList.add("is-visible");
    }
  })();

  // Marquee: seamless infinite (no gap) using CSS var distance
  function setMarqueeVars(){
    var tracks = qsa(".logoMarquee__track[data-marquee]");
    if (!tracks.length) return;
    for (var i=0;i<tracks.length;i++){
      var t = tracks[i];
      if (t.getAttribute("data-duped") !== "1"){
        t.innerHTML = t.innerHTML + t.innerHTML;
        t.setAttribute("data-duped","1");
      }
      // half width after duplication
      var half = Math.floor(t.scrollWidth / 2);
      if (half > 0){
        t.style.setProperty("--marquee-distance", half + "px");
        // speed: ~90px/s
        var duration = Math.max(10, half / 90);
        t.style.animationDuration = duration + "s";
      }
    }
  }
  // run after fonts/layout settle
  window.addEventListener("load", function(){ setMarqueeVars(); setTimeout(setMarqueeVars, 250); });



  // ToTop button
  (function(){
    var btn = byId("toTop");
    if (!btn) return;
    function onScroll(){
      if (window.scrollY > 480) btn.classList.add("is-on"); else btn.classList.remove("is-on");
    }
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
    btn.addEventListener("click", function(){ window.scrollTo({ top: 0, behavior: "smooth" }); });
  })();

  // Quickbar actions
  (function(){
    var qb = byId("quickbar");
    if (!qb) return;
    qb.addEventListener("click", function(e){
      var pick = e.target && e.target.closest ? e.target.closest("button[data-pick]") : null;
      var nav = e.target && e.target.closest ? e.target.closest("button[data-nav]") : null;
      var chat = e.target && e.target.closest ? e.target.closest("button[data-chat]") : null;

      if (pick){
        var val = pick.getAttribute("data-pick") || "";
        var url = "teklif-formu.html?product=" + encodeURIComponent(val);
        showOverlay();
        setTimeout(function(){ window.location.href = url; }, 220);
      } else if (nav){
        var href = nav.getAttribute("data-href") || "teklif-formu.html";
        showOverlay();
        setTimeout(function(){ window.location.href = href; }, 220);
      } else if (chat){
        openChat();
      }
    });
  })();

  // Pricing filter + select buttons + meta chips
  (function initPricing(){
    var search = byId("priceSearch");
    var filterBtns = qsa(".chipBtn2");
    var rows = qsa(".priceRow");
    if (!search && !filterBtns.length && !rows.length) return;

    function getActiveFilter() {
      for (var i = 0; i < filterBtns.length; i++) {
        if (filterBtns[i].classList.contains("is-active")) {
          return (filterBtns[i].getAttribute("data-filter") || "all").toLowerCase();
        }
      }
      return "all";
    }

    function applyFilter() {
      var q = (search ? search.value : "").toLowerCase().trim();
      var active = getActiveFilter();

      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        var nameEl = qs(".priceRow__name", row);
        var name = (nameEl ? nameEl.textContent : "").toLowerCase();
        var cat = (row.getAttribute("data-cat") || "").toLowerCase();

        var okText = (!q) || (name.indexOf(q) !== -1);
        var okCat = (active === "all") || (cat === active);
        row.style.display = (okText && okCat) ? "flex" : "none";
      }

      // Hide empty sections
      var secs = qsa(".priceSection");
      for (var s = 0; s < secs.length; s++) {
        var secRows = qsa(".priceRow", secs[s]);
        var any = false;
        for (var rr = 0; rr < secRows.length; rr++) {
          if (secRows[rr].style.display !== "none") { any = true; break; }
        }
        secs[s].style.display = any ? "" : "none";
      }
    }

    if (search) search.addEventListener("input", applyFilter);
    for (var b = 0; b < filterBtns.length; b++) {
      (function(btn){
        btn.addEventListener("click", function(){
          for (var i = 0; i < filterBtns.length; i++) filterBtns[i].classList.remove("is-active");
          btn.classList.add("is-active");
          applyFilter();
        });
      })(filterBtns[b]);
    }

    // Select button -> teklif formu prefill
    document.addEventListener("click", function(e){
      var btn = e.target && e.target.closest ? e.target.closest("button[data-select]") : null;
      if (!btn) return;
      var product = btn.getAttribute("data-select") || "";
      var url = "teklif-formu.html?product=" + encodeURIComponent(product);
      showOverlay();
      setTimeout(function(){ window.location.href = url; }, 220);
    });

    // Meta chips (what you get)
    function chips(list){
      return list.map(function(t){ return '<span class="metaChip">'+t+'</span>'; }).join("");
    }
    function setMeta(row, list){
      var meta = qs(".priceRow__meta", row);
      if (!meta) return;
      meta.innerHTML = chips(list);
      meta.setAttribute("aria-hidden", "false");
    }

    for (var i=0;i<rows.length;i++){
      var name = (qs(".priceRow__name", rows[i]) ? qs(".priceRow__name", rows[i]).textContent : "");
      var n = name.toLowerCase();

      if (n.indexOf("logo tasarım") !== -1){
        setMeta(rows[i], ["AI/SVG", "PNG", "Mockup", "Kullanım rehberi"]);
      }
      if (n.indexOf("kurumsal kimlik") !== -1){
        setMeta(rows[i], ["Kartvizit", "Antetli", "Mail imza", "Renk/Font"]);
      }
      if (n.indexOf("banner tasarım paketi") !== -1){
        setMeta(rows[i], ["Ölçüler", "PNG/JPG", "2 varyasyon", "Hızlı teslim"]);
      }
      if (n.indexOf("kurumsal web") !== -1 || n.indexOf("landing") !== -1){
        setMeta(rows[i], ["Mobil uyum", "Hız", "SEO", "Form/WhatsApp"]);
      }
      if (n.indexOf("e‑ticaret") !== -1 || n.indexOf("e-ticaret") !== -1){
        setMeta(rows[i], ["Ödeme/Kargo", "Ürün yükleme", "Tema", "Temel SEO"]);
      }
      if (n.indexOf("randevu") !== -1 || n.indexOf("rezervasyon") !== -1){
        setMeta(rows[i], ["Takvim", "Onay", "WhatsApp", "Panel"]);
      }
      if (n.indexOf("katalog") !== -1){
        setMeta(rows[i], ["Baskı hazır PDF", "Sayfa düzen", "Kapak", "Revize"]);
      }
      if (n.indexOf("afiş") !== -1 || n.indexOf("poster") !== -1 || n.indexOf("billboard") !== -1){
        setMeta(rows[i], ["Baskı ölçü", "CMYK", "PDF", "Yüksek çözünürlük"]);
      }
    }

    applyFilter();
  })();

  
  // Custom select (dark themed) for product picker
  function initCustomSelect(){
    var sel = byId("productSelect");
    var btn = byId("csBtn");
    var btnText = byId("csBtnText");
    var panel = byId("csPanel");
    var list = byId("csList");
    var search = byId("csSearch");
    if (!sel || !btn || !btnText || !panel || !list || !search) return;

    function parseOptionText(t){
      // Expected "Name — Price"
      var s = String(t || "").trim();
      var parts = s.split("—");
      if (parts.length >= 2){
        var name = parts.slice(0, parts.length-1).join("—").trim();
        var price = parts[parts.length-1].trim();
        return { name:name, price:price };
      }
      return { name:s, price:"" };
    }

    var options = [];
    for (var i=0;i<sel.options.length;i++){
      var o = sel.options[i];
      if (!o.value) continue;
      var parsed = parseOptionText(o.textContent || o.value);
      options.push({ value:o.value, name: parsed.name, price: parsed.price });
    }

    function render(filter){
      var q = (filter || "").toLowerCase().trim();
      list.innerHTML = "";
      var shown = 0;

      for (var i=0;i<options.length;i++){
        var it = options[i];
        var hay = (it.name + " " + it.price).toLowerCase();
        if (q && hay.indexOf(q) === -1) continue;

        var div = document.createElement("div");
        div.className = "cs__opt" + (sel.value === it.value ? " is-active" : "");
        div.setAttribute("role", "option");
        div.setAttribute("data-value", it.value);

        var left = document.createElement("div");
        left.className = "cs__optName";
        left.textContent = it.name;

        var right = document.createElement("div");
        right.className = "cs__optPrice";
        right.textContent = it.price || "";

        div.appendChild(left);
        div.appendChild(right);

        div.addEventListener("click", function(e){
          var v = this.getAttribute("data-value") || "";
          sel.value = v;

          // Update button text
          var parsed = parseOptionText(v);
          btnText.textContent = parsed.name + " — " + parsed.price;

          // close
          closePanel();
          render(search.value);
        });

        list.appendChild(div);
        shown++;
      }

      if (shown === 0){
        var empty = document.createElement("div");
        empty.className = "cs__empty";
        empty.textContent = "Sonuç bulunamadı.";
        list.appendChild(empty);
      }
    }

    function openPanel(){
      panel.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      setTimeout(function(){ search.focus(); }, 0);
      render(search.value);
    }
    function closePanel(){
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
    function togglePanel(){
      if (panel.hidden) openPanel(); else closePanel();
    }

    btn.addEventListener("click", function(){ togglePanel(); });
    search.addEventListener("input", function(){ render(search.value); });

    // Click outside closes
    document.addEventListener("click", function(e){
      if (panel.hidden) return;
      var picker = byId("productPicker");
      if (!picker) return;
      if (picker.contains(e.target)) return;
      closePanel();
    });

    // ESC closes
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && !panel.hidden) closePanel();
    });

    // Initialize button text from current select value (or placeholder)
    function syncFromSelect(){
      if (!sel.value){
        btnText.textContent = "Seçiniz…";
        return;
      }
      btnText.textContent = sel.value;
    }
    syncFromSelect();
    render("");

    // Expose sync (used by prefill)
    window.__syncProductPicker = function(){
      // set button text to selected option
      if (!sel.value){
        btnText.textContent = "Seçiniz…";
        return;
      }
      btnText.textContent = sel.value;
      render(search.value);
    };
  }

// Prefill offer form product from URL
  (function initPrefill(){
    var sel = byId("productSelect");
    if (!sel) return;
    var params = new URLSearchParams(window.location.search || "");
    var prod = params.get("product");
    if (prod){
      // try exact match
      for (var i=0;i<sel.options.length;i++){
        if (sel.options[i].value === prod){
          sel.selectedIndex = i;
          break;
        }
      }
      // fallback: contains
      if (sel.value !== prod){
        for (var j=0;j<sel.options.length;j++){
          if ((sel.options[j].value || "").indexOf(prod) !== -1){
            sel.selectedIndex = j;
            break;
          }
        }
      }
    }

    // deadline pills
    var wrap = qs(".deadlinePills");
    var input = byId("deadlineInput");
    if (wrap && input){
      wrap.addEventListener("click", function(e){
        var b = e.target && e.target.closest ? e.target.closest("button[data-deadline]") : null;
        if (!b) return;
        input.value = b.getAttribute("data-deadline") || "";
      });
    }
  })();

  initCustomSelect();


  // Lead sender (no mail app)
  function sendLead(payload) {
    return fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    }).then(function (r) {
      return r.json().catch(function(){ return { ok:false, error:"Yanıt okunamadı" }; })
        .then(function (j) {
          if (!r.ok || !j || !j.ok) throw new Error((j && j.error) ? j.error : "Gönderilemedi");
          return true;
        });
    });
  }

  // Success modal
  function openModal(){
    var m = byId("successModal");
    if (!m) return;
    m.hidden = false;
  }
  function closeModal(){
    var m = byId("successModal");
    if (!m) return;
    m.hidden = true;
  }
  document.addEventListener("click", function(e){
    var t = e.target;
    if (!t) return;
    var c = t.closest ? t.closest("[data-close]") : null;
    if (c) closeModal();
  });

  // Chatbot (professional: typing + cart + confirm)
  var chatFab = byId("chatFab");
  var chat = byId("chat");
  var chatClose = byId("chatClose");
  var chatBody = byId("chatBody");
  var chatActions = byId("chatActions");
  var chatSub = byId("chatSub");
var state = {
    step: 0,
    answers: { hizmet:"", teslim:"", butce:"", ad:"", telefon:"", email:"", not:"" },
    customHizmet: ""
  };

  function addMsg(text, who) {
    if (!chatBody) return;
    var div = document.createElement("div");
    div.className = "msg " + (who === "me" ? "msg--me" : "msg--bot");
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }

  function typing(delay){
    var bubble = addMsg("", "bot");
    if (bubble){
      bubble.textContent = "";
      var wrap = document.createElement("span");
      wrap.className = "typing";
      for (var i=0;i<3;i++){
        var d = document.createElement("span");
        d.className = "typingDot";
        wrap.appendChild(d);
      }
      bubble.appendChild(wrap);
    }
    return new Promise(function(resolve){
      setTimeout(function(){
        if (bubble && bubble.parentNode) bubble.parentNode.removeChild(bubble);
        resolve();
      }, delay || 550);
    });
  }

  function setActions(html) {
    if (!chatActions) return;
    chatActions.innerHTML = html;
  }

  function resetChat() {
    state.step = 0;
    state.answers = { hizmet:"", teslim:"", butce:"", ad:"", telefon:"", email:"", not:"" };
    state.customHizmet = "";
    if (chatBody) chatBody.innerHTML = "";
    if (chatSub) chatSub.textContent = "İhtiyacınızı netleştirelim.";
    addMsg("Merhaba 👋 Size en doğru teklifi hazırlamak için 4 kısa soru soracağım.", "bot");
    ask0();
  }

  function openChat() {
    if (!chat) return;
    chat.hidden = false;
    if (chatBody && chatBody.children.length === 0) resetChat();
  }
  function closeChat() { if (chat) chat.hidden = true; }


  if (chatFab) chatFab.addEventListener("click", function () {
    if (chat && !chat.hidden) closeChat(); else openChat();
  });
  if (chatClose) chatClose.addEventListener("click", closeChat);

  function ask0() {
    state.step = 0;
    typing(400).then(function(){
      addMsg("Hangi hizmeti istiyorsunuz?", "bot");
      var picks = [
        "Logo Tasarım (paket)",
        "Kurumsal Kimlik",
        "Logo + Kurumsal Kimlik",
        "Banner Tasarım Paketi",
        "Web Site / Landing",
        "Online Randevu / Rezervasyon",
        "E‑Ticaret Site",
        "Katalog Tasarımı",
        "Diğer (yazacağım)"
      ];
      setActions(picks.map(function(p){ return '<button class="chipBtn" data-choice="'+p+'">'+p+'</button>'; }).join(""));
    });
  }

  function ask1() {
    state.step = 1;
    typing(380).then(function(){
      addMsg("Teslim hedefiniz nedir?", "bot");
      var picks = ["3 gün", "1 hafta", "2 hafta", "Esnek"];
      setActions(picks.map(function(p){ return '<button class="chipBtn" data-choice="'+p+'">'+p+'</button>'; }).join(""));
    });
  }

  function ask2() {
    state.step = 2;
    typing(380).then(function(){
      addMsg("Bütçe aralığınız nedir? (yaklaşık)", "bot");
      var picks = ["3.000–8.000", "8.000–15.000", "15.000–30.000", "30.000+"];
      setActions(picks.map(function(p){ return '<button class="chipBtn" data-choice="'+p+'">'+p+'</button>'; }).join(""));
    });
  }

  function ask3() {
    state.step = 3;
    typing(380).then(function(){
      addMsg("İletişim bilgilerinizi alayım: ad soyad, telefon, e‑posta", "bot");
      setActions(
        '<div class="chatForm">' +
          '<input class="chatInput" id="cName" placeholder="Ad Soyad" />' +
          '<input class="chatInput" id="cPhone" placeholder="Telefon" />' +
          '<input class="chatInput" id="cEmail" placeholder="E-posta" />' +
          '<textarea class="chatInput chatInput--ta" id="cNote" rows="3" placeholder="Kısa not (isteğe bağlı)"></textarea>' +
          '<button class="chipBtn" data-submit="contact">Devam</button>' +
        '</div>'
      );
    });
  }

  function parseTL(s){
    var m = String(s || "").replace(/\./g,"").match(/(\d+)\s*TL/i);
    return m ? parseInt(m[1], 10) : 0;
  }
  function formatTL(n){
    try { return n.toLocaleString("tr-TR") + " TL"; } catch(e){ return String(n) + " TL"; }
  }

  function recommendationItems(){
    var h = (state.answers.hizmet || "").toLowerCase();
    var items = [];

    function add(name, price){ items.push({ name:name, price:price }); }

    if (h.indexOf("logo +") !== -1) {
      add("Logo ve Kurumsal Kimlik Tasarımı - Standart Paket", "20.000 TL");
      add("Kartvizit (opsiyonel)", "1.500–3.000 TL");
      add("Banner paketi (opsiyonel)", "9.000 TL+");
    } else if (h.indexOf("kurumsal") !== -1) {
      add("Kurumsal Kimlik Tasarımı - Standart Paket", "12.000 TL");
      add("Kartvizit (opsiyonel)", "1.500–3.000 TL");
    } else if (h.indexOf("banner") !== -1) {
      add("Small Banner Paketi (10 adet)", "9.000 TL");
      add("Medium Banner Paketi (20 adet)", "15.000 TL");
    } else if (h.indexOf("randevu") !== -1 || h.indexOf("rezerv") !== -1) {
      add("Online Randevu / Rezervasyon Sitesi", "65.000 TL");
      add("Çok dilli paket (opsiyonel)", "15.000 TL");
    } else if (h.indexOf("ticaret") !== -1 || h.indexOf("eticaret") !== -1) {
      add("E‑Ticaret (Başlangıç) — 30 ürün", "125.000 TL");
      add("E‑Ticaret (Gelişmiş) — 100 ürün", "175.000 TL");
    } else if (h.indexOf("web") !== -1 || h.indexOf("landing") !== -1) {
      add("Landing Page (Tek sayfa)", "18.000 TL");
      add("Kurumsal Web Site (5 sayfa)", "35.000 TL");
      add("Aylık bakım (opsiyonel)", "4.000 TL");
    } else if (h.indexOf("katalog") !== -1) {
      add("Katalog ( 8 Sayfa )", "15.000 TL");
      add("Katalog Ön/Arka Kapak Tasarımı", "5.000 TL");
    } else if (h.indexOf("logo") !== -1) {
      add("Logo Tasarım Standart Paket", "8.000 TL");
      add("Logo Tasarım Elit Paket", "12.000 TL");
    } else {
      add("İhtiyaca göre paket", "—");
    }
    return items;
  }

  function summaryStep() {
    state.step = 4;
    typing(500).then(function(){
      addMsg("Tamamdır ✅ Size mantıklı bir “sepet” çıkardım:", "bot");
      var items = recommendationItems();

      var total = 0;
      for (var i=0;i<items.length;i++){
        var p = parseTL(items[i].price);
        if (p) total += p;
      }

      for (var j=0;j<items.length;j++){
        addMsg("• " + items[j].name + " — " + items[j].price, "bot");
      }
      if (total > 0) addMsg("Tahmini toplam (baz kalemler): " + formatTL(total), "bot");

      addMsg("İsterseniz bu talebi bize iletelim. (Mail uygulaması açmadan gönderir)", "bot");
      addMsg("Talebi göndereyim mi?", "bot");
      setActions(
        '<button class="chipBtn" data-send="yes">Evet, gönder</button>' +
        '<button class="chipBtn" data-send="no">Hayır, şimdilik değil</button>' +
        '<button class="chipBtn" data-reset="1">Baştan başla</button>'
      );
    });
  }

  function submitChatLead() {
    var a = state.answers;
    var items = recommendationItems();
    var list = items.map(function(x){ return "- " + x.name + " — " + x.price; }).join("\n");
    var payload = {
      source: "chat",
      page: (window.location && window.location.pathname) ? window.location.pathname : "",
      hizmet: a.hizmet,
      teslim: a.teslim,
      butce: a.butce,
      ad: a.ad,
      telefon: a.telefon,
      email: a.email,
      not: a.not,
      message: "Önerilen sepet:\n" + list
    };

    addMsg("Gönderiyorum…", "bot");

    return sendLead(payload).then(function () {
      addMsg("Talebiniz bize ulaştı ✅ En kısa sürede dönüş yapacağız.", "bot");
      setActions('<button class="chipBtn" data-reset="1">Yeni talep</button>');
    }).catch(function (err) {
      addMsg("Gönderim başarısız: " + (err && err.message ? err.message : err), "bot");
      addMsg("Not: Bu özellik yayında (Vercel) çalışır. Lokal dosyada API olmaz.", "bot");
      setActions('<a class="chipBtn" href="teklif-formu.html">Proje Talep Formu</a>');
    });
  }

  if (chatActions) {
    chatActions.addEventListener("click", function (e) {
      var btnChoice = e.target && e.target.closest ? e.target.closest("button[data-choice]") : null;
      var btnSend = e.target && e.target.closest ? e.target.closest("button[data-send]") : null;
      var btnSubmit = e.target && e.target.closest ? e.target.closest("button[data-submit]") : null;
      var btnReset = e.target && e.target.closest ? e.target.closest("button[data-reset]") : null;

      if (btnReset) { resetChat(); return; }

      if (btnChoice) {
        var choice = btnChoice.getAttribute("data-choice") || "";
        addMsg(choice, "me");

        if (choice.indexOf("Diğer") !== -1){
          state.answers.hizmet = "Diğer";
          typing(350).then(function(){
            addMsg("Kısaca ne istiyorsunuz? (örn: afiş, etiket, menü…)", "bot");
            setActions(
              '<div class="chatForm">' +
                '<input class="chatInput" id="cCustom" placeholder="İhtiyacınızı yazın…" />' +
                '<button class="chipBtn" data-submit="custom">Devam</button>' +
              '</div>'
            );
          });
          return;
        }

        if (state.step === 0) { state.answers.hizmet = choice; ask1(); return; }
        if (state.step === 1) { state.answers.teslim = choice; ask2(); return; }
        if (state.step === 2) { state.answers.butce = choice; ask3(); return; }
        return;
      }

      if (btnSubmit) {
        var kind = btnSubmit.getAttribute("data-submit");
        if (kind === "custom"){
          var cEl = byId("cCustom");
          var v = cEl && cEl.value ? cEl.value.trim() : "";
          if (!v){ addMsg("Lütfen kısa bir açıklama yazın.", "bot"); return; }
          state.answers.hizmet = v;
          addMsg("Tamam: " + v, "me");
          ask1();
          return;
        }

        if (kind === "contact") {
          var nEl = byId("cName"), pEl = byId("cPhone"), mEl = byId("cEmail"), noteEl = byId("cNote");
          var n = nEl && nEl.value ? nEl.value.trim() : "";
          var p = pEl && pEl.value ? pEl.value.trim() : "";
          var m = mEl && mEl.value ? mEl.value.trim() : "";
          var note = noteEl && noteEl.value ? noteEl.value.trim() : "";

          if (!n || !p || !m) { addMsg("Lütfen ad, telefon ve e‑posta alanlarını doldurun.", "bot"); return; }

          state.answers.ad = n;
          state.answers.telefon = p;
          state.answers.email = m;
          state.answers.not = note;

          addMsg("Bilgileriniz alındı ✅", "bot");
          summaryStep();
          return;
        }
      }

      if (btnSend) {
        var yes = (btnSend.getAttribute("data-send") === "yes");
        if (yes) { addMsg("Evet, gönder", "me"); submitChatLead(); }
        else {
          addMsg("Hayır, şimdilik değil", "me");
          addMsg("Tamamdır. İsterseniz form üzerinden de iletebilirsiniz.", "bot");
          setActions('<a class="chipBtn" href="teklif-formu.html">Proje Talep Formu</a>');
        }
      }
    });
  }

  // Offer form submit -> API + success modal
  var form = byId("leadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var fd = new FormData(form);
      var product = String(fd.get("product") || "").trim();
      var name = String(fd.get("name") || "").trim();
      var email = String(fd.get("email") || "").trim();
      var phone = String(fd.get("phone") || "").trim();
      var deadline = String(fd.get("deadline") || "").trim();
      var message = String(fd.get("message") || "").trim();

      if (!product || !name || !email || !phone) {
        alert("Lütfen ürün seçimi, ad soyad, e-posta ve telefon alanlarını doldurun.");
        return;
      }

      var statusEl = byId("formStatus");
      if (statusEl) statusEl.textContent = "Gönderiliyor…";

      sendLead({
        source: "form",
        page: (window.location && window.location.pathname) ? window.location.pathname : "",
        product: product,
        deadline: deadline,
        ad: name,
        telefon: phone,
        email: email,
        message: message
      }).then(function () {
        if (statusEl) statusEl.textContent = "Talebiniz alındı ✅ En kısa sürede dönüş yapacağız.";
        openModal();
        form.reset();
      }).catch(function (err) {
        if (statusEl) statusEl.textContent = "Gönderim başarısız: " + (err && err.message ? err.message : err);
      });
    });
  }

})();
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape"){
      try{ if (chat && !chat.hidden) closeChat(); }catch(_){ }
      try{ var m = byId("successModal"); if (m && !m.hidden) m.hidden = true; }catch(_){ }
    }
  });
