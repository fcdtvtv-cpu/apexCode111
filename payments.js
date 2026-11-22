"use strict";
document.querySelectorAll("[data-apex-pay]").forEach(button => button.addEventListener("click", async () => {
  const original = button.textContent; button.disabled = true; button.textContent = "Переход к оплате…";
  try {
    const result = await ApexAPI.request("/payments/checkout", { method: "POST", body: JSON.stringify({ title: button.dataset.apexPay || "Заказ ApexCode" }) });
    if (!result.url) throw new Error("Платёжная ссылка не получена.");
    window.location.assign(result.url);
  } catch (error) {
    if (error.status === 401) window.location.assign("account.html");
    else { const target = document.getElementById("paymentFeedback"); if (target) target.textContent = error.message; else window.alert(error.message); }
  } finally { button.disabled = false; button.textContent = original; }
}));
