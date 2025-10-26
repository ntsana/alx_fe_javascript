// -----------------------------
// Dynamic Quote Generator v2
// - localStorage persistence
// - sessionStorage last-viewed quote
// - JSON import/export
// - dynamic form + controls created with DOM methods
// -----------------------------

// Default quote set (used only if no saved quotes exist)
const DEFAULT_QUOTES = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Success is not in what you have, but who you are.", category: "Success" },
  { text: "Happiness depends upon ourselves.", category: "Happiness" },
  { text: "Be the change that you wish to see in the world.", category: "Inspiration" },
];

// Keys for storage
const LS_KEY = "dq_quotes_v1";         // localStorage key for quotes
const SS_LAST_QUOTE = "dq_last_quote"; // sessionStorage key for last displayed quote (stringified object)

// In-memory quotes array
let quotes = [];

// DOM references
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuote");
const formContainer = document.getElementById("formContainer");
const storageControls = document.getElementById("storageControls");

// -----------------------------
// Persistence functions
// -----------------------------
function saveQuotes() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
  }
}

function loadQuotes() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) {
    // Use defaults (and save them)
    quotes = [...DEFAULT_QUOTES];
    saveQuotes();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    // Validate parsed structure: must be an array of objects with text & category
    if (Array.isArray(parsed) && parsed.every(isValidQuote)) {
      quotes = parsed;
    } else {
      console.warn("Saved quotes invalid — resetting to defaults.");
      quotes = [...DEFAULT_QUOTES];
      saveQuotes();
    }
  } catch (err) {
    console.warn("Could not parse saved quotes — resetting to defaults.", err);
    quotes = [...DEFAULT_QUOTES];
    saveQuotes();
  }
}

// Simple validator for quote objects
function isValidQuote(obj) {
  return obj && typeof obj.text === "string" && typeof obj.category === "string";
}

// -----------------------------
// UI population
// -----------------------------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = "";

  // If there are no categories (edge case), create placeholder
  if (categories.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No categories";
    categorySelect.appendChild(opt);
    return;
  }

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// -----------------------------
// Show random quote and session storage usage
// -----------------------------
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  displayQuote(randomQuote);

  // Save last shown quote into sessionStorage (temporary for session only)
  try {
    sessionStorage.setItem(SS_LAST_QUOTE, JSON.stringify(randomQuote));
  } catch (err) {
    console.warn("Could not save last quote to sessionStorage:", err);
  }
}

function displayQuote(quoteObj) {
  quoteDisplay.textContent = `"${quoteObj.text}" — (${quoteObj.category})`;
}

// On init, if sessionStorage has last quote, display it
function restoreLastQuoteFromSession() {
  try {
    const raw = sessionStorage.getItem(SS_LAST_QUOTE);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (isValidQuote(obj)) {
      displayQuote(obj);
    }
  } catch (err) {
    console.warn("Could not restore last quote from session:", err);
  }
}

// -----------------------------
// Adding quotes & preventing duplicates
// -----------------------------
function addQuoteFromInputs(textInput, categoryInput) {
  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category!");
    return;
  }

  const newQuote = { text: newText, category: newCategory };

  // Avoid exact duplicates (same text & category)
  const duplicate = quotes.some(q => q.text === newQuote.text && q.category === newQuote.category);
  if (duplicate) {
    alert("This quote already exists.");
    return;
  }

  quotes.push(newQuote);
  saveQuotes();
  populateCategories();

  // Clear inputs
  textInput.value = "";
  categoryInput.value = "";

  // Optionally show newly added quote
  displayQuote(newQuote);
  sessionStorage.setItem(SS_LAST_QUOTE, JSON.stringify(newQuote));
}

// -----------------------------
// Create Add-Quote Form dynamically
// -----------------------------
function createAddQuoteForm() {
  formContainer.innerHTML = ""; // clear

  const title = document.createElement("h3");
  title.textContent = "Add a New Quote";

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", () => addQuoteFromInputs(quoteInput, categoryInput));

  // Small note
  const note = document.createElement("small");
  note.textContent = "Quotes are saved to your browser (localStorage).";

  // Append to container
  formContainer.appendChild(title);
  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
  formContainer.appendChild(note);
}

// -----------------------------
// JSON Export / Import
// -----------------------------
function createStorageControls() {
  storageControls.innerHTML = "";

  // Export button
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.addEventListener("click", exportQuotesToJson);

  // Import file input (hidden) + label button to trigger it
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json,application/json";
  importInput.style.display = "none";
  importInput.id = "importFile";

  importInput.addEventListener("change", importFromJsonFile);

  const importBtn = document.createElement("button");
  importBtn.textContent = "Import Quotes (JSON)";
  importBtn.addEventListener("click", () => importInput.click());

  // Clear all quotes button (dangerous - user confirmation)
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Reset to Defaults";
  clearBtn.addEventListener("click", () => {
    if (confirm("This will remove your saved quotes and restore defaults. Continue?")) {
      quotes = [...DEFAULT_QUOTES];
      saveQuotes();
      populateCategories();
      displayQuote({ text: "Quotes reset to defaults.", category: "System" });
      sessionStorage.removeItem(SS_LAST_QUOTE);
    }
  });

  // Append to storageControls container
  storageControls.appendChild(exportBtn);
  storageControls.appendChild(importBtn);
  storageControls.appendChild(importInput);
  storageControls.appendChild(clearBtn);
}

// Export: create blob and a temporary link to download
function exportQuotesToJson() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Could not export quotes.");
  }
}

// Import: read file, validate, merge avoiding duplicates
function importFromJsonFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);

      if (!Array.isArray(imported) || !imported.every(isValidQuote)) {
        alert("Invalid JSON format. File must be an array of objects with 'text' and 'category' strings.");
        return;
      }

      // Merge: add only non-duplicates
      let added = 0;
      imported.forEach(q => {
        const exists = quotes.some(existing => existing.text === q.text && existing.category === q.category);
        if (!exists) {
          quotes.push(q);
          added++;
        }
      });

      if (added > 0) {
        saveQuotes();
        populateCategories();
      }

      alert(`Import complete. ${added} new quote(s) added.`);
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import JSON. Make sure the file is valid JSON.");
    } finally {
      // reset input so same file can be re-selected later if needed
      event.target.value = "";
    }
  };

  reader.onerror = function () {
    alert("Failed to read file.");
  };

  reader.readAsText(file);
}

// -----------------------------
// Initialization
// -----------------------------
function initApp() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();
  createStorageControls();
  restoreLastQuoteFromSession();

  // Wire up main button
  newQuoteBtn.addEventListener("click", showRandomQuote);

  // If there is no selected category (rare), select first
  if (!categorySelect.value && categorySelect.options.length > 0) {
    categorySelect.selectedIndex = 0;
  }
}

// Run
initApp();

