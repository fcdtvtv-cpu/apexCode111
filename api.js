"use strict";

window.ApexAPI = {
  async request(path, options = {}) {
    const response = await fetch(`/api${path}`, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "Не удалось выполнить запрос.");
      error.status = response.status;
      throw error;
    }
    return payload;
  },
  me() { return this.request("/me"); },
  login(data) { return this.request("/login", { method: "POST", body: JSON.stringify(data) }); },
  register(data) { return this.request("/register", { method: "POST", body: JSON.stringify(data) }); },
  logout() { return this.request("/logout", { method: "POST", body: "{}" }); },
  tickets() { return this.request("/tickets"); },
  createTicket(data) { return this.request("/tickets", { method: "POST", body: JSON.stringify(data) }); },
  orders() { return this.request("/orders"); }
};
