import { auth } from './firebase-init.js';
import {
  signInWithEmailAndPassword, sendPasswordResetEmail,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// >>>>>>>> COLOQUE AQUI OS E-MAILS DE ADMIN <<<<<<<<
const ADMIN_EMAILS = ["admin@liriobranco.com"]; // edite para o(s) seu(s) admin(s)

const $ = (s)=>document.querySelector(s);
const msg = $('#msg');

function showMsg(text, ok=false){
  if(!msg) return;
  msg.textContent = text;
  msg.style.display = 'block';
  msg.style.background = ok ? '#e8f7ee' : '#fde8e8';
  msg.style.color      = ok ? '#0f5132' : '#842029';
  msg.style.border     = '1px solid ' + (ok ? '#badbcc' : '#f5c2c7');
}

// LOGIN
$('#btn-entrar')?.addEventListener('click', async (e)=>{
  e.preventDefault();
  try{
    const email = $('#login-email').value.trim();
    const senha = $('#login-senha').value;
    await signInWithEmailAndPassword(auth, email, senha);
    showMsg("Login OK! Redirecionando...", true);
    location.href = "dashboard.html";
  }catch(err){ showMsg(traduz(err)); }
});

// ESQUECI A SENHA
$('#btn-esqueci')?.addEventListener('click', async (e)=>{
  e.preventDefault();
  try{
    const email = $('#login-email').value.trim();
    if(!email){ showMsg("Digite seu e-mail para receber o link."); return; }
    await sendPasswordResetEmail(auth, email);
    showMsg("E-mail de redefinição enviado!", true);
  }catch(err){ showMsg(traduz(err)); }
});

// LOGOUT
$('#btn-sair')?.addEventListener('click', async ()=>{
  await signOut(auth);
  location.href = "index.html";
});

// PROTEÇÃO DE PÁGINAS/MENUS
onAuthStateChanged(auth, (user)=>{
  const path = location.pathname;
  const precisaLogin = path.endsWith('dashboard.html') || path.endsWith('financeiro.html');

  if(precisaLogin && !user){
    location.href = 'index.html';
    return;
  }

  // Esconder menu Financeiro para não-admin
  const menuFin = $('#menu-financeiro');
  if(menuFin){
    if(!user || !ADMIN_EMAILS.includes(user.email)){
      menuFin.style.display = 'none';
    }else{
      menuFin.style.display = 'inline-block';
    }
  }

  // Bloquear página financeiro.html para não-admin
  if(user && path.endsWith('financeiro.html') && !ADMIN_EMAILS.includes(user.email)){
    alert("Apenas admin pode acessar o Financeiro.");
    location.href = 'dashboard.html';
  }
});

function traduz(err){
  const m = String(err?.code || err?.message || err);
  if(m.includes('auth/invalid-email')) return 'E-mail inválido.';
  if(m.includes('auth/missing-password')) return 'Digite a senha.';
  if(m.includes('auth/wrong-password') || m.includes('auth/invalid-credential')) return 'E-mail ou senha incorretos.';
  if(m.includes('auth/too-many-requests')) return 'Muitas tentativas. Tente mais tarde.';
  if(m.includes('api-key-not-valid') || m.includes('auth/invalid-api-key')) return 'API key inválida no firebase-init.js.';
  return m;
}

