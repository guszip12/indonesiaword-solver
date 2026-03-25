const RANKING_URL = "https://raw.githubusercontent.com/fay23-dam/sazaraaax-script/refs/heads/main/wordworng/ranking_kata%20(1).json";
const WRONG_WORDS_URL = "https://raw.githubusercontent.com/fay23-dam/sazaraaax-script/refs/heads/main/wordworng/a3x.lua";

const TRAPS = ["EA", "X", "Y", "W", "IF", "AH", "EH", "OX" ,"EX", "OH", "AX", "CY", "AO", "LY", "HY", "GY"];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const INTERNAL_DB = [
    "EHOMOFOBIA",
    "eak",
    "earl",
    "eabagar"
];

let wordDatabase = [];
let wrongWordsSet = new Set();
let filterMode = { type: null, value: null };
let maxDisplayLimit = 1000;

// Status Mode Pencarian (False = Awalan, True = Akhiran)
let isReverseSearch = false;

// Toggle Function Panel
function toggleElement(id) {
    const el = document.getElementById(id);
    el.classList.toggle('hidden');
}

// Toggle Reverse Search Mode
function toggleReverseMode() {
    isReverseSearch = !isReverseSearch;
    const btn = document.getElementById('reverseBtn');
    const input = document.getElementById('searchInput');
    
    if (isReverseSearch) {
        btn.classList.add('active');
        input.classList.add('reverse-active');
        input.placeholder = "CARI AKHIRAN...";
    } else {
        btn.classList.remove('active');
        input.classList.remove('reverse-active');
        input.placeholder = "CARI AWALAN...";
    }
    updateList(); 
}

// Slider Listeners
document.getElementById('maxWordsSlider').oninput = function() {
    maxDisplayLimit = parseInt(this.value);
    document.getElementById('maxWordsVal').innerText = this.value;
    updateList();
};

document.getElementById('zoomSlider').oninput = function() {
    const val = this.value;
    document.getElementById('zoomVal').innerText = val;
    document.body.style.transform = `scale(${val/100})`;
    document.body.style.width = `${100 / (val/100)}%`; 
};

function initControls() {
    const startTrapArea = document.getElementById('startTrapArea');
    const endTrapArea = document.getElementById('endTrapArea');
    const alphabetArea = document.getElementById('alphabetArea');

    startTrapArea.innerHTML = "";
    endTrapArea.innerHTML = "";
    alphabetArea.innerHTML = "";

    TRAPS.forEach(t => {
        const btnS = document.createElement('button');
        btnS.className = 'counter-btn';
        btnS.innerText = `Awal ${t}`;
        btnS.onclick = () => setFilter('START', t, btnS);
        startTrapArea.appendChild(btnS);

        const btnE = document.createElement('button');
        btnE.className = 'counter-btn';
        btnE.innerText = `Akhir ${t}`;
        btnE.onclick = () => setFilter('END', t, btnE);
        endTrapArea.appendChild(btnE);
    });

    ALPHABET.forEach(char => {
        const btn = document.createElement('button');
        btn.className = 'alphabet-btn counter-btn';
        btn.innerText = char;
        btn.onclick = () => setFilter('START', char, btn);
        alphabetArea.appendChild(btn);
    });
}

function setFilter(type, value, el) {
    if (filterMode.type === type && filterMode.value === value) {
        filterMode = { type: null, value: null };
        el.classList.remove('active');
    } else {
        document.querySelectorAll('.counter-btn').forEach(b => b.classList.remove('active'));
        filterMode = { type, value };
        el.classList.add('active');
    }
    // Bersihkan input manual jika pakai tombol filter
    document.getElementById('searchInput').value = "";
    updateList();
}

async function loadData() {
    try {
        const [r1, r2] = await Promise.all([fetch(RANKING_URL), fetch(WRONG_WORDS_URL)]);
        const data1 = await r1.json();
        
        let combinedWords = new Set(INTERNAL_DB.map(w => w.toUpperCase()));
        
        data1.forEach(i => {
            let w = i.word.toUpperCase();
            if (/^[A-Z]+$/.test(w) && w.length >= 3) {
                combinedWords.add(w);
            }
        });
        wordDatabase = Array.from(combinedWords);
        
        const text2 = await r2.text();
        const matches = text2.match(/"([^"]+)"/g);
        if (matches) matches.forEach(m => wrongWordsSet.add(m.replace(/"/g, '').toUpperCase()));
        
        document.getElementById('status').innerText = `READY | ${wordDatabase.length} WORDS`;
        initControls();
        updateList();
    } catch (e) { 
        wordDatabase = INTERNAL_DB.map(w => w.toUpperCase());
        document.getElementById('status').innerText = `OFFLINE MODE (Internal DB) | ${wordDatabase.length} WORDS`;
        initControls();
        updateList();
    }
}

function updateList() {
    const query = document.getElementById('searchInput').value.toUpperCase().trim();
    const list = document.getElementById('resultList');
    const mainToggleArea = document.getElementById('mainToggleArea');
    const expandablePanels = document.getElementById('expandablePanels');
    const settingsPanel = document.getElementById('settingsPanel');
    
    list.innerHTML = "";

    if (query.length > 0) {
        mainToggleArea.classList.add('hidden');
        expandablePanels.classList.add('hidden');
        settingsPanel.classList.add('hidden');
    } else {
        mainToggleArea.classList.remove('hidden');
        if (filterMode.type === null) expandablePanels.classList.remove('hidden');
    }

    let display = [];
    
    if (query.length > 0) {
        if (isReverseSearch) {
            list.innerHTML = `<span class='mode-indicator' style='color:#00ffff'>🔍 Mencari Akhiran: "${query}"</span>`;
            display = wordDatabase.filter(w => w.endsWith(query) && !wrongWordsSet.has(w));
        } else {
            display = wordDatabase.filter(w => w.startsWith(query) && !wrongWordsSet.has(w));
        }
        display.sort((a,b) => {
            const getPriority = (word) => {
                if (word.endsWith("EA")) return 0;
                if (word.endsWith("EH") || word.endsWith("LT")) return 1;
                if (TRAPS.some(e => word.endsWith(e))) return 2;
                return 3;
            };
            return getPriority(a) - getPriority(b) || a.length - b.length;
        });
        
    } else if (filterMode.type === 'START') {
        list.innerHTML = `<span class='mode-indicator'>🔍 Awalan: ${filterMode.value}</span>`;
        display = wordDatabase.filter(w => w.startsWith(filterMode.value) && !wrongWordsSet.has(w));
        display.sort((a,b) => a.length - b.length);
    } else if (filterMode.type === 'END') {
        list.innerHTML = `<span class='mode-indicator'>🎯 Akhiran: ${filterMode.value}</span>`;
        display = wordDatabase.filter(w => w.endsWith(filterMode.value) && !wrongWordsSet.has(w));
        display.sort((a,b) => a.length - b.length);
    } else {
        list.innerHTML = "<span class='mode-indicator'>✨ Rekomendasi Acak ✨</span>";
        let ea = [], eh = [], xy = [], others = [];
        wordDatabase.forEach(w => {
            if(wrongWordsSet.has(w)) return;
            if(w.endsWith("EA")) ea.push(w);
            else if(w.endsWith("EH")) eh.push(w);
            else if(w.endsWith("X") || w.endsWith("Y")) xy.push(w);
            else if(TRAPS.some(e => w.endsWith(e))) others.push(w);
        });
        const shuf = (a) => a.sort(() => Math.random() - 0.5);
        shuf(ea); shuf(eh); shuf(xy); shuf(others);
        
        // Rekomendasi akan memprioritaskan EA terlebih dahulu
        let max = Math.max(ea.length, eh.length, xy.length, others.length);
        for(let i=0; i<max; i++) {
            if(ea[i]) display.push(ea[i]);
            if(eh[i]) display.push(eh[i]);
            if(xy[i]) display.push(xy[i]);
            if(others[i]) display.push(others[i]);
        }
    }

    display.slice(0, maxDisplayLimit).forEach(word => {
        const div = document.createElement('div');
        let cls = "normal";
        
        if (word.endsWith("EA")) cls = "trap-ea";
        else if (word.endsWith("EH") || word.endsWith("LT")) cls = "trap-eh";
        else if (word.endsWith("X") || word.endsWith("Y")) cls = "trap-xy";
        else if (TRAPS.some(e => word.endsWith(e))) cls = "trap-others";
        
        div.className = `word-item ${cls}`;
        div.innerHTML = `<span>${word}</span> <span class="char-count">${word.length}L</span>`;
        div.onclick = () => {
            navigator.clipboard.writeText(word);
            div.style.background = "#fff";
            setTimeout(() => div.style.background = "", 100);
        };
        list.appendChild(div);
    });
}

document.getElementById('searchInput').oninput = () => {
    filterMode = { type: null, value: null };
    document.querySelectorAll('.counter-btn').forEach(b => b.classList.remove('active'));
    updateList();
};

loadData();
