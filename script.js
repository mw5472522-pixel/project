const defaultStock = { "أرز": 100, "مكرونة": 100, "عدس": 100, "فول": 100, "مربى": 100, "جبنة": 100, "حلاوة": 100, "صلصة": 100, "زيت بذرة": 100, "زيت متجمد": 100, "ملح": 100, "خل": 100, "صابون سائل": 100, "توابل": 100 };
const defaultRates = { "أرز": 100, "مكرونة": 100, "عدس": 100, "فول": 100, "مربى": 40, "جبنة": 40, "حلاوة": 40, "زيت بذرة": 14, "زيت متجمد": 12, "صلصة_أرز": 10, "صلصة_مكرونة": 15, "ملح": 12, "خل": 1, "صابون سائل": 1, "توابل": 1 };

let currentStock = JSON.parse(localStorage.getItem('stock_v8')) || defaultStock;
let currentRates = JSON.parse(localStorage.getItem('rates_v8')) || defaultRates;
let currentStep = 1, tempWarehouseList = [], session = {};

document.getElementById('todayDate').textContent = new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });

function backToMenu() {
    document.querySelectorAll('.app-content').forEach(m => m.style.display = 'none');
    document.getElementById('mainMenu').style.display = 'block';
}

function dailyBack() { currentStep === 1 ? backToMenu() : (currentStep--, showStep(currentStep)); }

function startFlow(id) {
    document.querySelectorAll('.app-content').forEach(m => m.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(id === 'dailyFlow') { currentStep = 1; showStep(1); }
}

function showStep(s) {
    currentStep = s;
    document.querySelectorAll('.step').forEach(e => e.classList.remove('active'));
    document.getElementById(s === 'final' ? 'stepFinal' : 'step' + s).classList.add('active');
    document.getElementById('progress').style.width = (s === 'final' ? 100 : (s/5)*100) + '%';
}

function nextStep(s) {
    if(s === 2 && !document.getElementById('unitStrength').value) return alert("أدخل القوة");
    showStep(s);
}

function selectOption(key, val, next) { session[key] = val; showStep(next); }

function calculateDaily(dinnerVal) {
    session.dinner = dinnerVal;
    const n = parseFloat(document.getElementById('unitStrength').value);
    const m = session.main, leg = session.legumes, brk = session.breakfast, din = session.dinner;

    const list = [
        {n: m, q: (n * (currentRates[m]||0))/1000}, {n: leg, q: (n * (currentRates[leg]||0))/1000},
        {n: brk, q: (n * (currentRates[brk]||0))/1000}, {n: din, q: (n * (currentRates[din]||0))/1000},
        {n: "زيت بذرة", q: (n * currentRates["زيت بذرة"])/1000}, {n: "زيت متجمد", q: (n * currentRates["زيت متجمد"])/1000},
        {n: "صلصة", q: (m==='أرز'? n*currentRates["صلصة_أرز"] : n*currentRates["صلصة_مكرونة"])/1000},
        {n: "ملح", q: (n*currentRates["ملح"])/1000}, {n: "خل", q: (n*currentRates["خل"])/1000},
        {n: "صابون سائل", q: (n*currentRates["صابون سائل"])/1000}, {n: "توابل", q: (n*currentRates["توابل"])/1000}
    ];

    list.forEach(i => { if(currentStock[i.n] !== undefined) currentStock[i.n] -= i.q; });
    saveData();
    document.getElementById('resultsList').innerHTML = list.map(i => `<div class="res-item"><span>${i.n}</span><b>${i.q.toFixed(3)} كجم</b></div>`).join('');
    showStep('final');
}

// رصيد المخزن المطور
function showStock() {
    startFlow('stockView');
    const c = document.getElementById('stockListContainer'); c.innerHTML = '';
    for (let i in currentStock) {
        const val = currentStock[i];
        const d = document.createElement('div');
        d.className = `stock-item-card ${val < 10 ? 'low' : ''}`;
        d.innerHTML = `<h4>${i}</h4><div class="qty">${val.toFixed(1)} <small>كجم</small></div>`;
        c.appendChild(d);
    }
}

// إدارة الأصناف والفئات
function showManageStock() {
    startFlow('manageView');
    const ic = document.getElementById('manageItemsContainer'); ic.innerHTML = '';
    for (let i in currentStock) {
        const d = document.createElement('div'); d.className = 'manage-row';
        d.innerHTML = `
            <div class="manage-row-header"><span>${i}</span> <button class="btn-del" style="padding:2px 8px" onclick="deleteFullItem('${i}')">حذف 🗑️</button></div>
            <div class="manage-controls">
                <div>الرصيد (كجم):<input type="number" id="e-q-${i}" value="${currentStock[i].toFixed(1)}"></div>
                <div>الفئة (جم):<input type="number" id="e-r-${i}" value="${currentRates[i] || 0}"></div>
            </div>
            <button class="btn-primary" style="padding:5px; margin-top:10px; font-size:0.8rem" onclick="updateFullItem('${i}')">حفظ التعديلات</button>
        `;
        ic.appendChild(d);
    }
}

function updateFullItem(i) {
    currentStock[i] = parseFloat(document.getElementById(`e-q-${i}`).value);
    currentRates[i] = parseFloat(document.getElementById(`e-r-${i}`).value);
    saveData(); alert("تم التحديث");
}

function deleteFullItem(i) { if(confirm("حذف الصنف نهائياً؟")) { delete currentStock[i]; delete currentRates[i]; saveData(); showManageStock(); } }

function addNewItemFull() {
    const n = document.getElementById('newName').value.trim();
    const q = parseFloat(document.getElementById('newQty').value);
    const r = parseFloat(document.getElementById('newRate').value);
    if(n && !isNaN(q)) {
        currentStock[n] = q; currentRates[n] = r || 0;
        saveData(); alert("تمت الإضافة"); showManageStock();
        document.getElementById('newName').value = ''; document.getElementById('newQty').value = ''; document.getElementById('newRate').value = '';
    }
}

function saveData() { localStorage.setItem('stock_v8', JSON.stringify(currentStock)); localStorage.setItem('rates_v8', JSON.stringify(currentRates)); }

// توريد المستودع
function addManualItemToList() {
    const n = document.getElementById('manualItemName').value.trim(), q = parseFloat(document.getElementById('manualItemQty').value);
    if(n && !isNaN(q)) { tempWarehouseList.push({ n: n, q: q }); renderTemp(); document.getElementById('manualItemName').value=''; document.getElementById('manualItemQty').value=''; }
}
function renderTemp() {
    const c = document.getElementById('manualPreview'); c.innerHTML = '';
    tempWarehouseList.forEach((i, idx) => {
        c.innerHTML += `<div class="res-item"><span>${i.n} (+${i.q} كجم)</span><button onclick="tempWarehouseList.splice(${idx},1);renderTemp()">❌</button></div>`;
    });
    document.getElementById('saveManualBtn').style.display = tempWarehouseList.length > 0 ? 'block' : 'none';
}
function saveManualToStock() {
    tempWarehouseList.forEach(i => { if(currentStock[i.n] !== undefined) currentStock[i.n] += i.q; else currentStock[i.n] = i.q; });
    saveData(); backToMenu(); alert("تم التوريد");
}
