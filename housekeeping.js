const API_URL = "/api/getHousekeepingBookings";
const REFRESH_MS = 30000;
const START_HOUR = 8;
const END_HOUR = 18;

const sampleData = [
  { ID:1, RoomName:"ห้องประชุม 8A", StartTime:"09:30", EndTime:"11:00", Department:"ฝ่ายขาย", Attendees:15, Purpose:"ประชุมยอดขาย", Equipment:"Coffee Break, Projector, Wireless Mic", Status:"Approved", HousekeepingStatus:"Waiting" },
  { ID:2, RoomName:"ห้องประชุม 4B", StartTime:"09:45", EndTime:"12:00", Department:"ฝ่าย IT", Attendees:8, Purpose:"test ระบบ", Equipment:"Projector, ไมค์ Conference, น้ำดื่ม, กาแฟ", Status:"Approved", HousekeepingStatus:"Waiting" },
  { ID:3, RoomName:"ห้องประชุม 3A", StartTime:"10:30", EndTime:"12:00", Department:"ฝ่ายการตลาด", Attendees:10, Purpose:"Marketing Plan", Equipment:"อาหารกลางวัน, Projector", Status:"Approved", HousekeepingStatus:"Preparing" },
  { ID:4, RoomName:"Phone Booth A", StartTime:"08:30", EndTime:"10:00", Department:"ฝ่ายกฎหมาย", Attendees:2, Purpose:"Call", Equipment:"", Status:"Approved", HousekeepingStatus:"Ready" }
];

function pad(n){ return String(n).padStart(2,"0"); }

function formatThaiDate(d){
  return d.toLocaleDateString("th-TH", { day:"numeric", month:"long", year:"numeric" });
}

function updateClock(){
  const now = new Date();
  document.getElementById("nowTime").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())} น.`;
  document.getElementById("todayText").textContent = formatThaiDate(now);
}

function normalizeStatus(v){
  const s = String(v || "Waiting").toLowerCase();
  if(s.includes("ready") || s.includes("พร้อม")) return "Ready";
  if(s.includes("preparing") || s.includes("กำลัง")) return "Preparing";
  if(s.includes("cancel")) return "Cancelled";
  return "Waiting";
}

function timeToMin(t){
  if(!t) return 0;
  const parts = String(t).match(/(\d{1,2}):(\d{2})/);
  if(!parts) return 0;
  return Number(parts[1]) * 60 + Number(parts[2]);
}

function card(item){
  const equip = item.Equipment ? item.Equipment : "ไม่มีการเตรียมพิเศษ";
  return `
    <article class="card">
      <div class="time">${item.StartTime}<small>ถึง ${item.EndTime}</small></div>
      <div>
        <div class="room">${item.RoomName || "-"}</div>
        <div class="meta">
          <span>${item.Department || "-"}</span>
          <span>👥 ${item.Attendees || 0} คน</span>
        </div>
        <div class="equip">☑ ${equip}</div>
      </div>
    </article>`;
}

function renderColumn(id, items){
  const el = document.getElementById(id);
  const html = items.slice(0,2).map(card).join("");
  el.innerHTML = html || `<div class="card empty">ไม่มีรายการ</div>`;
}

function renderTimeline(items){
  const rooms = [...new Set(items.map(x => x.RoomName || "-"))].slice(0,6);
  const total = (END_HOUR - START_HOUR) * 60;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowLeft = Math.max(0, Math.min(100, ((nowMin - START_HOUR * 60) / total) * 100));

  const rows = rooms.map(room => {
    const bars = items.filter(x => (x.RoomName || "-") === room).map(x => {
      const start = timeToMin(x.StartTime);
      const end = timeToMin(x.EndTime);
      const left = Math.max(0, ((start - START_HOUR * 60) / total) * 100);
      const width = Math.max(2, ((end - start) / total) * 100);
      const st = normalizeStatus(x.HousekeepingStatus).toLowerCase();
      return `<div class="bar ${st}" style="left:${left}%;width:${width}%">${x.StartTime} - ${x.EndTime}</div>`;
    }).join("");

    return `<div class="trow"><div class="rname">${room}</div><div class="grid">${bars}</div></div>`;
  }).join("");

  document.getElementById("timeline").innerHTML = rows + `<div class="nowLine" style="left:calc(230px + (100% - 230px) * ${nowLeft / 100})"></div>`;
}

function render(data){
  const approved = data
    .filter(x => String(x.Status || "").toLowerCase() === "approved")
    .sort((a,b) => timeToMin(a.StartTime) - timeToMin(b.StartTime));

  const waiting = approved.filter(x => normalizeStatus(x.HousekeepingStatus) === "Waiting");
  const preparing = approved.filter(x => normalizeStatus(x.HousekeepingStatus) === "Preparing");
  const ready = approved.filter(x => normalizeStatus(x.HousekeepingStatus) === "Ready");

  renderColumn("waitingList", waiting);
  renderColumn("preparingList", preparing);
  renderColumn("readyList", ready);

  document.getElementById("waitingCount").textContent = waiting.length;
  document.getElementById("preparingCount").textContent = preparing.length;
  document.getElementById("readyCount").textContent = ready.length;
  document.getElementById("lastUpdate").textContent = new Date().toLocaleTimeString("th-TH", {hour:"2-digit", minute:"2-digit"});

  renderTimeline(approved);
}

async function loadData(){
  try{
    const res = await fetch(API_URL, { cache:"no-store" });
    if(!res.ok) throw new Error("API not ready");
    const data = await res.json();
    render(Array.isArray(data) ? data : data.value || []);
  }catch(e){
    render(sampleData);
  }
}

updateClock();
loadData();
setInterval(updateClock, 1000);
setInterval(loadData, REFRESH_MS);
