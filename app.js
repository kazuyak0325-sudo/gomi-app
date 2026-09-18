function formatDateJp(d){
  const days = ["日","月","火","水","木","金","土"];
  return d.getFullYear() + "年" + (d.getMonth()+1) + "月" + d.getDate() + "日(" + days[d.getDay()] + ")";
}
document.getElementById("dateVersion").textContent = formatDateJp(new Date()) + "　" + APP_VERSION;

function todayDateStr(){
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

function todayKey(){
  return "gomi_" + COURSE_ID + "_" + todayDateStr();
}

function todayViolationKey(){
  return "gomi_v_" + COURSE_ID + "_" + todayDateStr();
}

function todaySavedKey(){
  return "gomi_saved_" + COURSE_ID + "_" + todayDateStr();
}

function markSavedToday(){
  try {
    localStorage.setItem(todaySavedKey(), "1");
  } catch (e) {}
}

function isSavedToday(){
  try {
    return localStorage.getItem(todaySavedKey()) === "1";
  } catch (e) {
    return false;
  }
}

let records = {};
try {
  records = JSON.parse(localStorage.getItem(todayKey()) || "{}");
} catch (e) {
  records = {};
}

let violations = {};
try {
  violations = JSON.parse(localStorage.getItem(todayViolationKey()) || "{}");
} catch (e) {
  violations = {};
}

function save(){
  try {
    localStorage.setItem(todayKey(), JSON.stringify(records));
  } catch (e) {}
}

function saveViolations(){
  try {
    localStorage.setItem(todayViolationKey(), JSON.stringify(violations));
  } catch (e) {}
}

function fmtTime(d){
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}

function showConfirm(message, onConfirm){
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const box = document.createElement("div");
  box.className = "modal-box";
  const p = document.createElement("p");
  p.textContent = message;
  const actions = document.createElement("div");
  actions.className = "modal-actions";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "modal-btn-cancel";
  cancelBtn.textContent = "キャンセル";
  cancelBtn.addEventListener("click", () => overlay.remove());
  const okBtn = document.createElement("button");
  okBtn.className = "modal-btn-ok";
  okBtn.textContent = "実行";
  okBtn.addEventListener("click", () => {
    overlay.remove();
    onConfirm();
  });
  actions.appendChild(cancelBtn);
  actions.appendChild(okBtn);
  box.appendChild(p);
  box.appendChild(actions);
  overlay.appendChild(box);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function showTextModal(message, text){
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const box = document.createElement("div");
  box.className = "modal-box";
  const p = document.createElement("p");
  p.textContent = message;
  const ta = document.createElement("textarea");
  ta.className = "modal-textarea";
  ta.value = text;
  ta.readOnly = true;
  const actions = document.createElement("div");
  actions.className = "modal-actions";
  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-btn-cancel";
  closeBtn.textContent = "閉じる";
  closeBtn.addEventListener("click", () => overlay.remove());
  actions.appendChild(closeBtn);
  box.appendChild(p);
  box.appendChild(ta);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  ta.focus();
  ta.select();
}

function showToast(message){
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

function mkStepperBtn(label, onClick){
  const b = document.createElement("button");
  b.className = "stepper-btn";
  b.textContent = label;
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return b;
}

function render(filterText){
  const list = document.getElementById("list");
  list.innerHTML = "";

  if (stations.length === 0) {
    list.innerHTML = '<li class="empty-state">このコースはまだ準備中です。<br>ステーションデータが追加されるとここに一覧が表示されます。</li>';
    document.getElementById("progress").textContent = "準備中";
    return;
  }

  let doneCount = 0;
  let violationStations = 0;
  let violationItems = 0;
  const ft = (filterText || "").trim();

  stations.forEach(s => {
    const time = records[s.st];
    const v = violations[s.st];
    if (time) doneCount++;
    if (v) {
      violationStations++;
      violationItems += v.count;
    }
    if (ft && !(s.target.includes(ft) || String(s.st).includes(ft) || String(s.no).includes(ft))) return;

    const li = document.createElement("li");
    li.className = "item" + (time ? " done" : "") + (v ? " violation" : "");

    const rowMain = document.createElement("div");
    rowMain.className = "row-main";
    rowMain.innerHTML =
      '<span class="no">' + s.no + '</span>' +
      '<span class="target">' + s.target + '<small>' + s.map + ' / ST' + s.st + '</small></span>' +
      '<span class="time">' + (time || "--:--") + '</span>';
    rowMain.addEventListener("click", () => onTap(s));
    li.appendChild(rowMain);

    const vRow = document.createElement("div");
    vRow.className = "violation-row";
    if (v) {
      vRow.appendChild(mkStepperBtn("－", () => changeViolationCount(s, -1)));
      const countSpan = document.createElement("span");
      countSpan.className = "count-display";
      countSpan.textContent = v.count + "個";
      vRow.appendChild(countSpan);
      vRow.appendChild(mkStepperBtn("＋", () => changeViolationCount(s, 1)));
      const clearBtn = document.createElement("button");
      clearBtn.className = "clear-btn";
      clearBtn.textContent = "解除";
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        clearViolation(s);
      });
      vRow.appendChild(clearBtn);
    } else {
      const markBtn = document.createElement("button");
      markBtn.className = "mark-btn";
      markBtn.textContent = "違反ゴミあり";
      markBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        markViolation(s);
      });
      vRow.appendChild(markBtn);
    }
    li.appendChild(vRow);

    list.appendChild(li);
  });

  document.getElementById("progress").textContent =
    doneCount + " / " + stations.length + " 完了　違反ゴミ " + violationStations + "箇所（計" + violationItems + "個）";
}

function onTap(s){
  if (records[s.st]) {
    showConfirm('「' + s.target + '」の記録(' + records[s.st] + ')を取り消しますか？', () => {
      delete records[s.st];
      save();
      render(document.getElementById("filter").value);
    });
    return;
  }
  records[s.st] = fmtTime(new Date());
  save();
  render(document.getElementById("filter").value);
}

function markViolation(s){
  violations[s.st] = { count: 1, time: fmtTime(new Date()) };
  saveViolations();
  render(document.getElementById("filter").value);
}

function changeViolationCount(s, delta){
  const v = violations[s.st];
  if (!v) return;
  v.count = Math.max(1, v.count + delta);
  saveViolations();
  render(document.getElementById("filter").value);
}

function clearViolation(s){
  delete violations[s.st];
  saveViolations();
  render(document.getElementById("filter").value);
}

document.getElementById("filter").addEventListener("input", e => render(e.target.value));

function doReset(){
  records = {};
  violations = {};
  save();
  saveViolations();
  render(document.getElementById("filter").value);
}

document.getElementById("resetBtn").addEventListener("click", () => {
  const hasData = Object.keys(records).length > 0 || Object.keys(violations).length > 0;
  const message = (hasData && !isSavedToday())
    ? "本日のデータはまだ保存されていません。保存せずにリセットすると記録が失われます。本当にリセットしますか？"
    : "今日の記録（収集時刻・違反ゴミ）をすべてリセットしますか？";
  showConfirm(message, doReset);
});

function csvField(v){
  const s = String(v);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(){
  const rows = [["番号", "ST番号", "地図番号", "目標物", "収集時刻", "違反ゴミ個数"]];
  stations.forEach(s => {
    const v = violations[s.st];
    rows.push([
      String(s.no),
      s.st,
      s.map,
      s.target,
      records[s.st] || "",
      v ? String(v.count) : ""
    ]);
  });
  return "﻿" + rows.map(row => row.map(csvField).join(",")).join("\r\n");
}

document.getElementById("saveBtn").addEventListener("click", () => {
  if (stations.length === 0) {
    showToast("このコースはまだ準備中です。");
    return;
  }
  const csv = buildCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = COURSE_NAME + "_" + todayDateStr() + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markSavedToday();
  showToast("保存中です。保存先はOneDriveの「ゴミ収集データ／" + COURSE_NAME + "」フォルダを選んでください。");
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const lines = stations.map(s => records[s.st] || "");
  const text = lines.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast("時刻を上から順にコピーしました。Excelの時刻列に貼り付けできます。");
  } catch (e) {
    showTextModal("自動コピーできませんでした。下の内容を手動でコピーしてください:", text);
  }
});

render("");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
