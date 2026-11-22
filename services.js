
const searchInput = document.getElementById("serviceSearch");
const filterButtons = document.querySelectorAll(".filter-button");
const serviceCards = document.querySelectorAll(".service-card");
const emptyResults = document.getElementById("emptyResults");

if (!searchInput || !emptyResults) { /* This script is page-specific. */ }

let activeFilter = "all";

function updateServices() {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  serviceCards.forEach(card => {
    const category = card.dataset.category;
    const searchableText = (
      card.dataset.search + " " + card.textContent
    ).toLowerCase();

    const matchesCategory =
      activeFilter === "all" || category === activeFilter;

    const matchesSearch = searchableText.includes(query);

    const visible = matchesCategory && matchesSearch;

    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  emptyResults.hidden = visibleCount !== 0;
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.remove("active"));

    button.classList.add("active");
    activeFilter = button.dataset.filter;

    updateServices();
  });
});

if (searchInput) searchInput.addEventListener("input", updateServices);
