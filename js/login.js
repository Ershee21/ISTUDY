// login.js — simple client-side login/register using Web Crypto and localStorage
(function(){
  const form = document.getElementById('loginForm');
  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const messageEl = document.getElementById('message');
  const registerBtn = document.getElementById('registerBtn');

  // Helpers: persist users in localStorage as { username: {salt, hash} }
  function getUsers(){
    try{ return JSON.parse(localStorage.getItem('users')||'{}'); }catch(e){ return {}; }
  }
  function setUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }

  async function hashPassword(password, salt){
    // salt should be Uint8Array
    const enc = new TextEncoder();
    const pw = enc.encode(password);
    const data = new Uint8Array(salt.length + pw.length);
    data.set(salt,0); data.set(pw,salt.length);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  function randomSalt(len=12){
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return arr;
  }

  function toBase64(u8){
    // Convert Uint8Array to base64
    let s = '';
    for(let i=0;i<u8.length;i++) s += String.fromCharCode(u8[i]);
    return btoa(s);
  }
  function fromBase64(b64){
    const s = atob(b64);
    const u = new Uint8Array(s.length);
    for(let i=0;i<s.length;i++) u[i] = s.charCodeAt(i);
    return u;
  }

  async function registerUser(username, password){
    const users = getUsers();
    if(users[username]) throw new Error('User exists');
    const salt = randomSalt(16);
    const hash = await hashPassword(password, salt);
    users[username] = {salt: toBase64(salt), hash: toBase64(hash)};
    setUsers(users);
  }

  async function verifyUser(username,password){
    const users = getUsers();
    const record = users[username];
    if(!record) return false;
    const salt = fromBase64(record.salt);
    const hash = await hashPassword(password, salt);
    return toBase64(hash) === record.hash;
  }

  function showMessage(msg, isError=true){
    messageEl.textContent = msg;
    messageEl.style.color = isError ? '#b00020' : '#0b6623';
  }

  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const u = usernameEl.value.trim();
    const p = passwordEl.value;
    if(!u || !p){ showMessage('Enter username and password'); return; }
    showMessage('Checking...', false);
    try{
      const ok = await verifyUser(u,p);
      if(ok){
        localStorage.setItem('sessionUser', u);
        showMessage('Login successful — redirecting...', false);
        setTimeout(()=> location.href = 'study.html', 600);
      } else {
        showMessage('Invalid username or password');
      }
    }catch(err){ console.error(err); showMessage('Login failed'); }
  });

  registerBtn.addEventListener('click', async ()=>{
    const u = usernameEl.value.trim();
    const p = passwordEl.value;
    if(!u || !p){ showMessage('Enter a username and password to register'); return; }
    try{
      await registerUser(u,p);
      showMessage('Registration successful — you can now log in', false);
    }catch(err){ showMessage(err.message || 'Registration failed'); }
  });

})();

