const { meta, wines } = window.WINE_DATA;

const state = {
  mode: "region",
  country: wines[0].country,
  region: wines[0].region,
  grape: wines[0].grapes[0],
};

const $ = (id) => document.getElementById(id);
const regionKey = (country, region) => `${country}|||${region}`;
const unique = (items) => [...new Set(items)];
const escapeHTML = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function countBy(items, keyFn) {
  const counts = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const countries = unique(wines.map((wine) => wine.country)).sort((a, b) => a.localeCompare(b));
const grapes = unique(wines.flatMap((wine) => wine.grapes)).sort((a, b) => a.localeCompare(b));
const regionPopularity = countBy(wines, (wine) => regionKey(wine.country, wine.region));
const grapePopularity = countBy(wines.flatMap((wine) => wine.grapes.map((grape) => ({ grape }))), (item) => item.grape);

function regionItems(country = null) {
  return regionPopularity
    .map(([key, count]) => {
      const [itemCountry, region] = key.split("|||");
      return { country: itemCountry, region, count };
    })
    .filter((item) => !country || item.country === country);
}

function selectOptions(items, selected) {
  return items.map((item) => `<option${item === selected ? " selected" : ""}>${escapeHTML(item)}</option>`).join("");
}

function scrollToExplorer() {
  $("explorer").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setMode(mode, shouldScroll = false) {
  state.mode = mode;
  render();
  if (shouldScroll) requestAnimationFrame(scrollToExplorer);
}

function chooseRegion(country, region, shouldScroll = true) {
  state.mode = "region";
  state.country = country;
  state.region = region;
  render();
  if (shouldScroll) requestAnimationFrame(scrollToExplorer);
}

function chooseGrape(grape, shouldScroll = true) {
  state.mode = "grape";
  state.grape = grape;
  render();
  if (shouldScroll) requestAnimationFrame(scrollToExplorer);
}

function getViewData() {
  const activeWines = state.mode === "region"
    ? wines.filter((wine) => wine.country === state.country && wine.region === state.region)
    : wines.filter((wine) => wine.grapes.includes(state.grape));
  const rankedWines = [...activeWines].sort((a, b) => b.rankScore - a.rankScore || b.ratingCount - a.ratingCount);
  const activeGrapes = countBy(activeWines.flatMap((wine) => wine.grapes.map((grape) => ({ grape }))), (item) => item.grape);
  const activeRegions = countBy(activeWines, (wine) => regionKey(wine.country, wine.region)).map(([key, count]) => {
    const [country, region] = key.split("|||");
    return { country, region, count };
  });
  const wineryMap = new Map();
  activeWines.forEach((wine) => wineryMap.set(wine.winery, [...(wineryMap.get(wine.winery) || []), wine]));
  const wineries = [...wineryMap.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const mappedWineryCount = wineries.filter(([, wineryWines]) => wineryWines.some((wine) => wine.coordinates)).length;
  return { activeWines, rankedWines, activeGrapes, activeRegions, wineries, mappedWineryCount };
}

function renderHero() {
  $("regionTab").classList.toggle("active", state.mode === "region");
  $("grapeTab").classList.toggle("active", state.mode === "grape");
  $("regionTab").setAttribute("aria-selected", String(state.mode === "region"));
  $("grapeTab").setAttribute("aria-selected", String(state.mode === "grape"));
  $("regionFields").classList.toggle("is-hidden", state.mode !== "region");
  $("grapeFields").classList.toggle("is-hidden", state.mode !== "grape");
  $("countrySelect").innerHTML = selectOptions(countries, state.country);
  $("regionSelect").innerHTML = selectOptions(regionItems(state.country).map((item) => item.region), state.region);
  $("grapeSelect").innerHTML = selectOptions(grapes, state.grape);

  const popular = state.mode === "region"
    ? regionPopularity.slice(0, 3).map(([key]) => {
        const [country, region] = key.split("|||");
        return `<button type="button" data-country="${escapeHTML(country)}" data-region="${escapeHTML(region)}">${escapeHTML(region)}</button>`;
      })
    : grapePopularity.slice(0, 3).map(([grape]) => `<button type="button" data-grape="${escapeHTML(grape)}">${escapeHTML(grape)}</button>`);
  $("popularLinks").innerHTML = `<span>Popular now</span>${popular.join("")}`;
  $("heroStats").innerHTML = `
    <div><strong>${meta.countryCount}</strong><span>countries in prototype</span></div>
    <div><strong>${meta.regionCount}</strong><span>wine regions</span></div>
    <div><strong>${meta.grapeCount}</strong><span>grape varieties</span></div>
    <div><strong>${meta.ratingCount.toLocaleString()}</strong><span>ratings analyzed</span></div>`;
}

function renderOverview(view) {
  const title = state.mode === "region" ? state.region : state.grape;
  const topGrapes = view.activeGrapes.slice(0, 4).map(([name]) => name);
  const topRegions = view.activeRegions.slice(0, 3).map((item) => item.region);
  const summary = state.mode === "region"
    ? `${state.region} is represented here by ${view.activeWines.length} ${view.activeWines.length === 1 ? "wine" : "wines"} from ${view.wineries.length} ${view.wineries.length === 1 ? "winery" : "wineries"}. The leading grapes in this working data are ${topGrapes.join(", ") || "still being catalogued"}.`
    : `${state.grape} appears in ${view.activeWines.length} ${view.activeWines.length === 1 ? "wine" : "wines"} across ${view.activeRegions.length} ${view.activeRegions.length === 1 ? "region" : "regions"}. The strongest current representation comes from ${topRegions.join(", ") || "regions still being catalogued"}.`;

  $("breadcrumb").innerHTML = `<span>Explore</span><i>›</i><span>${state.mode === "region" ? "Regions" : "Grapes"}</span><i>›</i><strong>${escapeHTML(title)}</strong>`;
  $("overviewCopy").innerHTML = `
    <p class="kicker">${state.mode === "region" ? `${escapeHTML(state.country)} · Wine region` : "Global grape guide"}</p>
    <h2>${escapeHTML(title)}</h2><p>${escapeHTML(summary)}</p>
    <div class="fact-row">
      <div><strong>${view.activeWines.length}</strong><span>Wines</span></div>
      <div><strong>${view.wineries.length}</strong><span>Wineries</span></div>
      <div><strong>${state.mode === "region" ? view.activeGrapes.length : view.activeRegions.length}</strong><span>${state.mode === "region" ? "Grapes" : "Regions"}</span></div>
      <div><strong>${view.mappedWineryCount}</strong><span>Verified map matches</span></div>
    </div>`;

  $("relationshipTitle").textContent = state.mode === "region" ? "Grapes grown here" : "Regions producing this grape";
  $("relationshipList").innerHTML = state.mode === "region"
    ? view.activeGrapes.slice(0, 8).map(([grape, count]) => `<button type="button" data-grape="${escapeHTML(grape)}"><span>${escapeHTML(grape)}</span><small>${count} ${count === 1 ? "wine" : "wines"}</small><b>→</b></button>`).join("")
    : view.activeRegions.slice(0, 8).map((item) => `<button type="button" data-country="${escapeHTML(item.country)}" data-region="${escapeHTML(item.region)}"><span>${escapeHTML(item.region)}<em>${escapeHTML(item.country)}</em></span><small>${item.count} ${item.count === 1 ? "wine" : "wines"}</small><b>→</b></button>`).join("");
}

function renderRankings(view) {
  $("rankingList").innerHTML = view.rankedWines.slice(0, 8).map((wine, index) => `
    <article class="wine-row">
      <span class="rank-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="wine-type wine-type--${escapeHTML(wine.type.toLowerCase().replace(/[^a-z]+/g, "-"))}" aria-hidden="true"></span>
      <div class="wine-main">
        <p>${escapeHTML(wine.winery)}</p><h3>${escapeHTML(wine.name)}</h3>
        <div class="wine-meta">
          <button type="button" data-country="${escapeHTML(wine.country)}" data-region="${escapeHTML(wine.region)}">${escapeHTML(wine.region)}, ${escapeHTML(wine.country)}</button>
          <span>${escapeHTML(wine.type)}</span>${wine.abv ? `<span>${wine.abv}% ABV</span>` : ""}
        </div>
        <div class="tag-list">${wine.grapes.map((grape) => `<button type="button" data-grape="${escapeHTML(grape)}">${escapeHTML(grape)}</button>`).join("")}</div>
      </div>
      <div class="rating" aria-label="${wine.rating} out of 5 from ${wine.ratingCount} ratings">
        <strong>${wine.rating.toFixed(1)}</strong><span class="stars">★★★★★</span><small>${wine.ratingCount} ratings</small>
      </div>
    </article>`).join("");
}

function renderProfile(view) {
  const items = state.mode === "region"
    ? view.activeGrapes.slice(0, 6).map(([name, count]) => ({ name, count, note: "Grape" }))
    : view.activeRegions.slice(0, 6).map((item) => ({ name: item.region, count: item.count, note: item.country }));
  const max = Math.max(1, ...items.map((item) => item.count));
  $("profileTitle").textContent = state.mode === "region" ? "Leading grapes" : "Leading regions";
  $("barList").innerHTML = items.map((item) => `
    <div class="bar-item"><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.note)}</small><span>${item.count}</span></div>
    <i><b style="width:${Math.max(10, (item.count / max) * 100)}%"></b></i></div>`).join("");
  $("coverageText").textContent = `${view.mappedWineryCount} of ${view.wineries.length} wineries in this selection have a conservative exact-name map match. Unmatched wineries stay in the catalogue without guessed coordinates.`;
}

function renderWineries(view) {
  $("wineryCount").textContent = `${view.wineries.length} results`;
  $("wineryGrid").innerHTML = view.wineries.slice(0, 12).map(([winery, wineryWines]) => {
    const location = wineryWines.find((wine) => wine.coordinates)?.coordinates;
    const topWine = [...wineryWines].sort((a, b) => b.rankScore - a.rankScore)[0];
    const monogram = winery.split(/\s+/).slice(0, 2).map((word) => word[0]).join("");
    return `<article class="winery-card">
      <div class="winery-card__top"><span class="winery-monogram">${escapeHTML(monogram)}</span><span class="map-status${location ? " verified" : ""}">${location ? "● Map verified" : "○ Location pending"}</span></div>
      <p>${escapeHTML(topWine.region)}, ${escapeHTML(topWine.country)}</p><h3>${escapeHTML(winery)}</h3>
      <span>${wineryWines.length} ${wineryWines.length === 1 ? "wine" : "wines"} · Top score ${topWine.rating.toFixed(1)}</span>
      <div class="winery-card__footer">
        <button type="button" data-grape="${escapeHTML(topWine.grapes[0])}">${escapeHTML(topWine.grapes[0])}</button>
        ${topWine.website ? `<a href="${escapeHTML(topWine.website)}" target="_blank" rel="noreferrer">Website ↗</a>` : ""}
      </div>
    </article>`;
  }).join("");
}

function render() {
  renderHero();
  const view = getViewData();
  renderOverview(view);
  renderRankings(view);
  renderProfile(view);
  renderWineries(view);
}

document.addEventListener("change", (event) => {
  if (event.target.id === "countrySelect") {
    state.country = event.target.value;
    state.region = regionItems(state.country)[0].region;
    render();
  } else if (event.target.id === "regionSelect") {
    state.region = event.target.value;
    render();
  } else if (event.target.id === "grapeSelect") {
    state.grape = event.target.value;
    render();
  }
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;
  if (target.dataset.country && target.dataset.region) {
    chooseRegion(target.dataset.country, target.dataset.region);
  } else if (target.dataset.grape) {
    chooseGrape(target.dataset.grape);
  } else if (target.dataset.mode) {
    setMode(target.dataset.mode, target.dataset.scroll === "explorer");
  } else if (target.dataset.scroll === "explorer") {
    scrollToExplorer();
  }
});

render();

