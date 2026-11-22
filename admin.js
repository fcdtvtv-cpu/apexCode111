"use strict";
const messageEl = document.getElementById("adminMessage");
const appEl = document.getElementById("adminApp");
const escapeText = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[char]));
const dateText = value => value ? new Date(value).toLocaleString("ru-RU") : "—";
async function adminRequest(path, options = {}) { return ApexAPI.request(path, options); }
function stat(label, value) { return `<article class="admin-stat"><span>${label}</span><strong>${value}</strong></article>`; }
function renderAdmin(data) {
  const s = data.stats;
  document.getElementById("adminStats").innerHTML = [stat("Пользователи",s.users),stat("Всего заказов",s.orders),stat("Обращения",s.tickets),stat("Открытые обращения",s.openTickets)].join("");
  document.getElementById("usersTotal").textContent = `${data.users.length} аккаунтов`;
  document.getElementById("usersRows").innerHTML = data.users.map(user => `<tr><td>${escapeText(user.name)}</td><td>${escapeText(user.email)}</td><td>${user.role === "admin" ? "Администратор" : "Пользователь"}</td><td>${dateText(user.createdAt)}</td><td>${user.active === false ? "Отключён" : "Активен"}</td><td><button class="button secondary user-toggle" data-id="${escapeText(user.id)}" data-active="${user.active !== false}">${user.active === false ? "Включить" : "Отключить"}</button></td></tr>`).join("") || '<tr><td colspan="6">Пользователей пока нет</td></tr>';
  document.querySelectorAll(".user-toggle").forEach(button => button.addEventListener("click", async () => { try { await adminRequest(`/admin/users/${encodeURIComponent(button.dataset.id)}`, { method: "PATCH", body: JSON.stringify({ active: button.dataset.active !== "true" }) }); messageEl.textContent = "Состояние аккаунта обновлено."; await loadDashboard(); } catch (error) { messageEl.textContent = error.message; } }));
  const orderLabels = {pending:"Заявка получена",processing:"В работе",completed:"Завершён",cancelled:"Отменён"};
  document.getElementById("ordersRows").innerHTML = data.orders.map(order => `<tr><td>${escapeText(order.orderNumber)}</td><td>${escapeText(order.user?.name || "Удалённый пользователь")}<br>${escapeText(order.user?.email || "")}</td><td>${escapeText(order.title)}</td><td>${dateText(order.createdAt)}</td><td><select class="order-status" data-id="${escapeText(order.id)}">${Object.entries(orderLabels).map(([key,label])=>`<option value="${key}" ${order.status===key?"selected":""}>${label}</option>`).join("")}</select></td></tr>`).join("") || '<tr><td colspan="5">Заказов пока нет</td></tr>';
  document.querySelectorAll(".order-status").forEach(select => select.addEventListener("change", async () => { try { await adminRequest(`/admin/orders/${encodeURIComponent(select.dataset.id)}`,{method:"PATCH",body:JSON.stringify({status:select.value})}); messageEl.textContent="Статус заказа обновлён."; } catch(error) { messageEl.textContent=error.message; await loadDashboard(); } }));
  const ticketLabels = {open:"Открыто",in_progress:"В работе",waiting:"Ожидает ответа",closed:"Закрыто"};
  const tickets = document.getElementById("ticketsList"); tickets.replaceChildren();
  if (!data.tickets.length) tickets.innerHTML = '<p class="admin-empty">Обращений пока нет.</p>';
  data.tickets.forEach(ticket => {
    const card=document.createElement("article"); card.className="admin-ticket";
    const attachments=(ticket.attachments||[]).map(file=>`<p><a href="/api/attachments/${encodeURIComponent(file.id)}" target="_blank" rel="noopener noreferrer">Вложение: ${escapeText(file.name)}</a></p>`).join("");
    const replies=(ticket.replies||[]).map(reply=>`<p class="admin-reply"><strong>${escapeText(reply.authorName||"Администратор")}</strong> · ${dateText(reply.createdAt)}<br>${escapeText(reply.message)}</p>`).join("");
    card.innerHTML=`<h3>${escapeText(ticket.ticketNumber)} · ${escapeText(ticket.subject)}</h3><div class="admin-ticket-meta">${escapeText(ticket.user?.name||"Пользователь")} (${escapeText(ticket.user?.email||"—")}) · ${escapeText(ticket.categoryLabel)} · ${dateText(ticket.createdAt)}</div><p>${escapeText(ticket.message)}</p>${attachments}${replies?`<div class="admin-replies">${replies}</div>`:""}<div class="admin-ticket-controls"><select class="ticket-status" aria-label="Статус обращения">${Object.entries(ticketLabels).map(([key,label])=>`<option value="${key}" ${ticket.status===key?"selected":""}>${label}</option>`).join("")}</select><textarea class="ticket-reply" maxlength="3000" placeholder="Ответ пользователю…"></textarea><button class="button primary ticket-save" type="button">Сохранить</button></div>`;
    card.querySelector(".ticket-save").addEventListener("click",async()=>{const status=card.querySelector(".ticket-status").value;const reply=card.querySelector(".ticket-reply").value.trim();try{await adminRequest(`/admin/tickets/${encodeURIComponent(ticket.id)}`,{method:"PATCH",body:JSON.stringify({status,...(reply?{reply}:{})})});messageEl.textContent=`Обращение ${ticket.ticketNumber} обновлено.`;await loadDashboard();}catch(error){messageEl.textContent=error.message;}});
    tickets.append(card);
  });
}
async function loadDashboard(){messageEl.textContent="Загружаем данные…";try{const result=await adminRequest("/admin/dashboard");appEl.hidden=false;messageEl.textContent="Вы вошли как администратор.";renderAdmin(result);}catch(error){appEl.hidden=true;messageEl.textContent=error.status===401?"Войдите в аккаунт администратора через страницу «Аккаунт».":error.status===403?"У этого аккаунта нет прав администратора.":error.message;}}
document.getElementById("refreshAdmin").addEventListener("click",loadDashboard);
loadDashboard();
