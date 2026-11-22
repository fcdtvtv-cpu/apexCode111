
const projectSearch = document.getElementById("projectSearch");
const projectFilters = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".portfolio-card");
const emptyProjects = document.getElementById("emptyProjects");

let selectedCategory = "all";

function filterProjects() {
  const query = projectSearch.value.trim().toLowerCase();
  let visibleCount = 0;

  projectCards.forEach(card => {
    const category = card.dataset.category;
    const searchText = (
      card.dataset.search + " " + card.textContent
    ).toLowerCase();

    const matchesCategory =
      selectedCategory === "all" ||
      category === selectedCategory;

    const matchesSearch = searchText.includes(query);

    const visible = matchesCategory && matchesSearch;

    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  emptyProjects.hidden = visibleCount > 0;
}

projectFilters.forEach(button => {
  button.addEventListener("click", () => {
    projectFilters.forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    selectedCategory = button.dataset.filter;

    filterProjects();
  });
});

if (projectSearch) projectSearch.addEventListener("input", filterProjects);
