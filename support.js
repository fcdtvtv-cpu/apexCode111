"use strict";
const ticketForm = document.getElementById("ticketForm");
const formFeedback = document.getElementById("formFeedback");
const ticketMessage = document.getElementById("ticketMessage");
const ticketHistoryList = document.getElementById("ticketHistoryList");
const ticketHistoryEmpty = document.getElementById("ticketHistoryEmpty");
const labels = { account: "Аккаунт", products: "Товары и услуги", applications: "Заявки и заказы", payments: "Оплата", bots: "Telegram-боты", security: "Безопасность", technical: "Технические вопросы", other: "Другое" };
function showFeedback(message, error = false) { formFeedback.textContent = message; formFeedback.style.color = error ? "#ff7777" : "var(--accent)"; }
function renderTicketHistory(items) {
  ticketHistoryList.replaceChildren();
  ticketHistoryEmpty.hidden = items.length > 0;
  items.forEach(ticket => {
    const card = document.createElement("article"); card.className = "ticket-history-item";
    const title = document.createElement("h3"); title.textContent = `${ticket.ticketNumber} · ${ticket.subject}`;
    const meta = document.createElement("div"); meta.className = "ticket-meta";
    const status = document.createElement("span"); status.textContent = ticket.statusLabel;
    const category = document.createElement("span"); category.textContent = labels[ticket.category] || ticket.category;
    const date = document.createElement("span"); date.textContent = new Date(ticket.createdAt).toLocaleString("ru-RU");
    const body = document.createElement("p"); body.textContent = ticket.message;
    meta.append(status, category, date); card.append(title, meta, body);
    (ticket.attachments || []).forEach(file => {
      const link = document.createElement("a"); link.href = `/api/attachments/${encodeURIComponent(file.id)}`; link.textContent = `Вложение: ${file.name}`; link.target = "_blank"; link.rel = "noopener noreferrer"; card.append(link);
    });
    (ticket.replies || []).forEach(reply => {
      const answer = document.createElement("p"); answer.className = "ticket-admin-reply";
      answer.textContent = `Ответ поддержки · ${new Date(reply.createdAt).toLocaleString("ru-RU")}: ${reply.message}`;
      card.append(answer);
    });
    ticketHistoryList.append(card);
  });
}
async function refreshHistory() {
  try { const result = await ApexAPI.tickets(); renderTicketHistory(result.items); }
  catch (error) { if (error.status === 401) { ticketHistoryEmpty.hidden = false; } else showFeedback(error.message, true); }
}
if (ticketForm && formFeedback) ticketForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!ticketForm.reportValidity()) return;
  const data = Object.fromEntries(new FormData(ticketForm));
  const submit = ticketForm.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = "Отправка…";
  try {
    let attachmentIds = [];
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      if (file.size > 8 * 1024 * 1024) throw new Error("Файл должен быть не больше 8 МБ.");
      const uploadData = new FormData(); uploadData.append("file", file);
      const uploaded = await fetch("/api/attachments", { method: "POST", credentials: "same-origin", body: uploadData });
      const uploadResult = await uploaded.json().catch(() => ({}));
      if (!uploaded.ok) throw new Error(uploadResult.error || "Не удалось загрузить файл.");
      attachmentIds.push(uploadResult.attachmentId);
    }
    const result = await ApexAPI.createTicket({ ...data, attachmentIds });
    showFeedback(`Обращение ${result.ticket.ticketNumber} создано. Оно появилось в истории.`);
    ticketForm.reset(); updateCounter(); await refreshHistory();
  } catch (error) {
    showFeedback(error.status === 401 ? "Чтобы создать обращение, сначала войдите в аккаунт." : error.message, true);
  } finally { submit.disabled = false; submit.textContent = "Создать обращение"; }
});
function updateCounter() {
  const counter = document.querySelector(".form-footer > span");
  if (counter && ticketMessage) counter.textContent = `Осталось символов: ${3000 - ticketMessage.value.length}`;
}
if (ticketMessage) ticketMessage.addEventListener("input", updateCounter);
updateCounter(); refreshHistory();
