// Global Data State - Includes Card Details
let data = JSON.parse(localStorage.getItem("financeData")) || {
  transactions: [],
  debts: [],
  card: {
    holder: "AETHER DRIFT",
    number: "4589 1234 5678 9012",
    expiry: "12/28",
    cvv: "999",
  },
};

// App Initialization
window.onload = () => {
  setTimeout(() => {
    const loader = document.getElementById("loader-screen");
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.visibility = "hidden";
    }, 800);
  }, 2000);

  updateUI();
};

// --- NEW: INPUT FORMATTING LOGIC FOR CARD ---

// Card Number Formatting (Spaces every 4 digits, max 16 digits)
document
  .getElementById("edit-card-number")
  .addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    value = value.substring(0, 16); // Limit to 16 digits
    // Add space every 4 digits
    let formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    e.target.value = formatted;
  });

// Expiry Formatting (MM/YY)
document
  .getElementById("edit-card-expiry")
  .addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length > 4) value = value.substring(0, 4); // Limit to 4 digits (MMYY)

    if (value.length >= 2) {
      // Insert slash after month
      value = value.substring(0, 2) + "/" + value.substring(2);
    }
    e.target.value = value;
  });

// CVV Formatting (Max 3 digits)
document
  .getElementById("edit-card-cvv")
  .addEventListener("input", function (e) {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 3); // Only numbers, max 3
  });
// ---------------------------------------------

// Card Modal Logic
function toggleCardModal() {
  const modal = document.getElementById("card-edit-modal");
  modal.classList.toggle("open");

  if (modal.classList.contains("open")) {
    // Pre-fill form
    document.getElementById("edit-card-holder").value = data.card?.holder || "";
    document.getElementById("edit-card-number").value = data.card?.number || "";
    document.getElementById("edit-card-expiry").value = data.card?.expiry || "";
    document.getElementById("edit-card-cvv").value = data.card?.cvv || "";
  }
}

// Save Card Details
document.getElementById("card-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const holder = document.getElementById("edit-card-holder").value.trim();
  const number = document.getElementById("edit-card-number").value.trim();
  const expiry = document.getElementById("edit-card-expiry").value.trim();
  const cvv = document.getElementById("edit-card-cvv").value.trim();

  if (!holder || !number) {
    showToast("Name and Number are required!", "error");
    return;
  }

  data.card = { holder, number, expiry, cvv };
  saveData();
  toggleCardModal();
  showToast("Card details updated successfully", "success");
});

// Navigation Switcher
function switchView(viewId) {
  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById("nav-" + viewId).classList.add("active");

  document
    .querySelectorAll(".view-section")
    .forEach((sec) => sec.classList.remove("active"));
  document.getElementById("view-" + viewId).classList.add("active");

  updateUI();
}

// Persistent Storage
function saveData() {
  localStorage.setItem("financeData", JSON.stringify(data));
  updateUI();
}

// Modern Popup Message (Toast)
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";

  toast.className = `toast-popup toast-${type}`;
  toast.innerHTML = `
                <span class="text-xl">${icon}</span>
                <div>
                    <p class="font-bold text-slate-800 text-sm">${message}</p>
                </div>
            `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Auto-remove after 3.5s
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// Transaction Handling
document.getElementById("tx-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const desc = document.getElementById("tx-desc").value.trim();
  const amount = parseFloat(document.getElementById("tx-amount").value);
  const type = document.getElementById("tx-type").value;
  const category = document.getElementById("tx-category").value;
  const editId = document.getElementById("edit-id").value;

  if (!desc || isNaN(amount) || amount <= 0) {
    showToast("Please enter valid amount and description.", "error");
    return;
  }

  if (editId) {
    const index = data.transactions.findIndex((t) => t.id == editId);
    if (index !== -1) {
      data.transactions[index] = {
        ...data.transactions[index],
        desc,
        amount,
        type,
        category,
      };
    }
    showToast("Entry updated successfully.", "info");
  } else {
    const now = new Date();
    data.transactions.unshift({
      id: Date.now(),
      timestamp: now.getTime(),
      desc,
      amount,
      type,
      category,
      date: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    showToast("Money flow recorded.", "success");
  }

  resetTxForm();
  saveData();
});

// Debt Handling
document.getElementById("debt-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const desc = document.getElementById("debt-desc").value.trim();
  const amount = parseFloat(document.getElementById("debt-amount").value);
  const type = document.getElementById("debt-type").value;

  if (!desc || isNaN(amount) || amount <= 0) {
    showToast("Please fill all debt details.", "error");
    return;
  }

  const now = new Date();
  data.debts.unshift({
    id: Date.now(),
    timestamp: now.getTime(),
    desc,
    amount,
    type,
    date: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  document.getElementById("debt-form").reset();
  saveData();
  showToast("Debt entry saved.", "success");
});

// Edit Functionality
function editTransaction(id) {
  const item = data.transactions.find((t) => t.id == id);
  if (!item) return;
  document.getElementById("edit-id").value = item.id;
  document.getElementById("tx-desc").value = item.desc;
  document.getElementById("tx-amount").value = item.amount;
  document.getElementById("tx-category").value = item.category || "General";
  document.getElementById("tx-type").value = item.type;
  document.getElementById("tx-form-title").innerText = "Edit Recorded Entry";
  document.getElementById("submit-btn").innerText = "Update Ledger";
  document.getElementById("cancel-edit").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetTxForm() {
  document.getElementById("tx-form").reset();
  document.getElementById("edit-id").value = "";
  document.getElementById("tx-form-title").innerText = "Financial Entry";
  document.getElementById("submit-btn").innerText = "Record Transaction";
  document.getElementById("cancel-edit").classList.add("hidden");
}

// Deletion Logic
function deleteItem(type, id) {
  const container = document.createElement("div");
  // Custom confirmation can be added here, for now using standard confirm for safety
  if (confirm("Confirm: Delete this entry forever?")) {
    data[type] = data[type].filter((item) => item.id !== id);
    saveData();
    showToast("Record deleted from system.", "error");
  }
}

function resetAllData() {
  if (confirm("WARNING: All your ledger data will be wiped out. Continue?")) {
    data = { transactions: [], debts: [], card: data.card }; // Keep card details on reset? Or wipe? Currently keeps.
    saveData();
    showToast("Ledger reset complete.", "error");
  }
}

// Filtering
function filterByTime(items, filterValue) {
  if (filterValue === "all") return items;
  const now = Date.now();
  let limit = 0;
  if (filterValue === "7days") limit = 7 * 24 * 60 * 60 * 1000;
  if (filterValue === "30days") limit = 30 * 24 * 60 * 60 * 1000;
  return items.filter((item) => now - item.timestamp <= limit);
}

// Refresh UI View
function updateUI() {
  const txFilter = document.getElementById("tx-filter").value;
  const txSearch = document.getElementById("tx-search").value.toLowerCase();
  const debtSearch = document.getElementById("debt-search").value.toLowerCase();

  let filteredTx = filterByTime(data.transactions, txFilter);
  if (txSearch) {
    filteredTx = filteredTx.filter(
      (t) =>
        t.desc.toLowerCase().includes(txSearch) ||
        (t.category && t.category.toLowerCase().includes(txSearch)),
    );
  }

  let filteredDebts = data.debts;
  if (debtSearch)
    filteredDebts = filteredDebts.filter((d) =>
      d.desc.toLowerCase().includes(debtSearch),
    );

  const incomeTotal = data.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = data.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const lentTotal = data.debts
    .filter((d) => d.type === "lent")
    .reduce((sum, d) => sum + d.amount, 0);
  const borrowedTotal = data.debts
    .filter((d) => d.type === "borrowed")
    .reduce((sum, d) => sum + d.amount, 0);
  const debtNet = lentTotal - borrowedTotal;

  // Header Updates
  document.getElementById("dash-balance").innerText =
    `₹${(incomeTotal - expenseTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  document.getElementById("dash-income").innerText =
    `₹${incomeTotal.toLocaleString()}`;
  document.getElementById("dash-expense").innerText =
    `₹${expenseTotal.toLocaleString()}`;
  document.getElementById("dash-debt").innerText =
    `${debtNet >= 0 ? "+" : ""}₹${debtNet.toLocaleString()}`;

  // Update Card UI
  if (data.card) {
    document.getElementById("card-display-number").innerText =
      data.card.number || "0000 0000 0000 0000";
    document.getElementById("card-display-holder").innerText =
      data.card.holder || "YOUR NAME";
    document.getElementById("card-display-expiry").innerText =
      data.card.expiry || "MM/YY";
    document.getElementById("card-display-cvv").innerText =
      data.card.cvv || "***";
  }

  // Rendering Feed
  const txList = document.getElementById("tx-list");
  txList.innerHTML = filteredTx.length
    ? ""
    : '<div class="p-16 text-center text-slate-300 text-sm font-medium italic">No transactions in this period.</div>';
  document.getElementById("tx-count").innerText = `${filteredTx.length} Items`;
  filteredTx.forEach(
    (t) => (txList.innerHTML += renderItem(t, "transactions")),
  );

  const debtList = document.getElementById("debt-list");
  debtList.innerHTML = filteredDebts.length
    ? ""
    : '<div class="p-16 text-center text-slate-300 text-sm font-medium italic">All debts cleared.</div>';
  filteredDebts.forEach((d) => (debtList.innerHTML += renderItem(d, "debts")));

  // Dashboard Recent
  const recent = [...data.transactions].sort((a, b) => b.id - a.id).slice(0, 6);
  const rList = document.getElementById("recent-list");
  rList.innerHTML = recent.length
    ? ""
    : '<p class="text-slate-300 p-10 text-center text-sm italic">Empty feed.</p>';
  recent.forEach((item) => {
    const color = item.type === "income" ? "text-green-600" : "text-slate-900";
    rList.innerHTML += `
                    <div class="px-6 py-5 flex justify-between items-center hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
                        <div>
                            <p class="font-bold text-slate-700 leading-tight">${item.desc}</p>
                            <p class="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">${item.date} • ${item.category}</p>
                        </div>
                        <span class="font-black ${color}">${item.type === "expense" ? "-" : "+"}₹${item.amount.toLocaleString()}</span>
                    </div>`;
  });

  // Spending Analytics Engine
  updateAnalytics(expenseTotal);
}

function updateAnalytics(totalExp) {
  const anaDiv = document.getElementById("category-analysis");
  if (totalExp === 0) {
    anaDiv.innerHTML =
      '<p class="text-center text-slate-400 text-sm py-10 italic">Analyze your expenses by recording some data.</p>';
    return;
  }

  const catTotals = {};
  data.transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "General";
      catTotals[cat] = (catTotals[cat] || 0) + t.amount;
    });

  anaDiv.innerHTML = "";
  Object.keys(catTotals).forEach((cat) => {
    const percentage = Math.round((catTotals[cat] / totalExp) * 100);
    anaDiv.innerHTML += `
                    <div>
                        <div class="flex justify-between text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                            <span>${cat}</span>
                            <span>${percentage}%</span>
                        </div>
                        <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div class="bg-blue-600 h-full transition-all duration-1000 shadow-sm" style="width: ${percentage}%"></div>
                        </div>
                    </div>`;
  });
}

function renderItem(item, listType) {
  const isPos = item.type === "income" || item.type === "lent";
  const color = isPos ? "text-green-600" : "text-red-600";
  const symbol = isPos ? "+" : "-";

  return `
                <div class="p-5 flex justify-between items-center hover:bg-slate-50 group transition">
                    <div class="flex items-center gap-5">
                        <div class="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 shadow-sm group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                            ${item.desc.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-800 tracking-tight leading-tight">${item.desc}</h4>
                            <div class="flex items-center gap-2">
                                <span class="text-[9px] bg-slate-200/50 text-slate-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">${item.category || item.type}</span>
                                <span class="text-[11px] text-slate-400 font-medium">${item.date} • ${item.time || ""}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <span class="font-black ${color} tracking-tight">${symbol}₹${item.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
                        <div class="flex gap-1 no-print">
                            ${
                              listType === "transactions"
                                ? `
                                <button onclick="editTransaction(${item.id})" class="p-2 text-slate-200 hover:text-blue-500 transition" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            `
                                : ""
                            }
                            <button onclick="deleteItem('${listType}', ${item.id})" class="p-2 text-slate-200 hover:text-red-500 transition" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>`;
}

// STATEMENT GENERATOR LOGIC
function downloadPDF() {
  const txFilter = document.getElementById("tx-filter").value;
  let filteredTx = filterByTime(data.transactions, txFilter);

  // Sort Chronologically for Statement (Oldest first)
  filteredTx.sort((a, b) => a.timestamp - b.timestamp);

  // 1. Calculate Summary Stats for the Period
  let totalCr = 0;
  let totalDr = 0;
  filteredTx.forEach((t) => {
    if (t.type === "income") totalCr += t.amount;
    if (t.type === "expense") totalDr += t.amount;
  });
  const periodNet = totalCr - totalDr;

  // 2. Calculate Global Closing Balance (Current Balance)
  const globalIncome = data.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const globalExpense = data.transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const closingBalance = globalIncome - globalExpense;

  // 3. Reverse Calculate Opening Balance
  // If viewing "All Time", Opening is 0 (or close to).
  // If viewing "This Month", Opening = Closing - (This Month Income - This Month Expense)
  // Note: This assumes 'filteredTx' contains ALL transactions for the filtered period.
  // If filteredTx is empty, Opening = Closing.
  let openingBalance = closingBalance - periodNet;

  // 4. Update Statement DOM
  const dateLabel = new Date().toLocaleDateString();
  document.getElementById("stmt-date-range").innerText =
    `Date: ${dateLabel} | Period: ${txFilter.toUpperCase()}`;
  document.getElementById("stmt-holder").innerText =
    data.card.holder || "Authorized User";
  document.getElementById("stmt-number").innerText =
    data.card.number || "XXXX XXXX XXXX XXXX";

  document.getElementById("stmt-open-bal").innerText =
    `₹${openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  document.getElementById("stmt-total-cr").innerText =
    `+₹${totalCr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  document.getElementById("stmt-total-dr").innerText =
    `-₹${totalDr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  document.getElementById("stmt-close-bal").innerText =
    `₹${closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // 5. Generate Table Rows
  const tableBody = document.getElementById("stmt-table-body");
  tableBody.innerHTML = "";

  let runningBalance = openingBalance;

  if (filteredTx.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center py-4 text-slate-400">No transactions found in this period.</td></tr>';
  } else {
    filteredTx.forEach((t) => {
      const isCredit = t.type === "income";
      const debitAmt = isCredit
        ? "-"
        : `₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      const creditAmt = isCredit
        ? `₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : "-";

      // Update running balance
      if (isCredit) runningBalance += t.amount;
      else runningBalance -= t.amount;

      const row = `
                        <tr>
                            <td>${t.date}</td>
                            <td>
                                <div class="font-bold text-xs">${t.desc}</div>
                                <div class="text-[9px] text-slate-500 uppercase">${t.category}</div>
                            </td>
                            <td class="text-xs font-mono text-slate-500">TX#${String(t.id).slice(-4)}</td>
                            <td class="text-right font-mono dr-text">${debitAmt}</td>
                            <td class="text-right font-mono cr-text">${creditAmt}</td>
                            <td class="text-right font-mono font-bold">₹${runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `;
      tableBody.innerHTML += row;
    });
  }

  // 6. Trigger Print
  showToast("Preparing Bank Statement...", "info");
  setTimeout(() => {
    window.print();
  }, 500);
}
