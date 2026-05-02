// Default state and configuration
const defaults = {
  salary: 100000,
  expenses: [
    ["Rent", 20000],
    ["Groceries", 5000],
    ["Utilities", 2000],
    ["Personal Loan EMI", 10000],
  ],
  core: [
    ["Equity MF", 15000],
    ["Debt MF", 5000],
  ],
  satellite: [
    ["Crypto", 5000],
    ["Stocks", 3000],
  ],
  personalLoan: 200000,
  homeLoan: 0,
  annualTopup: 0,
  healthActive: true,
  termActive: true,
  activeSipTab: "core",
  lumpSum: 0,
};

let state = JSON.parse(localStorage.getItem("financialPlannerState")) || structuredClone(defaults);

function byId(id) {
  return document.getElementById(id);
}

function sum(arr) {
  return arr.reduce((acc, [_, amount]) => acc + (amount || 0), 0);
}

function format(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

function saveState() {
  localStorage.setItem("financialPlannerState", JSON.stringify(state));
}

function updateScalarInputs() {
  byId("salaryInput").value = state.salary;
  byId("lumpSumInput").value = state.lumpSum;
  byId("personalLoanInput").value = state.personalLoan;
  byId("homeLoanInput").value = state.homeLoan;
  byId("annualTopupInput").value = state.annualTopup;
  byId("healthActive").checked = state.healthActive;
  byId("termActive").checked = state.termActive;
}

function renderExpenses() {
  const container = byId("expensesContainer");
  container.innerHTML = state.expenses
    .map(([name, amount], index) => `
      <div class=\"expense-row\">\n        <label>${name}</label>\n        <input type=\"number\" value=\"${amount}\" data-kind=\"expenses\" data-index=\"${index}\" />\n      </div>\n    `)
    .join("");
}

function renderSipRows() {
  const kind = state.activeSipTab;
  const container = byId("sipContainer");
  container.innerHTML = state[kind]
    .map(([name, amount], index) => `
      <div class=\"sip-row\">
        <label>${name}</label>
        <input type=\"number\" value=\"${amount}\" data-kind=\"${kind}\" data-index=\"${index}\" />
      </div>
    `)
    .join("");
}

function renderThemes() {
  const core = sum(state.core);
  const satellite = sum(state.satellite);
  const total = core + satellite;
  const corePercent = total > 0 ? (core / total) * 100 : 0;
  const satellitePercent = total > 0 ? (satellite / total) * 100 : 0;

  const html = [
    ["Core SIP", core, corePercent],
    ["Satellite SIP", satellite, satellitePercent],
  ]
    .map(([sector, amount, percent]) => {
      return `
        <div class=\"theme-bar\">
          <strong>${sector}</strong>
          <div class=\"bar-track\"><div class=\"bar-fill\" style=\"width:${percent}%\"></div></div>
          <span>${format(amount)}</span>
        </div>
      `;
    })
    .join("");

  byId("themesContainer").innerHTML = html;
}

function renderCalculatedValues() {
  const fixed = sum(state.expenses);
  const core = sum(state.core);
  const satellite = sum(state.satellite);
  const investing = core + satellite;
  const outflow = fixed + investing;
  const surplus = state.salary - outflow;
  const emergency = Math.max(Math.round(surplus * 0.37), 0);
  const prepay = Math.max(Math.round(surplus * 0.37), 0);
  const reserve = Math.max(surplus - emergency - prepay, 0);
  const personalLoanEmi = state.expenses.find(([name]) => name === "Personal Loan EMI")?.[1] || 0;
  const monthlyPaydown = personalLoanEmi + prepay;
  const closureMonths = monthlyPaydown > 0 ? Math.ceil(state.personalLoan / monthlyPaydown) : 0;
  const originalPl = defaults.personalLoan || state.personalLoan || 1;
  const progress = Math.max(0, Math.min(100, ((originalPl - state.personalLoan) / originalPl) * 100));
  const lumpEmergency = Math.round(state.lumpSum / 2);
  const lumpInvest = state.lumpSum - lumpEmergency;

  byId("salaryMetric").textContent = format(state.salary);
  byId("outflowMetric").textContent = format(outflow);
  byId("surplusMetric").textContent = format(surplus);
  byId("sideSurplus").textContent = format(surplus);
  byId("closureMetric").textContent = closureMonths ? `${closureMonths} mo` : "N/A";
  byId("sipTotal").textContent = `${format(investing)}/mo`;
  byId("emergencyUse").textContent = format(emergency);
  byId("prepayUse").textContent = format(prepay);
  byId("reserveUse").textContent = format(reserve);
  byId("lumpEmergency").textContent = format(lumpEmergency);
  byId("lumpInvest").textContent = format(lumpInvest);
  byId("plProgress").value = progress;
  byId("personalLoanPlan").textContent = monthlyPaydown
    ? `Continue EMI plus surplus prepayment for an estimated payoff in ${closureMonths} month${closureMonths === 1 ? "" : "s"}.`
    : "Add monthly paydown to generate a closure estimate.";

  const cashStatus = byId("cashStatus");
  if (surplus >= 0) {
    cashStatus.textContent = "Balanced";
    cashStatus.style.background = "#e7f4ec";
    cashStatus.style.color = "#1f7a4d";
  } else {
    cashStatus.textContent = "Over budget";
    cashStatus.style.background = "#fae8eb";
    cashStatus.style.color = "#b43b4f";
  }
}

function render() {
  updateScalarInputs();
  renderExpenses();
  renderSipRows();
  renderThemes();
  renderCalculatedValues();
  saveState();
}

function setNumber(key, value) {
  state[key] = Math.max(Number(value) || 0, 0);
  render();
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const kind = target.dataset.kind;
  const index = Number(target.dataset.index);
  if (kind && Number.isInteger(index)) {
    state[kind][index][1] = Math.max(Number(target.value) || 0, 0);
    renderCalculatedValues();
    if (kind !== "expenses") renderSipRows();
    saveState();
    return;
  }

  if (target.id === "salaryInput") setNumber("salary", target.value);
  if (target.id === "lumpSumInput") setNumber("lumpSum", target.value);
  if (target.id === "personalLoanInput") setNumber("personalLoan", target.value);
  if (target.id === "homeLoanInput") setNumber("homeLoan", target.value);
  if (target.id === "annualTopupInput") setNumber("annualTopup", target.value);
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.id === "healthActive") state.healthActive = target.checked;
  if (target.id === "termActive") state.termActive = target.checked;
  saveState();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeSipTab = tab.dataset.tab;
    render();
  });
});

byId("resetBtn").addEventListener("click", () => {
  state = structuredClone(defaults);
  render();
});

byId("exportBtn").addEventListener("click", () => {
  const payload = {
    exportedAt: new Date().toISOString(),
    salary: state.salary,
    fixedExpenses: state.expenses,
    coreSip: state.core,
    satelliteSip: state.satellite,
    personalLoan: state.personalLoan,
    homeLoan: state.homeLoan,
    annualTopup: state.annualTopup,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "financial-planner-export.json";
  link.click();
  URL.revokeObjectURL(url);
});

render();