// EventForce Application Core Controller
let currentUser = null;
let currentTab = 'events';
let activeCategory = 'All';
let eventsList = [];
let categoryChartInstance = null;
let workforceChartInstance = null;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initUserSession();
  setupEventListeners();
  await loadEvents();
});

// User Session Management
function initUserSession() {
  currentUser = api.getUser();
  updateAuthUI();
}

function updateAuthUI() {
  const userSection = document.getElementById('userSection');
  const navWorkforce = document.getElementById('navWorkforce');
  const navAdmin = document.getElementById('navAdmin');
  const navMyTickets = document.getElementById('navMyTickets');

  if (currentUser) {
    userSection.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-bold text-slate-800 leading-tight">${currentUser.name}</p>
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
            currentUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
            currentUser.role === 'staff' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }">
            ${currentUser.role === 'admin' ? '👑 Organizer' : currentUser.role === 'staff' ? '👷 Crew Staff' : '🎓 Attendee'}
          </span>
        </div>
        <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}" 
             class="w-10 h-10 rounded-full border-2 border-indigo-500 shadow-sm object-cover" 
             alt="Avatar"
             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';">
        <button onclick="handleLogout()" class="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Log Out">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    `;

    // Role-dependent navigation visibility
    if (navWorkforce) navWorkforce.classList.remove('hidden');
    if (navAdmin) {
      if (currentUser.role === 'admin') {
        navAdmin.classList.remove('hidden');
      } else {
        navAdmin.classList.add('hidden');
      }
    }
    if (navMyTickets) navMyTickets.classList.remove('hidden');
  } else {
    userSection.innerHTML = `
      <div class="flex items-center space-x-2">
        <button onclick="openLoginModal()" class="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all">
          Sign In
        </button>
        <button onclick="openRegisterModal()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all">
          Register
        </button>
      </div>
    `;
    if (navWorkforce) navWorkforce.classList.remove('hidden'); // allow preview
    if (navAdmin) navAdmin.classList.remove('hidden'); // allow preview with demo
    if (navMyTickets) navMyTickets.classList.remove('hidden');
  }
}

// Quick Demo Login Switcher (Designed for fast persona exploration)
async function quickSwitchDemo(role) {
  try {
    let email = 'admin@eventforce.com';
    let password = 'admin123';

    if (role === 'staff') {
      email = 'staff1@eventforce.com';
      password = 'staff123';
    } else if (role === 'attendee') {
      email = 'attendee@eventforce.com';
      password = 'user123';
    }

    showToast(`Switching to ${role.toUpperCase()} persona...`, 'info');
    const res = await api.login(email, password);
    currentUser = res.user;
    updateAuthUI();
    showToast(`Logged in as ${res.user.name} (${role})`, 'success');

    // Automatically navigate to relevant tab
    if (role === 'admin') {
      switchTab('admin');
    } else if (role === 'staff') {
      switchTab('workforce');
    } else {
      switchTab('events');
    }
  } catch (err) {
    showToast('Failed to switch demo account: ' + err.message, 'error');
  }
}

function handleLogout() {
  api.clearSession();
  currentUser = null;
  updateAuthUI();
  showToast('Logged out successfully', 'info');
  switchTab('events');
}

// Navigation Tab Switcher
function switchTab(tab) {
  currentTab = tab;

  // Update nav buttons
  ['navEvents', 'navMyTickets', 'navWorkforce', 'navAdmin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('text-indigo-600', 'font-bold', 'border-b-2', 'border-indigo-600');
      el.classList.add('text-slate-600', 'hover:text-indigo-600');
    }
  });

  const activeNav = document.getElementById({
    'events': 'navEvents',
    'my-tickets': 'navMyTickets',
    'workforce': 'navWorkforce',
    'admin': 'navAdmin'
  }[tab]);

  if (activeNav) {
    activeNav.classList.remove('text-slate-600');
    activeNav.classList.add('text-indigo-600', 'font-bold', 'border-b-2', 'border-indigo-600');
  }

  // Switch content containers
  ['viewEvents', 'viewMyTickets', 'viewWorkforce', 'viewAdmin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const activeView = document.getElementById({
    'events': 'viewEvents',
    'my-tickets': 'viewMyTickets',
    'workforce': 'viewWorkforce',
    'admin': 'viewAdmin'
  }[tab]);

  if (activeView) activeView.classList.remove('hidden');

  // Trigger data loaders for specific tabs
  if (tab === 'events') {
    loadEvents();
  } else if (tab === 'my-tickets') {
    loadMyTickets();
  } else if (tab === 'workforce') {
    loadWorkforcePortal();
  } else if (tab === 'admin') {
    loadAdminDashboard();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load and Render Events
async function loadEvents() {
  try {
    const searchInput = document.getElementById('eventSearchInput');
    const query = searchInput ? searchInput.value.trim() : '';

    const res = await api.getEvents({
      category: activeCategory,
      search: query
    });

    eventsList = res.events || [];
    renderEventsGrid(eventsList);
  } catch (err) {
    showToast('Failed to load events: ' + err.message, 'error');
  }
}

function filterCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    if (btn.dataset.category === cat) {
      btn.className = 'cat-pill px-4 py-2 text-sm font-semibold rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-200 transition-all';
    } else {
      btn.className = 'cat-pill px-4 py-2 text-sm font-medium rounded-full bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all';
    }
  });
  loadEvents();
}

function renderEventsGrid(events) {
  const grid = document.getElementById('eventsGrid');
  const countEl = document.getElementById('eventsCountBadge');
  if (countEl) countEl.innerText = `${events.length} Events Available`;

  if (!events || events.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          <i class="fas fa-calendar-times"></i>
        </div>
        <h3 class="text-base font-bold text-slate-800">No Events Found</h3>
        <p class="text-slate-500 text-xs mt-1">Try selecting another category or clear your search keyword.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = events.map(evt => {
    const occupancy = Math.round((evt.registeredCount / evt.capacity) * 100);
    const isFull = evt.registeredCount >= evt.capacity;
    const isFree = evt.ticketPrice === 0;

    const categoryBadges = {
      'Technical': 'bg-blue-50 text-blue-700 border-blue-200',
      'Conference': 'bg-purple-50 text-purple-700 border-purple-200',
      'Cultural': 'bg-pink-50 text-pink-700 border-pink-200',
      'Sports': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Workshop': 'bg-amber-50 text-amber-700 border-amber-200'
    };

    return `
      <div class="event-card bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between h-full">
        <div>
          <!-- Banner Container with Aspect Ratio Lock -->
          <div class="relative h-48 w-full overflow-hidden group cursor-pointer" onclick="openEventDetailsModal('${evt.id}')">
            <img src="${evt.bannerUrl}" alt="${evt.title}" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';">
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20"></div>
            <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider border shadow-sm backdrop-blur-md ${categoryBadges[evt.category] || 'bg-slate-100 text-slate-700 border-slate-200'}">
              ${evt.category}
            </span>
            <span class="absolute top-3 right-3 px-3 py-1 rounded-full text-2xs font-black tracking-wider ${isFree ? 'bg-emerald-600 text-white shadow-emerald-900/30' : 'bg-slate-900 text-white'} shadow-md">
              ${isFree ? 'FREE PASS' : `$${evt.ticketPrice}`}
            </span>
          </div>

          <!-- Body Content with Fixed Vertical Alignment -->
          <div class="p-5 flex flex-col">
            <div class="flex items-center text-xs text-indigo-600 font-semibold mb-2">
              <i class="far fa-calendar-alt mr-1.5"></i>
              <span>${new Date(evt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span class="mx-2 text-slate-300">•</span>
              <i class="far fa-clock mr-1.5"></i>
              <span>${evt.time}</span>
            </div>

            <h3 class="clamp-title text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer" onclick="openEventDetailsModal('${evt.id}')" title="${evt.title}">
              ${evt.title}
            </h3>

            <p class="text-xs text-slate-500 mt-2 flex items-center h-5">
              <i class="fas fa-map-marker-alt text-slate-400 mr-1.5 flex-shrink-0"></i>
              <span class="truncate">${evt.venue}</span>
            </p>

            <p class="clamp-desc text-xs text-slate-600 mt-2 leading-relaxed">
              ${evt.description}
            </p>

            <!-- Occupancy bar -->
            <div class="mt-4 pt-3.5 border-t border-slate-100">
              <div class="flex justify-between text-2xs font-semibold text-slate-600 mb-1.5">
                <span>Registrations: <strong>${evt.registeredCount}</strong> / ${evt.capacity}</span>
                <span class="${isFull ? 'text-red-500 font-bold' : 'text-slate-500'}">
                  ${isFull ? 'Housefull' : `${evt.capacity - evt.registeredCount} seats left`}
                </span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : occupancy > 80 ? 'bg-amber-500' : 'bg-indigo-600'}" 
                     style="width: ${Math.min(100, occupancy)}%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions with Uniform Padding and Heights -->
        <div class="p-5 pt-0 grid grid-cols-2 gap-2.5">
          <button onclick="openEventDetailsModal('${evt.id}')" 
                  class="w-full py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-center flex items-center justify-center gap-1.5">
            <i class="fas fa-info-circle text-slate-400"></i>
            <span>Details</span>
          </button>
          <button onclick="openBookingModal('${evt.id}')" 
                  ${isFull ? 'disabled' : ''}
                  class="w-full py-2.5 px-3 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                    isFull ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
                  }">
            <i class="fas fa-ticket-alt"></i>
            <span>${isFull ? 'Closed' : 'Book Pass'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Event Details Modal
async function openEventDetailsModal(eventId) {
  try {
    const res = await api.getEvent(eventId);
    const evt = res.event;
    const tasks = res.workforceTasks || [];
    const speakers = evt.speakers || [];
    const sponsors = evt.sponsors || [];
    const agenda = evt.agenda || [];
    const feedbacks = evt.feedbacks || [];

    const modalContent = document.getElementById('eventDetailsContent');
    modalContent.innerHTML = `
      <div class="relative h-64 sm:h-72 overflow-hidden rounded-t-2xl">
        <img src="${evt.bannerUrl}" class="w-full h-full object-cover" alt="${evt.title}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80';">
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent"></div>
        <div class="absolute bottom-5 left-6 right-6 text-white">
          <span class="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-indigo-600 mb-2 inline-block shadow-sm">
            ${evt.category}
          </span>
          <h2 class="text-2xl sm:text-3xl font-black leading-tight">${evt.title}</h2>
          <p class="text-xs sm:text-sm text-slate-200 mt-1 flex items-center gap-2">
            <span>By <strong class="text-white">${evt.organizerName}</strong></span>
            <span>•</span>
            <span>${evt.venue}</span>
          </p>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Date, Venue & Pricing Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-2xs text-slate-400 font-bold tracking-wider uppercase block">DATE & TIME</span>
            <p class="text-sm font-bold text-slate-800 mt-1">${new Date(evt.date).toDateString()}</p>
            <p class="text-xs text-indigo-600 font-medium">${evt.time}</p>
          </div>
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-2xs text-slate-400 font-bold tracking-wider uppercase block">VENUE LOCATION</span>
            <p class="text-sm font-bold text-slate-800 mt-1 line-clamp-2">${evt.venue}</p>
          </div>
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-2xs text-slate-400 font-bold tracking-wider uppercase block">ADMISSION TICKET</span>
            <p class="text-sm font-black ${evt.ticketPrice === 0 ? 'text-emerald-600' : 'text-slate-800'} mt-1">
              ${evt.ticketPrice === 0 ? 'FREE ENTRY' : `$${evt.ticketPrice} / pass`}
            </p>
            <p class="text-xs text-slate-500 font-medium">${evt.seatsLeft} of ${evt.capacity} seats remaining</p>
          </div>
        </div>

        <!-- Overview -->
        <div>
          <h4 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <i class="fas fa-align-left text-indigo-600"></i> Event Overview
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">${evt.description}</p>
        </div>

        <!-- Featured Keynote Speakers -->
        ${speakers.length > 0 ? `
          <div class="pt-4 border-t border-slate-100">
            <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="fas fa-microphone-alt text-indigo-600"></i> Keynote & Featured Speakers
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${speakers.map(spk => `
                <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3.5">
                  <img src="${spk.avatar}" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 flex-shrink-0" alt="${spk.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';">
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-slate-900 truncate">${spk.name}</p>
                    <p class="text-2xs text-indigo-600 font-semibold truncate">${spk.role} • ${spk.company}</p>
                    <p class="text-2xs text-slate-500 mt-0.5 line-clamp-1 italic">"${spk.topic}"</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Multi-Track Agenda / Schedule -->
        ${agenda.length > 0 ? `
          <div class="pt-4 border-t border-slate-100">
            <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <i class="far fa-calendar-check text-indigo-600"></i> Schedule & Sessions Track
            </h4>
            <div class="space-y-2">
              ${agenda.map(ag => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-3">
                    <span class="px-2 py-1 font-mono font-bold bg-indigo-100 text-indigo-700 rounded text-2xs">${ag.time}</span>
                    <div>
                      <p class="font-bold text-slate-800">${ag.title}</p>
                      <p class="text-2xs text-slate-500">Host/Speaker: ${ag.speaker}</p>
                    </div>
                  </div>
                  <span class="text-2xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600">
                    📍 ${ag.room}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Sponsors & Partners Showcase -->
        ${sponsors.length > 0 ? `
          <div class="pt-4 border-t border-slate-100">
            <h4 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <i class="fas fa-handshake text-indigo-600"></i> Supporting Sponsors & Partners
            </h4>
            <div class="flex flex-wrap items-center gap-2.5">
              ${sponsors.map(sp => `
                <div class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                  ${sp.logo ? `<img src="${sp.logo}" class="w-4 h-4 rounded-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'" alt="">` : ''}
                  <span class="text-xs font-bold text-slate-800">${sp.name}</span>
                  <span class="text-2xs text-indigo-600 font-semibold px-1.5 py-0.5 bg-indigo-50 rounded">${sp.tier}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Assigned Workforce Crew Section -->
        <div class="pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="fas fa-users-cog text-indigo-600"></i> Assigned EventForce Crew (${tasks.length})
            </h4>
            <span class="text-2xs text-slate-400 uppercase font-bold tracking-wider">Live Shift Operations</span>
          </div>

          ${tasks.length === 0 ? `
            <p class="text-xs text-slate-400 italic">No crew tasks assigned to this event yet.</p>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${tasks.map(t => `
                <div class="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p class="font-bold text-slate-800">${t.title}</p>
                    <p class="text-slate-500">Crew: <span class="font-medium text-indigo-600">${t.assignedToName}</span> (${t.roleRequired})</p>
                  </div>
                  <span class="px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                    t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    t.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }">
                    ${t.status}
                  </span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Attendee Reviews & Star Ratings -->
        <div class="pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i class="fas fa-star text-amber-400"></i> Attendee Feedback (${feedbacks.length})
            </h4>
          </div>

          ${feedbacks.length > 0 ? `
            <div class="space-y-2 mb-4">
              ${feedbacks.map(fb => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-slate-800">${fb.attendeeName}</span>
                    <span class="text-amber-500 font-bold">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
                  </div>
                  <p class="text-slate-600">${fb.comment}</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-xs text-slate-400 italic mb-4">No reviews submitted yet. Be the first to review!</p>
          `}

          <!-- Review Submission Form -->
          <div class="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
            <p class="text-xs font-bold text-slate-800 mb-2">Leave Attendee Feedback</p>
            <div class="flex items-center gap-2 mb-2">
              <select id="reviewRatingSelect" class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold">
                <option value="5">★★★★★ (5 Stars)</option>
                <option value="4">★★★★☆ (4 Stars)</option>
                <option value="3">★★★☆☆ (3 Stars)</option>
              </select>
              <input type="text" id="reviewCommentInput" placeholder="Write brief feedback..." class="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <button onclick="handleFeedbackSubmit('${evt.id}')" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all">
                Submit
              </button>
            </div>
          </div>
        </div>

        <!-- Action bar -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button onclick="closeModal('eventDetailsModal')" class="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            Close
          </button>
          <button onclick="closeModal('eventDetailsModal'); openBookingModal('${evt.id}')" 
                  class="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-all">
            Proceed to Book Pass
          </button>
        </div>
      </div>
    `;

    openModal('eventDetailsModal');
  } catch (err) {
    showToast('Failed to load event details: ' + err.message, 'error');
  }
}

async function handleFeedbackSubmit(eventId) {
  if (!currentUser) {
    showToast('Please sign in to submit feedback!', 'warning');
    openLoginModal();
    return;
  }
  const rating = document.getElementById('reviewRatingSelect').value;
  const comment = document.getElementById('reviewCommentInput').value.trim();

  try {
    await api.submitFeedback(eventId, rating, comment);
    triggerConfetti();
    showToast('Thank you for your feedback!', 'success');
    openEventDetailsModal(eventId); // reload modal with updated reviews
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Booking Modal
function openBookingModal(eventId) {
  const event = eventsList.find(e => e.id === eventId);
  if (!event) {
    showToast('Event not found', 'error');
    return;
  }

  // Pre-fill user data if logged in
  document.getElementById('bookingEventId').value = event.id;
  document.getElementById('bookingEventTitle').innerText = event.title;
  document.getElementById('bookingEventPrice').innerText = event.ticketPrice === 0 ? 'FREE' : `$${event.ticketPrice}`;
  document.getElementById('bookingEventDate').innerText = `${new Date(event.date).toLocaleDateString()} (${event.time})`;
  document.getElementById('bookingEventVenue').innerText = event.venue;

  if (currentUser) {
    document.getElementById('bookAttendeeName').value = currentUser.name || '';
    document.getElementById('bookAttendeeEmail').value = currentUser.email || '';
    document.getElementById('bookAttendeePhone').value = currentUser.phone || '';
  }

  openModal('bookingModal');
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const eventId = document.getElementById('bookingEventId').value;
  const name = document.getElementById('bookAttendeeName').value.trim();
  const email = document.getElementById('bookAttendeeEmail').value.trim();
  const phone = document.getElementById('bookAttendeePhone').value.trim();
  const college = document.getElementById('bookAttendeeCollege').value.trim();

  // If not logged in, prompt quick sign-in or auto guest account
  if (!currentUser) {
    showToast('Please sign in or use one-click Attendee login to book tickets!', 'warning');
    openLoginModal();
    return;
  }

  try {
    const res = await api.bookTicket({
      eventId,
      attendeeName: name,
      attendeeEmail: email,
      attendeePhone: phone,
      college
    });

    closeModal('bookingModal');
    triggerConfetti();
    showToast('🎉 Ticket successfully booked!', 'success');

    // Display the generated ticket pass with QR Code!
    showTicketPass(res.ticket);
    loadEvents(); // refresh seat counts
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Display Digital Ticket Pass with QR Code
function showTicketPass(ticket) {
  const container = document.getElementById('ticketPassContainer');
  container.innerHTML = `
    <div id="printableTicket" class="ticket-pass p-6 shadow-xl border border-slate-200">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span class="text-xs font-extrabold uppercase tracking-widest text-indigo-600">EventForce Digital Pass</span>
          <h3 class="text-xl font-black text-slate-800">${ticket.eventTitle}</h3>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400 block">TICKET ID</span>
          <span class="text-sm font-mono font-bold text-slate-800">${ticket.ticketNumber}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-200 items-center">
        <div class="space-y-3 md:col-span-2">
          <div>
            <span class="text-xs font-semibold text-slate-400">ATTENDEE NAME</span>
            <p class="text-base font-bold text-slate-800">${ticket.attendeeName}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-xs font-semibold text-slate-400">DATE & TIME</span>
              <p class="text-sm font-semibold text-slate-700">${ticket.eventDate} | ${ticket.eventTime}</p>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-400">STATUS</span>
              <p class="text-sm font-bold ${ticket.status === 'Checked In' ? 'text-emerald-600' : 'text-blue-600'}">
                ${ticket.status}
              </p>
            </div>
          </div>
          <div>
            <span class="text-xs font-semibold text-slate-400">VENUE</span>
            <p class="text-sm text-slate-600">${ticket.eventVenue}</p>
          </div>
        </div>

        <!-- Real QR Code rendering -->
        <div class="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner border border-slate-100">
          <div id="qrcodeBox" class="w-32 h-32 flex items-center justify-center"></div>
          <span class="text-2xs font-mono text-slate-400 mt-2 text-center">Scan at desk for admission</span>
        </div>
      </div>

      <div class="flex justify-between items-center pt-4 text-xs text-slate-400 no-print">
        <span>EventForce Certified Cryptographic E-Pass • Gate Verified</span>
        <button onclick="window.print()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all">
          <i class="fas fa-print"></i> Print Ticket Pass
        </button>
      </div>
    </div>
  `;

  // Render QR Code
  setTimeout(() => {
    const qrBox = document.getElementById('qrcodeBox');
    if (qrBox && typeof QRCode !== 'undefined') {
      qrBox.innerHTML = '';
      new QRCode(qrBox, {
        text: ticket.qrData || ticket.ticketNumber,
        width: 120,
        height: 120,
        colorDark: "#1e1b4b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }, 100);

  openModal('ticketModal');
}

// Load Attendee's Tickets
async function loadMyTickets() {
  const container = document.getElementById('myTicketsList');
  if (!currentUser) {
    container.innerHTML = `
      <div class="py-16 text-center">
        <i class="fas fa-lock text-4xl text-slate-300 mb-3"></i>
        <h3 class="text-lg font-bold text-slate-700">Sign In to View Your Tickets</h3>
        <p class="text-slate-500 text-sm mt-1 mb-4">Please log in or switch to the Attendee demo account.</p>
        <button onclick="quickSwitchDemo('attendee')" class="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg">
          Switch to Attendee Demo
        </button>
      </div>
    `;
    return;
  }

  try {
    const res = await api.getMyTickets();
    const tickets = res.tickets || [];

    if (tickets.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center">
          <i class="fas fa-ticket-alt text-4xl text-slate-300 mb-3"></i>
          <h3 class="text-lg font-bold text-slate-700">No Tickets Found</h3>
          <p class="text-slate-500 text-sm mt-1 mb-4">You have not registered for any events yet.</p>
          <button onclick="switchTab('events')" class="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg">
            Browse Events
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = tickets.map(ticket => `
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
              ${ticket.ticketNumber}
            </span>
            <span class="text-xs px-2 py-0.5 rounded-full font-bold ${
              ticket.status === 'Checked In' ? 'bg-emerald-100 text-emerald-800' :
              ticket.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }">
              ${ticket.status}
            </span>
          </div>
          <h4 class="text-lg font-bold text-slate-800">${ticket.eventTitle}</h4>
          <p class="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span><i class="far fa-calendar-alt text-indigo-500 mr-1"></i> ${ticket.eventDate} (${ticket.eventTime})</span>
            <span>•</span>
            <span><i class="fas fa-map-marker-alt text-indigo-500 mr-1"></i> ${ticket.eventVenue}</span>
          </p>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto">
          <button onclick='showTicketPass(${JSON.stringify(ticket)})' 
                  class="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all">
            <i class="fas fa-qrcode mr-1"></i> View QR Pass
          </button>
          ${ticket.status !== 'Cancelled' ? `
            <button onclick="handleCancelTicket('${ticket.id}')" 
                    class="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all">
              Cancel
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load tickets: ' + err.message, 'error');
  }
}

async function handleCancelTicket(ticketId) {
  if (!confirm('Are you sure you want to cancel this event ticket?')) return;
  try {
    await api.cancelTicket(ticketId);
    showToast('Ticket cancelled', 'info');
    loadMyTickets();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Workforce Crew Portal
async function loadWorkforcePortal() {
  const container = document.getElementById('workforceTasksList');
  const rosterContainer = document.getElementById('crewDirectoryList');

  try {
    // If logged in as staff, load personal tasks; if admin or guest, load all tasks
    const tasksRes = await api.getWorkforceTasks();
    const tasks = tasksRes.tasks || [];

    const myTasks = currentUser ? tasks.filter(t => t.assignedToUserId === currentUser.id) : tasks;

    // Render Stats
    document.getElementById('wfTotalTasks').innerText = tasks.length;
    document.getElementById('wfActiveTasks').innerText = tasks.filter(t => t.status === 'In Progress').length;
    document.getElementById('wfCompletedTasks').innerText = tasks.filter(t => t.status === 'Completed').length;

    // Render My Assigned Shifts
    if (myTasks.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
            <i class="fas fa-clipboard-check"></i>
          </div>
          <p class="text-sm font-bold text-slate-700">No shifts assigned to your profile currently.</p>
          <p class="text-xs text-slate-400 mt-0.5">Switch to Event Director persona to assign shifts or view all shifts.</p>
        </div>
      `;
    } else {
      container.innerHTML = myTasks.map(t => `
        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="text-2xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                t.priority === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                t.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
              }">
                ${t.priority} Priority
              </span>
              <span class="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <i class="far fa-clock text-indigo-500"></i> ${t.shiftStart} - ${t.shiftEnd}
              </span>
            </div>

            <h4 class="text-base font-bold text-slate-900 leading-snug">${t.title}</h4>
            <p class="text-xs font-semibold text-indigo-600 mt-1 truncate">${t.eventTitle}</p>
            <p class="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">${t.description}</p>

            <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-2xs text-slate-500">
              <div class="truncate">
                <span class="text-slate-400 block font-semibold">LOCATION</span>
                <span class="font-bold text-slate-700 truncate block">📍 ${t.location || 'Main Venue'}</span>
              </div>
              <div class="truncate">
                <span class="text-slate-400 block font-semibold">ASSIGNED CREW</span>
                <span class="font-bold text-indigo-700 truncate block">👤 ${t.assignedToName}</span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
            <span class="text-2xs uppercase tracking-wider font-extrabold text-slate-400">Shift Progress:</span>
            <select onchange="updateShiftStatus('${t.id}', this.value)" 
                    class="text-xs font-bold rounded-xl px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600">
              <option value="Assigned" ${t.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
              <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>
      `).join('');
    }

    // Load Crew Directory
    const dirRes = await api.getCrewDirectory();
    const crew = dirRes.crew || [];
    if (rosterContainer) {
      rosterContainer.innerHTML = crew.map(c => `
        <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img src="${c.avatar}" class="w-9 h-9 rounded-full border border-slate-200 object-cover" alt="${c.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80';">
            <div>
              <p class="text-xs font-bold text-slate-800 leading-tight">${c.name}</p>
              <p class="text-2xs text-slate-500">${c.department} • <span class="text-indigo-600 font-semibold">${c.specialization}</span></p>
              <p class="text-2xs text-slate-400 mt-0.5">${c.phone}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xs font-bold px-2 py-0.5 rounded-full ${c.activeTasks > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
              ${c.activeTasks} Shifts
            </span>
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    showToast('Workforce load error: ' + err.message, 'error');
  }
}

async function updateShiftStatus(taskId, status) {
  try {
    await api.updateTaskStatus(taskId, status);
    showToast(`Task status updated to ${status}`, 'success');
    loadWorkforcePortal();
  } catch (err) {
    showToast(err.message, 'error');
    loadWorkforcePortal();
  }
}

// Crew Real-Time Entry Check-In Desk Tool
async function handleCheckInSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('checkInTicketInput');
  const resultBox = document.getElementById('checkInResultBox');
  const code = input.value.trim();

  if (!code) {
    showToast('Please enter a ticket number or scan code', 'warning');
    return;
  }

  try {
    const res = await api.checkInTicket(code);
    resultBox.className = 'mt-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 block';
    resultBox.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-check"></i>
        </div>
        <div>
          <h5 class="text-sm font-bold">${res.message}</h5>
          <p class="text-xs mt-0.5">Attendee: <strong>${res.ticket.attendeeName}</strong> (${res.ticket.college || 'Participant'})</p>
          <p class="text-2xs text-emerald-600 mt-1">Ticket: ${res.ticket.ticketNumber} • Event: ${res.ticket.eventTitle}</p>
        </div>
      </div>
    `;
    input.value = '';
    showToast('Check-in confirmed!', 'success');
  } catch (err) {
    resultBox.className = 'mt-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 block';
    resultBox.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-red-200 text-red-800 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div>
          <h5 class="text-sm font-bold">Verification Failed</h5>
          <p class="text-xs mt-0.5">${err.message}</p>
        </div>
      </div>
    `;
    showToast(err.message, 'error');
  }
}

// Admin Dashboard
async function loadAdminDashboard() {
  try {
    const res = await api.getDashboardAnalytics();
    const stats = res.stats;

    // Stat counters
    document.getElementById('admTotalEvents').innerText = stats.totalEvents;
    document.getElementById('admTotalRegs').innerText = stats.totalRegistrations;
    document.getElementById('admCheckedIn').innerText = `${stats.checkedInAttendees} (${stats.checkInRate}%)`;
    document.getElementById('admTotalStaff').innerText = stats.totalStaff;

    // Render Charts
    renderAnalyticsCharts(stats);

    // Render Event Management Table
    renderAdminEventsTable();

    // Populate dropdowns for shift assignment modal
    populateStaffAndEventDropdowns();

    // Render Attendee Verification Table
    renderAdminAttendeesTable();
  } catch (err) {
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

function renderAnalyticsCharts(stats) {
  // 1. Categories chart
  const catCanvas = document.getElementById('chartCategories');
  if (catCanvas && typeof Chart !== 'undefined') {
    const ctx = catCanvas.getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const labels = Object.keys(stats.categoryCounts);
    const data = Object.values(stats.categoryCounts);

    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#4f46e5', '#0ea5e9', '#ec4899', '#10b981', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  // 2. Workforce Tasks chart
  const wfCanvas = document.getElementById('chartWorkforce');
  if (wfCanvas && typeof Chart !== 'undefined') {
    const ctx = wfCanvas.getContext('2d');
    if (workforceChartInstance) workforceChartInstance.destroy();

    workforceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Assigned', 'In Progress', 'Completed'],
        datasets: [{
          label: 'Shifts & Tasks',
          data: [
            stats.taskStatusCounts['Assigned'] || 0,
            stats.taskStatusCounts['In Progress'] || 0,
            stats.taskStatusCounts['Completed'] || 0
          ],
          backgroundColor: ['#94a3b8', '#f59e0b', '#10b981'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

async function renderAdminEventsTable() {
  const tableBody = document.getElementById('adminEventsTableBody');
  const res = await api.getEvents();
  const events = res.events || [];

  tableBody.innerHTML = events.map(e => `
    <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
      <td class="py-3 px-4">
        <div class="flex items-center space-x-3">
          <img src="${e.bannerUrl}" class="w-10 h-10 rounded-lg object-cover" alt="" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80';">
          <div>
            <p class="text-sm font-bold text-slate-800">${e.title}</p>
            <p class="text-xs text-slate-400">${e.venue}</p>
          </div>
        </div>
      </td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          ${e.category}
        </span>
      </td>
      <td class="py-3 px-4 text-xs text-slate-600">
        ${new Date(e.date).toLocaleDateString()}
      </td>
      <td class="py-3 px-4 text-xs font-semibold">
        ${e.registeredCount} / ${e.capacity}
      </td>
      <td class="py-3 px-4 text-xs font-bold ${e.ticketPrice === 0 ? 'text-emerald-600' : 'text-slate-800'}">
        ${e.ticketPrice === 0 ? 'Free' : `$${e.ticketPrice}`}
      </td>
      <td class="py-3 px-4 text-right">
        <button onclick="handleDeleteEvent('${e.id}')" class="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete Event">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function handleDeleteEvent(eventId) {
  if (!confirm('Are you sure you want to delete this event and its crew assignments?')) return;
  try {
    await api.deleteEvent(eventId);
    showToast('Event deleted successfully', 'success');
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function populateStaffAndEventDropdowns() {
  try {
    const eventsRes = await api.getEvents();
    const staffRes = await api.getUsers('staff');

    const eventSelect = document.getElementById('assignEventSelect');
    const staffSelect = document.getElementById('assignStaffSelect');

    if (eventSelect) {
      eventSelect.innerHTML = (eventsRes.events || []).map(e => `
        <option value="${e.id}">${e.title}</option>
      `).join('');
    }

    if (staffSelect) {
      staffSelect.innerHTML = (staffRes.users || []).map(s => `
        <option value="${s.id}">${s.name} (${s.department || 'Staff'})</option>
      `).join('');
    }
  } catch (err) {
    console.error('Error populating dropdowns:', err);
  }
}

async function renderAdminAttendeesTable() {
  const container = document.getElementById('adminAttendeesTableBody');
  try {
    // Collect attendees across all events
    const events = (await api.getEvents()).events || [];
    let allRegistrations = [];

    for (const evt of events) {
      const regRes = await api.getEventAttendees(evt.id);
      if (regRes.registrations) {
        allRegistrations.push(...regRes.registrations);
      }
    }

    if (allRegistrations.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-xs text-slate-400">No registrations found.</td></tr>`;
      return;
    }

    container.innerHTML = allRegistrations.map(r => `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="py-2.5 px-4 font-mono text-xs font-bold text-slate-800">${r.ticketNumber}</td>
        <td class="py-2.5 px-4">
          <p class="text-xs font-bold text-slate-800">${r.attendeeName}</p>
          <p class="text-2xs text-slate-400">${r.attendeeEmail} • ${r.attendeePhone || 'N/A'}</p>
        </td>
        <td class="py-2.5 px-4 text-xs text-slate-600 line-clamp-1">${r.eventTitle}</td>
        <td class="py-2.5 px-4">
          <span class="px-2 py-0.5 rounded text-2xs font-bold ${
            r.status === 'Checked In' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
          }">
            ${r.status}
          </span>
        </td>
        <td class="py-2.5 px-4 text-2xs text-slate-500">${new Date(r.registeredAt).toLocaleDateString()}</td>
        <td class="py-2.5 px-4 text-right">
          ${r.status !== 'Checked In' ? `
            <button onclick="quickAdminCheckIn('${r.ticketNumber}')" class="px-2.5 py-1 text-2xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-all">
              Verify Check-In
            </button>
          ` : `
            <span class="text-2xs text-emerald-600 font-bold"><i class="fas fa-check-circle mr-1"></i>Verified</span>
          `}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error rendering attendees:', err);
  }
}

async function quickAdminCheckIn(ticketNum) {
  try {
    await api.checkInTicket(ticketNum);
    showToast(`Checked in ticket ${ticketNum}`, 'success');
    renderAdminAttendeesTable();
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Assign Crew Task Form
async function handleAssignTaskSubmit(e) {
  e.preventDefault();
  const eventId = document.getElementById('assignEventSelect').value;
  const staffId = document.getElementById('assignStaffSelect').value;
  const title = document.getElementById('assignTaskTitle').value.trim();
  const role = document.getElementById('assignTaskRole').value.trim();
  const start = document.getElementById('assignShiftStart').value.trim();
  const end = document.getElementById('assignShiftEnd').value.trim();
  const priority = document.getElementById('assignPriority').value;
  const description = document.getElementById('assignDescription').value.trim();

  try {
    await api.createWorkforceTask({
      eventId,
      assignedToUserId: staffId,
      title,
      roleRequired: role,
      shiftStart: start,
      shiftEnd: end,
      priority,
      description
    });

    closeModal('assignTaskModal');
    showToast('Crew shift assigned successfully!', 'success');
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Create Event Form
async function handleCreateEventSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('createEventTitle').value.trim();
  const category = document.getElementById('createEventCategory').value;
  const date = document.getElementById('createEventDate').value;
  const time = document.getElementById('createEventTime').value.trim();
  const venue = document.getElementById('createEventVenue').value.trim();
  const capacity = document.getElementById('createEventCapacity').value;
  const ticketPrice = document.getElementById('createEventPrice').value;
  const bannerUrl = document.getElementById('createEventBanner').value.trim();
  const description = document.getElementById('createEventDescription').value.trim();

  try {
    await api.createEvent({
      title,
      category,
      date,
      time,
      venue,
      capacity,
      ticketPrice,
      bannerUrl,
      description
    });

    closeModal('createEventModal');
    showToast('New event created and published!', 'success');
    loadAdminDashboard();
    loadEvents();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('eventSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(window.searchTimer);
      window.searchTimer = setTimeout(loadEvents, 300);
    });
  }

  // Modals & Forms
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);

  const checkInForm = document.getElementById('checkInForm');
  if (checkInForm) checkInForm.addEventListener('submit', handleCheckInSubmit);

  const assignTaskForm = document.getElementById('assignTaskForm');
  if (assignTaskForm) assignTaskForm.addEventListener('submit', handleAssignTaskSubmit);

  const createEventForm = document.getElementById('createEventForm');
  if (createEventForm) createEventForm.addEventListener('submit', handleCreateEventSubmit);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
}

// Auth Form Handlers
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await api.login(email, password);
    currentUser = res.user;
    updateAuthUI();
    closeModal('loginModal');
    showToast(res.message, 'success');
    if (currentTab === 'my-tickets') loadMyTickets();
    if (currentTab === 'workforce') loadWorkforcePortal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  const phone = document.getElementById('regPhone').value.trim();
  const department = document.getElementById('regDept').value.trim();

  try {
    const res = await api.register({
      name,
      email,
      password,
      role,
      phone,
      department
    });
    currentUser = res.user;
    updateAuthUI();
    closeModal('registerModal');
    showToast(res.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Modal Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function openLoginModal() {
  openModal('loginModal');
}

function openRegisterModal() {
  openModal('registerModal');
}

// Toast System
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-indigo-600 text-white'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  toast.className = `flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transform transition-all duration-300 translate-y-2 opacity-0 ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Animate out
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Confetti celebration helper
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}
