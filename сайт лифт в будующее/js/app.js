'use strict';
(() => {
  const STORAGE_KEY = 'stroiresurs_competition_v3';
  const PROFILE_KEY = 'stroiresurs_profile_v1';
  const titles = {dashboard:'Обзор', procurement:'Закупки', warehouse:'Склад и логистика', substitutes:'Импортозамещение', analytics:'Аналитика', bim:'ТИМ / BIM'};
  const initialStock = [
    {id:1,name:'Цемент М500',unit:'мешок',qty:12,min:50},
    {id:2,name:'Арматура А500С',unit:'т',qty:4.5,min:2},
    {id:3,name:'Кирпич керамический',unit:'шт.',qty:2400,min:1000},
    {id:4,name:'Утеплитель фасадный',unit:'м²',qty:180,min:200},
    {id:5,name:'Бетон М300',unit:'м³',qty:22,min:10}
  ];
  const initialOrders = [
    {id:1001,material:'Бетон М300',supplier:'Поставщик А',qty:120,unit:'м³',amount:420000,status:'Доставлено',date:'06.11.2026',note:'Демонстрационная запись'},
    {id:1002,material:'Арматура А500С',supplier:'Поставщик Б',qty:4.5,unit:'т',amount:318000,status:'В пути',date:'06.11.2026',note:'Демонстрационная запись'},
    {id:1003,material:'Утеплитель фасадный',supplier:'Поставщик В',qty:180,unit:'м²',amount:189000,status:'Согласование',date:'05.11.2026',note:'Демонстрационная запись'},
    {id:1004,material:'Цемент М500',supplier:'Не выбран',qty:100,unit:'мешок',amount:65000,status:'Новый запрос',date:'05.11.2026',note:'Демонстрационная запись'}
  ];
  const demoChart = [
    {m:'Июн',plan:82,fact:69},{m:'Июл',plan:88,fact:74},{m:'Авг',plan:94,fact:80},
    {m:'Сен',plan:91,fact:84},{m:'Окт',plan:100,fact:88},{m:'Ноя',plan:96,fact:78}
  ];
  const substituteData = {
    insulation:{title:'Теплоизоляция фасада',a:'Материал А · исходный вариант',b:'Материал Б · кандидат для проверки',unit:'м²',fields:[['Назначение','Наружная теплоизоляция','Наружная теплоизоляция'],['Теплопроводность, Вт/(м·К)','0,036','0,037'],['Плотность, кг/м³','135','140'],['Прочность на сжатие, кПа','30','35'],['Пожарные характеристики','Проверить документы','Проверить документы'],['Норматив / сертификаты','Требует проверки','Требует проверки']]},
    cable:{title:'Кабельная продукция',a:'Материал А · исходный вариант',b:'Материал Б · кандидат для проверки',unit:'м',fields:[['Назначение','Силовая линия','Силовая линия'],['Номинальное напряжение','0,66 кВ','0,66 кВ'],['Число жил','3','3'],['Сечение','3 × 2,5 мм²','3 × 2,5 мм²'],['Пожарное исполнение','Проверить маркировку','Проверить маркировку'],['Норматив / сертификаты','Требует проверки','Требует проверки']]},
    paint:{title:'Фасадное покрытие',a:'Материал А · исходный вариант',b:'Материал Б · кандидат для проверки',unit:'л',fields:[['Назначение','Фасадная окраска','Фасадная окраска'],['Расход, л/м²','0,18','0,20'],['Паропроницаемость','Сверить техлист','Сверить техлист'],['Стойкость к осадкам','Сверить техлист','Сверить техлист'],['Пожарные характеристики','Проверить документы','Проверить документы'],['Норматив / сертификаты','Требует проверки','Требует проверки']]},
    concrete:{title:'Бетонная смесь',a:'Материал А · исходный вариант',b:'Материал Б · кандидат для проверки',unit:'м³',fields:[['Назначение','Конструкционный бетон','Конструкционный бетон'],['Класс прочности','B25','B25'],['Морозостойкость','F150 · проверить','F150 · проверить'],['Водонепроницаемость','W6 · проверить','W6 · проверить'],['Подвижность','Проверить П-класс','Проверить П-класс'],['Норматив / паспорт','Требует проверки','Требует проверки']]},
    steel:{title:'Арматурная сталь',a:'Материал А · исходный вариант',b:'Материал Б · кандидат для проверки',unit:'т',fields:[['Назначение','Армирование ЖБК','Армирование ЖБК'],['Класс арматуры','А500С','А500С'],['Диаметр','Сверить ведомость','Сверить ведомость'],['Свариваемость','Подтвердить паспортом','Подтвердить паспортом'],['Механические свойства','Проверить сертификат','Проверить сертификат'],['Норматив / сертификаты','Требует проверки','Требует проверки']]},
    cement:{title:'Цемент',a:'Материал А · исходный вариант',b:'Материал Б · кандидат для проверки',unit:'мешок',fields:[['Назначение','Общестроительные работы','Общестроительные работы'],['Класс прочности','Сверить маркировку','Сверить маркировку'],['Срок хранения','Проверить дату','Проверить дату'],['Минералогический состав','Сверить паспорт','Сверить паспорт'],['Условия хранения','Сверить регламент','Сверить регламент'],['Норматив / сертификаты','Требует проверки','Требует проверки']]}
  };
  const readJson = (key, fallback) => { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const loaded = readJson(STORAGE_KEY, null);
  let state = loaded && Array.isArray(loaded.stock) && Array.isArray(loaded.orders) ? loaded : {stock:initialStock.map(x=>({...x})),orders:initialOrders.map(x=>({...x})),operations:[]};
  let lastCalculation = null;
  let toastTimer = null;
  const $ = id => document.getElementById(id);
  const has = id => !!$(id);
  const fmt = n => Number(n||0).toLocaleString('ru-RU',{maximumFractionDigits:2});
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function saveState(){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); updateStorageStatus(true); return true; } catch(e) { updateStorageStatus(false); toast('Не удалось сохранить изменения в этом браузере.'); return false; } }
  function toast(message){ const el=$('toast'); if(!el)return; el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2800); }
  function updateStorageStatus(ok){ const el=$('storageStatus'); if(!el)return; el.innerHTML=ok?'<span class="storage-dot"></span>Локальное сохранение доступно на этом устройстве':'<span class="storage-dot" style="background:#bf4b4b"></span>Локальное сохранение недоступно'; }
  function currentPage(){return document.body.dataset.page || (location.hash.slice(1) || 'dashboard');}
  function setActivePage(id){document.querySelectorAll('[data-page-link]').forEach(a=>a.classList.toggle('active',a.dataset.pageLink===id));document.querySelectorAll('[data-page-content]').forEach(s=>s.classList.toggle('active',s.dataset.pageContent===id));const title=$( 'pageTitle');if(title)title.textContent=titles[id]||'Обзор';}
  function navigate(id){if(!titles[id])return;if(document.body.dataset.single==='true'){setActivePage(id);history.replaceState(null,'','#'+id);window.scrollTo({top:0,behavior:'smooth'});if(id==='warehouse')renderStock();if(id==='analytics')renderAnalytics();if(id==='bim')updateBim();}else{const link=document.querySelector(`[data-page-link="${id}"]`);if(link)location.href=link.href;}}
  document.querySelectorAll('[data-page-link]').forEach(a=>a.addEventListener('click',e=>{if(document.body.dataset.single==='true'){e.preventDefault();navigate(a.dataset.pageLink);}}));
  document.querySelectorAll('[data-nav-to]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.navTo)));
  setActivePage(currentPage());

  function updateDashboard(){
    const active=state.orders.filter(o=>o.status!=='Доставлено').length;
    const low=state.stock.filter(x=>x.qty<=x.min).length;
    const sum=state.orders.reduce((s,o)=>s+(Number(o.amount)||0),0);
    if(has('kpiOrders'))$('kpiOrders').textContent=active;
    if(has('kpiLow'))$('kpiLow').textContent=low;
    if(has('kpiBudget'))$('kpiBudget').textContent=fmt(sum)+' ₽';
    if(has('kpiStock'))$('kpiStock').textContent=state.stock.length;
    if(has('recentOrders')){
      const root=$('recentOrders');root.replaceChildren();
      state.orders.slice().sort((a,b)=>b.id-a.id).slice(0,5).forEach(o=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(o.material)}</td><td>${esc(o.supplier)}</td><td>${fmt(o.amount)} ₽</td><td>${statusTag(o.status)}</td>`;root.appendChild(tr);});
      if(!state.orders.length)root.innerHTML='<tr><td colspan="4" class="empty-note">Закупок пока нет.</td></tr>';
    }
    if(has('dashboardAlerts')){
      const root=$('dashboardAlerts');root.replaceChildren();
      const lowItems=state.stock.filter(x=>x.qty<=x.min);
      lowItems.slice(0,3).forEach(x=>addAlert(root,'!','Низкий остаток: '+x.name,`Остаток ${fmt(x.qty)} ${x.unit}; минимум ${fmt(x.min)} ${x.unit}.`));
      const transit=state.orders.filter(o=>o.status==='В пути');
      if(transit.length)addAlert(root,'◷',`${transit.length} поставка(и) в пути`,'Проверьте ожидаемую дату и подтверждение поставщика.');
      if(!root.children.length)addAlert(root,'✓','Критичных сигналов нет','По текущим демонстрационным данным предупреждений нет.');
    }
  }
  function addAlert(root,icon,title,desc){const div=document.createElement('div');div.className='alert';const ic=document.createElement('div');ic.className='alert-icon';ic.textContent=icon;const body=document.createElement('div');const b=document.createElement('b');b.textContent=title;const small=document.createElement('small');small.textContent=desc;body.append(b,small);div.append(ic,body);root.appendChild(div);}
  function statusTag(status){const cls=status==='Доставлено'?'':status==='В пути'?'info':status==='Согласование'?'warn':status==='Отменено'?'red':'gray';return `<span class="tag ${cls}">${esc(status)}</span>`;}

  function calculate(){
    const name=($('calcMaterial')?.value||'').trim();const qty=Number($('calcQty')?.value);const price=Number($('calcPrice')?.value);const shipping=Number($('calcShipping')?.value||0);const unit=$('calcUnit')?.value||'шт.';const err=$('calcError');
    if(!name||name.length>80||!Number.isFinite(qty)||qty<=0||qty>1e8||!Number.isFinite(price)||price<0||price>1e9||!Number.isFinite(shipping)||shipping<0||shipping>1e9){if(err)err.textContent='Проверьте материал, количество, цену и доставку. Количество должно быть больше нуля.';return false;}
    const goods=qty*price,total=goods+shipping;if(!Number.isFinite(total)||total>1e15){if(err)err.textContent='Итоговая сумма превышает допустимый диапазон.';return false;}
    lastCalculation={name,qty,price,shipping,unit,total};if(err)err.textContent='';if(has('calcCaption'))$('calcCaption').textContent=`${name}: ${fmt(qty)} ${unit} × ${fmt(price)} ₽`;
    if(has('calcTotal'))$('calcTotal').textContent=fmt(total)+' ₽';if(has('calcShippingLine'))$('calcShippingLine').textContent='Доставка: '+fmt(shipping)+' ₽';
    if(has('createOrderFromCalc'))$('createOrderFromCalc').disabled=false;return true;
  }
  function addOrder(order){state.orders.push({...order,id:Date.now()+Math.floor(Math.random()*1000),date:new Date().toLocaleDateString('ru-RU'),status:'Новый запрос'});saveState();renderOrders();updateDashboard();toast('Заявка добавлена в демонстрационный реестр.');}
  function createOrderFromCalc(){if(!lastCalculation&&!calculate())return;if(!lastCalculation)return;const c=lastCalculation;addOrder({material:c.name,supplier:'Не выбран',qty:c.qty,unit:c.unit,amount:c.total,status:'Новый запрос',note:'Создано из калькулятора'});}
  function renderOrders(){const body=$('ordersBody');if(!body)return;const q=($('orderSearch')?.value||'').trim().toLocaleLowerCase('ru');const f=$('orderFilter')?.value||'';const list=state.orders.filter(o=>(!q||[o.material,o.supplier,o.status].join(' ').toLocaleLowerCase('ru').includes(q))&&(!f||o.status===f));body.replaceChildren();list.forEach(o=>{const tr=document.createElement('tr');tr.innerHTML=`<td><b>${esc(o.material)}</b><br><small class="muted">${esc(o.date||'')}</small></td><td>${esc(o.supplier)}</td><td>${fmt(o.qty)} ${esc(o.unit)}</td><td>${fmt(o.amount)} ₽</td><td>${statusTag(o.status)}</td><td><button class="mini-btn" data-order-next="${o.id}">Статус →</button></td>`;body.appendChild(tr);});if(!list.length)body.innerHTML='<tr><td colspan="6" class="empty-note">По заданным условиям записи не найдены.</td></tr>';if($('orderTotal'))$('orderTotal').textContent=`Показано ${list.length} из ${state.orders.length}`;}
  const statusFlow=['Новый запрос','Согласование','В пути','Доставлено'];
  function nextOrderStatus(id){const o=state.orders.find(x=>x.id===id);if(!o)return;const i=statusFlow.indexOf(o.status);o.status=statusFlow[Math.min(i+1,statusFlow.length-1)];saveState();renderOrders();updateDashboard();toast('Статус заявки: '+o.status);}
  $('ordersBody')?.addEventListener('click',e=>{const b=e.target.closest('[data-order-next]');if(b)nextOrderStatus(Number(b.dataset.orderNext));});
  $('orderSearch')?.addEventListener('input',renderOrders);$('orderFilter')?.addEventListener('change',renderOrders);$('resetOrderFilters')?.addEventListener('click',()=>{if($('orderSearch'))$('orderSearch').value='';if($('orderFilter'))$('orderFilter').value='';renderOrders();});
  $('calculateBtn')?.addEventListener('click',calculate);$('createOrderFromCalc')?.addEventListener('click',createOrderFromCalc);
  $('copyCalc')?.addEventListener('click',async()=>{if(!lastCalculation&&!calculate())return;const c=lastCalculation;if(!c)return;const text=`${c.name}: ${fmt(c.qty)} ${c.unit} × ${fmt(c.price)} ₽ + доставка ${fmt(c.shipping)} ₽ = ${fmt(c.total)} ₽`;try{await navigator.clipboard.writeText(text);toast('Расчёт скопирован.');}catch{toast(text);}});
  ['calcMaterial','calcQty','calcPrice','calcShipping','calcUnit'].forEach(id=>$(id)?.addEventListener('input',()=>{lastCalculation=null;if($('createOrderFromCalc'))$('createOrderFromCalc').disabled=true;}));

  function operation(type,item,qty){state.operations.unshift({id:Date.now(),date:new Date().toLocaleString('ru-RU'),type,item,qty});state.operations=state.operations.slice(0,20);}
  function renderStock(){const body=$('stockBody');if(!body)return;const q=($('stockSearch')?.value||'').trim().toLocaleLowerCase('ru');const f=$('stockFilter')?.value||'';const list=state.stock.filter(x=>x.name.toLocaleLowerCase('ru').includes(q)&&(!f||(f==='low'?x.qty<=x.min:x.qty>x.min)));body.replaceChildren();list.forEach(x=>{const tr=document.createElement('tr');tr.innerHTML=`<td><b>${esc(x.name)}</b></td><td>${esc(x.unit)}</td><td><b>${fmt(x.qty)}</b></td><td>${fmt(x.min)}</td><td>${x.qty<=x.min?'<span class="tag warn">Ниже минимума</span>':'<span class="tag">В норме</span>'}</td><td><div class="stock-actions"><button class="mini-btn" data-stock-op="in" data-id="${x.id}">Приход</button><button class="mini-btn" data-stock-op="out" data-id="${x.id}">Списание</button><button class="mini-btn" data-stock-op="min" data-id="${x.id}">Мин.</button><button class="mini-btn danger" data-stock-op="delete" data-id="${x.id}">Удалить</button></div></td>`;body.appendChild(tr);});if(!list.length)body.innerHTML='<tr><td colspan="6" class="empty-note">По заданным условиям материалы не найдены.</td></tr>';if($('stockRows'))$('stockRows').textContent=`Показано ${list.length} из ${state.stock.length}`;if($('stockItemCount'))$('stockItemCount').textContent=state.stock.length;if($('stockLowCount'))$('stockLowCount').textContent=state.stock.filter(x=>x.qty<=x.min).length;renderOperations();updateDashboard();}
  function renderOperations(){const root=$('stockLog');if(!root)return;root.replaceChildren();if(!state.operations.length){root.textContent='Операций пока нет. Добавьте материал, приход или списание.';return;}state.operations.slice(0,8).forEach(op=>{const p=document.createElement('p');p.style.margin='7px 0';p.textContent=`${op.date} · ${op.type}: ${op.item} — ${fmt(op.qty)}`;root.appendChild(p);});}
  function submitStockForm(e){e.preventDefault();const name=$('newStockName').value.trim();const unit=$('newStockUnit').value;const qty=Number($('newStockQty').value);const min=Number($('newStockMin').value);const err=$('stockFormError');if(!name||name.length>80||!Number.isFinite(qty)||qty<0||qty>1e8||!Number.isFinite(min)||min<0||min>1e8){err.textContent='Введите название и корректные неотрицательные количества.';return;}const found=state.stock.find(x=>x.name.toLocaleLowerCase('ru')===name.toLocaleLowerCase('ru')&&x.unit===unit);if(found){found.qty=Math.round((found.qty+qty)*100)/100;found.min=min;operation('Пополнение / изменение минимума',name,qty);}else{state.stock.push({id:Date.now(),name,unit,qty,min});operation('Добавление',name,qty);}saveState();e.target.reset();$('newStockMin').value='0';err.textContent='';renderStock();toast('Складская запись обновлена.');}
  $('stockForm')?.addEventListener('submit',submitStockForm);
  $('stockSearch')?.addEventListener('input',renderStock);$('stockFilter')?.addEventListener('change',renderStock);$('resetStockFilters')?.addEventListener('click',()=>{if($('stockSearch'))$('stockSearch').value='';if($('stockFilter'))$('stockFilter').value='';renderStock();});
  $('stockBody')?.addEventListener('click',e=>{const b=e.target.closest('[data-stock-op]');if(!b)return;const item=state.stock.find(x=>x.id===Number(b.dataset.id));if(!item)return;const type=b.dataset.stockOp;
    if(type==='delete'){if(!confirm(`Удалить «${item.name}» из локального демо-реестра?`))return;state.stock=state.stock.filter(x=>x.id!==item.id);operation('Удаление',item.name,item.qty);}
    if(type==='min'){const raw=prompt(`Минимальный запас для ${item.name} (${item.unit}):`,String(item.min));if(raw===null)return;const v=Number(raw.replace(',','.'));if(!Number.isFinite(v)||v<0||v>1e8){toast('Некорректное значение минимума.');return;}item.min=v;operation('Изменение минимума',item.name,v);}
    if(type==='in'||type==='out'){const raw=prompt(`${type==='in'?'Поступление':'Списание'}: ${item.name}. Текущее количество: ${fmt(item.qty)} ${item.unit}. Введите количество:`, '1');if(raw===null)return;const qty=Number(raw.replace(',','.'));if(!Number.isFinite(qty)||qty<=0||qty>1e8){toast('Введите положительное количество в допустимом диапазоне.');return;}if(type==='out'&&qty>item.qty){toast('Нельзя списать больше текущего остатка.');return;}item.qty=Math.round((item.qty+(type==='in'?qty:-qty))*100)/100;operation(type==='in'?'Поступление':'Списание',item.name,qty);}
    saveState();renderStock();toast('Складская операция сохранена в браузере.');
  });
  $('exportStock')?.addEventListener('click',()=>exportCsv('stroiresurs_sklad.csv',['Материал','Ед.','Остаток','Минимум'],state.stock.map(x=>[x.name,x.unit,x.qty,x.min])));
  function exportCsv(filename,headers,rows){const csv=[headers,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);}

  function renderSubstitute(){const key=$('substituteType')?.value||'insulation';const d=substituteData[key];if(!d||!$('substituteTable'))return;$('substituteTitle').textContent=d.title;$('substituteTable').replaceChildren();d.fields.forEach(row=>{const tr=document.createElement('tr');row.forEach((v,i)=>{const td=document.createElement('td');td.textContent=v;if(i===0)td.style.fontWeight='700';tr.appendChild(td);});$('substituteTable').appendChild(tr);});$('substituteUnit').textContent='Ед. сравнения: '+d.unit;$('substituteA').textContent=d.a;$('substituteB').textContent=d.b;updateSubstituteChecklist();}
  function updateSubstituteChecklist(){const boxes=[...document.querySelectorAll('[data-check]')];const count=boxes.filter(b=>b.checked).length;const status=$('substituteCheckStatus');if(!status)return;if(count===boxes.length){status.textContent='Чек-лист заполнен. Это не подтверждает эквивалентность — требуется экспертное согласование.';status.className='status-line ready';}else{status.textContent=`Проверено пунктов: ${count} из ${boxes.length}. До согласования остаются проверки.`;status.className='status-line pending';}}
  $('substituteType')?.addEventListener('change',renderSubstitute);document.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('change',updateSubstituteChecklist));$('resetSubstituteChecks')?.addEventListener('click',()=>{document.querySelectorAll('[data-check]').forEach(b=>b.checked=false);updateSubstituteChecklist();});$('openEpd')?.addEventListener('click',()=>window.open('https://epdportal.org/','_blank','noopener,noreferrer'));

  function renderAnalytics(){if(!has('analyticsChart'))return;const root=$('analyticsChart');root.replaceChildren();demoChart.forEach(x=>{const col=document.createElement('div');col.className='chart-col';const p=document.createElement('div');p.className='bar';p.style.height=x.plan+'%';const f=document.createElement('div');f.className='bar alt';f.style.height=x.fact+'%';const l=document.createElement('small');l.textContent=x.m;col.append(p,f,l);root.appendChild(col);});const active=state.orders.filter(o=>o.status!=='Доставлено').length;const low=state.stock.filter(x=>x.qty<=x.min).length;const total=state.orders.reduce((s,o)=>s+(Number(o.amount)||0),0);if(has('analyticsActive'))$('analyticsActive').textContent=active;if(has('analyticsLow'))$('analyticsLow').textContent=low;if(has('analyticsTotal'))$('analyticsTotal').textContent=fmt(total)+' ₽';if(has('analyticsOrders'))$('analyticsOrders').textContent=state.orders.length;}
  $('printReport')?.addEventListener('click',()=>window.print());

  function updateBim(){const L=Number($('bimLength')?.value),W=Number($('bimWidth')?.value),F=Number($('bimFloors')?.value);const out=$('bimMetrics');if(!out)return;if(!Number.isFinite(L)||!Number.isFinite(W)||!Number.isInteger(F)||L<5||L>200||W<5||W>100||F<1||F>30){out.textContent='Допустимо: длина 5–200 м, ширина 5–100 м, этажность 1–30.';return;}const area=L*W,total=area*F;const dx=Math.max(80,Math.min(220,L*2.2)),h=Math.max(48,Math.min(155,F*13)),x=260-dx/2,y=113-h/2;const floorLines=Array.from({length:F-1},(_,i)=>{const fy=y+h-(i+1)*h/F;return `<path d="M${x} ${fy} L260 ${fy+21} L${x+dx} ${fy}"/>`;}).join('');const svg=$('bimSvg');if(svg)svg.innerHTML=`<g stroke="#6686a4" stroke-width="2"><path d="M${x} ${y} L260 ${y-25} L${x+dx} ${y} L260 ${y+22}Z" fill="#edf4f9"/><path d="M${x} ${y} L260 ${y+22} L260 ${y+h+22} L${x} ${y+h}Z" fill="#d2e0eb"/><path d="M260 ${y+22} L${x+dx} ${y} L${x+dx} ${y+h} L260 ${y+h+22}Z" fill="#a9c2d6"/></g><g fill="none" stroke="#6686a4" stroke-width="1.5">${floorLines}</g><text x="260" y="238" text-anchor="middle" fill="#46647f" font-size="10">${L} × ${W} м · ${F} этаж(ей)</text>`;
    if(has('bimArea'))$('bimArea').textContent=fmt(area)+' м²';if(has('bimTotalArea'))$('bimTotalArea').textContent=fmt(total)+' м²';if(has('bimFloorsOut'))$('bimFloorsOut').textContent=F;
    const concrete=total*0.25,steel=total*0.045;if(has('bimConcrete'))$('bimConcrete').textContent=fmt(concrete)+' м³';if(has('bimSteel'))$('bimSteel').textContent=fmt(steel)+' т';out.textContent=`Условная оценка: площадь пятна ${fmt(area)} м²; суммарная площадь ${fmt(total)} м². Для демонстрации применены коэффициенты 0,25 м³ бетона и 0,045 т арматуры на 1 м². Это не сметный расчёт и не данные из IFC.`;
  }
  ['bimLength','bimWidth','bimFloors'].forEach(id=>$(id)?.addEventListener('input',updateBim));
  function addBimOrder(kind){updateBim();const L=Number($('bimLength')?.value),W=Number($('bimWidth')?.value),F=Number($('bimFloors')?.value);if(!Number.isFinite(L)||L<5||L>200||!Number.isFinite(W)||W<5||W>100||!Number.isInteger(F)||F<1||F>30){toast('Сначала задайте допустимые параметры здания.');return;}const total=L*W*F;const isConcrete=kind==='concrete';const qty=total*(isConcrete?.25:.045);const unit=isConcrete?'м³':'т';const material=isConcrete?'Бетон · условная потребность по ТИМ/BIM':'Арматура · условная потребность по ТИМ/BIM';addOrder({material,supplier:'Не выбран',qty,unit,amount:0,status:'Новый запрос',note:'Расчёт по упрощённому коэффициенту; требует проверки'});}
  $('addConcreteOrder')?.addEventListener('click',()=>addBimOrder('concrete'));$('addSteelOrder')?.addEventListener('click',()=>addBimOrder('steel'));

  function readProfile(){const p=readJson(PROFILE_KEY,{name:'Демонстрационный пользователь',role:'Специалист по снабжению',org:'Учебный проект',email:'',phone:''});return p&&typeof p==='object'?p:{name:'Демонстрационный пользователь',role:'',org:'',email:'',phone:''};}
  function initials(name){const parts=String(name||'').trim().split(/\s+/).filter(Boolean);return (parts.length>1?parts[0][0]+parts[1][0]:String(name||'П').slice(0,2)).toLocaleUpperCase('ru');}
  function refreshProfile(){const p=readProfile();if(has('profileLabel'))$('profileLabel').textContent=p.name||'Пользователь';if(has('profileAvatar'))$('profileAvatar').textContent=initials(p.name);if(has('profile_name'))$('profile_name').value=p.name||'';if(has('profile_role'))$('profile_role').value=p.role||'';if(has('profile_org'))$('profile_org').value=p.org||'';if(has('profile_email'))$('profile_email').value=p.email||'';if(has('profile_phone'))$('profile_phone').value=p.phone||'';}
  function openProfile(){const b=$('profileBackdrop');if(!b)return;refreshProfile();b.classList.add('open');b.setAttribute('aria-hidden','false');$('profile_name')?.focus();}
  function closeProfile(){const b=$('profileBackdrop');if(!b)return;b.classList.remove('open');b.setAttribute('aria-hidden','true');$('openProfile')?.focus();}
  $('openProfile')?.addEventListener('click',openProfile);$('closeProfile')?.addEventListener('click',closeProfile);$('cancelProfile')?.addEventListener('click',closeProfile);$('saveProfile')?.addEventListener('click',()=>{const p={name:$('profile_name').value.trim(),role:$('profile_role').value.trim(),org:$('profile_org').value.trim(),email:$('profile_email').value.trim(),phone:$('profile_phone').value.trim()};if(!p.name){toast('Укажите имя пользователя.');$('profile_name').focus();return;}if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)){toast('Проверьте формат электронной почты.');$('profile_email').focus();return;}try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p));refreshProfile();closeProfile();toast('Профиль сохранён в этом браузере.');}catch{toast('Не удалось сохранить профиль в браузере.');}});
  $('profileBackdrop')?.addEventListener('click',e=>{if(e.target===$('profileBackdrop'))closeProfile();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('profileBackdrop')?.classList.contains('open'))closeProfile();});
  $('resetDemo')?.addEventListener('click',()=>{if(!confirm('Сбросить демонстрационные закупки, склад и журнал операций к исходным значениям? Профиль пользователя останется без изменений.'))return;state={stock:initialStock.map(x=>({...x})),orders:initialOrders.map(x=>({...x})),operations:[]};saveState();renderStock();renderOrders();updateDashboard();renderAnalytics();toast('Демонстрационные данные восстановлены.');});

  function init(){updateStorageStatus(true);refreshProfile();updateDashboard();renderOrders();renderStock();renderSubstitute();renderAnalytics();updateBim();if(has('calcTotal'))calculate();if(document.body.dataset.single==='true'){const hash=location.hash.slice(1);if(titles[hash])setActivePage(hash);} }
  init();
})();
