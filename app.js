function formatDateJp(d){
  const days = ["日","月","火","水","木","金","土"];
  return d.getFullYear() + "年" + (d.getMonth()+1) + "月" + d.getDate() + "日(" + days[d.getDay()] + ")";
}
document.getElementById("dateVersion").textContent = formatDateJp(new Date()) + "　" + APP_VERSION;

(function(){
  const header = document.querySelector("header");
  if (header) {
    const backLink = document.createElement("a");
    backLink.href = "../";
    backLink.className = "back-link";
    backLink.textContent = "← コース選択に戻る";
    header.insertBefore(backLink, header.firstChild);

    const topLink = document.createElement("a");
    topLink.href = "../../";
    topLink.className = "back-link";
    topLink.style.marginLeft = "10px";
    topLink.textContent = "トップ画面に戻る";
    header.insertBefore(topLink, backLink.nextSibling);
  }
})();

function dateStrFor(d){
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

function todayDateStr(){
  return dateStrFor(new Date());
}

function keyFor(dateStr){ return "gomi_" + COURSE_ID + "_" + dateStr; }
function violationKeyFor(dateStr){ return "gomi_v_" + COURSE_ID + "_" + dateStr; }
function savedKeyFor(dateStr){ return "gomi_saved_" + COURSE_ID + "_" + dateStr; }
function cardboardKeyFor(dateStr){ return "gomi_cb_" + COURSE_ID + "_" + dateStr; }
function cardboardTimeKeyFor(dateStr){ return "gomi_ct_" + COURSE_ID + "_" + dateStr; }

const IS_CARDBOARD_COURSE = /-pet\d/.test(COURSE_ID);

function todayKey(){
  return keyFor(todayDateStr());
}

function todayViolationKey(){
  return violationKeyFor(todayDateStr());
}

function todaySavedKey(){
  return savedKeyFor(todayDateStr());
}

function markSavedForDate(dateStr){
  try {
    localStorage.setItem(savedKeyFor(dateStr), "1");
  } catch (e) {}
}

function markSavedToday(){
  markSavedForDate(todayDateStr());
}

function isSavedForDate(dateStr){
  try {
    return localStorage.getItem(savedKeyFor(dateStr)) === "1";
  } catch (e) {
    return false;
  }
}

function isSavedToday(){
  return isSavedForDate(todayDateStr());
}

function stationsOverrideKey(){
  return "gomi_stations_" + COURSE_ID;
}

function loadStations(){
  try {
    const saved = JSON.parse(localStorage.getItem(stationsOverrideKey()) || "null");
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch (e) {}
  return DEFAULT_STATIONS.slice();
}

function saveStationsOverride(){
  try {
    localStorage.setItem(stationsOverrideKey(), JSON.stringify(stations));
  } catch (e) {}
}

function renumberStations(){
  stations.forEach((s, i) => { s.no = i + 1; });
}

function resetStationsToDefault(){
  showConfirm("編集内容をすべて取り消して、最初のステーション一覧に戻しますか？", () => {
    stations = DEFAULT_STATIONS.slice();
    try { localStorage.removeItem(stationsOverrideKey()); } catch (e) {}
    render(document.getElementById("filter").value);
    showToast("元のステーション一覧に戻しました。");
  });
}

let stations = loadStations();
let editMode = false;

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

let cardboard = {};
try {
  cardboard = JSON.parse(localStorage.getItem(cardboardKeyFor(todayDateStr())) || "{}");
} catch (e) {
  cardboard = {};
}

let cardboardTimes = {};
try {
  cardboardTimes = JSON.parse(localStorage.getItem(cardboardTimeKeyFor(todayDateStr())) || "{}");
} catch (e) {
  cardboardTimes = {};
}

let cardboardFilterOn = false;

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

function saveCardboard(){
  try {
    localStorage.setItem(cardboardKeyFor(todayDateStr()), JSON.stringify(cardboard));
  } catch (e) {}
}

function saveCardboardTimes(){
  try {
    localStorage.setItem(cardboardTimeKeyFor(todayDateStr()), JSON.stringify(cardboardTimes));
  } catch (e) {}
}

function toggleCardboard(s){
  if (cardboard[s.st]) {
    delete cardboard[s.st];
  } else {
    cardboard[s.st] = true;
  }
  saveCardboard();
  render(document.getElementById("filter").value);
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

function adminServerKey(){
  return "gomi_admin_server";
}

function getAdminServer(){
  try {
    return localStorage.getItem(adminServerKey()) || "";
  } catch (e) {
    return "";
  }
}

function setAdminServer(v){
  try {
    localStorage.setItem(adminServerKey(), v);
  } catch (e) {}
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

function showStationEditor(existing, onSave){
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const box = document.createElement("div");
  box.className = "modal-box";

  const title = document.createElement("p");
  title.textContent = existing ? "ステーションを編集" : "ステーションを追加";
  box.appendChild(title);

  function mkField(labelText, value, type){
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.type = type || "text";
    input.value = value || "";
    input.className = "field-input";
    wrap.appendChild(label);
    wrap.appendChild(input);
    box.appendChild(wrap);
    return input;
  }

  const maxPos = existing ? stations.length : stations.length + 1;
  const posDefault = existing ? existing.no : stations.length + 1;
  const posInput = mkField(
    (existing ? "何番目に移動しますか？" : "何番目に追加しますか？") + "（1〜" + maxPos + "）",
    String(posDefault),
    "number"
  );
  const stInput = mkField("ST番号", existing ? existing.st : "");
  const mapInput = mkField("地図番号", existing ? existing.map : "");
  const targetInput = mkField("目標物（名称）", existing ? existing.target : "");

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "modal-btn-cancel";
  cancelBtn.textContent = "キャンセル";
  cancelBtn.addEventListener("click", () => overlay.remove());
  const okBtn = document.createElement("button");
  okBtn.className = "modal-btn-ok";
  okBtn.textContent = "保存";
  okBtn.addEventListener("click", () => {
    const st = stInput.value.trim();
    const map = mapInput.value.trim();
    const target = targetInput.value.trim();
    let position = parseInt(posInput.value, 10);
    if (!st || !target) {
      showToast("ST番号と目標物は必須です。");
      return;
    }
    if (!position || position < 1 || position > maxPos) {
      showToast("番号は1〜" + maxPos + "の範囲で入力してください。");
      return;
    }
    const dup = stations.some(s => s.st === st && s !== existing);
    if (dup) {
      showToast("そのST番号は既に使われています。");
      return;
    }
    overlay.remove();
    onSave({ st, map, target }, position);
  });
  actions.appendChild(cancelBtn);
  actions.appendChild(okBtn);
  box.appendChild(actions);

  overlay.appendChild(box);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  posInput.focus();
  posInput.select();
}

function mkEditBtn(label, className, onClick){
  const b = document.createElement("button");
  b.className = className;
  b.textContent = label;
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return b;
}

function addStationFlow(){
  showStationEditor(null, (newStation, position) => {
    const idx = Math.min(Math.max(position - 1, 0), stations.length);
    stations.splice(idx, 0, newStation);
    renumberStations();
    saveStationsOverride();
    render(document.getElementById("filter").value);
    showToast(position + "番目に追加しました。");
  });
}

function editStationAt(idx){
  const original = stations[idx];
  showStationEditor(original, (updated, position) => {
    if (updated.st !== original.st) {
      if (records[original.st] !== undefined) {
        records[updated.st] = records[original.st];
        delete records[original.st];
        save();
      }
      if (violations[original.st] !== undefined) {
        violations[updated.st] = violations[original.st];
        delete violations[original.st];
        saveViolations();
      }
    }
    const updatedStation = { no: original.no, st: updated.st, map: updated.map, target: updated.target };
    stations.splice(idx, 1);
    const newIdx = Math.min(Math.max(position - 1, 0), stations.length);
    stations.splice(newIdx, 0, updatedStation);
    renumberStations();
    saveStationsOverride();
    render(document.getElementById("filter").value);
  });
}

function deleteStationAt(idx){
  const s = stations[idx];
  showConfirm('「' + s.target + '」を削除しますか？関連する収集記録・違反ゴミ記録も削除されます。', () => {
    delete records[s.st];
    delete violations[s.st];
    stations.splice(idx, 1);
    renumberStations();
    save();
    saveViolations();
    saveStationsOverride();
    render(document.getElementById("filter").value);
  });
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

  if (stations.length === 0 && !editMode) {
    list.innerHTML = '<li class="empty-state">このコースはまだ準備中です。<br>ステーションデータが追加されるとここに一覧が表示されます。</li>';
    document.getElementById("progress").textContent = "準備中";
    return;
  }

  let doneCount = 0;
  let violationStations = 0;
  let violationItems = 0;
  let cardboardCount = 0;
  let cardboardDoneCount = 0;
  const ft = (filterText || "").trim();

  stations.forEach((s, idx) => {
    const time = records[s.st];
    const v = violations[s.st];
    const hasCardboard = !!cardboard[s.st];
    const cbTime = cardboardTimes[s.st];
    if (time) doneCount++;
    if (v) {
      violationStations++;
      violationItems += v.count;
    }
    if (hasCardboard) cardboardCount++;
    if (cbTime) cardboardDoneCount++;
    if (ft && !(s.target.includes(ft) || String(s.st).includes(ft) || String(s.no).includes(ft))) return;
    if (IS_CARDBOARD_COURSE && cardboardFilterOn && !hasCardboard) return;

    const isDone = (IS_CARDBOARD_COURSE && cardboardFilterOn) ? !!cbTime : !!time;
    const li = document.createElement("li");
    li.className = "item" + (isDone ? " done" : "") + (v ? " violation" : "");

    const rowMain = document.createElement("div");
    rowMain.className = "row-main";
    rowMain.innerHTML =
      '<span class="no">' + s.no + '</span>' +
      '<span class="target">' + s.target + '<small>' + s.map + ' / ST' + s.st + '</small></span>' +
      '<span class="time' + (time ? ' filled' : '') + '">' + (IS_CARDBOARD_COURSE ? "🧴" : "") + (time || "--:--") + '</span>' +
      (IS_CARDBOARD_COURSE ? '<span class="time cb-time' + (cbTime ? ' filled' : '') + '">📦' + (cbTime || "--:--") + '</span>' : '');
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

    if (IS_CARDBOARD_COURSE) {
      const cbRow = document.createElement("div");
      cbRow.className = "cardboard-row";
      const cbBtn = document.createElement("button");
      cbBtn.className = "cardboard-btn" + (hasCardboard ? " on" : "");
      cbBtn.textContent = hasCardboard ? "ダンボールあり" : "ダンボールなし";
      cbBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleCardboard(s);
      });
      cbRow.appendChild(cbBtn);
      li.appendChild(cbRow);
    }

    if (editMode) {
      const editRow = document.createElement("div");
      editRow.className = "edit-row";
      editRow.appendChild(mkEditBtn("編集", "edit-btn", () => editStationAt(idx)));
      editRow.appendChild(mkEditBtn("削除", "delete-btn", () => deleteStationAt(idx)));
      li.appendChild(editRow);
    }

    list.appendChild(li);
  });

  if (editMode) {
    const resetLi = document.createElement("li");
    resetLi.style.textAlign = "center";
    const resetBtn2 = document.createElement("button");
    resetBtn2.className = "reset-stations-btn";
    resetBtn2.textContent = "編集を元に戻す";
    resetBtn2.addEventListener("click", resetStationsToDefault);
    resetLi.appendChild(resetBtn2);
    list.appendChild(resetLi);
  }

  document.getElementById("progress").textContent =
    doneCount + " / " + stations.length + " 完了　違反ゴミ " + violationStations + "箇所（計" + violationItems + "個）" +
    (IS_CARDBOARD_COURSE ? "　ダンボール " + cardboardDoneCount + " / " + cardboardCount + "箇所 回収済み" : "");
}

function onTap(s){
  if (IS_CARDBOARD_COURSE && cardboardFilterOn) {
    onTapCardboardTime(s);
    return;
  }
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

function onTapCardboardTime(s){
  if (cardboardTimes[s.st]) {
    showConfirm('「' + s.target + '」のダンボール回収時刻(' + cardboardTimes[s.st] + ')を取り消しますか？', () => {
      delete cardboardTimes[s.st];
      saveCardboardTimes();
      render(document.getElementById("filter").value);
    });
    return;
  }
  cardboardTimes[s.st] = fmtTime(new Date());
  saveCardboardTimes();
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

if (IS_CARDBOARD_COURSE) {
  const h1ForWord = document.querySelector("header h1");
  if (h1ForWord && h1ForWord.textContent.includes("ダンボール")) {
    h1ForWord.innerHTML = h1ForWord.textContent.replace("ダンボール", '<span id="cbWord">ダンボール</span>');
  }

  const progressEl = document.getElementById("progress");
  const filterBtn = document.createElement("button");
  filterBtn.id = "cardboardFilterBtn";
  filterBtn.className = "cardboard-filter-btn";
  filterBtn.textContent = "ダンボールありのみ表示";
  filterBtn.addEventListener("click", () => {
    cardboardFilterOn = !cardboardFilterOn;
    filterBtn.textContent = cardboardFilterOn ? "すべて表示に戻す" : "ダンボールありのみ表示";
    filterBtn.classList.toggle("on", cardboardFilterOn);
    const cbWord = document.getElementById("cbWord");
    if (cbWord) cbWord.classList.toggle("cardboard-mode", cardboardFilterOn);
    render(document.getElementById("filter").value);
  });
  progressEl.insertAdjacentElement("afterend", filterBtn);
}

const fabAdd = document.createElement("button");
fabAdd.className = "fab-add";
fabAdd.textContent = "＋";
fabAdd.setAttribute("aria-label", "ステーションを追加");
fabAdd.addEventListener("click", addStationFlow);
document.body.appendChild(fabAdd);

document.getElementById("editBtn").addEventListener("click", () => {
  editMode = !editMode;
  document.getElementById("editBtn").textContent = editMode ? "編集モードを終了" : "ステーションを編集";
  fabAdd.classList.toggle("show", editMode);
  document.getElementById("filter").value = "";
  render("");
});

function doReset(){
  records = {};
  violations = {};
  cardboard = {};
  cardboardTimes = {};
  save();
  saveViolations();
  saveCardboard();
  saveCardboardTimes();
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

function buildCsvFor(recordsObj, violationsObj){
  const rows = [["番号", "ST番号", "地図番号", "目標物", "収集時刻", "違反ゴミ個数"]];
  stations.forEach(s => {
    const v = violationsObj[s.st];
    rows.push([
      String(s.no),
      s.st,
      s.map,
      s.target,
      recordsObj[s.st] || "",
      v ? String(v.count) : ""
    ]);
  });
  return "﻿" + rows.map(row => row.map(csvField).join(",")).join("\r\n");
}

function buildCsv(){
  return buildCsvFor(records, violations);
}

function downloadCsvFallback(csv, dateStr, reasonMessage){
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = COURSE_NAME + "_" + dateStr + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markSavedForDate(dateStr);
  showToast(reasonMessage + "保存先はOneDriveの「ゴミ収集データ／" + COURSE_NAME + "」フォルダを選んでください。");
}

async function uploadOrDownload(csv, dateStr, onDone){
  const server = getAdminServer();
  if (!server) {
    downloadCsvFallback(csv, dateStr, "送信先が未設定のため、ファイルをダウンロードしました。");
    if (onDone) onDone(false);
    return;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const url = (server.startsWith("http") ? server : "http://" + server).replace(/\/$/, "") + "/api/collect";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: COURSE_ID,
        courseName: COURSE_NAME,
        date: dateStr,
        csv: csv
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "アップロードに失敗しました。");
    }
    markSavedForDate(dateStr);
    showToast(dateStr + "分を事務所PCにアップロードしました！");
    if (onDone) onDone(true);
  } catch (e) {
    downloadCsvFallback(csv, dateStr, "事務所PCに繋がらなかったため、ファイルをダウンロードしました。");
    if (onDone) onDone(false);
  }
}

document.getElementById("saveBtn").textContent = "本日の収集データをアップロード";

document.getElementById("saveBtn").addEventListener("click", async () => {
  if (stations.length === 0) {
    showToast("このコースはまだ準備中です。");
    return;
  }
  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.textContent = "アップロード中...";
  await uploadOrDownload(buildCsv(), todayDateStr());
  btn.disabled = false;
  btn.textContent = "本日の収集データをアップロード";
});

function findUnsentPastDates(){
  const found = [];
  for (let i = 1; i <= 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = dateStrFor(d);
    if (isSavedForDate(dateStr)) continue;
    let recs = {};
    try { recs = JSON.parse(localStorage.getItem(keyFor(dateStr)) || "{}"); } catch (e) {}
    if (Object.keys(recs).length > 0) found.push(dateStr);
  }
  return found;
}

function checkUnsentPastData(){
  const dates = findUnsentPastDates();
  if (dates.length === 0) return;
  const header = document.querySelector("header");
  if (!header) return;
  const banner = document.createElement("div");
  banner.className = "past-data-banner";
  banner.textContent =
    dates.length + "日分（" + dates.join("、") + "）の未送信データがあります。";
  const btn = document.createElement("button");
  btn.className = "past-data-btn";
  btn.textContent = "送信する";
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "送信中...";
    for (const dateStr of dates) {
      const recs = JSON.parse(localStorage.getItem(keyFor(dateStr)) || "{}");
      const viols = JSON.parse(localStorage.getItem(violationKeyFor(dateStr)) || "{}");
      await uploadOrDownload(buildCsvFor(recs, viols), dateStr);
    }
    banner.remove();
  });
  banner.appendChild(btn);
  header.insertBefore(banner, header.firstChild);
}
checkUnsentPastData();

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
