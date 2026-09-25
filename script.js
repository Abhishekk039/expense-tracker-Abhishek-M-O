/* ==========================================================================
   Expense Tracker — Signature Application Logic
   High Aesthetics, Quick Interactive Chips, Real-Time Analytics & CSV Export
   ========================================================================== */

const STORAGE_KEY = "expenseTrackerTransactions";
const MONTHLY_BUDGET_TARGET = 50000;

const CATEGORIES = {
  expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Healthcare", "Education", "Travel", "Other"],
  income: ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"]
};

const CATEGORY_ICONS = {
  Food: "🍔", Transport: "🚌", Shopping: "🛍️", Bills: "🧾", Entertainment: "🎬",
  Healthcare: "🩺", Education: "📚", Travel: "✈️", Other: "📦",
  Salary: "💼", Freelance: "💻", Business: "🏢", Investment: "📈", Gift: "🎁"
};

/* ---------------------------------------------------------------------- */
/* State                                                                   */
/* ---------------------------------------------------------------------- */

let transactions = loadFromLocalStorage();
let editingId = null;
let pendingDeleteId = null;

/* ---------------------------------------------------------------------- */
/* DOM references                                                          */
/* ---------------------------------------------------------------------- */

const form = document.getElementById("transaction-form");
const formHeading = document.getElementById("form-heading");
const formBadge = document.getElementById("form-badge");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const typeExpenseInput = document.getElementById("type-expense");
const typeIncomeInput = document.getElementById("type-income");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const quickCategoriesContainer = document.getElementById("quick-categories");

const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const exportBtn = document.getElementById("export-btn");

const filterTypeSelect = document.getElementById("filter-type");
const filterCategorySelect = document.getElementById("filter-category");
const sortSelect = document.getElementById("sort-by");

const transactionListEl = document.getElementById("transaction-list");
const transactionCounterEl = document.getElementById("transaction-counter");
const navTxBadge = document.getElementById("nav-tx-badge");
const emptyStateEl = document.getElementById("empty-state");
const emptyAddBtn = document.getElementById("empty-add-btn");

const monthSelect = document.getElementById("month-select");
const monthPillLabel = document.getElementById("month-pill-label");
const monthlyBars = document.getElementById("monthly-bars");
const monthlyView = document.getElementById("monthly-view");
const dailyView = document.getElementById("daily-view");
const chartBackBtn = document.getElementById("chart-back-btn");
const dailyChart = document.getElementById("daily-chart");
const dailyTooltip = document.getElementById("daily-tooltip");
const dailyDetailTitle = document.getElementById("daily-detail-title");
const dailyDetailSubtitle = document.getElementById("daily-detail-subtitle");

const modalOverlay = document.getElementById("modal-overlay");
const modalCancel = document.getElementById("modal-cancel");
const modalConfirm = document.getElementById("modal-confirm");

const toastContainer = document.getElementById("toast-container");

/* ---------------------------------------------------------------------- */
/* Local Storage & Initial Mock Data                                      */
/* ---------------------------------------------------------------------- */

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    
    // Seed initial realistic transactions if first visit for rich experience
    const initialData = [
      {
        id: "seed-1",
        type: "income",
        amount: 85000,
        category: "Salary",
        date: todayISO(),
        description: "Monthly Primary Salary",
        createdAt: Date.now() - 86400000 * 4
      },
      {
        id: "seed-2",
        type: "expense",
        amount: 4200,
        category: "Food",
        date: todayISO(),
        description: "Grocery shopping & fresh vegetables",
        createdAt: Date.now() - 86400000 * 2
      },
      {
        id: "seed-3",
        type: "expense",
        amount: 1850,
        category: "Transport",
        date: todayISO(),
        description: "Fuel & Metro recharge",
        createdAt: Date.now() - 86400000 * 1
      },
      {
        id: "seed-4",
        type: "income",
        amount: 14500,
        category: "Freelance",
        date: todayISO(),
        description: "Web development consulting",
        createdAt: Date.now() - 86400000 * 3
      },
      {
        id: "seed-5",
        type: "expense",
        amount: 2499,
        category: "Bills",
        date: todayISO(),
        description: "High-speed broadband bill",
        createdAt: Date.now()
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  } catch (err) {
    console.error("Failed to load transactions:", err);
    return [];
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error("Failed to save transactions:", err);
    showToast("Could not save data locally.", "error");
  }
}

/* ---------------------------------------------------------------------- */
/* Formatting Helpers                                                      */
/* ---------------------------------------------------------------------- */

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  const formatted = value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2
  });
  return "₹" + formatted;
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function updateMonthPillLabel(monthStr) {
  if (!monthPillLabel || !monthStr) return;
  const [year, month] = monthStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, 1);
  monthPillLabel.textContent = dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatCompactCurrency(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${Math.round(value)}`;
}

/* ---------------------------------------------------------------------- */
/* Category Dropdowns & Quick Chips Population                             */
/* ---------------------------------------------------------------------- */

function populateCategoryOptions(type) {
  const list = CATEGORIES[type] || [];
  categorySelect.innerHTML = '<option value="" disabled selected>Select category</option>';
  list.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = `${CATEGORY_ICONS[cat] || "•"} ${cat}`;
    categorySelect.appendChild(opt);
  });
  renderQuickCategories(type);
}

function renderQuickCategories(type) {
  if (!quickCategoriesContainer) return;
  const list = (CATEGORIES[type] || []).slice(0, 6);
  quickCategoriesContainer.innerHTML = list
    .map((cat) => {
      const isSelected = categorySelect.value === cat;
      return `<button type="button" class="quick-cat-chip ${isSelected ? "is-selected" : ""}" data-cat="${escapeHtml(cat)}">
        ${CATEGORY_ICONS[cat] || "•"} ${escapeHtml(cat)}
      </button>`;
    })
    .join("");
}

function populateFilterCategoryOptions() {
  const all = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])].sort();
  filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
  all.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = `${CATEGORY_ICONS[cat] || "•"} ${cat}`;
    filterCategorySelect.appendChild(opt);
  });
}

/* ---------------------------------------------------------------------- */
/* Validation                                                              */
/* ---------------------------------------------------------------------- */

function clearErrors() {
  ["amount", "category", "date"].forEach((field) => {
    const errorEl = document.getElementById("error-" + field);
    if (errorEl) errorEl.textContent = "";
    const group = errorEl ? errorEl.closest(".field-group") : null;
    if (group) group.classList.remove("has-error");
  });
}

function setError(field, message) {
  const errorEl = document.getElementById("error-" + field);
  if (!errorEl) return;
  errorEl.textContent = message;
  const group = errorEl.closest(".field-group");
  if (group) group.classList.add("has-error");
}

function validateForm() {
  clearErrors();
  let valid = true;

  const amountValue = amountInput.value.trim();
  if (amountValue === "") {
    setError("amount", "Please enter an amount.");
    valid = false;
  } else if (isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
    setError("amount", "Amount must be greater than zero.");
    valid = false;
  }

  if (!categorySelect.value) {
    setError("category", "Please select a category.");
    valid = false;
  }

  if (!dateInput.value) {
    setError("date", "Please pick a valid transaction date.");
    valid = false;
  }

  return valid;
}

/* ---------------------------------------------------------------------- */
/* CRUD Operations                                                         */
/* ---------------------------------------------------------------------- */

function addTransaction(txn) {
  transactions.unshift(txn);
  saveToLocalStorage();
}

function updateTransaction(id, updates) {
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx === -1) return;
  transactions[idx] = { ...transactions[idx], ...updates };
  saveToLocalStorage();
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  saveToLocalStorage();
}

function editTransaction(id) {
  const txn = transactions.find((t) => t.id === id);
  if (!txn) return;

  editingId = id;

  (txn.type === "income" ? typeIncomeInput : typeExpenseInput).checked = true;
  populateCategoryOptions(txn.type);
  categorySelect.value = txn.category;
  renderQuickCategories(txn.type);
  amountInput.value = txn.amount;
  dateInput.value = txn.date;
  descriptionInput.value = txn.description || "";

  formHeading.textContent = "Edit Transaction";
  if (formBadge) formBadge.textContent = "Editing Mode";
  submitBtn.querySelector(".btn-text").textContent = "Update Transaction";
  cancelEditBtn.hidden = false;
  clearErrors();

  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
  amountInput.focus();
}

function exitEditMode() {
  editingId = null;
  formHeading.textContent = "Add Transaction";
  if (formBadge) formBadge.textContent = "Quick Entry";
  submitBtn.querySelector(".btn-text").textContent = "Add Transaction";
  cancelEditBtn.hidden = true;
  form.reset();
  typeExpenseInput.checked = true;
  populateCategoryOptions("expense");
  dateInput.value = todayISO();
  clearErrors();
}

/* ---------------------------------------------------------------------- */
/* Calculations                                                            */
/* ---------------------------------------------------------------------- */

function calculateTotals(list) {
  return list.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

function calculateMonthlySummary(monthValue) {
  if (!monthValue) return { income: 0, expense: 0 };
  const [year, month] = monthValue.split("-").map(Number);
  const monthTxns = transactions.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  return calculateTotals(monthTxns);
}

function calculateCategoryBreakdown(monthValue = monthSelect.value) {
  const totals = {};
  const [year, month] = (monthValue || "").split("-").map(Number);
  transactions
    .filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return t.type === "expense" && d.getFullYear() === year && d.getMonth() + 1 === month;
    })
    .forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
    });
  return totals;
}

/* ---------------------------------------------------------------------- */
/* Filtering & Sorting                                                     */
/* ---------------------------------------------------------------------- */

function filterTransactions(list) {
  const typeFilter = filterTypeSelect.value;
  const categoryFilter = filterCategorySelect.value;
  const searchFilter = (searchInput ? searchInput.value.trim().toLowerCase() : "");

  return list.filter((t) => {
    const typeMatch = typeFilter === "all" || t.type === typeFilter;
    const categoryMatch = categoryFilter === "all" || t.category === categoryFilter;
    
    let searchMatch = true;
    if (searchFilter) {
      const matchCat = t.category.toLowerCase().includes(searchFilter);
      const matchDesc = (t.description || "").toLowerCase().includes(searchFilter);
      const matchAmount = String(t.amount).includes(searchFilter);
      searchMatch = matchCat || matchDesc || matchAmount;
    }

    return typeMatch && categoryMatch && searchMatch;
  });
}

function sortTransactions(list) {
  const sortBy = sortSelect.value;
  const sorted = [...list];

  switch (sortBy) {
    case "oldest":
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date) || a.createdAt - b.createdAt);
      break;
    case "highest":
      sorted.sort((a, b) => Number(b.amount) - Number(a.amount));
      break;
    case "lowest":
      sorted.sort((a, b) => Number(a.amount) - Number(b.amount));
      break;
    case "newest":
    default:
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
      break;
  }
  return sorted;
}

/* ---------------------------------------------------------------------- */
/* Rendering Functions                                                     */
/* ---------------------------------------------------------------------- */

function renderSummary() {
  const totals = calculateTotals(transactions);
  const balance = totals.income - totals.expense;

  document.getElementById("total-income").textContent = formatCurrency(totals.income);
  document.getElementById("total-expense").textContent = formatCurrency(totals.expense);
  
  const balanceEl = document.getElementById("total-balance");
  balanceEl.textContent = formatCurrency(balance);

  const balancePill = document.getElementById("balance-pill");
  if (balancePill) {
    if (balance > 0) {
      balancePill.textContent = "● Healthy Reserve";
      balancePill.style.color = "var(--primary-dark)";
    } else if (balance < 0) {
      balancePill.textContent = "● In Deficit";
      balancePill.style.color = "var(--danger)";
    } else {
      balancePill.textContent = "● Balanced";
      balancePill.style.color = "var(--text-muted)";
    }
  }

  renderBudgetMiniCard();
}

function renderBudgetMiniCard() {
  const budgetBar = document.getElementById("budget-progress-bar");
  const budgetPct = document.getElementById("budget-pct");
  const budgetStatusText = document.getElementById("budget-status-text");

  if (!budgetBar || !monthSelect.value) return;

  const currentSummary = calculateMonthlySummary(monthSelect.value);
  const spent = currentSummary.expense;
  const pct = Math.min(100, Math.round((spent / MONTHLY_BUDGET_TARGET) * 100));

  budgetBar.style.width = `${pct}%`;
  if (budgetPct) budgetPct.textContent = `${pct}%`;
  if (budgetStatusText) {
    budgetStatusText.textContent = `${formatCurrency(spent)} of ${formatCurrency(MONTHLY_BUDGET_TARGET)} used`;
  }
}

function renderMonthlySummary() {
  if (!monthSelect.value) return;
  updateMonthPillLabel(monthSelect.value);

  const summary = calculateMonthlySummary(monthSelect.value);
  const netMonth = summary.income - summary.expense;

  document.getElementById("monthly-income").textContent = formatCurrency(summary.income);
  document.getElementById("monthly-expense").textContent = formatCurrency(summary.expense);
  
  const monthBalanceEl = document.getElementById("monthly-balance");
  monthBalanceEl.textContent = formatCurrency(netMonth);
  if (netMonth >= 0) {
    monthBalanceEl.className = "monthly-value income-text";
  } else {
    monthBalanceEl.className = "monthly-value expense-text";
  }

  render12MonthChart();
  renderBudgetMiniCard();
}

function render12MonthChart() {
  const barsContainer = document.getElementById("monthly-bars");
  if (!barsContainer || !monthSelect.value) return;

  const [currentYear, currentMonth] = monthSelect.value.split("-").map(Number);
  const monthTotals = Array(12).fill(0);

  transactions.forEach((t) => {
    if (t.type === "expense") {
      const d = new Date(t.date + "T00:00:00");
      if (d.getFullYear() === currentYear) {
        monthTotals[d.getMonth()] += Number(t.amount);
      }
    }
  });

  const maxExpense = Math.max(...monthTotals, 1000);
  const axisMaxEl = document.getElementById("axis-max");
  const axisHighEl = document.getElementById("axis-high");
  const axisLowEl = document.getElementById("axis-low");
  if (axisMaxEl) axisMaxEl.textContent = formatCompactCurrency(maxExpense);
  if (axisHighEl) axisHighEl.textContent = formatCompactCurrency(maxExpense * 0.67);
  if (axisLowEl) axisLowEl.textContent = formatCompactCurrency(maxExpense * 0.33);

  barsContainer.innerHTML = monthTotals
    .map((amount, idx) => {
      const isCurrentMonth = idx + 1 === currentMonth;
      const heightPercent = Math.max(10, Math.round((amount / maxExpense) * 92));
      const formattedAmt = formatCurrency(amount);

      const monthValue = `${currentYear}-${String(idx + 1).padStart(2, "0")}`;
      return `
        <div class="bar-col ${isCurrentMonth ? "is-active" : ""}" title="${formatMonthLabel(monthValue)}: ${formattedAmt}. Tap to view daily details" data-month-value="${monthValue}" role="button" tabindex="0" aria-label="View daily details for ${formatMonthLabel(monthValue)}">
          <div class="bar-pill" style="--bar-height: ${heightPercent}%;"></div>
        </div>`;
    })
    .join("");

  renderDailyChart();
}

function showDailyView() {
  if (!monthlyView || !dailyView) return;
  monthlyView.hidden = true;
  dailyView.hidden = false;
  if (dailyTooltip) dailyTooltip.hidden = true;
  dailyView.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showMonthlyView() {
  if (!monthlyView || !dailyView) return;
  dailyView.hidden = true;
  monthlyView.hidden = false;
  if (dailyTooltip) dailyTooltip.hidden = true;
}

function renderDailyChart() {
  if (!dailyChart || !monthSelect.value) return;

  const [year, month] = monthSelect.value.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyBudget = MONTHLY_BUDGET_TARGET / daysInMonth;
  const dailyExpenses = Array(daysInMonth).fill(0);

  transactions.forEach((t) => {
    if (t.type !== "expense") return;
    const date = new Date(t.date + "T00:00:00");
    if (date.getFullYear() === year && date.getMonth() + 1 === month) {
      dailyExpenses[date.getDate() - 1] += Number(t.amount);
    }
  });

  const maxValue = Math.max(dailyBudget, ...dailyExpenses, 1);
  const monthLabel = formatMonthLabel(monthSelect.value);
  const totalExpense = dailyExpenses.reduce((sum, value) => sum + value, 0);
  dailyDetailTitle.textContent = `${monthLabel} daily activity`;
  dailyDetailSubtitle.textContent = `${formatCurrency(totalExpense)} spent · ${formatCurrency(dailyBudget)} budget per day`;

  dailyChart.innerHTML = dailyExpenses.map((amount, index) => {
    const expenseHeight = Math.max(amount ? 4 : 0, Math.round((amount / maxValue) * 100));
    const budgetHeight = Math.max(4, Math.round((dailyBudget / maxValue) * 100));
    const day = index + 1;
    return `
      <button type="button" class="daily-day ${amount > dailyBudget ? "over-budget" : ""}" data-day="${day}" aria-label="${formatMonthLabel(monthSelect.value)} day ${day}: ${formatCurrency(amount)} expense, ${formatCurrency(dailyBudget)} budget">
        <span class="daily-bars">
          <span class="daily-expense-bar" style="height:${expenseHeight}%"></span>
          <span class="daily-budget-bar" style="height:${budgetHeight}%"></span>
        </span>
        <span class="daily-day-label">${day}</span>
      </button>`;
  }).join("");
}

function showDailyTooltip(day) {
  if (!dailyTooltip || !monthSelect.value) return;
  const [year, month] = monthSelect.value.split("-").map(Number);
  const dayExpenses = transactions
    .filter((t) => {
      const date = new Date(t.date + "T00:00:00");
      return t.type === "expense" && date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const dailyBudget = MONTHLY_BUDGET_TARGET / new Date(year, month, 0).getDate();
  dailyTooltip.textContent = `Day ${day}: ${formatCurrency(dayExpenses)} spent · ${formatCurrency(dailyBudget)} budget`;
  dailyTooltip.hidden = false;
}

function renderChart() {
  const breakdown = calculateCategoryBreakdown(monthSelect.value);
  const container = document.getElementById("chart-container");
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    container.innerHTML = '<p class="chart-empty">No expense categories to show yet.</p>';
    return;
  }

  const maxValue = Math.max(...entries.map(([, v]) => v));

  container.innerHTML = entries
    .map(([category, amount]) => {
      const pct = Math.max(8, Math.round((amount / maxValue) * 100));
      const icon = CATEGORY_ICONS[category] || "•";
      return `
        <div class="chart-row">
          <span class="chart-cat-name">${icon} ${escapeHtml(category)}</span>
          <div class="chart-track"><div class="chart-fill" style="width:${pct}%"></div></div>
          <span class="chart-amount">${formatCurrency(amount)}</span>
        </div>`;
    })
    .join("");
}

function renderTransactions() {
  let list = filterTransactions(transactions);
  list = sortTransactions(list);

  if (transactionCounterEl) {
    transactionCounterEl.textContent = `${list.length} ${list.length === 1 ? "record" : "records"}`;
  }
  if (navTxBadge) {
    navTxBadge.textContent = transactions.length;
  }

  if (transactions.length === 0) {
    transactionListEl.innerHTML = "";
    emptyStateEl.hidden = false;
    return;
  }

  if (list.length === 0) {
    transactionListEl.innerHTML = '<p class="chart-empty">No transactions match your search and filter criteria.</p>';
    emptyStateEl.hidden = true;
    return;
  }

  emptyStateEl.hidden = true;

  transactionListEl.innerHTML = list
    .map((t) => {
      const icon = CATEGORY_ICONS[t.category] || "•";
      const isIncome = t.type === "income";
      const sign = isIncome ? "+" : "−";
      const desc = t.description ? escapeHtml(t.description) : "General transaction";
      return `
      <div class="transaction-row txn-${t.type}" data-id="${t.id}" role="listitem">
        <div class="txn-icon" aria-hidden="true">${icon}</div>
        <div class="txn-details">
          <div class="txn-category">${escapeHtml(t.category)}</div>
          <div class="txn-meta">${desc} · ${formatDate(t.date)}</div>
        </div>
        <div class="txn-amount">${sign} ${formatCurrency(t.amount)}</div>
        <div class="txn-actions">
          <button type="button" class="icon-btn edit-btn" aria-label="Edit transaction" title="Edit entry" data-id="${t.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button type="button" class="icon-btn delete-btn" aria-label="Delete transaction" title="Delete entry" data-id="${t.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>`;
    })
    .join("");
}

function renderAll() {
  renderSummary();
  renderMonthlySummary();
  renderChart();
  renderTransactions();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------------------------------------------------------------------- */
/* CSV Export Feature                                                      */
/* ---------------------------------------------------------------------- */

function exportCSV() {
  if (transactions.length === 0) {
    showToast("No transactions available to export", "error");
    return;
  }

  const headers = ["ID", "Type", "Amount", "Category", "Date", "Description"];
  const rows = transactions.map((t) => [
    t.id,
    t.type,
    t.amount,
    `"${(t.category || "").replace(/"/g, '""')}"`,
    t.date,
    `"${(t.description || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `expenses_report_${todayISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("✓ CSV Report exported successfully", "success");
}

/* ---------------------------------------------------------------------- */
/* Toast Notifications                                                     */
/* ---------------------------------------------------------------------- */

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-out");
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}

/* ---------------------------------------------------------------------- */
/* Confirmation Modal                                                      */
/* ---------------------------------------------------------------------- */

function openDeleteModal(id) {
  pendingDeleteId = id;
  modalOverlay.hidden = false;
  modalConfirm.focus();
}

function closeDeleteModal() {
  pendingDeleteId = null;
  modalOverlay.hidden = true;
}

modalCancel.addEventListener("click", closeDeleteModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeDeleteModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeDeleteModal();
});

modalConfirm.addEventListener("click", () => {
  if (pendingDeleteId === null) return;
  deleteTransaction(pendingDeleteId);
  closeDeleteModal();
  renderAll();
  showToast("✓ Transaction deleted successfully", "success");
});

/* ---------------------------------------------------------------------- */
/* Event Listeners                                                         */
/* ---------------------------------------------------------------------- */

typeExpenseInput.addEventListener("change", () => populateCategoryOptions("expense"));
typeIncomeInput.addEventListener("change", () => populateCategoryOptions("income"));

// Quick Category Chips Click Delegation
if (quickCategoriesContainer) {
  quickCategoriesContainer.addEventListener("click", (e) => {
    const chip = e.target.closest(".quick-cat-chip");
    if (!chip) return;
    const cat = chip.dataset.cat;
    categorySelect.value = cat;
    document.querySelectorAll(".quick-cat-chip").forEach((c) => c.classList.remove("is-selected"));
    chip.classList.add("is-selected");
    const catError = document.getElementById("error-category");
    if (catError) catError.textContent = "";
  });
}

// Quick Amount Preset Chips Click Delegation
const quickAmountsContainer = document.querySelector(".quick-amounts");
if (quickAmountsContainer) {
  quickAmountsContainer.addEventListener("click", (e) => {
    const chip = e.target.closest(".amount-chip");
    if (!chip) return;
    const addVal = Number(chip.dataset.amt) || 0;
    const currentVal = Number(amountInput.value) || 0;
    amountInput.value = currentVal > 0 ? currentVal + addVal : addVal;
    const amountError = document.getElementById("error-amount");
    if (amountError) amountError.textContent = "";
  });
}

categorySelect.addEventListener("change", () => {
  const currentVal = categorySelect.value;
  document.querySelectorAll(".quick-cat-chip").forEach((chip) => {
    chip.classList.toggle("is-selected", chip.dataset.cat === currentVal);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast("⚠ Please check the required fields", "error");
    return;
  }

  const type = typeIncomeInput.checked ? "income" : "expense";

  const payload = {
    type,
    amount: Number(amountInput.value),
    category: categorySelect.value,
    date: dateInput.value,
    description: descriptionInput.value.trim()
  };

  if (editingId) {
    updateTransaction(editingId, payload);
    showToast("✓ Transaction updated successfully", "success");
    exitEditMode();
  } else {
    addTransaction({ id: crypto.randomUUID ? crypto.randomUUID() : "tx-" + Date.now(), createdAt: Date.now(), ...payload });
    showToast("✓ Transaction recorded successfully", "success");
    form.reset();
    typeExpenseInput.checked = true;
    populateCategoryOptions("expense");
    dateInput.value = todayISO();
    clearErrors();
  }

  renderAll();
});

cancelEditBtn.addEventListener("click", exitEditMode);

transactionListEl.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".edit-btn");
  const deleteBtn = e.target.closest(".delete-btn");

  if (editBtn) editTransaction(editBtn.dataset.id);
  if (deleteBtn) openDeleteModal(deleteBtn.dataset.id);
});

// Search input handling
if (searchInput) {
  searchInput.addEventListener("input", () => {
    if (searchClear) searchClear.hidden = !searchInput.value;
    renderTransactions();
  });
}

if (searchClear) {
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.hidden = true;
    renderTransactions();
    searchInput.focus();
  });
}

if (exportBtn) {
  exportBtn.addEventListener("click", exportCSV);
}

filterTypeSelect.addEventListener("change", renderTransactions);
filterCategorySelect.addEventListener("change", renderTransactions);
sortSelect.addEventListener("change", renderTransactions);

if (chartBackBtn) {
  chartBackBtn.addEventListener("click", showMonthlyView);
}

monthSelect.addEventListener("change", () => {
  renderMonthlySummary();
  renderChart();
});

if (monthlyBars) {
  monthlyBars.addEventListener("click", (e) => {
    const bar = e.target.closest(".bar-col");
    if (!bar) return;
    monthSelect.value = bar.dataset.monthValue;
    renderMonthlySummary();
    renderChart();
    showDailyView();
  });

  monthlyBars.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.target.click();
  });
}

if (dailyChart) {
  dailyChart.addEventListener("click", (e) => {
    const day = e.target.closest(".daily-day");
    if (day) showDailyTooltip(Number(day.dataset.day));
  });
}

const monthPillEl = document.querySelector(".month-pill");
if (monthPillEl && monthSelect) {
  monthPillEl.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof monthSelect.showPicker === "function") {
      monthSelect.showPicker();
    } else {
      monthSelect.click();
    }
  });
}

emptyAddBtn.addEventListener("click", () => {
  amountInput.focus();
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------------------------------------------------------------------- */
/* Initialization                                                          */
/* ---------------------------------------------------------------------- */

function init() {
  populateCategoryOptions("expense");
  populateFilterCategoryOptions();
  dateInput.value = todayISO();

  const now = new Date();
  const currentMonthVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  monthSelect.value = currentMonthVal;
  updateMonthPillLabel(currentMonthVal);

  renderAll();
}

init();
