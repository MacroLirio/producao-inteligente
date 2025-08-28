import { db } from './firebase-init.js';
import {
  collection, addDoc, getDocs, doc, updateDoc, serverTimestamp,
  query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const $ = (s)=>document.querySelector(s);

// ====== TABS (dashboard)
document.querySelectorAll('.tab')?.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tabpane').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $('#sec-'+btn.dataset.fluxo).classList.add('active');
  });
});

// ====== Form de novo projeto (Inscrição)
$('#btn-toggle-form')?.addEventListener('click', ()=>{
  const f = $('#form-inscricao'); f.style.display = (f.style.display==='none'?'block':'none');
});
document.addEventListener('click', (e)=>{
  if(e.target?.classList?.contains('btn-add-rubrica')){
    const area = $('#planilha-area');
    const row = document.createElement('div');
    row.className = 'grid3 plan-row';
    row.innerHTML = `
      <input class="rubrica" placeholder="Rubrica"/>
      <input class="valor" type="number" placeholder="Valor"/>
      <button type="button" class="btn-secundario btn-remover">Remover</button>
    `;
    area.appendChild(row);
  }
  if(e.target?.classList?.contains('btn-remover')){
    e.target.closest('.plan-row')?.remove();
  }
});

// Salvar Inscrição
$('#form-inscricao')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const plan = [...document.querySelectorAll('#planilha-area .plan-row')].map(r=>{
    const rubrica = r.querySelector('.rubrica')?.value || '';
    const valor = Number(r.querySelector('.valor')?.value || 0);
    return {rubrica, valor};
  });
  const data = {
    nome: $('#p-nome').value,
    proponente: $('#p-proponente').value,
    edital: $('#p-edital').value,
    atividades: $('#p-ativ').value,
    cidade: $('#p-cidade').value,
    estado: $('#p-estado').value,
    bairro: $('#p-bairro').value,
    cronogramaInscrito: $('#p-crono').value,
    planilha: plan,
    valorRubricas: Number($('#p-valorRubrica').value || 0),
    valorProjeto: Number($('#p-valorProjeto').value || 0),
    fluxo: 'inscricao',
    criadoEm: serverTimestamp(),
    historico: [{acao:'criado', quando: new Date().toISOString()}]
  };
  await addDoc(collection(db,'projetos'), data);
  alert('Projeto salvo em Inscrição.');
  location.reload();
});

// ====== Listagens por fluxo
async function listarFluxo(fluxo, containerId, renderer){
  const c = $(containerId); if(!c) return;
  c.innerHTML = '<small>Carregando...</small>';
  const q = query(collection(db,'projetos'), where('fluxo','==',fluxo));
  const snap = await getDocs(q);
  let html = '';
  snap.forEach(d=>{
    html += renderer(d.id, d.data());
  });
  c.innerHTML = html || '<small>Nenhum projeto neste fluxo.</small>';
}

// Cartões/Forms por fluxo
const cardInscricao = (id,p)=>`
  <div class="item">
    <h4>${p.nome} <span class="badge">Inscrição</span></h4>
    <small>Proponente: ${p.proponente} • Edital: ${p.edital || '-'}</small>
    <details><summary>Planilha de custos</summary>
      ${ (p.planilha||[]).map(i=>`<div>- ${i.rubrica}: R$ ${i.valor||0}</div>`).join('') || '<div><small>Sem linhas.</small></div>' }
      <div><small>Total rubricas: R$ ${p.valorRubricas||0} • Valor projeto: R$ ${p.valorProjeto||0}</small></div>
    </details>
    <button data-act="to-captacao" data-id="${id}">Avançar para Captação/Aprovação</button>
  </div>
`;

const cardCaptacao = (id,p)=>`
  <div class="item">
    <h4>${p.nome} <span class="badge">Captação/Aprovação</span></h4>
    <div class="grid3">
      <div><label>NOVO VALOR</label><input data-field="novoValor" data-id="${id}" type="number" value="${p?.dadosCaptacao?.novoValor||''}"/></div>
      <div><label>Status</label>
        <select data-field="status" data-id="${id}">
          <option value="" ${!p?.dadosCaptacao?.status?'selected':''}>Selecione</option>
          <option value="aprovado"  ${p?.dadosCaptacao?.status==='aprovado'?'selected':''}>Aprovado</option>
          <option value="reprovado" ${p?.dadosCaptacao?.status==='reprovado'?'selected':''}>Reprovado</option>
          <option value="cancelado" ${p?.dadosCaptacao?.status==='cancelado'?'selected':''}>Cancelado</option>
        </select>
      </div>
      <div><label>Data do status</label><input data-field="dataStatus" data-id="${id}" type="date" value="${p?.dadosCaptacao?.dataStatus||''}"/></div>
    </div>
    <button data-act="salvar-captacao" data-id="${id}">Salvar</button>
    <button data-act="avancar-captacao" data-id="${id}">Avançar</button>
  </div>
`;

const cardExecucao = (id,p)=>`
  <div class="item">
    <h4>${p.nome} <span class="badge">Execução</span></h4>
    <div class="grid3">
      <div><label>Modificações importantes</label><textarea data-field="modificacoes" data-id="${id}">${p?.dadosExecucao?.modificacoes||''}</textarea></div>
      <div><label>Novas datas (início)</label><input data-field="dataInicio" data-id="${id}" type="date" value="${p?.dadosExecucao?.dataInicio||''}"/></div>
      <div><label>Novas datas (fim)</label><input data-field="dataFim" data-id="${id}" type="date" value="${p?.dadosExecucao?.dataFim||''}"/></div>
    </div>

    <details><summary>Execução financeira (clique para abrir)</summary>
      ${(p.planilha||[]).map((linha,idx)=>{
        const ef = p?.dadosExecucao?.execFinanceira?.[idx] || {};
        return `
        <div class="card">
          <b>${linha.rubrica}</b> — R$ ${linha.valor||0}
          <div class="grid3">
            <div><label>Rubrica normal?</label>
              <select data-field="rubricaNormal" data-id="${id}" data-idx="${idx}">
                <option value="sim" ${ef.rubricaNormal==='sim'?'selected':''}>Sim</option>
                <option value="nao" ${ef.rubricaNormal==='nao'?'selected':''}>Não</option>
              </select>
            </div>
            <div><label>EXECUTADO?</label>
              <select data-field="executado" data-id="${id}" data-idx="${idx}">
                <option value="nao" ${ef.executado==='nao'?'selected':''}>Não</option>
                <option value="sim" ${ef.executado==='sim'?'selected':''}>Sim</option>
              </select>
            </div>
            <div><label>Nota fiscal de (CPF/CNPJ)</label>
              <input data-field="notaFiscalDe" data-id="${id}" data-idx="${idx}" placeholder="CPF/CNPJ" value="${ef.notaFiscalDe||''}"/>
            </div>
          </div>
        </div>`;
      }).join('')}
    </details>

    <div style="margin-top:8px">
      <label><input type="checkbox" data-field="projetoExecutado" data-id="${id}" ${p?.dadosExecucao?.projetoExecutado?'checked':''}/> Projeto executado (SIM)</label>
    </div>
    <button data-act="salvar-execucao" data-id="${id}">Salvar</button>
    <button data-act="avancar-execucao" data-id="${id}">Avançar</button>
  </div>
`;

const cardPrestacao = (id,p)=>`
  <div class="item">
    <h4>${p.nome} <span class="badge">Prestação de Contas</span></h4>
    <div class="grid3">
      <div><label>Data entrada no fluxo</label><input data-field="dataEntrada" data-id="${id}" type="date" value="${p?.prestacao?.dataEntrada||''}"/></div>
      <div><label>Data máxima para envio</label><input data-field="dataMaxEnvio" data-id="${id}" type="date" value="${p?.prestacao?.dataMaxEnvio||''}"/></div>
      <div><label>Data início prestação</label><input data-field="dataInicio" data-id="${id}" type="date" value="${p?.prestacao?.dataInicio||''}"/></div>
    </div>
    <div class="grid3">
      <div><label>Data fim prestação</label><input data-field="dataFim" data-id="${id}" type="date" value="${p?.prestacao?.dataFim||''}"/></div>
      <div><label>Data de envio</label><input data-field="dataEnvio" data-id="${id}" type="date" value="${p?.prestacao?.dataEnvio||''}"/></div>
    </div>
    <button data-act="salvar-prestacao" data-id="${id}">Salvar</button>
    <button data-act="avancar-prestacao" data-id="${id}">Avançar</button>
  </div>
`;

const cardFinalizado = (id,p)=>`
  <div class="item">
    <h4>${p.nome} <span class="badge">Finalizado</span></h4>
    <div><small>Motivo: ${p?.finalizacao?.motivo||'-'} • Data: ${p?.finalizacao?.data||'-'}</small></div>
  </div>
`;

// listar todos os fluxos
listarFluxo('inscricao', '#lista-inscricao', cardInscricao);
listarFluxo('captacao',  '#lista-captacao',  cardCaptacao);
listarFluxo('execucao',  '#lista-execucao',  cardExecucao);
listarFluxo('prestacao', '#lista-prestacao', cardPrestacao);
listarFluxo('finalizado','#lista-finalizado',cardFinalizado);

// ====== Ações (delegação)
document.addEventListener('click', async (e)=>{
  const act = e.target?.dataset?.act;
  const id  = e.target?.dataset?.id;
  if(!act || !id) return;

  if(act==='to-captacao'){
    await updateDoc(doc(db,'projetos',id), {fluxo:'captacao', historico:hist('inscricao→captacao')});
    alert('Movido para Captação/Aprovação.');
    location.reload();
  }

  if(act==='salvar-captacao'){
    const parent = e.target.closest('.item');
    const novoValor = parent.querySelector('[data-field="novoValor"]').value || null;
    const status    = parent.querySelector('[data-field="status"]').value || '';
    const dataStatus= parent.querySelector('[data-field="dataStatus"]').value || '';
    await updateDoc(doc(db,'projetos',id), {
      dadosCaptacao: {novoValor: novoValor?Number(novoValor):null, status, dataStatus},
      historico: hist('captacao:salvar')
    });
    alert('Captação/Aprovação salva.');
  }

  if(act==='avancar-captacao'){
    const parent = e.target.closest('.item');
    const status = parent.querySelector('[data-field="status"]').value || '';
    if(status==='aprovado'){
      await updateDoc(doc(db,'projetos',id), {fluxo:'execucao', historico:hist('captacao→execucao')});
      alert('Projeto APROVADO → Execução.');
    }else{
      const motivo = status==='reprovado' ? 'Reprovação' : 'Cancelado';
      await updateDoc(doc(db,'projetos',id), {
        fluxo:'finalizado',
        finalizacao:{motivo, data: hoje(), origem:'captacao'},
        historico: hist('captacao→finalizado('+motivo+')')
      });
      alert('Projeto finalizado por: '+motivo);
    }
    location.reload();
  }

  if(act==='salvar-execucao'){
    const parent = e.target.closest('.item');
    const modificacoes = parent.querySelector('[data-field="modificacoes"]').value || '';
    const dataInicio = parent.querySelector('[data-field="dataInicio"]').value || '';
    const dataFim    = parent.querySelector('[data-field="dataFim"]').value || '';

    // execucao financeira
    const execFinanceira = [];
    parent.querySelectorAll('[data-field="rubricaNormal"]').forEach(el=>{
      const i = Number(el.dataset.idx);
      execFinanceira[i] = execFinanceira[i] || {};
      execFinanceira[i].rubricaNormal = el.value;
    });
    parent.querySelectorAll('[data-field="executado"]').forEach(el=>{
      const i = Number(el.dataset.idx);
      execFinanceira[i] = execFinanceira[i] || {};
      execFinanceira[i].executado = el.value;
    });
    parent.querySelectorAll('[data-field="notaFiscalDe"]').forEach(el=>{
      const i = Number(el.dataset.idx);
      execFinanceira[i] = execFinanceira[i] || {};
      execFinanceira[i].notaFiscalDe = el.value;
    });
    const projetoExecutado = parent.querySelector('[data-field="projetoExecutado"]')?.checked || false;

    await updateDoc(doc(db,'projetos',id), {
      dadosExecucao: {modificacoes, dataInicio, dataFim, execFinanceira, projetoExecutado},
      historico: hist('execucao:salvar')
    });
    alert('Execução salva.');
  }

  if(act==='avancar-execucao'){
    const parent = e.target.closest('.item');
    const ok = parent.querySelector('[data-field="projetoExecutado"]')?.checked;
    if(!ok){ alert('Marque "Projeto executado (SIM)" para avançar.'); return; }
    await updateDoc(doc(db,'projetos',id), {
      fluxo:'prestacao',
      prestacao: { dataEntrada: hoje() },
      historico: hist('execucao→prestacao')
    });
    alert('Projeto → Prestação de Contas.');
    location.reload();
  }

  if(act==='salvar-prestacao'){
    const parent = e.target.closest('.item');
    const p = {
      dataEntrada: parent.querySelector('[data-field="dataEntrada"]').value || '',
      dataMaxEnvio: parent.querySelector('[data-field="dataMaxEnvio"]').value || '',
      dataInicio: parent.querySelector('[data-field="dataInicio"]').value || '',
      dataFim: parent.querySelector('[data-field="dataFim"]').value || '',
      dataEnvio: parent.querySelector('[data-field="dataEnvio"]').value || '',
    };
    await updateDoc(doc(db,'projetos',id), { prestacao: p, historico: hist('prestacao:salvar') });
    alert('Prestação de Contas salva.');
  }

  if(act==='avancar-prestacao'){
    await updateDoc(doc(db,'projetos',id), {
      fluxo:'finalizado',
      finalizacao:{motivo:'Executado', data: hoje(), origem:'prestacao'},
      historico: hist('prestacao→finalizado(Executado)')
    });
    alert('Projeto finalizado (Executado).');
    location.reload();
  }
});

function hoje(){ return new Date().toISOString().slice(0,10); }
function hist(txt){ return [{acao:txt, quando: new Date().toISOString()}]; }

// ====== FINANCEIRO (UI — a proteção real está nas regras do Firestore)
$('#form-financeiro')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const reg = {
    projeto: $('#fin-projeto').value,
    proponente: $('#fin-proponente').value,
    valorPago: Number($('#fin-valor').value || 0),
    percentualRecebido: Number($('#fin-percentual').value || 0),
    dataCadastro: $('#fin-data').value,
    criadoEm: serverTimestamp(),
  };
  await addDoc(collection(db,'financeiro'), reg);
  alert('Registro financeiro salvo.');
  location.reload();
});

async function carregarFinanceiro(){
  const cont = $('#financeiro-lista'); if(!cont) return;
  const snap = await getDocs(collection(db,'financeiro'));
  let html='';
  snap.forEach(d=>{
    const f=d.data();
    html += `<div class="item"><h4>${f.projeto}</h4>
      <div>Proponente: ${f.proponente}</div>
      <div>Valor pago: R$ ${f.valorPago} (${f.percentualRecebido}%)</div>
      <div>Data: ${f.dataCadastro||'-'}</div></div>`;
  });
  cont.innerHTML = html || '<small>Sem registros.</small>';
}
carregarFinanceiro();

// ====== EXPORTAÇÕES (Excel/PDF)
function exportExcelFrom(containerSelector, nome='relatorio'){
  const el = document.querySelector(containerSelector);
  const linhas = [...el.querySelectorAll('.item')].map(i=>i.innerText.replace(/\n/g,' | '));
  const ws = XLSX.utils.aoa_to_sheet([['Relatório'], ...linhas.map(l=>[l])]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
  XLSX.writeFile(wb, `${nome}.xlsx`);
}
function exportPdfFrom(containerSelector, nome='relatorio'){
  const el = document.querySelector(containerSelector);
  const blocos = [...el.querySelectorAll('.item')].map(i=>i.innerText.split('\n'));
  const { jsPDF } = window.jspdf;
  const docpdf = new jsPDF();
  let y=10;
  docpdf.text('Relatório', 10, y); y+=10;
  blocos.forEach(bloco=>{
    bloco.forEach(l=>{
      docpdf.text(String(l).slice(0,100), 10, y);
      y+=8; if(y>280){ docpdf.addPage(); y=10; }
    });
    y+=6;
  });
  docpdf.save(`${nome}.pdf`);
}

$('#export-inscricao-excel')?.addEventListener('click', ()=>exportExcelFrom('#lista-inscricao','inscricao'));
$('#export-inscricao-pdf')  ?.addEventListener('click', ()=>exportPdfFrom  ('#lista-inscricao','inscricao'));

$('#export-captacao-excel')?.addEventListener('click', ()=>exportExcelFrom('#lista-captacao','captacao'));
$('#export-captacao-pdf')  ?.addEventListener('click', ()=>exportPdfFrom  ('#lista-captacao','captacao'));

$('#export-execucao-excel')?.addEventListener('click', ()=>exportExcelFrom('#lista-execucao','execucao'));
$('#export-execucao-pdf')  ?.addEventListener('click', ()=>exportPdfFrom  ('#lista-execucao','execucao'));

$('#export-prestacao-excel')?.addEventListener('click', ()=>exportExcelFrom('#lista-prestacao','prestacao'));
$('#export-prestacao-pdf')  ?.addEventListener('click', ()=>exportPdfFrom  ('#lista-prestacao','prestacao'));

$('#export-finalizado-excel')?.addEventListener('click', ()=>exportExcelFrom('#lista-finalizado','finalizados'));
$('#export-finalizado-pdf')  ?.addEventListener('click', ()=>exportPdfFrom  ('#lista-finalizado','finalizados'));


