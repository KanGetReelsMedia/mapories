let memories = JSON.parse(localStorage.getItem('mapories_journal_final')) || [];
const viewport = document.getElementById('timeline-viewport');
const track = document.getElementById('memory-track');
const threadLayer = document.getElementById('thread-layer');

function init() { 
    render(); 
    setupDrag(); 
}

function render() {
    track.innerHTML = '';
    track.appendChild(threadLayer);
    threadLayer.innerHTML = '';
    
    // Sort by Date then Time chronological verification
    memories.sort((a, b) => {
        let dtA = new Date(a.date + ' ' + a.time);
        let dtB = new Date(b.date + ' ' + b.time);
        return dtA - dtB;
    });

    memories.forEach((m, index) => {
        const card = document.createElement('div');
        card.className = 'mem-card';
        card.style.setProperty('--rotation', `${(index % 2 === 0 ? 2 : -2)}deg`);
        card.style.marginTop = index % 2 === 0 ? '60px' : '-60px';
        card.id = `card-${m.id}`;
        card.setAttribute('data-date', m.date);

        card.innerHTML = `
            <div class="card-meta">
                <span>${m.time} • ${formatDate(m.date)}</span>
                <span class="material-icons" style="font-size:1.3rem">${m.weather}</span>
            </div>
            <div style="font-weight:bold; font-size:1.3rem; margin-bottom:12px; color:#fff; letter-spacing: -0.5px;">${m.title}</div>
            <div style="font-size:0.95rem; color:#bbb; line-height:1.7;">${m.note}</div>
            <div class="card-location">
                <span class="material-icons" style="font-size:1rem">place</span>
                <span>${m.location}</span>
            </div>
        `;
        track.appendChild(card);
    });
    setTimeout(drawThreads, 150);
}

function openReliveSearch() {
    document.getElementById('reliveModal').style.display = 'flex';
    document.getElementById('reliveDate').value = new Date().toISOString().split('T')[0];
}

async function startRelive() {
    const targetDate = document.getElementById('reliveDate').value;
    const dayMems = memories.filter(m => m.date === targetDate);
    document.getElementById('reliveModal').style.display = 'none';

    if (dayMems.length === 0) return alert("No entries recorded for that day.");

    // Cinema Playback Engine Activation
    document.getElementById('grid-container').style.opacity = '0.1';
    document.getElementById('main-header').style.opacity = '0';
    document.getElementById('top-ui').style.opacity = '0';
    document.getElementById('bottom-ui').style.opacity = '0';
    document.getElementById('playback-ui').style.opacity = '1';
    document.getElementById('pb-date').innerText = new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    for (let m of dayMems) {
        const card = document.getElementById(`card-${m.id}`);
        card.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        card.classList.add('active-playback');
        await new Promise(r => setTimeout(r, 4500));
        card.classList.remove('active-playback');
    }

    // Deactivate Cinema Playback Mode
    document.getElementById('grid-container').style.opacity = '1';
    document.getElementById('main-header').style.opacity = '1';
    document.getElementById('top-ui').style.opacity = '1';
    document.getElementById('bottom-ui').style.opacity = '1';
    document.getElementById('playback-ui').style.opacity = '0';
}

function drawThreads() {
    threadLayer.innerHTML = '';
    const cards = document.querySelectorAll('.mem-card');
    for (let i = 0; i < cards.length - 1; i++) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", cards[i].offsetLeft + 160);
        line.setAttribute("y1", cards[i].offsetTop + 120);
        line.setAttribute("x2", cards[i+1].offsetLeft + 160);
        line.setAttribute("y2", cards[i+1].offsetTop + 120);
        line.setAttribute("class", "thread-line");
        threadLayer.appendChild(line);
    }
}

function openModal() {
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('mDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('mTime').value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function closeModal() { 
    document.getElementById('addModal').style.display = 'none'; 
}

function handleSave() {
    const data = {
        id: Date.now(),
        title: document.getElementById('mTitle').value,
        note: document.getElementById('mNote').value,
        date: document.getElementById('mDate').value,
        time: document.getElementById('mTime').value,
        location: document.getElementById('mLoc').value || 'Unknown Location',
        weather: document.getElementById('mWeather').value,
    };
    if(!data.title) return alert("Moment name is required.");
    memories.push(data);
    localStorage.setItem('mapories_journal_final', JSON.stringify(memories));
    render();
    closeModal();
}

function setupDrag() {
    let isDown = false; 
    let startX; 
    let scrollLeft;
    
    viewport.addEventListener('mousedown', (e) => { 
        isDown = true; 
        startX = e.pageX - viewport.offsetLeft; 
        scrollLeft = viewport.scrollLeft; 
    });
    
    viewport.addEventListener('mouseup', () => isDown = false);
    viewport.addEventListener('mouseleave', () => isDown = false);
    
    viewport.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        viewport.scrollLeft = scrollLeft - (e.pageX - viewport.offsetLeft - startX) * 2;
        const center = window.innerWidth / 2;
        document.querySelectorAll('.mem-card').forEach(card => {
            const r = card.getBoundingClientRect();
            if(r.left < center + 100 && r.right > center - 100) {
                document.getElementById('year-display').innerText = card.getAttribute('data-date').split('-')[0];
            }
        });
    });
    
    viewport.addEventListener('wheel', (e) => { 
        viewport.scrollLeft += e.deltaY; 
    });
}

function formatDate(d) { 
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); 
}

window.onload = init;