"use strict";

const accountTabs = document.querySelectorAll(".account-tab");
const accountPanels = document.querySelectorAll(".tab-panel");
function openAccountTab(tabName) {
  accountTabs.forEach(button => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  accountPanels.forEach(panel => {
    const active = panel.id === `tab-${tabName}`;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
}
accountTabs.forEach(button => button.addEventListener("click", () => openAccountTab(button.dataset.tab)));
const params = new URLSearchParams(location.search);
const requestedTab = params.get("tab");
const availableTabs = ["overview", "profile", "applications", "orders", "favorites", "notifications", "security"];
if (availableTabs.includes(requestedTab)) openAccountTab(requestedTab);

const $ = id => document.getElementById(id);
const loginForm = $("loginForm"), registerForm = $("registerForm");
const authPanel = $("authPanel"), authFeedback = $("authFeedback");
let currentUser = null;
function feedback(message) { if (authFeedback) authFeedback.textContent = message; }
function renderUser(user) {
  currentUser = user || null;
  const signedIn = Boolean(user);
  $("sidebarUserName").textContent = user?.name || "Гость";
  $("sidebarUserStatus").textContent = signedIn ? "Выполнен вход" : "Не авторизован";
  $("profileName").textContent = user?.name || "Не указано";
  $("profileEmail").textContent = user?.email || "Не подключён";
  $("profileTitle").textContent = user ? user.name : "Гостевой режим";
  $("sidebarAvatar").textContent = user ? user.name.trim().charAt(0).toUpperCase() : "G";
  $("profileAvatar").textContent = user ? user.name.trim().charAt(0).toUpperCase() : "G";
  loginForm.hidden = signedIn || !loginForm.hidden && registerForm.hidden === false;
  registerForm.hidden = true;
  $("authHeading").textContent = signedIn ? `Вы вошли как ${user.name}` : "Войти в аккаунт";
  $("authSwitch").hidden = signedIn;
  $("logoutButton").hidden = !signedIn;
  let adminLink = $("adminPanelLink");
  if (user?.role === "admin") {
    if (!adminLink) { adminLink = document.createElement("a"); adminLink.id = "adminPanelLink"; adminLink.className = "support-link"; adminLink.href = "admin.html"; adminLink.textContent = "Панель администратора →"; document.querySelector(".account-sidebar")?.append(adminLink); }
    adminLink.hidden = false;
  } else if (adminLink) adminLink.hidden = true;
  if (signedIn) { loginForm.hidden = true; authPanel.querySelector(".auth-intro").textContent = "Ваш аккаунт подключён. Данные обращений загружаются с сервера."; }
  else { loginForm.hidden = false; authPanel.querySelector(".auth-intro").textContent = "Войдите или создайте аккаунт, чтобы видеть свои обращения и заказы."; }
}
function renderTickets(tickets) {
  const panel = $("tab-applications");
  let list = $("accountTicketList");
  if (!list) { list = document.createElement("div"); list.id = "accountTicketList"; panel.append(list); }
  list.replaceChildren();
  const empty = panel.querySelector(".empty-state");
  if (empty) empty.hidden = tickets.length > 0;
  $("applicationsCount").textContent = String(tickets.length);
  tickets.forEach(ticket => {
    const card = document.createElement("article"); card.className = "account-card";
    const title = document.createElement("h3"); title.textContent = `${ticket.ticketNumber} · ${ticket.subject}`;
    const status = document.createElement("p"); status.textContent = `Статус: ${ticket.statusLabel} · Категория: ${ticket.categoryLabel}`;
    const body = document.createElement("p"); body.textContent = ticket.message;
    card.append(title, status, body);
    (ticket.replies || []).forEach(reply => { const answer = document.createElement("p"); answer.textContent = `Ответ поддержки · ${new Date(reply.createdAt).toLocaleString("ru-RU")}: ${reply.message}`; card.append(answer); });
    list.append(card);
  });
}
function renderOrders(orders) {
  const panel = $("tab-orders");
  let list = $("accountOrderList");
  if (!list) { list = document.createElement("div"); list.id = "accountOrderList"; panel.append(list); }
  list.replaceChildren();
  const empty = panel.querySelector(".empty-state");
  if (empty) empty.hidden = orders.length > 0;
  $("ordersCount").textContent = String(orders.length);
  orders.forEach(order => {
    const card = document.createElement("article"); card.className = "account-card";
    const title = document.createElement("h3"); title.textContent = `${order.orderNumber} · ${order.title}`;
    const status = document.createElement("p"); status.textContent = `Статус: ${order.statusLabel} · Создан: ${new Date(order.createdAt).toLocaleDateString("ru-RU")}`;
    card.append(title, status); list.append(card);
  });
}
async function loadAccountData() {
  if (!currentUser) return;
  try {
    const [tickets, orders] = await Promise.all([ApexAPI.tickets(), ApexAPI.orders()]);
    renderTickets(tickets.items); renderOrders(orders.items);
  } catch (error) { feedback(error.message); }
}
loginForm.addEventListener("submit", async event => {
  event.preventDefault(); feedback("");
  const data = Object.fromEntries(new FormData(loginForm));
  try { const result = await ApexAPI.login(data); renderUser(result.user); loginForm.reset(); feedback("Вы успешно вошли."); await loadAccountData(); await submitPendingProduct(); }
  catch (error) { feedback(error.message); }
});
registerForm.addEventListener("submit", async event => {
  event.preventDefault(); feedback("");
  const data = Object.fromEntries(new FormData(registerForm));
  try { const result = await ApexAPI.register(data); renderUser(result.user); registerForm.reset(); feedback("Аккаунт создан. Добро пожаловать!"); await loadAccountData(); await submitPendingProduct(); }
  catch (error) { feedback(error.message); }
});
$("authSwitch").addEventListener("click", () => {
  const showRegister = registerForm.hidden;
  registerForm.hidden = !showRegister; loginForm.hidden = showRegister;
  $("authHeading").textContent = showRegister ? "Создать аккаунт" : "Войти в аккаунт";
  $("authSwitch").textContent = showRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться";
  feedback("");
});
$("logoutButton").addEventListener("click", async () => {
  try { await ApexAPI.logout(); renderUser(null); feedback("Вы вышли из аккаунта."); }
  catch (error) { feedback(error.message); }
});
const favoritesContainer = $("savedFavorites"), favoritesEmpty = $("favoritesEmpty");
async function submitPendingProduct() {
  const title = sessionStorage.getItem("apex_pending_product");
  if (!title || !currentUser) return;
  try {
    await ApexAPI.request("/orders", { method: "POST", body: JSON.stringify({ title }) });
    sessionStorage.removeItem("apex_pending_product");
    feedback(`Заявка «${title}» создана. Она появится в разделе «Мои заказы».`);
    await loadAccountData();
  } catch (error) { feedback(error.message); }
}
function loadFavorites() {
  let favorites = [];
  try { const stored = JSON.parse(localStorage.getItem("apexcode_favorites") || "[]"); favorites = Array.isArray(stored) ? stored : []; } catch {}
  favoritesEmpty.hidden = favorites.length > 0;
  $("favoritesCount").textContent = String(favorites.length);
  favoritesContainer.replaceChildren();
  favorites.forEach(name => {
    const item = document.createElement("div"); item.className = "information-row";
    const title = document.createElement("strong"); title.textContent = name;
    const link = document.createElement("a"); link.href = "products.html"; link.textContent = "Открыть каталог →";
    item.append(title, link); favoritesContainer.append(item);
  });
}
loadFavorites();
ApexAPI.me().then(async result => { renderUser(result.user); await loadAccountData(); await submitPendingProduct(); }).catch(() => renderUser(null));
