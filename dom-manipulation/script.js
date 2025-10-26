// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteBtn = document.getElementById("newQuote");
const formContainer = document.getElementById("formContainer");
const importFile = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");

// Mock server URL (JSONPlaceholder)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Initialize quotes with IDs
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { id: 2, text: "Success is not in what you have, but who you are.", category: "Success" },
  { id: 3, text: "Happiness depends upon ourselves.", category: "Happiness" },
  { id: 4, text: "Be the change that you wish to see in the world.", category: "Inspiration" },
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate dropdowns
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];

  // Random quote dropdown
  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  // Filter dropdown
  const lastFilter = localStorage.getItem("lastFilter") || "all";
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  categoryFilter.value = lastFilter;
}

// Show random quote by selected category
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter(q => q.category === selectedCategory);

  if (!filteredQuotes.length) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" — (${randomQuote.category})`;
  sessionStorage.setItem("lastQuote", JSON.stringify(randomQuote));
}

// Post new quote to server (mock)
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });

    if (!response.ok) throw new Error("Failed to post quote to server");

    const serverResponse = await response.json();
    console.log("Quote posted to server:", serverResponse);
  } catch (error) {
    console.error("Error posting quote to server:", error);
  }
}

// Add new quote
function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!newText || !newCategory) {
    alert("Please enter both a quote and a category!");
    return;
  }

  const newId = quotes.length ? Math.max(...quotes.map(q => q.id)) + 1 : 1;
  const newQuote = { id: newId, text: newText, category: newCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();

  // Post to server
  postQuoteToServer(newQuote);

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("New quote added successfully!");
}

// Create Add Quote Form dynamically
function createAddQuoteForm() {
  const formTitle = document.createElement("h3");
  formTitle.textContent = "Add a New Quote";

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
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(formTitle);
  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
}

// Filter quotes
function filterQuotes() {
  const selectedFilter = categoryFilter.value;
  localStorage.setItem("lastFilter", selectedFilter);

  if (selectedFilter === "all") {
    quoteDisplay.textContent = "Showing all quotes. Click 'Show New Quote'!";
  } else {
    const filtered = quotes.filter(q => q.category === selectedFilter);
    if (!filtered.length) {
      quoteDisplay.textContent = "No quotes in this category.";
    } else {
      const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
      quoteDisplay.textContent = `"${randomQuote.text}" — (${randomQuote.category})`;
    }
  }
}

// Export quotes as JSON
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Import quotes from JSON
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid JSON format");
      importedQuotes.forEach(q => { if(!q.id) q.id = quotes.length ? Math.max(...quotes.map(q=>q.id))+1 : 1; });
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to import quotes: " + err.message);
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Notification
function notifyUser(message) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.top = "10px";
  notification.style.right = "10px";
  notification.style.background = "#007bff";
  notification.style.color = "#fff";
  notification.style.padding = "10px";
  notification.style.borderRadius = "5px";
  notification.style.zIndex = "1000";
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 5000);
}

// Merge server quotes with local
function mergeQuotes(serverQuotes) {
  let updated = false;
  serverQuotes.forEach(sq => {
    const localIndex = quotes.findIndex(lq => lq.id === sq.id);
    if (localIndex === -1) {
      quotes.push(sq);
      updated = true;
    } else if (JSON.stringify(quotes[localIndex]) !== JSON.stringify(sq)) {
      quotes[localIndex] = sq;
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    notifyUser("Quotes synced with server. Conflicts resolved.");
  }
}

// **Sync function**
async function syncQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Failed to fetch server data");

    const serverData = await response.json();
    const serverQuotes = serverData.slice(0, 10).map(item => ({
      id: item.id,
      text: item.title || item.text,
      category: item.body || "General"
    }));

    mergeQuotes(serverQuotes);
  } catch (err) {
    console.error("Sync error:", err);
  }
}

// Event listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportQuotes);
importFile.addEventListener("change", importFromJsonFile);

// Initialize
populateCategories();
createAddQuoteForm();

// Load last quote from sessionStorage
const lastQuote = JSON.parse(sessionStorage.getItem("lastQuote"));
if (lastQuote) {
  quoteDisplay.textContent = `"${lastQuote.text}" — (${lastQuote.category})`;
}

// Periodically sync with server every 30 seconds
setInterval(syncQuotes, 30000);

