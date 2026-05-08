// Simple Study Guide app - vanilla JS
(function(){
  const subjectListEl = document.getElementById('subjectList');
  const newSubjectBtn = document.getElementById('newSubjectBtn');
  const contentArea = document.getElementById('contentArea');
  const addNoteBtn = document.getElementById('addNoteBtn');
  const addCardBtn = document.getElementById('addCardBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  let subjects = []; // {id, title, items: [{id,type,front,back,body,created}]}
  let selectedSubjectId = null;
  let nextId = 1;

  function init(){
    newSubjectBtn.addEventListener('click', createSubject);
    addNoteBtn.addEventListener('click', createNote);
    addCardBtn.addEventListener('click', createCard);
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', ()=>importFile.click());
    importFile.addEventListener('change', handleImportFile);

    load();
    renderSubjects();
    renderContent();
  }

  function save(){
    const payload = {subjects,nextId};
    localStorage.setItem('studyGuide', JSON.stringify(payload));
  }

  function load(){
    try{
      const txt = localStorage.getItem('studyGuide');
      if(!txt) return seedSample();
      const obj = JSON.parse(txt);
      subjects = obj.subjects||[];
      nextId = obj.nextId || (subjects.reduce((m,s)=>Math.max(m, s.id),0)+1);
      if(subjects.length) selectedSubjectId = subjects[0].id;
    }catch(e){ console.warn('Load failed',e); seedSample(); }
  }

  function seedSample(){
    subjects = [
      {id:1,title:'Math',items:[{id:1,type:'note',body:'Review algebra: factoring, quadratic formula',created:Date.now()}]},
      {id:2,title:'History',items:[{id:2,type:'card',front:'Who was the first president of the USA?',back:'George Washington',created:Date.now()}]}
    ];
    nextId = 3;
    selectedSubjectId = 1;
    save();
  }

  function createSubject(){
    const title = prompt('Subject title');
    if(!title) return;
    const id = nextId++;
    subjects.push({id,title,items:[]});
    selectedSubjectId = id;
    save(); renderSubjects(); renderContent();
  }

  function createNote(){
    if(!ensureSubject()) return;
    const body = prompt('Note text');
    if(!body) return;
    const subj = subjects.find(s=>s.id===selectedSubjectId);
    subj.items.push({id:nextId++,type:'note',body,created:Date.now()});
    save(); renderContent(); renderSubjects();
  }

  function createCard(){
    if(!ensureSubject()) return;
    const front = prompt('Flashcard front (question)');
    if(front===null) return;
    const back = prompt('Flashcard back (answer)');
    if(back===null) return;
    const subj = subjects.find(s=>s.id===selectedSubjectId);
    subj.items.push({id:nextId++,type:'card',front,back,created:Date.now()});
    save(); renderContent(); renderSubjects();
  }

  function ensureSubject(){
    if(selectedSubjectId==null){ alert('Create or select a subject first'); return false; }
    return true;
  }

  function renderSubjects(){
    subjectListEl.innerHTML = '';
    subjects.forEach(s=>{
      const li = document.createElement('li');
      li.textContent = `${s.title} (${s.items.length})`;
      if(s.id===selectedSubjectId) li.classList.add('active');
      li.addEventListener('click', ()=>{ selectedSubjectId = s.id; renderSubjects(); renderContent(); });
      // right-click to delete
      li.addEventListener('contextmenu', (e)=>{ e.preventDefault(); if(confirm('Delete subject?')){ subjects = subjects.filter(x=>x.id!==s.id); if(selectedSubjectId===s.id) selectedSubjectId = subjects.length?subjects[0].id:null; save(); renderSubjects(); renderContent(); } });
      subjectListEl.appendChild(li);
    });
  }

  function renderContent(){
    contentArea.innerHTML = '';
    const subj = subjects.find(s=>s.id===selectedSubjectId);
    if(!subj){ const p = document.createElement('p'); p.className='placeholder'; p.textContent='Select or create a subject to begin.'; contentArea.appendChild(p); return; }

    const h2 = document.createElement('h2'); h2.textContent = subj.title; contentArea.appendChild(h2);

    if(!subj.items.length){ const p = document.createElement('p'); p.className='placeholder'; p.textContent='No notes or flashcards yet.'; contentArea.appendChild(p); }

    subj.items.forEach(item=>{
      if(item.type==='note'){
        const div = document.createElement('div'); div.className='note';
        const meta = document.createElement('div'); meta.className='meta'; meta.textContent = new Date(item.created).toLocaleString();
        const body = document.createElement('div'); body.textContent = item.body;
        const actions = document.createElement('div'); actions.className='sg-actions';
        const del = document.createElement('button'); del.textContent='Delete'; del.addEventListener('click', ()=>{ if(confirm('Delete note?')){ subj.items = subj.items.filter(i=>i.id!==item.id); save(); renderContent(); renderSubjects(); } });
        const edit = document.createElement('button'); edit.textContent='Edit'; edit.addEventListener('click', ()=>{ const t = prompt('Edit note', item.body); if(t!==null){ item.body = t; save(); renderContent(); renderSubjects(); } });
        actions.appendChild(edit); actions.appendChild(del);
        div.appendChild(meta); div.appendChild(body); div.appendChild(actions);
        contentArea.appendChild(div);
      } else if(item.type==='card'){
        const div = document.createElement('div'); div.className='card';
        const front = document.createElement('div'); front.className='front'; front.textContent = item.front;
        const back = document.createElement('div'); back.className='back'; back.textContent = item.back; back.style.display='none';
        const actions = document.createElement('div'); actions.className='sg-actions';
        const show = document.createElement('button'); show.textContent='Show Answer'; show.addEventListener('click', ()=>{ back.style.display = back.style.display==='none'?'block':'none'; show.textContent = back.style.display==='none'?'Show Answer':'Hide Answer'; });
        const del = document.createElement('button'); del.textContent='Delete'; del.addEventListener('click', ()=>{ if(confirm('Delete card?')){ subj.items = subj.items.filter(i=>i.id!==item.id); save(); renderContent(); renderSubjects(); } });
        const edit = document.createElement('button'); edit.textContent='Edit'; edit.addEventListener('click', ()=>{ const f = prompt('Edit front', item.front); if(f===null) return; const b = prompt('Edit back', item.back); if(b===null) return; item.front=f; item.back=b; save(); renderContent(); renderSubjects(); });
        actions.appendChild(show); actions.appendChild(edit); actions.appendChild(del);
        div.appendChild(front); div.appendChild(back); div.appendChild(actions);
        contentArea.appendChild(div);
      }
    });
  }

  function exportData(){
    const data = {subjects,nextId};
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'study-guide.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function handleImportFile(e){
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const reader = new FileReader(); reader.onload = function(ev){ try{ const obj = JSON.parse(ev.target.result); subjects = obj.subjects||[]; nextId = obj.nextId || (subjects.reduce((m,s)=>Math.max(m,s.id),0)+1); selectedSubjectId = subjects.length?subjects[0].id:null; save(); renderSubjects(); renderContent(); }catch(err){ alert('Invalid JSON'); } }; reader.readAsText(f); importFile.value='';
  }

  // Initialize
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();

})();

