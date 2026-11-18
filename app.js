(() => {
  const storageKey = "campus-stores.shift.v2";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  // `at` is minutes since Friday 00:00, so desk time and due times compare directly.
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      short: "Fri 3:45 pm",
      at: 945,
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      short: "Fri 7:30 pm",
      at: 1170,
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      short: "Sat 9:00 am",
      at: 1980,
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const times = [
    ["Fri 8 pm", 1200],
    ["Sat 9 am", 1980],
    ["Sat 10 am", 2040],
    ["Sat noon", 2160],
    ["Sat 5 pm", 2460],
  ];
  const timeAt = Object.fromEntries(times);
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const original = () => ({
    version: 2,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        holder: "Tara Shah",
        due: "Sat 10 am",
        expected: "Sat 10 am",
        back: false,
        returnedAt: null,
        returnedBy: "",
        log: [],
      },
    ],
    notes: [],
    editing: false,
    issueReq: "",
    checkin: "",
    lookup: "",
    formError: "",
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  let focusAfterPaint = "";

  // ---------- lookups ----------
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const openLoans = () => s.loans.filter((l) => !l.back);
  const now = () => shifts[s.phase].at;
  const typeOf = (l) => getAsset(l.asset).type;
  const isLate = (l) => !l.back && timeAt[l.expected] < now();
  const slipRange = (nums) =>
    nums.length === 1
      ? "slip L-" + nums[0]
      : "slips L-" + nums[0] + "–L-" + nums[nums.length - 1];

  function loanState(l) {
    if (l.back)
      return [
        "Returned " +
          shifts[l.returnedAt].short +
          (l.returnedBy ? " · " + l.returnedBy : ""),
        "good",
      ];
    const t = timeAt[l.expected];
    if (t < now()) return ["Overdue · due " + l.expected, "warn"];
    if (t === now()) return ["Due now", "warn"];
    return ["Due " + l.expected, ""];
  }
  // One line per approved item, with the slip that covers it (open first, else latest).
  function kitLines(r) {
    return r.items.map((type, i) => {
      const slips = s.loans.filter((l) => l.req === r.id && typeOf(l) === type);
      const open = slips.find((l) => !l.back);
      return { i, type, open, slip: open || slips[slips.length - 1] };
    });
  }
  function reqSummary(r) {
    const lines = kitLines(r);
    const open = lines.filter((x) => x.open);
    const late = open.filter((x) => isLate(x.open));
    const none = lines.filter((x) => !x.slip);
    if (late.length) return [late.length + " overdue", "warn"];
    if (open.length) return [open.length + " of " + lines.length + " out", ""];
    if (none.length === lines.length) return ["Not issued", ""];
    if (none.length) return [none.length + " not issued", ""];
    return ["All returned", "good"];
  }

  // ---------- markup helpers ----------
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list, chosen = "") =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === chosen ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right, extra = "") =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small>" +
    extra +
    "</div><div class=\"rowend\">" +
    right +
    "</div></div>";
  const badge = (t, kind = "") =>
    '<span class="tag' + (kind ? " " + kind : "") + '">' + esc(t) + "</span>";
  const select = (label, name, options, chosen = "", extra = "") =>
    "<label><span>" +
    label +
    '</span><select name="' +
    name +
    '" required>' +
    (chosen ? "" : '<option value="">Select…</option>') +
    opts(options, chosen) +
    "</select>" +
    extra +
    "</label>";
  const peopleOpts = people.map((p) => [p, p]);
  const timeOpts = times.map(([t]) => [t, t]);
  const formError = () =>
    s.formError
      ? '<p class="error" role="alert">' + esc(s.formError) + "</p>"
      : "";
  const custody = (l) =>
    l.holder === l.who
      ? "With " + l.holder
      : "With " + l.holder + " (collected by " + l.who + ")";
  const lastLog = (l) =>
    l.log.length
      ? '<small class="log">' +
        esc(shifts[l.log[l.log.length - 1].phase].short + " · " + l.log[l.log.length - 1].text) +
        "</small>"
      : "";

  // ---------- issue: the whole approved kit in one pass ----------
  function issueForm(r) {
    const lines = kitLines(r).filter((x) => !x.open);
    let html =
      '<form data-issue data-req="' +
      r.id +
      '" class="panel"><h3>Issue kit · ' +
      r.id +
      " " +
      esc(r.club) +
      '</h3><p class="hint">One slip is written for each ticked unit. Pick the unit you take off the shelf.</p>';
    if (!lines.length)
      return (
        html +
        "<p>Every approved item on this request is already on loan.</p>" +
        btn("Close", "cancel") +
        "</form>"
      );
    html += '<div class="lines">';
    for (const x of lines) {
      const avail = assets.filter(
        (a) => a.type === x.type && !a.repair && !out(a.id),
      );
      const away = assets.filter(
        (a) => a.type === x.type && (a.repair || out(a.id)),
      );
      const awayText = away
        .map((a) => a.id + (a.repair ? " is in the workshop" : " is on loan"))
        .join(" · ");
      html +=
        '<div class="line"><label class="check"><input type="checkbox" name="line" value="' +
        x.i +
        '"' +
        (avail.length && !x.slip ? " checked" : "") +
        (avail.length ? "" : " disabled") +
        "> <strong>" +
        esc(x.type) +
        "</strong></label>" +
        (avail.length
          ? '<select name="unit-' +
            x.i +
            '" aria-label="Unit for ' +
            esc(x.type) +
            '">' +
            opts(
              avail.map((a) => [
                a.id,
                a.id + " · " + a.model + " · shelf " + a.bin,
              ]),
            ) +
            "</select>"
          : '<span class="tag warn">None on the shelf</span>') +
        (awayText ? "<small>" + esc(awayText) + "</small>" : "") +
        "</div>";
    }
    return (
      html +
      '</div><div class="form">' +
      select("Collected by", "who", peopleOpts) +
      select(
        "Return by",
        "due",
        timeOpts,
        r.due,
        "<small>Approved return: " + esc(r.due) + "</small>",
      ) +
      "</div>" +
      formError() +
      '<div class="buttons"><button type="submit" class="primary">Issue ticked units</button>' +
      btn("Cancel", "cancel") +
      "</div></form>"
    );
  }

  // ---------- check-in: account for every unit, record who has what's still out ----------
  function checkinForm(r) {
    const open = s.loans.filter((l) => l.req === r.id && !l.back);
    let html =
      '<form data-checkin data-req="' +
      r.id +
      '" class="panel"><h3>Check in · ' +
      r.id +
      " " +
      esc(r.club) +
      '</h3><p class="hint">Mark every unit on this request. Anything still out keeps an open slip in the name of whoever has it now, with the time they promised.</p><div class="form">' +
      select("Brought to the desk by", "by", peopleOpts, open[0].holder) +
      "</div>";
    for (const l of open) {
      const a = getAsset(l.asset);
      html +=
        '<fieldset class="unit"><legend><strong>' +
        a.id +
        " · " +
        esc(a.type) +
        "</strong> <small>" +
        esc(a.model) +
        " · slip L-" +
        l.num +
        " · " +
        esc(custody(l)) +
        '</small></legend><div class="choice"><label><input type="radio" name="st-' +
        l.num +
        '" value="back" required> Back at the desk</label><label><input type="radio" name="st-' +
        l.num +
        '" value="out"> Still out</label></div><div class="form stillout">' +
        select("Now with", "holder-" + l.num, peopleOpts, l.holder) +
        select("Expected back", "exp-" + l.num, timeOpts, l.expected) +
        "</div></fieldset>";
    }
    return (
      html +
      formError() +
      '<div class="buttons"><button type="submit" class="primary">Save check-in</button>' +
      btn("Cancel", "cancel") +
      "</div></form>"
    );
  }

  // ---------- pages ----------
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      const lines = kitLines(r);
      const canIssue = lines.some((x) => !x.slip);
      const anyOpen = lines.some((x) => x.open);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        r.id +
        " · Approved</small><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        "</p><p><b>Return by</b> " +
        esc(r.due) +
        "</p><p>" +
        esc(r.note) +
        '</p></div><h3 class="subhead">Approved kit</h3>';
      for (const x of lines) {
        const l = x.slip;
        const a = l && getAsset(l.asset);
        html += row(
          x.type,
          !l
            ? "Not issued yet"
            : a.id +
                " · " +
                a.model +
                " · slip L-" +
                l.num +
                (l.back ? "" : " · " + custody(l)),
          l ? badge(...loanState(l)) : badge("Not issued"),
        );
      }
      const editingHere = s.editing && s.issueReq === r.id;
      if (!editingHere && s.checkin !== r.id)
        html +=
          '<div class="buttons">' +
          (canIssue ? btn("Issue kit", "issue", r.id, "primary") : "") +
          (anyOpen
            ? btn("Check in returns", "checkin", r.id, canIssue ? "" : "primary")
            : "") +
          "</div>";
      if (editingHere) html += issueForm(r);
      if (s.checkin === r.id) html += checkinForm(r);
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club + " · Return by " + r.due,
            badge(...reqSummary(r)) + btn("View form", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const l = out(a.id);
      const status = a.repair ? "In repair" : l ? "On loan" : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model +
          " · shelf " +
          a.bin +
          (l
            ? " · L-" + l.num + " · " + l.holder + " · expected " + l.expected
            : ""),
        badge(
          l && isLate(l) ? "Overdue" : status,
          status === "On shelf" ? "good" : l && isLate(l) ? "warn" : "",
        ),
      );
    }
    return html;
  }
  function lookupCard() {
    if (!s.lookup) return "";
    const a = getAsset(s.lookup);
    if (!a)
      return (
        '<div class="panel warnpanel" role="alert"><p>No unit is tagged <b>' +
        esc(s.lookup) +
        "</b>. Read the tag again — it is on the underside of every unit.</p>" +
        btn("Clear", "clearlookup") +
        "</div>"
      );
    const l = out(a.id);
    if (!l) {
      const same = openLoans().filter((x) => typeOf(x) === a.type);
      return (
        '<div class="panel warnpanel" role="alert"><p><b>' +
        a.id +
        "</b> (" +
        esc(a.type) +
        ") has no open slip" +
        (a.repair
          ? " — it should be in the workshop."
          : " — it should already be on shelf " + esc(a.bin) + ".") +
        "</p>" +
        (same.length
          ? "<p>Open " +
            esc(a.type) +
            " slips: " +
            same
              .map(
                (x) =>
                  "<b>" +
                  x.asset +
                  "</b> on L-" +
                  x.num +
                  ", " +
                  esc(x.holder) +
                  " (" +
                  x.req +
                  ")",
              )
              .join("; ") +
            ". Check the tag before closing anything.</p>"
          : "") +
        btn("Clear", "clearlookup") +
        "</div>"
      );
    }
    const r = getReq(l.req);
    return (
      '<form data-return data-num="' +
      l.num +
      '" class="panel"><small>Slip L-' +
      l.num +
      " · " +
      l.req +
      " " +
      esc(r.club) +
      "</small><h3>" +
      a.id +
      " · " +
      esc(a.type) +
      "</h3><p>" +
      esc(a.model) +
      " · home shelf " +
      esc(a.bin) +
      "</p><p>" +
      esc(custody(l)) +
      " · " +
      badge(...loanState(l)) +
      "</p>" +
      lastLog(l) +
      '<div class="form">' +
      select("Handed in by", "by", peopleOpts, l.holder) +
      "</div>" +
      '<div class="buttons"><button type="submit" class="primary">Confirm ' +
      a.id +
      " is back · shelf " +
      esc(a.bin) +
      "</button>" +
      btn("Cancel", "clearlookup") +
      "</div></form>"
    );
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const r = getReq(s.issueReq);
      html +=
        '<div class="form"><label><span>Approved request</span><select data-pickreq required><option value="">Select…</option>' +
        opts(
          requests.map((x) => [x.id, x.id + " · " + x.club + " · " + x.event]),
          s.issueReq,
        ) +
        "</select></label></div>";
      return html + (r ? issueForm(r) : "");
    }
    html +=
      '<form data-lookup class="lookup"><label><span>Something handed back? Type the tag on the unit</span><input name="tag" list="tag-list" autocomplete="off" spellcheck="false" placeholder="e.g. PR-04" value="' +
      esc(s.lookup) +
      '" required></label><button type="submit">Find slip</button><datalist id="tag-list">' +
      opts(assets.map((a) => [a.id, a.type])) +
      "</datalist></form>" +
      lookupCard();
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) {
      const a = getAsset(l.asset);
      html += row(
        "L-" + l.num + " · " + a.id + " · " + a.type,
        l.req +
          " " +
          getReq(l.req).club +
          " · " +
          (l.back ? "Collected by " + l.who : custody(l)) +
          (l.back || l.expected === l.due
            ? ""
            : " · originally due " + l.due),
        badge(...loanState(l)) +
          (l.back ? "" : btn("Record return", "return", a.id)),
        l.back ? "" : lastLog(l),
      );
    }
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const open = openLoans();
    html +=
      '<div class="panel"><h3>Still out right now · ' +
      open.length +
      " unit" +
      (open.length === 1 ? "" : "s") +
      "</h3>" +
      (open.length
        ? open
            .map((l) =>
              row(
                l.asset + " · " + typeOf(l),
                l.req + " " + getReq(l.req).club + " · " + custody(l),
                badge(...loanState(l)),
              ),
            )
            .join("")
        : "<p>Nothing is out. Every slip is closed.</p>") +
      "</div>";
    const entries = [
      [
        0,
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        0,
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        0,
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([
        n.auto ? 1 : 0,
        shifts[n.phase].time,
        n.author || "Counter handover",
        n.text,
      ]);
    for (const [auto, t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record' +
        (auto ? " auto" : "") +
        '"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    const open = openLoans();
    const late = open.filter(isLate).length;
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg><span>' +
          n +
          "</span>" +
          (n === "Loan register" && open.length
            ? '<span class="count' +
              (late ? " late" : "") +
              '" title="' +
              open.length +
              " out" +
              (late ? ", " + late + " overdue" : "") +
              '">' +
              open.length +
              '<span class="sr"> out' +
              (late ? ", " + late + " overdue" : "") +
              "</span></span>"
            : "") +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
    if (focusAfterPaint) {
      const el = q(focusAfterPaint);
      if (el) el.focus();
      focusAfterPaint = "";
    }
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  function fail(msg) {
    s.formError = msg;
    paint();
    const e = q(".error");
    if (e) e.scrollIntoView({ block: "nearest" });
  }
  const closeForms = () => {
    s.editing = false;
    s.issueReq = "";
    s.checkin = "";
    s.formError = "";
  };
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.formError = "";
        s.notice = "Desk time is now " + shifts[s.phase].short + ".";
        break;
      case "tab":
        s.tab = v;
        s.lookup = "";
        closeForms();
        break;
      case "close":
        s.selected = "";
        closeForms();
        break;
      case "request":
        s.selected = v;
        closeForms();
        break;
      case "issue":
        closeForms();
        s.editing = true;
        s.issueReq = v;
        focusAfterPaint = "[data-issue] input, [data-issue] select";
        break;
      case "checkin":
        closeForms();
        s.checkin = v;
        focusAfterPaint = "[data-checkin] select";
        break;
      case "new":
        closeForms();
        s.editing = true;
        focusAfterPaint = "[data-pickreq]";
        break;
      case "cancel":
        closeForms();
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return":
        s.lookup = v;
        focusAfterPaint = "[data-return] button[type=submit]";
        break;
      case "clearlookup":
        s.lookup = "";
        focusAfterPaint = "[data-lookup] input";
        break;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
    if (e.target.matches("[data-pickreq]")) {
      s.issueReq = getReq(e.target.value) ? e.target.value : "";
      s.formError = "";
      focusAfterPaint = "[data-pickreq]";
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-lookup]")) {
      s.lookup = String(form.get("tag") || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
      focusAfterPaint = "[data-return] button[type=submit]";
      commit();
      return;
    }
    if (f.matches("[data-return]")) {
      const l = s.loans.find((x) => x.num === Number(f.dataset.num));
      const by = form.get("by");
      if (!l || l.back || !people.includes(by)) return;
      l.back = true;
      l.returnedAt = s.phase;
      l.returnedBy = by;
      l.log.push({ phase: s.phase, text: "Returned by " + by });
      const r = getReq(l.req);
      const left = s.loans.filter((x) => x.req === l.req && !x.back);
      s.notes.push({
        phase: s.phase,
        auto: true,
        author: "Return · " + l.req + " " + r.club,
        text:
          l.asset +
          " (" +
          typeOf(l) +
          ") handed in by " +
          by +
          ", slip L-" +
          l.num +
          " closed. " +
          (left.length
            ? "Still out on " + l.req + ": " + left.map((x) => x.asset + " with " + x.holder).join(", ") + "."
            : l.req + " kit is complete."),
      });
      s.lookup = "";
      focusAfterPaint = "[data-lookup] input";
      commit(
        l.asset +
          " back on shelf " +
          getAsset(l.asset).bin +
          ". Slip L-" +
          l.num +
          " closed." +
          (left.length ? "" : " " + l.req + " kit complete."),
      );
      return;
    }
    if (f.matches("[data-checkin]")) {
      const r = getReq(f.dataset.req);
      const by = form.get("by");
      const open = s.loans.filter((l) => l.req === r.id && !l.back);
      if (!people.includes(by)) return fail("Choose who brought the kit in.");
      const plan = [];
      for (const l of open) {
        const st = form.get("st-" + l.num);
        if (st !== "back" && st !== "out")
          return fail("Mark " + l.asset + " as back or still out.");
        const holder = form.get("holder-" + l.num);
        const exp = form.get("exp-" + l.num);
        if (st === "out" && (!people.includes(holder) || !timeAt[exp]))
          return fail("Say who has " + l.asset + " and when it is due back.");
        if (st === "out" && timeAt[exp] <= now())
          return fail(
            l.asset + " is still out, so its expected time must be later than " + shifts[s.phase].short + ".",
          );
        plan.push({ l, st, holder, exp });
      }
      const back = [],
        still = [];
      for (const { l, st, holder, exp } of plan) {
        if (st === "back") {
          l.back = true;
          l.returnedAt = s.phase;
          l.returnedBy = by;
          l.log.push({ phase: s.phase, text: "Returned by " + by });
          back.push(l);
        } else {
          const moved = holder !== l.holder;
          const later = exp !== l.expected;
          l.holder = holder;
          l.expected = exp;
          l.log.push({
            phase: s.phase,
            text:
              "Still out" +
              (moved ? " · now with " + holder : "") +
              (later ? " · expected " + exp : "") +
              " (told by " +
              by +
              ")",
          });
          still.push(l);
        }
      }
      s.notes.push({
        phase: s.phase,
        auto: true,
        author: "Check-in · " + r.id + " " + r.club,
        text:
          (back.length
            ? back.map((l) => l.asset).join(", ") + " returned by " + by + ". "
            : "Nothing returned. ") +
          (still.length
            ? "Still out: " +
              still
                .map(
                  (l) =>
                    l.asset +
                    " (" +
                    typeOf(l) +
                    ") with " +
                    l.holder +
                    ", expected " +
                    l.expected +
                    ", slip L-" +
                    l.num,
                )
                .join("; ") +
              "."
            : "Kit complete."),
      });
      closeForms();
      commit(
        (back.length ? back.length + " returned" : "Nothing returned") +
          (still.length
            ? " · " + still.map((l) => l.asset + " still out with " + l.holder).join(", ")
            : " · kit complete") +
          ". Logged in the desk book.",
      );
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const r = getReq(f.dataset.req);
    const who = form.get("who");
    const due = form.get("due");
    const idx = form.getAll("line").map(Number);
    if (!r) return;
    if (!people.includes(who)) return fail("Choose who is collecting.");
    if (!timeAt[due]) return fail("Choose a return time.");
    if (!idx.length) return fail("Tick at least one unit to issue.");
    const picks = idx.map((i) => ({
      type: r.items[i],
      unit: getAsset(form.get("unit-" + i)),
    }));
    for (const { type, unit } of picks) {
      if (!type || !unit) return fail("Pick a unit for every ticked item.");
      if (unit.type !== type)
        return fail(
          "This equipment type is outside the approved request. Choose an approved unit.",
        );
      if (unit.repair || out(unit.id))
        return fail(unit.id + " is not on the shelf.");
      if (s.loans.some((l) => l.req === r.id && !l.back && typeOf(l) === type))
        return fail(
          "The approved quantity of " + type + " is already on loan.",
        );
    }
    let num = Math.max(...s.loans.map((l) => l.num));
    const nums = [];
    for (const { unit } of picks) {
      num += 1;
      nums.push(num);
      s.loans.push({
        num,
        req: r.id,
        asset: unit.id,
        who,
        holder: who,
        due,
        expected: due,
        back: false,
        returnedAt: null,
        returnedBy: "",
        log: [],
      });
    }
    closeForms();
    commit(
      "Issued " +
        picks.map((p) => p.unit.id).join(", ") +
        " to " +
        who +
        " on " +
        slipRange(nums) +
        ". Due back " +
        due +
        ".",
    );
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 2 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          people.includes(l.holder) &&
          Object.hasOwn(timeAt, l.expected) &&
          Array.isArray(l.log) &&
          (!l.back || shifts[l.returnedAt]),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      loans: d.loans.map((l) => ({ ...l, log: l.log.map((x) => ({ ...x })) })),
      notes: d.notes.map((n) => ({ ...n })),
      editing: false,
      issueReq: "",
      checkin: "",
      lookup: "",
      formError: "",
    };
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
