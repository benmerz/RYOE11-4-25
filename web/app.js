(function(){
  const state = {
    data: [],
    filtered: [],
    sortKey: 'total_ryoe',
    sortDir: 'desc', // 'asc' | 'desc'
    minTouches: 0,
    minRush: 0,
    maxRush: 400
  };

  const els = {
    table: document.getElementById('leaderboard'),
    tbody: document.querySelector('#leaderboard tbody'),
    ths: Array.from(document.querySelectorAll('#leaderboard thead th')),
    minRange: document.getElementById('minTouches'),
    minNumber: document.getElementById('minTouchesNumber'),
    minOut: document.getElementById('minTouchesOut'),
    count: document.getElementById('count')
  };

  // Minimal CSV parser for simple, unquoted CSV
  function parseCSV(text){
    const lines = text.trim().split(/\r?\n/);
    if(lines.length === 0) return [];
    const header = lines[0].split(',').map(s => s.trim());
    const rows = [];
    for(let i=1;i<lines.length;i++){
      const line = lines[i].trim();
      if(!line) continue;
      const cols = line.split(',').map(s => s.trim());
      const obj = {};
      for(let j=0;j<header.length;j++) obj[header[j]] = cols[j] ?? '';
      rows.push(obj);
    }
    return rows;
  }

  function coerceTypes(rows){
    return rows.map(r => {
      const rush_attempts = Number(r.rush_attempts);
      const total_ryoe = Number(r.total_ryoe);
      const ryoe_per_att = rush_attempts ? (total_ryoe / rush_attempts) : 0;
      return {
        rusher_player_name: r.rusher_player_name,
        rusher_player_id: r.rusher_player_id,
        rush_attempts,
        total_ryoe,
        ryoe_per_att
      };
    });
  }

  function setMinRangeBounds(){
    const rushes = state.data.map(d => d.rush_attempts);
    const min = Math.min(...rushes);
    const max = Math.max(...rushes);
    state.minRush = min;
    state.maxRush = max;
    // defaults
    state.minTouches = min;
    els.minRange.min = String(min);
    els.minRange.max = String(max);
    els.minRange.value = String(min);
    els.minNumber.min = String(min);
    els.minNumber.max = String(max);
    els.minNumber.value = String(min);
    els.minOut.textContent = String(min);
  }

  function sortData(){
    const dir = state.sortDir === 'asc' ? 1 : -1;
    const key = state.sortKey;
    state.filtered.sort((a,b)=>{
      const av = a[key]; const bv = b[key];
      if(av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }

  function applyFilter(){
    state.filtered = state.data.filter(d => d.rush_attempts >= state.minTouches);
    sortData();
    render();
  }

  function formatNumber(n, decimals=0){
    return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  }

  function render(){
    els.count.textContent = String(state.filtered.length);
    const rows = [];
    let rank = 0;
    for(const d of state.filtered){
      rank++;
      rows.push(`<tr class="fade-in">\n`+
        `<td class="sticky-col left numeric">${rank}</td>`+
        `<td class="sticky-col left">${escapeHtml(d.rusher_player_name)}</td>`+
        `<td>${escapeHtml(d.rusher_player_id)}</td>`+
        `<td class="numeric">${formatNumber(d.rush_attempts)}</td>`+
        `<td class="numeric">${formatNumber(d.total_ryoe, 3)}</td>`+
        `<td class="numeric">${formatNumber(d.ryoe_per_att, 4)}</td>`+
      `</tr>`);
    }
    if(rows.length === 0){
      els.tbody.innerHTML = `<tr><td colspan="6" class="empty">No rushers match this filter.</td></tr>`;
    } else {
      els.tbody.innerHTML = rows.join('');
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function handleSortClick(ev){
    const th = ev.target.closest('th'); if(!th) return;
    const key = th.getAttribute('data-key'); if(!key || key === 'rank') return;
    if(state.sortKey === key){
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key; state.sortDir = 'desc';
    }
    els.ths.forEach(el=> el.classList.remove('sort-asc','sort-desc'));
    th.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    sortData();
    render();
  }

  function wireControls(){
    els.minRange.addEventListener('input', e => {
      const v = Number(e.target.value);
      state.minTouches = v;
      els.minOut.textContent = String(v);
      els.minNumber.value = String(v);
      applyFilter();
    });
    els.minNumber.addEventListener('input', e => {
      const v = Math.max(state.minRush, Math.min(state.maxRush, Number(e.target.value)));
      state.minTouches = v;
      els.minOut.textContent = String(v);
      els.minRange.value = String(v);
      applyFilter();
    });
    document.querySelector('#leaderboard thead').addEventListener('click', handleSortClick);
  }

  async function init(){
    wireControls();
    try {
      const res = await fetch('/dataForWebsite.csv');
      if(!res.ok) throw new Error(`Failed to load CSV: ${res.status}`);
      const text = await res.text();
      const rows = parseCSV(text);
      state.data = coerceTypes(rows);
      setMinRangeBounds();
      // initial sort by total_ryoe desc
      state.sortKey = 'total_ryoe';
      state.sortDir = 'desc';
      applyFilter();
      // reflect header sort style for total_ryoe
      const th = els.ths.find(t => t.getAttribute('data-key') === 'total_ryoe');
      if(th) th.classList.add('sort-desc');
    } catch (err){
      console.error(err);
      els.tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(String(err))}</td></tr>`;
    }
  }

  init();
})();
