const STORAGE_KEYS = {
  search: "oceanic-search",
  selectedFlight: "oceanic-selected-flight"
};

const BOOKINGS_KEY = "oceanic-bookings";

const airportMap = {
  BNE: "Brisbane",
  SYD: "Sydney",
  MEL: "Melbourne",
  PER: "Perth",
  LAX: "Los Angeles",
  SIN: "Singapore",
  DXB: "Dubai",
  HKG: "Hong Kong"
};

const flights = [
  { id: "OA-101", from: "BNE", to: "SYD", time: "08:15", duration: "2h 10m", price: 249, aircraft: "A320", seats: 12 },
  { id: "OA-204", from: "BNE", to: "SIN", time: "22:45", duration: "8h 30m", price: 899, aircraft: "A350", seats: 8 },
  { id: "OA-178", from: "SYD", to: "LAX", time: "11:30", duration: "13h 45m", price: 1299, aircraft: "B787", seats: 10 },
  { id: "OA-312", from: "MEL", to: "DXB", time: "01:40", duration: "15h 05m", price: 1499, aircraft: "A380", seats: 5 },
  { id: "OA-440", from: "PER", to: "HKG", time: "18:20", duration: "9h 15m", price: 1099, aircraft: "B777", seats: 15 },
  { id: "OA-512", from: "SYD", to: "SIN", time: "09:55", duration: "7h 50m", price: 739, aircraft: "A330", seats: 16 },
  { id: "OA-620", from: "LAX", to: "BNE", time: "16:05", duration: "15h 00m", price: 1349, aircraft: "B787", seats: 7 },
  { id: "OA-894", from: "DXB", to: "MEL", time: "03:10", duration: "14h 20m", price: 1389, aircraft: "A380", seats: 11 }
];

function money(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(value);
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getDefaultSearch() {
  return {
    from: "BNE",
    to: "SYD",
    depart: "2024-10-20",
    return: "2024-10-27",
    passengers: "1"
  };
}

function filterFlights(search) {
  const from = search?.from;
  const to = search?.to;

  if (!from || !to) return flights;

  return flights.filter((flight) => flight.from === from && flight.to === to);
}

function renderResults() {
  const resultsBox = document.getElementById("flight-results");
  const metaBox = document.getElementById("results-meta");

  if (!resultsBox) return;

  const search = readFromStorage(STORAGE_KEYS.search, getDefaultSearch());
  const list = filterFlights(search);

  if (!list.length) {
    resultsBox.innerHTML = `
      <div class="panel" style="padding: 20px;">
        <h3>No flights found</h3>
        <p>Try another route or change the dates.</p>
      </div>
    `;
    metaBox.textContent = "0 flights";
    return;
  }

  metaBox.textContent = `${list.length} flights available`;

  resultsBox.innerHTML = list.map((flight) => `
    <article class="flight-card">
      <div class="flight-route">
        <div class="airport-block">
          <span>${airportMap[flight.from]}</span>
          <strong>${flight.from}</strong>
        </div>

        <div class="route-line">
          <span>${flight.duration}</span>
          <span class="line"></span>
        </div>

        <div class="airport-block">
          <span>${airportMap[flight.to]}</span>
          <strong>${flight.to}</strong>
        </div>
      </div>

      <div class="flight-meta">
        <span><strong>Departs:</strong> ${flight.time}</span>
        <span><strong>Aircraft:</strong> ${flight.aircraft}</span>
        <span><strong>Seats left:</strong> ${flight.seats}</span>
      </div>

      <div class="flight-price">
        <strong>${money(flight.price)}</strong>
        <button class="btn btn-primary select-flight" data-flight-id="${flight.id}">
          Select
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".select-flight").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = flights.find((flight) => flight.id === button.dataset.flightId);
      if (!selected) return;

      saveToStorage(STORAGE_KEYS.selectedFlight, selected);
      window.location.href = "booking.html";
    });
  });
}

function setupSearchForm() {
  const form = document.getElementById("search-form");
  if (!form) return;

  const search = readFromStorage(STORAGE_KEYS.search, getDefaultSearch());

  form.from.value = search.from || "BNE";
  form.to.value = search.to || "SYD";
  form.depart.value = search.depart || "2024-10-20";
  form.return.value = search.return || "2024-10-27";
  form.passengers.value = search.passengers || "1";

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const newSearch = {
      from: formData.get("from"),
      to: formData.get("to"),
      depart: formData.get("depart"),
      return: formData.get("return"),
      passengers: formData.get("passengers") || "1"
    };

    saveToStorage(STORAGE_KEYS.search, newSearch);
    renderResults();
  });

  renderResults();
}

function createBookingCode() {
  return "OA-" + Math.floor(10000 + Math.random() * 90000);
}

function getSelectedFlight() {
  return readFromStorage(STORAGE_KEYS.selectedFlight, null);
}

function calculateTotal(selectedFlight, formData) {
  let total = selectedFlight.price;

  if (formData.get("baggage")) total += 65;
  if (formData.get("meal")) total += 22;
  if (formData.get("insurance")) total += 38;

  return total;
}

function setupBookingPage() {
  const summaryBox = document.getElementById("booking-summary");
  const totalBox = document.getElementById("booking-total");
  const form = document.getElementById("booking-form");

  if (!summaryBox || !form) return;

  const selectedFlight = getSelectedFlight();

  if (!selectedFlight) {
    summaryBox.innerHTML = "<p>Please select a flight first.</p>";
    form.style.display = "none";
    return;
  }

  summaryBox.innerHTML = `
    <div class="flight-route">
      <div class="airport-block">
        <span>${airportMap[selectedFlight.from]}</span>
        <strong>${selectedFlight.from}</strong>
      </div>

      <div class="route-line">
        <span>${selectedFlight.duration}</span>
        <span class="line"></span>
      </div>

      <div class="airport-block">
        <span>${airportMap[selectedFlight.to]}</span>
        <strong>${selectedFlight.to}</strong>
      </div>
    </div>

    <p><strong>Flight:</strong> ${selectedFlight.id} · ${selectedFlight.aircraft} · ${selectedFlight.time}</p>
  `;

  const updateTotal = () => {
    const formData = new FormData(form);
    totalBox.textContent = `Total: ${money(calculateTotal(selectedFlight, formData))}`;
  };

  form.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("change", updateTotal);
    input.addEventListener("input", updateTotal);
  });

  totalBox.textContent = `Total: ${money(selectedFlight.price)}`;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const booking = {
      reference: createBookingCode(),
      flight: selectedFlight,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      type: formData.get("type"),
      seat: formData.get("seat"),
      baggage: !!formData.get("baggage"),
      meal: !!formData.get("meal"),
      insurance: !!formData.get("insurance"),
      total: calculateTotal(selectedFlight, formData),
      status: "Confirmed",
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
    existing.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(existing));

    form.innerHTML = `
      <div class="booking-confirmation">
        <h3>Booking confirmed</h3>
        <p>Your booking reference is <strong>${booking.reference}</strong>.</p>
        <p>We've sent your trip details to <strong>${booking.email}</strong>.</p>
        <p>Total paid: <strong>${money(booking.total)}</strong></p>
        <a href="manage.html" class="btn btn-primary">Manage booking</a>
      </div>
    `;
  });
}

function setupManagePage() {
  const form = document.getElementById("manage-form");
  const resultBox = document.getElementById("manage-result");

  if (!form || !resultBox) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const bookingRef = document.getElementById("bookingRefInput").value.trim();
    const email = document.getElementById("bookingEmailInput").value.trim();

    let bookings = [];
    try {
      bookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
    } catch {
      bookings = [];
    }

    const booking = bookings.find(
      (entry) =>
        entry.reference === bookingRef &&
        String(entry.email).toLowerCase() === email.toLowerCase()
    );

    if (!booking) {
      resultBox.innerHTML = `
        <div class="booking-confirmation">
          <h3>No booking found</h3>
          <p>Check your reference and email address, then try again.</p>
        </div>
      `;
      return;
    }

    resultBox.innerHTML = `
      <div class="booking-detail-box">
        <h3>Booking details</h3>
        <p><strong>Reference:</strong> ${booking.reference}</p>
        <p><strong>Passenger:</strong> ${booking.firstName} ${booking.lastName}</p>
        <p><strong>Flight:</strong> ${booking.flight.id} · ${airportMap[booking.flight.from]} → ${airportMap[booking.flight.to]}</p>
        <p><strong>Seat:</strong> ${booking.seat}</p>
        <p><strong>Total:</strong> ${money(booking.total)}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearchForm();
  setupBookingPage();
  setupManagePage();
});
