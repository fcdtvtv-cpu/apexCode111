
const productSearch = document.getElementById("productSearch");
const categoryButtons = document.querySelectorAll(".category-button");
const productsGrid = document.getElementById("productsGrid");
const productCards = [...document.querySelectorAll(".product-card")];
const productCount = document.getElementById("productCount");
const productSort = document.getElementById("productSort");
const emptyProducts = document.getElementById("emptyProducts");

let selectedCategory = "all";

function updateProducts() {
  const query = productSearch ? productSearch.value.trim().toLowerCase() : "";
  let visibleCount = 0;

  productCards.forEach(card => {
    const category = card.dataset.category;
    const searchText = (
      card.dataset.search + " " +
      card.dataset.name + " " +
      card.textContent
    ).toLowerCase();

    const matchesCategory =
      selectedCategory === "all" ||
      selectedCategory === category;

    const matchesSearch = searchText.includes(query);
    const visible = matchesCategory && matchesSearch;

    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  productCount.textContent = `Найдено товаров: ${visibleCount}`;
  emptyProducts.hidden = visibleCount > 0;
}

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    selectedCategory = button.dataset.category;

    updateProducts();
  });
});

if (productSearch) productSearch.addEventListener("input", updateProducts);

if (productSort && productsGrid) productSort.addEventListener("change", () => {
  const cards = [...productsGrid.querySelectorAll(".product-card")];

  if (productSort.value === "name") {
    cards.sort((a, b) =>
      a.dataset.name.localeCompare(b.dataset.name, "ru")
    );
  } else {
    cards.sort((a, b) =>
      productCards.indexOf(a) - productCards.indexOf(b)
    );
  }

  cards.forEach(card => productsGrid.appendChild(card));
  updateProducts();
});

// Избранное в этом браузере

const FAVORITES_KEY = "apexcode_favorites";

function getFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function updateFavoriteButtons() {
  const favorites = getFavorites();

  document.querySelectorAll(".favorite-button").forEach(button => {
    const card = button.closest(".product-card");
    const name = card.dataset.name;
    const isFavorite = favorites.includes(name);

    button.setAttribute("aria-pressed", String(isFavorite));
    button.textContent = isFavorite ? "♥" : "♡";
    button.setAttribute(
      "aria-label",
      isFavorite ? "Убрать из избранного" : "Добавить в избранное"
    );
  });
}

document.querySelectorAll(".favorite-button").forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    const name = card.dataset.name;
    let favorites = getFavorites();

    if (favorites.includes(name)) {
      favorites = favorites.filter(item => item !== name);
    } else {
      favorites.push(name);
    }

    saveFavorites(favorites);
    updateFavoriteButtons();
  });
});

updateFavoriteButtons();

// Окно подробностей товара

const productModal = document.getElementById("productModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalClose = document.getElementById("modalClose");
const modalOverlay = document.getElementById("modalOverlay");

function closeProductModal() {
  if (!productModal) return;
  productModal.hidden = true;
  document.body.style.overflow = "";
}

if (productModal && modalTitle && modalDescription && modalClose && modalOverlay) {
document.querySelectorAll(".details-button").forEach(button => {
  button.addEventListener("click", () => {
    modalTitle.textContent = button.dataset.product;
    modalDescription.textContent = button.dataset.description;

    productModal.hidden = false;
    document.body.style.overflow = "hidden";
    modalClose.focus();
  });
});

modalClose.addEventListener("click", closeProductModal);
modalOverlay.addEventListener("click", closeProductModal);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && productModal && !productModal.hidden) {
    closeProductModal();
  }
});

updateProducts();

}


// Создание заявки на товар через backend
const requestProductButton = document.getElementById("requestProductButton");
if (requestProductButton) {
  requestProductButton.addEventListener("click", async () => {
    const feedback = document.getElementById("productRequestFeedback");
    requestProductButton.disabled = true;
    feedback.textContent = "Отправляем заявку…";
    try {
      await ApexAPI.request("/orders", {
        method: "POST",
        body: JSON.stringify({ title: modalTitle.textContent })
      });
      feedback.textContent = "Заявка создана. Её номер и статус доступны в личном кабинете.";
    } catch (error) {
      feedback.textContent = error.status === 401
        ? "Для заявки войдите в аккаунт. Сейчас откроем личный кабинет."
        : error.message;
      if (error.status === 401) {
        sessionStorage.setItem("apex_pending_product", modalTitle.textContent);
        setTimeout(() => { location.href = "account.html"; }, 900);
      }
    } finally {
      requestProductButton.disabled = false;
    }
  });
}
