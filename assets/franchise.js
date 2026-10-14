// Calculateur de franchise LAMal (adultes dès 19 ans)
// Coût annuel = primes + franchise payée + quote-part (10 %, max 700 CHF)
(function () {
  const FRANCHISES = [300, 500, 1000, 1500, 2000, 2500];
  const QP_RATE = 0.10, QP_MAX = 700;
  const MAX_REBATE = 0.70; // rabais légal maximal : 70 % du risque supplémentaire (art. 95 OAMal)

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Math.round(n).toLocaleString("fr-CH").replace(/ | /g, "'");
  const chf = (n) => fmt(n) + " CHF";

  const T = {
    fr: {
      best: (c, f) => `Avec ${chf(c)} de frais médicaux, la franchise la plus avantageuse est <strong>${f} CHF</strong>`,
      gap: (d) => ` — jusqu'à <strong>${chf(d)}</strong> d'écart avec le pire choix.`,
      threshold: (t) => `<br>Avec ces primes, la franchise de 2500 CHF est la meilleure tant que vos frais restent en dessous d'environ <strong>${chf(t)}</strong> par an.`,
    },
    de: {
      best: (c, f) => `Bei ${chf(c)} Gesundheitskosten ist die günstigste Franchise <strong>${f} CHF</strong>`,
      gap: (d) => ` — bis zu <strong>${chf(d)}</strong> Unterschied zur teuersten Wahl.`,
      threshold: (t) => `<br>Mit diesen Prämien ist die Franchise von 2500 CHF am günstigsten, solange Ihre Kosten unter etwa <strong>${chf(t)}</strong> pro Jahr bleiben.`,
    },
  };
  const t = T[(document.documentElement.lang || "fr").slice(0, 2)] || T.fr;

  function annualPremiums() {
    if ($("mode-own").checked) {
      return FRANCHISES.map((f) => (parseFloat($("p" + f).value) || 0) * 12);
    }
    const base = (parseFloat($("base").value) || 0) * 12;
    return FRANCHISES.map((f) => Math.max(0, base - MAX_REBATE * (f - 300)));
  }

  function totalCost(premium, franchise, costs) {
    const paidFranchise = Math.min(costs, franchise);
    const quotePart = Math.min(QP_RATE * Math.max(costs - franchise, 0), QP_MAX);
    return premium + paidFranchise + quotePart;
  }

  function bestAt(premiums, costs) {
    let best = 0;
    premiums.forEach((p, i) => {
      if (totalCost(p, FRANCHISES[i], costs) < totalCost(premiums[best], FRANCHISES[best], costs)) best = i;
    });
    return best;
  }

  function render() {
    const costs = parseFloat($("costs").value) || 0;
    $("costs-out").textContent = chf(costs);
    const premiums = annualPremiums();
    const totals = premiums.map((p, i) => totalCost(p, FRANCHISES[i], costs));
    const best = bestAt(premiums, costs);
    const max = Math.max(...totals);

    $("result-body").innerHTML = FRANCHISES.map((f, i) => `
      <tr class="${i === best ? "best" : ""}">
        <td>${fmt(f)}</td>
        <td class="num">${chf(premiums[i])}</td>
        <td class="num">${chf(totals[i] - premiums[i])}</td>
        <td class="num">${chf(totals[i])}</td>
        <td style="width:28%"><div class="bar" style="width:${max ? (totals[i] / max) * 100 : 0}%"></div></td>
      </tr>`).join("");

    // Seuil : jusqu'à quels frais la franchise la plus haute reste-t-elle la meilleure ?
    let threshold = null;
    for (let c = 0; c <= 15000; c += 10) {
      if (bestAt(premiums, c) !== FRANCHISES.length - 1) { threshold = c; break; }
    }
    const diff = Math.max(...totals) - totals[best];
    let txt = t.best(costs, FRANCHISES[best]);
    txt += diff > 0 ? t.gap(diff) : ".";
    if (threshold !== null && threshold > 0) txt += t.threshold(threshold);
    $("result-text").innerHTML = txt;
  }

  function toggleMode() {
    const own = $("mode-own").checked;
    $("own-premiums").classList.toggle("show", own);
    $("base-wrap").style.display = own ? "none" : "";
    render();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".calc input").forEach((el) => el.addEventListener("input", render));
    $("mode-est").addEventListener("change", toggleMode);
    $("mode-own").addEventListener("change", toggleMode);
    render();
  });
})();
