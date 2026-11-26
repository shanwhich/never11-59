// NEVER1159 — APPLICATION LOGIC (Local Vault, Rooms, Profiles, QR, DMs)
// ============================================================================

const STORAGE_KEYS = {
  ACCOUNTS: 'never1159_accounts_v2',
  CURRENT_USER: 'never1159_current_user_v2',
  ROOMS: 'never1159_rooms_v2',
  ACTIVE_ROOM: 'never1159_active_room_v2',
  ASYNC_SLOT: 'never1159_async_slot_v2',
  FRIENDS: 'never1159_friends_v2',
  MESSAGES: 'never1159_messages_v2',
  CLOUD_VAULT_PREFIX: 'never1159_cloud_sync_'
};

// Preset Cute Cozy Avatars (Inline SVG Data URIs)
const PRESET_AVATARS = {
  dino: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#E2EFE4"/><circle cx="50" cy="54" r="28" fill="#8FB996" stroke="#2F2A26" stroke-width="4"/><circle cx="42" cy="48" r="4" fill="#2F2A26"/><circle cx="58" cy="48" r="4" fill="#2F2A26"/><ellipse cx="36" cy="56" rx="5" ry="3" fill="#E89A7E"/><ellipse cx="64" cy="56" rx="5" ry="3" fill="#E89A7E"/><path d="M44 60 Q50 66 56 60" stroke="#2F2A26" stroke-width="3.5" fill="none" stroke-linecap="round"/><polygon points="50,18 43,29 57,29" fill="#D97B59"/></svg>')}`,
  bear: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#F9EBD2"/><circle cx="30" cy="32" r="11" fill="#C49A6C" stroke="#2F2A26" stroke-width="4"/><circle cx="70" cy="32" r="11" fill="#C49A6C" stroke="#2F2A26" stroke-width="4"/><circle cx="50" cy="55" r="28" fill="#D6AD7E" stroke="#2F2A26" stroke-width="4"/><ellipse cx="50" cy="61" rx="11" ry="8" fill="#FAF6F0"/><circle cx="41" cy="49" r="3.8" fill="#2F2A26"/><circle cx="59" cy="49" r="3.8" fill="#2F2A26"/><circle cx="50" cy="58" r="3.5" fill="#2F2A26"/></svg>')}`,
  cat: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#F9E4DC"/><polygon points="26,44 32,20 46,36" fill="#E89A7E" stroke="#2F2A26" stroke-width="4"/><polygon points="74,44 68,20 54,36" fill="#E89A7E" stroke="#2F2A26" stroke-width="4"/><circle cx="50" cy="56" r="27" fill="#F2B8A2" stroke="#2F2A26" stroke-width="4"/><circle cx="41" cy="52" r="3.8" fill="#2F2A26"/><circle cx="59" cy="52" r="3.8" fill="#2F2A26"/><path d="M46 61 Q50 65 54 61" stroke="#2F2A26" stroke-width="3" fill="none" stroke-linecap="round"/></svg>')}`,
  bunny: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="#E5E9FA"/><rect x="33" y="14" width="12" height="32" rx="6" fill="#FAF6F0" stroke="#2F2A26" stroke-width="4"/><rect x="55" y="14" width="12" height="32" rx="6" fill="#FAF6F0" stroke="#2F2A26" stroke-width="4"/><circle cx="50" cy="60" r="26" fill="#FAF6F0" stroke="#2F2A26" stroke-width="4"/><circle cx="41" cy="55" r="3.8" fill="#2F2A26"/><circle cx="59" cy="55" r="3.8" fill="#2F2A26"/><ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#E89A7E"/></svg>')}`
};

// Central Application State
let state = {
  accounts: [],
  currentUser: null,
  rooms: [],
  activeRoomId: null,
  asyncSlot: null,
  friendsByUser: {},
  directMessages: [],
  activeDmPartnerCode: null,
  viewedProfileCode: null,
  previousSection: 'home',
  currentSection: 'home',
  calendarDate: new Date(2026, 10, 1),
  selectedDateStr: '2026-11-26',
  timerDurationMinutes: 25,
  timerSeconds: 25 * 60,
  timerRunning: false,
  timerInterval: null,
  draggedTaskId: null,
  qrScanMode: 'add_friend',
  qrTargetRoomId: null,
  qrVideoStream: null,
  qrScanAnimFrame: null
};

// ============================================================================
// 1. NAVIGATION & DEDICATED SOCIAL-STYLE TEAMMATE PROFILE PAGE
// ============================================================================

function navigateTo(sectionName) {
  try {
    const validSections = ['home', 'rooms', 'profile'];
    const target = validSections.includes(sectionName) ? sectionName : 'home';

    if (state.currentSection && state.currentSection !== target && state.currentSection !== 'teammate-profile') {
      state.previousSection = state.currentSection;
    }
    state.currentSection = target;

    const teammateEl = document.getElementById('section-teammate-profile');
    if (teammateEl) teammateEl.classList.add('hidden');

    validSections.forEach(sec => {
      const el = document.getElementById(`section-${sec}`);
      const btn = document.getElementById(`nav-btn-${sec}`);
      const active = sec === target;

      if (el) {
        if (active) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }

      if (btn) {
        btn.className = active
          ? 'nav-tab px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-sageSoft to-ivory text-espresso shadow-xs transition'
          : 'nav-tab px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 text-mocha hover:text-espresso transition';
      }
    });

    if (target === 'home') renderHomeDashboard();
    if (target === 'rooms') renderSquadRooms();
    if (target === 'profile') renderProfileSection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Navigation error:', err);
    showToast('Could not switch view—please try again.', 'warning');
  }
}

function visitTeammateProfilePage(inviteCodeOrName) {
  try {
    const query = String(inviteCodeOrName || '').trim();
    let account = getLiveAccountByCode(query);

    // Fallback: resolve profile from room member data so visiting a profile never renders blank
    if (!account && query) {
      for (const room of state.rooms) {
        const m = (room.members || []).find(
          mem =>
            (mem.inviteCode && mem.inviteCode.toLowerCase() === query.toLowerCase()) ||
            mem.name.toLowerCase() === query.toLowerCase()
        );
        if (m) {
          account = findAccountByMember(m) || {
            id: 'member-' + encodeURIComponent(m.name),
            name: m.name,
            studentId: 'Student Member',
            yearLevel: 'Squad Teammate',
            course: room.subject || 'University Course',
            inviteCode: m.inviteCode || `N1159-${m.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'MEMBER'}`,
            avatar: PRESET_AVATARS.dino,
            asyncHours: '7:00 PM – 10:00 PM'
          };
          break;
        }
      }
    }

    if (!account) {
      showToast('Student profile not found.', 'warning');
      return;
    }

    if (state.currentUser && account.inviteCode && account.inviteCode.toLowerCase() === state.currentUser.inviteCode.toLowerCase()) {
      navigateTo('profile');
      return;
    }

    if (!state.accounts.some(a => a.inviteCode.toLowerCase() === account.inviteCode.toLowerCase())) {
      state.accounts.push({ ...account, email: '', password: '' });
    }

    if (state.currentSection && state.currentSection !== 'teammate-profile') {
      state.previousSection = state.currentSection;
    }
    state.currentSection = 'teammate-profile';
    state.viewedProfileCode = account.inviteCode;

    ['home', 'rooms', 'profile'].forEach(sec => {
      const el = document.getElementById(`section-${sec}`);
      const btn = document.getElementById(`nav-btn-${sec}`);
      if (el) el.classList.add('hidden');
      if (btn) {
        btn.className = 'nav-tab px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 text-mocha hover:text-espresso transition';
      }
    });

    const teammatePage = document.getElementById('section-teammate-profile');
    if (teammatePage) {
      teammatePage.classList.remove('hidden');
    }
    renderTeammateProfilePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Error visiting teammate profile:', err);
    showToast('Unable to open profile page.', 'warning');
  }
}

function navigateBackFromTeammateProfile() {
  navigateTo(state.previousSection || 'rooms');
}

function renderTeammateProfilePage() {
  const container = document.getElementById('teammate-profile-page-content');
  if (!container) return;

  if (!state.viewedProfileCode && state.accounts.length > 0) {
    const fallbackOther = state.accounts.find(
      a => !state.currentUser || a.inviteCode !== state.currentUser.inviteCode
    );
    if (fallbackOther) state.viewedProfileCode = fallbackOther.inviteCode;
  }

  const account = getLiveAccountByCode(state.viewedProfileCode);
  if (!account) {
    container.innerHTML = `
      <div class="bg-ivory border-2 border-sand rounded-[28px] p-8 text-center space-y-3 shadow-cozy">
        <p class="font-display text-lg font-bold text-espresso">Profile unavailable</p>
        <button type="button" onclick="navigateBackFromTeammateProfile()" class="px-4 py-2 rounded-xl bg-sage text-white text-xs font-bold">Go Back</button>
      </div>
    `;
    return;
  }

  const isFriend = getCurrentUserFriends().some(c => c.toLowerCase() === account.inviteCode.toLowerCase());
  const sharedRooms = state.rooms.filter(r =>
    (r.members || []).some(m =>
      (m.inviteCode && m.inviteCode.toLowerCase() === account.inviteCode.toLowerCase()) ||
      m.name.toLowerCase() === account.name.toLowerCase()
    )
  );

  const assignedTasks = state.rooms.flatMap(r =>
    (r.tasks || [])
      .filter(t => (t.assignee || '').toLowerCase() === account.name.toLowerCase())
      .map(t => ({ ...t, roomTitle: r.title, roomSubject: r.subject, roomId: r.id }))
  );
  const completedCount = assignedTasks.filter(t => t.status === 'approved').length;

  container.innerHTML = `
    <div class="bg-gradient-to-br from-ivory via-cream to-sageSoft/55 border-2 border-sand rounded-[28px] p-6 sm:p-8 shadow-cozy">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <img src="${account.avatar || PRESET_AVATARS.dino}" alt="${escapeHtml(account.name)}"
            class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-sand bg-sageSoft shadow-sm shrink-0" />
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-display text-2xl sm:text-3xl font-bold text-espresso">${escapeHtml(account.name)}</h2>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sageSoft text-sage">${escapeHtml(account.yearLevel || 'Student')}</span>
              <button type="button" onclick="copyTextToClipboard('${escapeHtml(account.inviteCode)}').then(() => showToast('Copied Invite ID: ${escapeHtml(account.inviteCode)}', 'success'))"
                class="px-3 py-0.5 rounded-full bg-cream hover:bg-sandLight border border-sand text-[11px] font-mono font-bold text-espresso transition" title="Click to copy Invite ID">
                ${escapeHtml(account.inviteCode)} 📋
              </button>
            </div>
            <p class="text-xs sm:text-sm font-semibold text-mocha mt-1">${escapeHtml(account.course || 'University Student')} • Student ID: <span class="text-espresso font-bold">${escapeHtml(account.studentId || 'N/A')}</span></p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 shrink-0">
          ${isFriend ? `
            <button type="button" onclick="unfriendByCode('${escapeHtml(account.inviteCode)}')"
              class="px-4 py-2.5 rounded-xl bg-terracottaSoft hover:bg-terracotta text-terracotta hover:text-white border border-terracotta/30 text-xs sm:text-sm font-bold transition">
              ✕ Unfriend
            </button>
          ` : `
            <button type="button" onclick="addFriendByCode('${escapeHtml(account.inviteCode)}')"
              class="px-5 py-2.5 rounded-xl bg-sage hover:bg-sage/90 text-white text-xs sm:text-sm font-bold shadow-sm transition">
              + Add Friend
            </button>
          `}

          <button type="button" onclick="openDirectMessageWith('${escapeHtml(account.inviteCode)}')"
            class="px-5 py-2.5 rounded-xl bg-lavender hover:bg-lavender/90 text-white text-xs sm:text-sm font-bold shadow-sm transition">
            ✉ Message
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-sand">
        <div class="p-4 rounded-2xl bg-cream border border-sand">
          <p class="text-[11px] font-bold uppercase tracking-wider text-mocha">Preferred Async Hours</p>
          <p class="font-display text-base font-bold text-espresso mt-1">${escapeHtml(account.asyncHours || '7:00 PM – 10:00 PM')}</p>
        </div>
        <div class="p-4 rounded-2xl bg-cream border border-sand">
          <p class="text-[11px] font-bold uppercase tracking-wider text-mocha">Shared Squad Rooms</p>
          <p class="font-display text-base font-bold text-sage mt-1">${sharedRooms.length} Active Room${sharedRooms.length === 1 ? '' : 's'}</p>
        </div>
        <div class="p-4 rounded-2xl bg-cream border border-sand">
          <p class="text-[11px] font-bold uppercase tracking-wider text-mocha">Verified Deliverables</p>
          <p class="font-display text-base font-bold text-terracotta mt-1">${completedCount} / ${assignedTasks.length} Approved</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-gradient-to-br from-honeySoft/60 via-ivory to-cream border-2 border-sand rounded-[24px] p-6 shadow-cozy space-y-3">
        <h3 class="font-display text-lg font-bold text-espresso">Squad Rooms Together</h3>
        ${sharedRooms.length === 0
          ? `<p class="text-xs text-mocha">You are not in a Squad Room with ${escapeHtml(account.name)} yet.</p>`
          : sharedRooms.map(r => `
              <button type="button" onclick="openRoomFromHome('${r.id}')" class="w-full text-left cursor-pointer p-3.5 rounded-2xl bg-cream hover:bg-ivory border border-sand flex items-center justify-between gap-2 transition">
                <div>
                  <p class="font-bold text-sm text-espresso">${escapeHtml(r.title)}</p>
                  <p class="text-xs text-mocha">${escapeHtml(r.subject)}</p>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-sageSoft text-sage text-[11px] font-bold">Open Room →</span>
              </button>
            `).join('')}
      </div>

      <div class="bg-gradient-to-br from-lavenderSoft/60 via-ivory to-cream border-2 border-sand rounded-[24px] p-6 shadow-cozy space-y-3">
        <h3 class="font-display text-lg font-bold text-espresso">Current Deliverables</h3>
        ${assignedTasks.length === 0
          ? `<p class="text-xs text-mocha">No tasks assigned yet.</p>`
          : assignedTasks.map(t => `
              <button type="button" onclick="openRoomFromHome('${t.roomId}')" class="w-full text-left p-3.5 rounded-2xl bg-cream hover:bg-ivory border border-sand flex items-center justify-between gap-2 transition">
                <div class="min-w-0">
                  <p class="font-bold text-xs sm:text-sm text-espresso truncate">${escapeHtml(t.title)}</p>
                  <p class="text-[11px] text-mocha truncate">${escapeHtml(t.roomTitle)}</p>
                </div>
                <span class="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusPillClass(t.status)}">${getStatusLabel(t.status)}</span>
              </button>
            `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// 2. HOME DASHBOARD (COMPLETION RING, PENDING TASKS, CALENDAR, TIMER, ASYNC)
// ============================================================================

function renderHomeDashboard() {
  if (!state.currentUser) return;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  document.getElementById('home-today-date').textContent = todayFormatted;
  document.getElementById('home-welcome-name').textContent = state.currentUser.name.split(' ')[0];
  document.getElementById('home-user-course').textContent = `${state.currentUser.course} • ${state.currentUser.yearLevel} • ID: ${state.currentUser.studentId}`;

  const allTasks = state.rooms.flatMap(room =>
    room.tasks.map(t => ({ ...t, roomTitle: room.title, roomId: room.id }))
  );

  const total = allTasks.length;
  const approved = allTasks.filter(t => t.status === 'approved').length;
  const inProgress = allTasks.filter(t => t.status === 'inprogress' || t.status === 'submitted').length;
  const todo = allTasks.filter(t => t.status === 'todo').length;
  const pct = total === 0 ? 0 : Math.round((approved / total) * 100);

  document.getElementById('home-completion-percent').textContent = `${pct}%`;
  document.getElementById('home-stat-done').textContent = approved;
  document.getElementById('home-stat-progress').textContent = inProgress;
  document.getElementById('home-stat-todo').textContent = todo;

  const badge = document.getElementById('home-completion-badge');
  if (pct === 100 && total > 0) {
    badge.textContent = 'Paid In Full!';
    badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-sage text-white';
  } else if (pct >= 50) {
    badge.textContent = 'Smooth Sailing';
    badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-sageSoft text-sage';
  } else {
    badge.textContent = 'In Motion';
    badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-honeySoft text-honey';
  }

  const ring = document.getElementById('home-progress-ring');
  const circumference = 251.2;
  ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;

  const pendingTasks = allTasks
    .filter(t => t.status !== 'approved')
    .sort((a, b) => new Date(a.checkpointDate) - new Date(b.checkpointDate));

  document.getElementById('home-pending-count').textContent = `${pendingTasks.length} Pending`;
  const pendingContainer = document.getElementById('home-pending-list');

  if (pendingTasks.length === 0) {
    pendingContainer.innerHTML = `
      <div class="p-6 rounded-2xl bg-cream/80 border border-sand text-center text-xs text-mocha">
        All deliverables are approved! Enjoy your stress-free evening.
      </div>
    `;
  } else {
    pendingContainer.innerHTML = pendingTasks.map(task => `
      <div onclick="openRoomFromHome('${task.roomId}')" class="cursor-pointer p-3 rounded-2xl bg-cream/90 hover:bg-ivory border border-sand flex items-center justify-between gap-3 transition">
        <div class="min-w-0">
          <p class="font-bold text-xs sm:text-sm text-espresso truncate">${escapeHtml(task.title)}</p>
          <p class="text-[11px] text-mocha truncate">${escapeHtml(task.roomTitle)} • <span class="font-semibold text-espresso">${escapeHtml(task.assignee)}</span></p>
        </div>
        <div class="text-right shrink-0">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusPillClass(task.status)}">
            ${getStatusLabel(task.status)}
          </span>
          <p class="text-[10px] font-semibold text-terracotta mt-0.5">${formatShortDate(task.checkpointDate)}</p>
        </div>
      </div>
    `).join('');
  }

  if (state.asyncSlot) {
    document.getElementById('async-date').value = state.asyncSlot.date || '';
    document.getElementById('async-time').value = state.asyncSlot.time || '';
    document.getElementById('async-note').value = state.asyncSlot.note || '';
    document.getElementById('async-saved-text').textContent =
      `Next Async Window: ${state.asyncSlot.date} at ${state.asyncSlot.time} — "${state.asyncSlot.note}"`;
  }

  renderCalendar();
}

function openRoomFromHome(roomId) {
  state.activeRoomId = roomId;
  saveAllState(false);
  navigateTo('rooms');
}

function changeCalendarMonth(delta) {
  state.calendarDate = new Date(
    state.calendarDate.getFullYear(),
    state.calendarDate.getMonth() + delta,
    1
  );
  renderCalendar();
}

function renderCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const monthName = state.calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('calendar-month-label').textContent = monthName;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDate = {};
  state.rooms.forEach(room => {
    const finalDateKey = (room.dueDate || '').slice(0, 10);
    if (finalDateKey) {
      eventsByDate[finalDateKey] = eventsByDate[finalDateKey] || [];
      eventsByDate[finalDateKey].push(`FINAL DUE: ${room.title}`);
    }
    room.tasks.forEach(task => {
      const key = (task.checkpointDate || '').slice(0, 10);
      if (key) {
        eventsByDate[key] = eventsByDate[key] || [];
        eventsByDate[key].push(`${task.title} (${task.assignee})`);
      }
    });
  });

  const grid = document.getElementById('calendar-grid');
  let cellsHtml = '';

  for (let i = 0; i < firstDayIndex; i++) {
    cellsHtml += `<div class="h-10 rounded-xl"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasEvents = Boolean(eventsByDate[dateStr]);
    const isSelected = state.selectedDateStr === dateStr;

    cellsHtml += `
      <button type="button" onclick="selectCalendarDate('${dateStr}')"
        class="h-10 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition relative
        ${isSelected
          ? 'bg-sage text-white border-sage shadow-sm'
          : hasEvents
            ? 'bg-honeySoft/85 text-espresso border-honey/50 hover:bg-honeySoft'
            : 'bg-cream/85 text-espresso border-sand/70 hover:bg-sandLight'}">
        <span>${day}</span>
        ${hasEvents ? `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-terracotta'} mt-0.5"></span>` : ''}
      </button>
    `;
  }

  grid.innerHTML = cellsHtml;
  updateSelectedDateDetails(eventsByDate);
}

function selectCalendarDate(dateStr) {
  state.selectedDateStr = dateStr;
  renderCalendar();
}

function updateSelectedDateDetails(eventsByDate) {
  const titleEl = document.getElementById('selected-date-title');
  const itemsEl = document.getElementById('selected-date-items');
  if (!state.selectedDateStr) return;

  titleEl.textContent = `Schedule for ${state.selectedDateStr}`;
  const items = eventsByDate[state.selectedDateStr] || [];
  if (items.length === 0) {
    itemsEl.innerHTML = `<p>No checkpoints scheduled on this date.</p>`;
  } else {
    itemsEl.innerHTML = items.map(item => `<p class="font-semibold text-espresso">• ${escapeHtml(item)}</p>`).join('');
  }
}

function setTimerDuration(minutes) {
  pauseFocusTimer();
  const mins = parseInt(minutes, 10) || 25;
  state.timerDurationMinutes = mins;
  state.timerSeconds = mins * 60;
  const presetEl = document.getElementById('timer-preset-select');
  if (presetEl) presetEl.value = String(mins);
  updateTimerDisplay();
  const statusEl = document.getElementById('focus-timer-status');
  if (statusEl) statusEl.textContent = 'Ready for a distraction-free block';
}

function startFocusTimer() {
  if (state.timerRunning) return;
  state.timerRunning = true;
  document.getElementById('focus-timer-status').textContent = 'Focusing calmly... Dino is cheering you on!';
  state.timerInterval = setInterval(() => {
    if (state.timerSeconds > 0) {
      state.timerSeconds--;
      updateTimerDisplay();
    } else {
      pauseFocusTimer();
      document.getElementById('focus-timer-status').textContent = 'Block complete! Take a cozy stretch.';
      showToast('Focus block complete! Great job avoiding the 11:58 panic.', 'success');
    }
  }, 1000);
}

function pauseFocusTimer() {
  state.timerRunning = false;
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  const statusEl = document.getElementById('focus-timer-status');
  if (statusEl && state.timerSeconds > 0) {
    statusEl.textContent = 'Timer paused';
  }
}

function resetFocusTimer() {
  setTimerDuration(state.timerDurationMinutes);
}

function updateTimerDisplay() {
  const display = document.getElementById('focus-timer-display');
  if (!display) return;
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = state.timerSeconds % 60;
  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function saveAsyncMeeting(event) {
  event.preventDefault();
  const date = document.getElementById('async-date').value;
  const time = document.getElementById('async-time').value;
  const note = document.getElementById('async-note').value.trim();

  state.asyncSlot = { date, time, note };
  saveAllState(true);
  renderHomeDashboard();
  showToast('Async check-in window saved!', 'success');
}

// ============================================================================
// 3. SQUAD ROOMS (LOCKED ROLE ON CREATION, RECEIPT BOARD, QR, EXPORTS)
// ============================================================================

function getUserRoleInRoom(room) {
  if (!room || !state.currentUser) return 'Member';
  if (room.lockedRoles && room.lockedRoles[state.currentUser.id]) {
    return room.lockedRoles[state.currentUser.id];
  }
  const memberEntry = (room.members || []).find(
    m => m.inviteCode === state.currentUser.inviteCode || m.name.toLowerCase() === state.currentUser.name.toLowerCase()
  );
  return memberEntry ? memberEntry.role : 'Member';
}

function getRoomCategory(room) {
  if (!room.tasks || room.tasks.length === 0) return 'not_started';
  const approvedCount = room.tasks.filter(t => t.status === 'approved').length;
  const todoCount = room.tasks.filter(t => t.status === 'todo').length;
  if (approvedCount === room.tasks.length) return 'completed';
  if (todoCount === room.tasks.length) return 'not_started';
  return 'in_progress';
}

function renderSquadRooms() {
  const countPill = document.getElementById('rooms-count-pill');
  const selectorContainer = document.getElementById('room-selector-tabs');
  const activeContainer = document.getElementById('active-room-container');

  countPill.textContent = `${state.rooms.length} Room${state.rooms.length === 1 ? '' : 's'}`;

  if (state.rooms.length === 0) {
    selectorContainer.innerHTML = '';
    activeContainer.innerHTML = `
      <div class="bg-gradient-to-br from-ivory via-cream to-sageSoft/50 border-2 border-sand rounded-[24px] p-10 text-center shadow-cozy space-y-3">
        <h3 class="font-display text-xl font-bold text-espresso">No Squad Rooms Yet</h3>
        <p class="text-xs sm:text-sm text-mocha max-w-md mx-auto">Create your first Squad Room to split deliverables backward from your deadline and lock in roles.</p>
        <button type="button" onclick="openCreateRoomModal()" class="px-5 py-2.5 rounded-xl bg-sage hover:bg-sage/90 text-white font-bold text-xs shadow-sm transition">
          + Create First Squad Room
        </button>
      </div>
    `;
    return;
  }

  if (!state.rooms.some(r => r.id === state.activeRoomId)) {
    state.activeRoomId = state.rooms[0].id;
  }

  const groups = [
    { key: 'not_started', label: 'Not Started', badgeClass: 'bg-sandLight text-mocha' },
    { key: 'in_progress', label: 'In Progress', badgeClass: 'bg-honeySoft text-honey' },
    { key: 'completed', label: 'Completed', badgeClass: 'bg-sageSoft text-sage' }
  ];

  selectorContainer.innerHTML = groups.map(group => {
    const groupRooms = state.rooms.filter(r => getRoomCategory(r) === group.key);
    return `
      <div class="bg-gradient-to-b from-ivory to-cream/90 border border-sand rounded-2xl p-3 space-y-2 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold uppercase tracking-wider text-espresso">${group.label}</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${group.badgeClass}">${groupRooms.length}</span>
        </div>
        <div class="space-y-1.5">
          ${groupRooms.length === 0
            ? `<p class="text-[11px] text-mocha italic py-1">No rooms here</p>`
            : groupRooms.map(room => {
                const isSelected = room.id === state.activeRoomId;
                const lockedRole = getUserRoleInRoom(room);
                return `
                  <button type="button" onclick="selectActiveRoom('${room.id}')"
                    class="w-full text-left px-3 py-2 rounded-xl border text-xs transition flex items-center justify-between gap-2
                    ${isSelected
                      ? 'bg-gradient-to-r from-sageSoft to-ivory border-sage font-bold text-espresso shadow-xs'
                      : 'bg-cream/80 hover:bg-sandLight/60 border-sand text-mocha'}">
                    <span class="truncate">${escapeHtml(room.title)}</span>
                    <span class="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${lockedRole === 'Leader' ? 'bg-terracottaSoft text-terracotta' : 'bg-lavenderSoft text-lavender'}">
                      ${lockedRole}
                    </span>
                  </button>
                `;
              }).join('')}
        </div>
      </div>
    `;
  }).join('');

  const activeRoom = state.rooms.find(r => r.id === state.activeRoomId);
  if (!activeRoom) return;

  const userRole = getUserRoleInRoom(activeRoom);
  const isLeader = userRole === 'Leader';
  const totalTasks = activeRoom.tasks.length;
  const approvedTasks = activeRoom.tasks.filter(t => t.status === 'approved').length;
  const isPaidInFull = totalTasks > 0 && approvedTasks === totalTasks;

  const columns = [
    { id: 'todo', title: 'Not Started', dot: 'bg-mocha', bg: 'from-ivory to-cream' },
    { id: 'inprogress', title: 'In Progress', dot: 'bg-honey', bg: 'from-honeySoft/55 to-cream' },
    { id: 'submitted', title: 'Ready for Review', dot: 'bg-lavender', bg: 'from-lavenderSoft/55 to-cream' },
    { id: 'approved', title: 'Approved (Paid)', dot: 'bg-sage', bg: 'from-sageSoft/65 to-cream' }
  ];

  activeContainer.innerHTML = `
    <div class="bg-gradient-to-br from-ivory via-cream to-honeySoft/45 border-2 border-sand rounded-[26px] p-6 sm:p-7 shadow-cozy space-y-5">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-3 py-0.5 rounded-full text-xs font-bold bg-lavenderSoft text-lavender">${escapeHtml(activeRoom.subject)}</span>
            <span class="px-3 py-0.5 rounded-full text-xs font-bold bg-espresso text-ivory flex items-center gap-1.5" title="Role is permanently locked once the room is created">
              🔒 Role Locked: ${userRole}
            </span>
          </div>
          <h3 class="font-display text-2xl sm:text-3xl font-bold text-espresso mt-1.5">${escapeHtml(activeRoom.title)}</h3>
          <p class="text-xs text-mocha mt-0.5">
            Final Project Due: <span class="font-bold text-terracotta">${formatFullDateTime(activeRoom.dueDate)}</span> • ${approvedTasks}/${totalTasks} Deliverables Paid
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" onclick="copyChatSummary('${activeRoom.id}')" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-lavenderSoft to-ivory hover:opacity-90 border border-lavender/35 text-xs font-bold text-espresso transition">
            Copy Messenger / Discord Receipt
          </button>
          ${isLeader ? `
            <button type="button" onclick="openAddTaskPrompt('${activeRoom.id}')" class="px-3.5 py-2 rounded-xl bg-sage hover:bg-sage/90 text-white text-xs font-bold shadow-sm transition">
              + Add Itemized Task
            </button>
            <button type="button" onclick="deleteSquadRoom('${activeRoom.id}')" class="px-3.5 py-2 rounded-xl bg-terracottaSoft hover:bg-terracotta text-terracotta hover:text-white text-xs font-bold border border-terracotta/30 transition">
              Delete Room
            </button>
          ` : ''}
        </div>
      </div>

      ${isPaidInFull ? `
        <div class="stamp-animate p-4 rounded-2xl bg-sageSoft border-2 border-sage text-center">
          <p class="font-display text-lg font-bold text-sage tracking-wide uppercase">✓ PAID IN FULL — ZERO 11:58 PANIC!</p>
          <p class="text-xs text-espresso mt-0.5">Every squad member completed and verified their deliverable ahead of schedule.</p>
        </div>
      ` : ''}

      <div class="receipt-divider pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold text-mocha uppercase tracking-wider mr-1">Squad Members (${activeRoom.members.length}/8 — Click Profile):</span>
          ${activeRoom.members.map(m => {
            const memberAccount = findAccountByMember(m);
            const liveName = memberAccount ? memberAccount.name : m.name;
            const avatarSrc = memberAccount?.avatar || PRESET_AVATARS.dino;
            const statusSummary = getMemberRoomProgressSummary(activeRoom, liveName, m.name);
            return `
              <button type="button" onclick="openRoomMemberPanel('${activeRoom.id}', '${escapeHtml(m.inviteCode || liveName)}')"
                class="group px-2.5 py-1.5 rounded-2xl bg-cream hover:bg-ivory border border-sand hover:border-sage text-xs font-semibold text-espresso flex items-center gap-2 transition shadow-2xs"
                title="Click to inspect ${escapeHtml(liveName)}'s project progress, visit profile, or message">
                <img src="${avatarSrc}" alt="${escapeHtml(liveName)}" class="w-6 h-6 rounded-full object-cover border border-sand group-hover:scale-105 transition" />
                <span>${escapeHtml(liveName)}</span>
                <span class="w-2 h-2 rounded-full ${statusSummary.dotClass}" title="${statusSummary.label}"></span>
                <span class="text-[10px] font-bold text-mocha">(${m.role})</span>
              </button>
            `;
          }).join('')}
        </div>

        ${isLeader ? `
          <div class="flex flex-wrap items-center gap-2">
            <form onsubmit="addMemberToRoom(event, '${activeRoom.id}')" class="flex items-center gap-1.5">
              <input type="text" id="add-member-input" required placeholder="Member name or N1159-ID" class="px-3 py-1.5 rounded-xl bg-cream border border-sand text-xs text-espresso focus:outline-none focus:border-sage" />
              <button type="submit" class="px-3 py-1.5 rounded-xl bg-espresso text-ivory text-xs font-bold hover:opacity-90 transition">
                + Invite
              </button>
            </form>
            <button type="button" onclick="openQrScannerModal('add_room_member', '${activeRoom.id}')" class="px-3 py-1.5 rounded-xl bg-sage hover:bg-sage/90 text-white text-xs font-bold shadow-xs transition flex items-center gap-1">
              <span>📷 Add via QR</span>
            </button>
          </div>
        ` : ''}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      ${columns.map(col => {
        const colTasks = activeRoom.tasks.filter(t => t.status === col.id);
        return `
          <div class="kanban-col bg-gradient-to-b ${col.bg} border-2 border-sand rounded-[22px] p-4 space-y-3 min-h-[290px]"
               ondragover="handleDragOver(event)"
               ondragleave="handleDragLeave(event)"
               ondrop="handleDrop(event, '${activeRoom.id}', '${col.id}')">
            <div class="flex items-center justify-between pb-2 border-b border-sand/80">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full ${col.dot}"></span>
                <h4 class="font-display font-bold text-sm text-espresso">${col.title}</h4>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-ivory border border-sand text-mocha">${colTasks.length}</span>
            </div>

            <div class="space-y-2.5">
              ${colTasks.length === 0
                ? `<div class="p-4 rounded-xl border border-dashed border-sand text-center text-[11px] text-mocha">Drag task card here</div>`
                : colTasks.map(task => renderTaskCard(activeRoom.id, task, isLeader)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderTaskCard(roomId, task, isLeader) {
  return `
    <div draggable="true"
         ondragstart="handleDragStart(event, '${task.id}')"
         ondragend="handleDragEnd(event)"
         class="task-card cursor-grab active:cursor-grabbing bg-ivory border border-sand rounded-2xl p-3.5 shadow-xs hover:shadow-md transition space-y-2.5">
      <div class="flex items-start justify-between gap-2">
        <p class="font-bold text-xs sm:text-sm text-espresso leading-snug">${escapeHtml(task.title)}</p>
      </div>

      <div class="flex items-center justify-between text-[11px]">
        <span class="px-2 py-0.5 rounded-lg bg-sandLight font-bold text-espresso">${escapeHtml(task.assignee)}</span>
        <span class="font-semibold text-terracotta">${formatShortDate(task.checkpointDate)}</span>
      </div>

      ${task.revisionNote ? `
        <div class="p-2 rounded-xl bg-terracottaSoft/80 border border-terracotta/30 text-[11px] text-espresso">
          <span class="font-bold text-terracotta">Revision Note:</span> ${escapeHtml(task.revisionNote)}
        </div>
      ` : ''}

      ${task.submissionLink ? `
        <a href="${escapeHtml(task.submissionLink)}" target="_blank" rel="noopener noreferrer" class="block truncate text-[11px] font-bold text-lavender hover:underline">
          🔗 View Submitted Proof
        </a>
      ` : ''}

      <div class="pt-1 flex items-center gap-1.5">
        <button type="button" onclick="openTaskActionModal('${roomId}', '${task.id}')"
          class="w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition
          ${isLeader && task.status === 'submitted'
            ? 'bg-sage text-white hover:bg-sage/90'
            : 'bg-cream hover:bg-sandLight border border-sand text-espresso'}">
          ${isLeader && task.status === 'submitted' ? 'Review & Approve' : 'Submit / Details'}
        </button>
      </div>
    </div>
  `;
}

function selectActiveRoom(roomId) {
  state.activeRoomId = roomId;
  saveAllState(false);
  renderSquadRooms();
}

function handleDragStart(event, taskId) {
  state.draggedTaskId = taskId;
  event.currentTarget.classList.add('dragging');
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove('dragging');
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event, roomId, newStatus) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  if (!state.draggedTaskId) return;

  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const task = room.tasks.find(t => t.id === state.draggedTaskId);
  if (!task) return;

  const isLeader = getUserRoleInRoom(room) === 'Leader';
  if (newStatus === 'approved' && !isLeader) {
    showToast('Only the locked Room Leader can stamp a task Approved!', 'warning');
    return;
  }

  task.status = newStatus;
  state.draggedTaskId = null;
  saveAllState(true);
  renderSquadRooms();
  showToast(`Moved "${task.title}" to ${getStatusLabel(newStatus)}.`, 'success');
}

function openCreateRoomModal() {
  const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  defaultDue.setHours(23, 59, 0, 0);
  const isoLocal = new Date(defaultDue.getTime() - defaultDue.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  document.getElementById('new-room-due').value = isoLocal;
  document.getElementById('create-room-modal').classList.remove('hidden');
}

function closeCreateRoomModal() {
  document.getElementById('create-room-modal').classList.add('hidden');
}

function handleCreateRoom(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const subject = document.getElementById('new-room-subject').value.trim();
  const title = document.getElementById('new-room-title').value.trim();
  const dueDateStr = document.getElementById('new-room-due').value;
  const chosenRole = document.getElementById('new-room-role').value;
  const membersRaw = document.getElementById('new-room-members').value.trim();
  const deliverablesRaw = document.getElementById('new-room-deliverables').value.trim();

  const extraInputs = membersRaw
    ? membersRaw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 7)
    : [];

  const lockedRoles = {
    [state.currentUser.id]: chosenRole
  };

  const members = [
    {
      name: state.currentUser.name,
      inviteCode: state.currentUser.inviteCode,
      role: chosenRole
    },
    ...extraInputs.map((entry, idx) => {
      const matched = state.accounts.find(
        a => a.inviteCode.toLowerCase() === entry.toLowerCase() || a.name.toLowerCase() === entry.toLowerCase()
      );
      const memberRole = chosenRole === 'Member' && idx === 0 ? 'Leader' : 'Member';
      if (matched) lockedRoles[matched.id] = memberRole;
      return {
        name: matched ? matched.name : entry,
        inviteCode: matched ? matched.inviteCode : `N1159-M${idx + 1}`,
        role: memberRole
      };
    })
  ];

  const lines = deliverablesRaw.split('\n').map(l => l.trim()).filter(Boolean);
  const nowMs = Date.now();
  const finalMs = new Date(dueDateStr).getTime();
  const safeSpan = Math.max(finalMs - nowMs, lines.length * 6 * 3600 * 1000);
  const bufferMs = Math.min(12 * 3600 * 1000, safeSpan * 0.15);
  const usableSpan = safeSpan - bufferMs;

  const tasks = lines.map((line, index) => {
    const fraction = (index + 1) / lines.length;
    const checkpointMs = nowMs + usableSpan * fraction;
    const checkpointIso = new Date(checkpointMs - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    const assignedMember = members[index % members.length];

    return {
      id: 'task-' + Date.now() + '-' + index,
      title: line,
      assignee: assignedMember.name,
      checkpointDate: checkpointIso,
      status: 'todo',
      submissionNote: '',
      submissionLink: '',
      revisionNote: ''
    };
  });

  const newRoom = {
    id: 'room-' + Date.now(),
    subject,
    title,
    dueDate: dueDateStr,
    createdBy: state.currentUser.id,
    lockedRoles,
    members,
    tasks
  };

  state.rooms.unshift(newRoom);
  state.activeRoomId = newRoom.id;
  saveAllState(true);
  closeCreateRoomModal();
  document.getElementById('create-room-form').reset();
  renderSquadRooms();
  showToast(`Room created! Your role is permanently locked as ${chosenRole}.`, 'success');
}

function addMemberToRoom(event, roomId) {
  event.preventDefault();
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  if (getUserRoleInRoom(room) !== 'Leader') {
    showToast('Only the locked Room Leader can invite members.', 'warning');
    return;
  }
  if (room.members.length >= 8) {
    showToast('Squad Room is at the maximum of 8 members.', 'warning');
    return;
  }

  const input = document.getElementById('add-member-input');
  const query = input.value.trim();
  if (!query) return;

  const matchedAccount = state.accounts.find(
    a => a.inviteCode.toLowerCase() === query.toLowerCase() || a.name.toLowerCase() === query.toLowerCase()
  );

  const memberName = matchedAccount ? matchedAccount.name : query;
  const inviteCode = matchedAccount ? matchedAccount.inviteCode : `N1159-${memberName.slice(0, 4).toUpperCase()}`;

  if (room.members.some(m => m.name.toLowerCase() === memberName.toLowerCase())) {
    showToast(`${memberName} is already in this Squad Room.`, 'info');
    return;
  }

  room.members.push({ name: memberName, inviteCode, role: 'Member' });
  if (matchedAccount) {
    room.lockedRoles = room.lockedRoles || {};
    room.lockedRoles[matchedAccount.id] = 'Member';
  }

  input.value = '';
  saveAllState(true);
  renderSquadRooms();
  showToast(`Added ${memberName} as Member!`, 'success');
}

function openAddTaskPrompt(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  const modal = document.getElementById('task-action-modal');
  document.getElementById('modal-task-badge').textContent = 'New Deliverable';
  document.getElementById('modal-task-title').textContent = room.title;

  document.getElementById('modal-task-body').innerHTML = `
    <form onsubmit="submitNewTaskToRoom(event, '${roomId}')" class="space-y-3.5">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-mocha mb-1">Deliverable Name</label>
        <input type="text" id="quick-task-title" required placeholder="e.g., Proofread Bibliography" class="w-full px-3.5 py-2 rounded-xl bg-cream border border-sand text-sm text-espresso" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-mocha mb-1">Assign To</label>
          <select id="quick-task-assignee" class="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm text-espresso">
            ${room.members.map(m => `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-mocha mb-1">Checkpoint Due</label>
          <input type="datetime-local" id="quick-task-date" required value="${room.dueDate}" class="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs text-espresso" />
        </div>
      </div>
      <button type="submit" class="w-full py-2.5 rounded-xl bg-sage hover:bg-sage/90 text-white text-xs font-bold shadow-sm transition">
        Add to Group Receipt
      </button>
    </form>
  `;

  modal.classList.remove('hidden');
}

function submitNewTaskToRoom(event, roomId) {
  event.preventDefault();
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  const title = document.getElementById('quick-task-title').value.trim();
  const assignee = document.getElementById('quick-task-assignee').value;
  const checkpointDate = document.getElementById('quick-task-date').value;

  room.tasks.push({
    id: 'task-' + Date.now(),
    title,
    assignee,
    checkpointDate,
    status: 'todo',
    submissionNote: '',
    submissionLink: '',
    revisionNote: ''
  });

  saveAllState(true);
  closeTaskActionModal();
  renderSquadRooms();
  showToast(`Added "${title}" to receipt.`, 'success');
}

function deleteSquadRoom(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  if (getUserRoleInRoom(room) !== 'Leader') {
    showToast('Only the locked Room Leader can delete this room.', 'warning');
    return;
  }

  state.rooms = state.rooms.filter(r => r.id !== roomId);
  state.activeRoomId = state.rooms[0] ? state.rooms[0].id : null;
  saveAllState(true);
  renderSquadRooms();
  showToast(`Deleted Squad Room "${room.title}".`, 'info');
}

function openTaskActionModal(roomId, taskId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const task = room.tasks.find(t => t.id === taskId);
  if (!task) return;

  const isLeader = getUserRoleInRoom(room) === 'Leader';
  document.getElementById('modal-task-badge').textContent = `${task.assignee} • ${getStatusLabel(task.status)}`;
  document.getElementById('modal-task-title').textContent = task.title;

  const body = document.getElementById('modal-task-body');
  body.innerHTML = `
    <form onsubmit="saveTaskSubmission(event, '${roomId}', '${taskId}')" class="space-y-3.5">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-mocha mb-1">Proof Link (Google Docs, Drive, Figma, GitHub)</label>
        <input type="url" id="task-sub-link" value="${escapeHtml(task.submissionLink || '')}" placeholder="https://..." class="w-full px-3.5 py-2 rounded-xl bg-cream border border-sand text-sm text-espresso" />
      </div>
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-mocha mb-1">Progress / Submission Note</label>
        <textarea id="task-sub-note" rows="2" placeholder="Describe what you completed..." class="w-full px-3.5 py-2 rounded-xl bg-cream border border-sand text-sm text-espresso">${escapeHtml(task.submissionNote || '')}</textarea>
      </div>
      <button type="submit" class="w-full py-2.5 rounded-xl bg-lavender hover:bg-lavender/90 text-white text-xs font-bold shadow-sm transition">
        Submit Deliverable for Leader Review
      </button>
    </form>

    ${isLeader ? `
      <div class="pt-3 border-t border-sand space-y-2.5">
        <p class="text-xs font-extrabold uppercase tracking-wider text-terracotta">Leader Verification Controls</p>
        <input type="text" id="leader-revision-note" value="${escapeHtml(task.revisionNote || '')}" placeholder="Optional revision feedback if requesting changes..." class="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs text-espresso" />
        <div class="grid grid-cols-2 gap-2.5">
          <button type="button" onclick="leaderVerifyTask('${roomId}', '${taskId}', true)" class="py-2 rounded-xl bg-sage hover:bg-sage/90 text-white text-xs font-bold shadow-sm transition">
            ✓ Stamp Approved
          </button>
          <button type="button" onclick="leaderVerifyTask('${roomId}', '${taskId}', false)" class="py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold shadow-sm transition">
            ↺ Request Revision
          </button>
        </div>
      </div>
    ` : ''}
  `;

  document.getElementById('task-action-modal').classList.remove('hidden');
}

function closeTaskActionModal() {
  document.getElementById('task-action-modal').classList.add('hidden');
}

function saveTaskSubmission(event, roomId, taskId) {
  event.preventDefault();
  const room = state.rooms.find(r => r.id === roomId);
  const task = room?.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.submissionLink = document.getElementById('task-sub-link').value.trim();
  task.submissionNote = document.getElementById('task-sub-note').value.trim();
  task.status = 'submitted';
  task.revisionNote = '';

  saveAllState(true);
  closeTaskActionModal();
  renderSquadRooms();
  showToast(`Submitted "${task.title}" for review!`, 'success');
}

function leaderVerifyTask(roomId, taskId, approved) {
  const room = state.rooms.find(r => r.id === roomId);
  const task = room?.tasks.find(t => t.id === taskId);
  if (!task) return;

  const revNote = document.getElementById('leader-revision-note')?.value.trim() || '';
  if (approved) {
    task.status = 'approved';
    task.revisionNote = '';
    showToast(`Stamped "${task.title}" as Approved!`, 'success');
  } else {
    task.status = 'inprogress';
    task.revisionNote = revNote || 'Please check formatting and resubmit.';
    showToast(`Sent "${task.title}" back with revision note.`, 'warning');
  }

  saveAllState(true);
  closeTaskActionModal();
  renderSquadRooms();
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch (_) {}
  ta.remove();
}

function copyChatSummary(roomId) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;

  const lines = room.tasks.map(t => {
    const icon = t.status === 'approved' ? '✅' : t.status === 'submitted' ? '🟣' : t.status === 'inprogress' ? '🟡' : '⚪';
    return `${icon} ${t.title} — ${t.assignee} (Due ${formatShortDate(t.checkpointDate)})`;
  });

  const receiptText = [
    `🧾 NEVER1159 SQUAD RECEIPT: ${room.title} (${room.subject})`,
    `📅 Final Due: ${formatFullDateTime(room.dueDate)}`,
    `-----------------------------------`,
    ...lines,
    `-----------------------------------`,
    `Cure the 11:58 panic! ✨`
  ].join('\n');

  copyTextToClipboard(receiptText).then(() => {
    showToast('Receipt summary copied for Messenger / Discord!', 'success');
  });
}

// ============================================================================
// 4. PROFILE, USER DIRECTORY, QR SCANNER & PROJECT DIRECT MESSAGES
// ============================================================================

function getLiveAccountByCode(inviteCode) {
  if (!inviteCode) return null;
  if (state.currentUser && state.currentUser.inviteCode.toLowerCase() === inviteCode.toLowerCase()) {
    return state.currentUser;
  }
  return state.accounts.find(a => a.inviteCode.toLowerCase() === inviteCode.toLowerCase()) || null;
}

function findAccountByMember(memberObj) {
  if (!memberObj) return null;
  if (state.currentUser) {
    if (
      (memberObj.inviteCode && state.currentUser.inviteCode.toLowerCase() === memberObj.inviteCode.toLowerCase()) ||
      state.currentUser.name.toLowerCase() === (memberObj.name || '').toLowerCase()
    ) {
      return state.currentUser;
    }
  }
  return state.accounts.find(a =>
    (memberObj.inviteCode && a.inviteCode.toLowerCase() === memberObj.inviteCode.toLowerCase()) ||
    a.name.toLowerCase() === (memberObj.name || '').toLowerCase()
  ) || null;
}

function getMemberRoomProgressSummary(room, liveName, fallbackName = '') {
  const namesToMatch = [liveName, fallbackName].filter(Boolean).map(n => n.toLowerCase());
  const memberTasks = (room.tasks || []).filter(
    t => namesToMatch.includes((t.assignee || '').toLowerCase())
  );

  if (memberTasks.length === 0) {
    return {
      key: 'not_started',
      label: 'Not Yet Starting',
      badgeClass: 'bg-sandLight text-mocha',
      dotClass: 'bg-mocha',
      detail: 'No deliverables assigned or started yet.'
    };
  }

  const approvedCount = memberTasks.filter(t => t.status === 'approved').length;
  const todoCount = memberTasks.filter(t => t.status === 'todo').length;

  if (approvedCount === memberTasks.length) {
    return {
      key: 'finished',
      label: 'Already Finished',
      badgeClass: 'bg-sageSoft text-sage',
      dotClass: 'bg-sage',
      detail: `Completed & approved (${approvedCount}/${memberTasks.length} tasks).`
    };
  }

  if (todoCount === memberTasks.length) {
    return {
      key: 'not_started',
      label: 'Not Yet Starting',
      badgeClass: 'bg-terracottaSoft text-terracotta',
      dotClass: 'bg-terracotta',
      detail: `0/${memberTasks.length} tasks started yet.`
    };
  }

  return {
    key: 'in_progress',
    label: 'In Progress',
    badgeClass: 'bg-honeySoft text-honey',
    dotClass: 'bg-honey',
    detail: `Working on tasks (${approvedCount}/${memberTasks.length} approved).`
  };
}

function openRoomMemberPanel(roomId, memberIdentifier) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const member = room.members.find(
    m => (m.inviteCode && m.inviteCode === memberIdentifier) || m.name === memberIdentifier
  );
  if (!member) return;

  const account = findAccountByMember(member) || {
    name: member.name,
    inviteCode: member.inviteCode || 'N1159-MEMBER',
    studentId: 'Student Member',
    course: room.subject,
    yearLevel: 'Squad Teammate',
    avatar: PRESET_AVATARS.dino,
    asyncHours: '7:00 PM – 10:00 PM'
  };

  const progress = getMemberRoomProgressSummary(room, account.name, member.name);
  const namesToMatch = [account.name, member.name].filter(Boolean).map(n => n.toLowerCase());
  const memberTasks = room.tasks.filter(t => namesToMatch.includes((t.assignee || '').toLowerCase()));
  const isSelf = state.currentUser && account.inviteCode === state.currentUser.inviteCode;
  const myFriends = getCurrentUserFriends();
  const isAlreadyFriend = myFriends.includes(account.inviteCode);

  const body = document.getElementById('member-panel-body');
  body.innerHTML = `
    <div class="flex items-center gap-3.5">
      <img src="${account.avatar || PRESET_AVATARS.dino}" alt="${escapeHtml(account.name)}" class="w-16 h-16 rounded-2xl object-cover border-2 border-sand bg-sageSoft" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5">
          <h4 class="font-display text-lg font-bold text-espresso truncate">${escapeHtml(account.name)}</h4>
          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-lavenderSoft text-lavender">${escapeHtml(member.role)}</span>
        </div>
        <p class="text-xs text-mocha">${escapeHtml(account.course)} • ${escapeHtml(account.yearLevel)}</p>
        <p class="text-[11px] font-mono font-bold text-espresso mt-0.5">${escapeHtml(account.inviteCode)}</p>
      </div>
    </div>

    <div class="p-3.5 rounded-2xl bg-cream border border-sand space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-mocha">Project Status</span>
        <span class="px-3 py-1 rounded-full text-xs font-extrabold ${progress.badgeClass}">
          ${progress.label}
        </span>
      </div>
      <p class="text-xs text-espresso font-medium">${escapeHtml(progress.detail)}</p>
      ${memberTasks.length > 0 ? `
        <div class="pt-1.5 border-t border-sand/70 space-y-1">
          ${memberTasks.map(t => `
            <div class="flex items-center justify-between text-[11px]">
              <span class="truncate text-espresso font-medium">• ${escapeHtml(t.title)}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusPillClass(t.status)}">${getStatusLabel(t.status)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
      <button type="button" onclick="closeMemberPanelModal(); visitTeammateProfilePage('${escapeHtml(account.inviteCode)}')"
        class="py-2.5 px-3 rounded-xl bg-ivory hover:bg-sandLight border border-sand text-xs font-bold text-espresso transition">
        Visit Profile
      </button>

      ${!isSelf ? `
        ${isAlreadyFriend ? `
          <button type="button" onclick="unfriendByCode('${escapeHtml(account.inviteCode)}'); openRoomMemberPanel('${roomId}', '${escapeHtml(memberIdentifier)}')"
            class="py-2.5 px-3 rounded-xl bg-terracottaSoft hover:bg-terracotta text-terracotta hover:text-white border border-terracotta/30 text-xs font-bold transition">
            ✕ Unfriend
          </button>
        ` : `
          <button type="button" onclick="addFriendByCode('${escapeHtml(account.inviteCode)}'); openRoomMemberPanel('${roomId}', '${escapeHtml(memberIdentifier)}')"
            class="py-2.5 px-3 rounded-xl bg-sage hover:bg-sage/90 text-white text-xs font-bold transition">
            + Add Friend
          </button>
        `}

        <button type="button" onclick="closeMemberPanelModal(); openDirectMessageWith('${escapeHtml(account.inviteCode)}')"
          class="py-2.5 px-3 rounded-xl bg-lavender hover:bg-lavender/90 text-white text-xs font-bold shadow-xs transition">
          Message
        </button>
      ` : `
        <button type="button" onclick="closeMemberPanelModal(); navigateTo('profile')"
          class="sm:col-span-2 py-2.5 px-3 rounded-xl bg-sage text-white text-xs font-bold transition">
          Edit My Profile
        </button>
      `}
    </div>
  `;

  document.getElementById('member-panel-modal').classList.remove('hidden');
}

function closeMemberPanelModal() {
  document.getElementById('member-panel-modal').classList.add('hidden');
}

function getCurrentUserFriends() {
  if (!state.currentUser) return [];
  const code = state.currentUser.inviteCode;
  if (!Array.isArray(state.friendsByUser[code])) {
    state.friendsByUser[code] = [];
  }
  return state.friendsByUser[code];
}

function addFriendByCode(inviteCode) {
  if (!state.currentUser) return false;
  const target = getLiveAccountByCode(inviteCode);
  if (!target) {
    showToast('No student found with that Invite Code.', 'warning');
    return false;
  }
  if (target.inviteCode === state.currentUser.inviteCode) {
    showToast('That is your own Invite ID!', 'info');
    return false;
  }

  const list = getCurrentUserFriends();
  if (list.includes(target.inviteCode)) {
    showToast(`${target.name} is already your friend!`, 'info');
    return true;
  }

  list.push(target.inviteCode);
  saveAllState(true);
  renderAddedFriendsList();
  if (!document.getElementById('section-teammate-profile')?.classList.contains('hidden')) {
    renderTeammateProfilePage();
  }
  showToast(`Added ${target.name} as a friend!`, 'success');
  return true;
}

function unfriendByCode(inviteCode) {
  if (!state.currentUser) return false;
  const target = getLiveAccountByCode(inviteCode);
  const code = state.currentUser.inviteCode;
  const list = getCurrentUserFriends();
  state.friendsByUser[code] = list.filter(c => c.toLowerCase() !== inviteCode.toLowerCase());

  saveAllState(true);
  renderAddedFriendsList();
  const searchInput = document.getElementById('user-search-input');
  if (searchInput && searchInput.value.trim()) {
    handleUserSearchInput(searchInput.value);
  }
  if (!document.getElementById('section-teammate-profile')?.classList.contains('hidden')) {
    renderTeammateProfilePage();
  }
  showToast(`Removed ${target ? target.name : inviteCode} from friends.`, 'info');
  return true;
}

function handleUserSearchInput(query) {
  const resultsEl = document.getElementById('user-search-results');
  if (!resultsEl) return;
  const q = (query || '').trim().toLowerCase();

  if (!q) {
    resultsEl.classList.add('hidden');
    resultsEl.innerHTML = '';
    return;
  }

  const matches = state.accounts.filter(acc =>
    state.currentUser &&
    acc.inviteCode !== state.currentUser.inviteCode &&
    (
      acc.name.toLowerCase().includes(q) ||
      acc.inviteCode.toLowerCase().includes(q) ||
      (acc.studentId || '').toLowerCase().includes(q) ||
      (acc.course || '').toLowerCase().includes(q)
    )
  );

  resultsEl.classList.remove('hidden');
  if (matches.length === 0) {
    resultsEl.innerHTML = `
      <div class="col-span-full p-4 rounded-2xl bg-cream/90 border border-sand text-center text-xs text-mocha">
        No matching students found for "${escapeHtml(query)}". Try searching by name, Student ID, or N1159-ID.
      </div>
    `;
    return;
  }

  const myFriends = getCurrentUserFriends();
  resultsEl.innerHTML = matches.map(rawAcc => {
    const acc = getLiveAccountByCode(rawAcc.inviteCode) || rawAcc;
    const added = myFriends.includes(acc.inviteCode);
    return `
      <div class="p-3.5 rounded-2xl bg-ivory border border-sand flex items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-2.5 min-w-0">
          <button type="button" onclick="visitTeammateProfilePage('${escapeHtml(acc.inviteCode)}')" class="shrink-0" title="Click profile picture to visit ${escapeHtml(acc.name)}'s profile">
            <img src="${acc.avatar || PRESET_AVATARS.dino}" alt="${escapeHtml(acc.name)}" class="w-11 h-11 rounded-2xl object-cover border border-sand hover:scale-105 transition" />
          </button>
          <div class="min-w-0">
            <p class="font-bold text-xs sm:text-sm text-espresso truncate">${escapeHtml(acc.name)}</p>
            <p class="text-[11px] text-mocha truncate">${escapeHtml(acc.studentId || '')} • ${escapeHtml(acc.inviteCode)}</p>
          </div>
        </div>
        ${added ? `
          <button type="button" onclick="unfriendByCode('${escapeHtml(acc.inviteCode)}')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-terracottaSoft hover:bg-terracotta text-terracotta hover:text-white transition">
            Unfriend
          </button>
        ` : `
          <button type="button" onclick="addFriendByCode('${escapeHtml(acc.inviteCode)}'); handleUserSearchInput(document.getElementById('user-search-input').value)"
            class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-sage hover:bg-sage/90 text-white transition">
            + Add Friend
          </button>
        `}
      </div>
    `;
  }).join('');
}

function renderAddedFriendsList() {
  const container = document.getElementById('added-friends-list');
  const countPill = document.getElementById('friends-count-pill');
  if (!container || !state.currentUser) return;

  const friendCodes = getCurrentUserFriends();
  if (countPill) countPill.textContent = `${friendCodes.length} Friends`;

  if (friendCodes.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-4 rounded-2xl bg-cream/80 border border-dashed border-sand text-center text-xs text-mocha">
        No friends added yet. Use the search bar above or scan a teammate's QR code!
      </div>
    `;
    return;
  }

  container.innerHTML = friendCodes.map(code => {
    const acc = getLiveAccountByCode(code);
    if (!acc) return '';
    return `
      <div class="p-3 rounded-2xl bg-ivory/95 border border-sand flex items-center justify-between gap-2 shadow-2xs">
        <button type="button" onclick="visitTeammateProfilePage('${escapeHtml(acc.inviteCode)}')" class="flex items-center gap-2.5 min-w-0 text-left group" title="Click avatar to visit ${escapeHtml(acc.name)}'s profile page">
          <img src="${acc.avatar || PRESET_AVATARS.dino}" alt="${escapeHtml(acc.name)}" class="w-11 h-11 rounded-2xl object-cover border border-sand group-hover:scale-105 transition shrink-0" />
          <div class="min-w-0">
            <p class="font-bold text-xs text-espresso truncate group-hover:text-terracotta transition">${escapeHtml(acc.name)}</p>
            <p class="text-[10px] font-mono text-mocha truncate">${escapeHtml(acc.inviteCode)}</p>
          </div>
        </button>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" onclick="openDirectMessageWith('${escapeHtml(acc.inviteCode)}')" title="Send Direct Message" class="p-2 rounded-xl bg-lavenderSoft hover:bg-lavender text-lavender hover:text-white text-xs font-bold transition">
            ✉
          </button>
          <button type="button" onclick="unfriendByCode('${escapeHtml(acc.inviteCode)}')" title="Unfriend" class="p-2 rounded-xl bg-terracottaSoft hover:bg-terracotta text-terracotta hover:text-white text-xs font-bold transition">
            ✕
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// QR Code Scanner & Image Upload (for Adding Teammates OR Adding to Squad Room)
function openQrScannerModal(mode = 'add_friend', roomId = null) {
  state.qrScanMode = mode;
  state.qrTargetRoomId = roomId;

  const badge = document.getElementById('qr-scanner-badge');
  const title = document.getElementById('qr-scanner-title');
  if (mode === 'add_room_member') {
    badge.textContent = 'Squad Room QR Invite';
    title.textContent = 'Add Member to Squad Room via QR';
  } else {
    badge.textContent = 'Squad Directory QR';
    title.textContent = 'Add Teammate via QR Code';
  }

  document.getElementById('qr-manual-code-input').value = '';
  document.getElementById('qr-scanner-modal').classList.remove('hidden');
}

function closeQrScannerModal() {
  stopQrCameraScan();
  document.getElementById('qr-scanner-modal').classList.add('hidden');
}

async function startQrCameraScan() {
  const video = document.getElementById('qr-video-preview');
  const placeholder = document.getElementById('qr-camera-placeholder');
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera not available in this browser—upload a QR image or paste code below!', 'warning');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    state.qrVideoStream = stream;
    video.srcObject = stream;
    await video.play();
    video.classList.remove('hidden');
    placeholder.classList.add('hidden');
    scanVideoFrameLoop();
  } catch (err) {
    showToast('Could not access camera. Try uploading the QR PNG image instead!', 'warning');
  }
}

function stopQrCameraScan() {
  if (state.qrScanAnimFrame) {
    cancelAnimationFrame(state.qrScanAnimFrame);
    state.qrScanAnimFrame = null;
  }
  if (state.qrVideoStream) {
    state.qrVideoStream.getTracks().forEach(t => t.stop());
    state.qrVideoStream = null;
  }
  const video = document.getElementById('qr-video-preview');
  const placeholder = document.getElementById('qr-camera-placeholder');
  if (video) video.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
}

function scanVideoFrameLoop() {
  const video = document.getElementById('qr-video-preview');
  const canvas = document.getElementById('qr-scan-canvas');
  if (!video || !canvas || !state.qrVideoStream) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA && typeof jsQR !== 'undefined') {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      processDecodedQrPayload(code.data);
      return;
    }
  }
  state.qrScanAnimFrame = requestAnimationFrame(scanVideoFrameLoop);
}

function handleQrImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('qr-scan-canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      if (typeof jsQR !== 'undefined') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);
        if (decoded && decoded.data) {
          processDecodedQrPayload(decoded.data);
          return;
        }
      }
      showToast('Could not detect a valid QR code in that image. Try pasting the Invite ID below.', 'warning');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleManualQrPayloadSubmit(event) {
  event.preventDefault();
  const raw = document.getElementById('qr-manual-code-input').value.trim();
  if (raw) processDecodedQrPayload(raw);
}

function processDecodedQrPayload(rawPayload) {
  let inviteCode = rawPayload.trim();
  let scannedName = '';

  try {
    if (inviteCode.startsWith('{')) {
      const parsed = JSON.parse(inviteCode);
      inviteCode = parsed.inviteCode || '';
      scannedName = parsed.name || '';
    }
  } catch (_) {}

  if (!inviteCode) {
    showToast('Invalid QR code payload.', 'danger');
    return;
  }

  closeQrScannerModal();

  if (state.qrScanMode === 'add_room_member' && state.qrTargetRoomId) {
    const room = state.rooms.find(r => r.id === state.qrTargetRoomId);
    if (!room) return;
    if (getUserRoleInRoom(room) !== 'Leader') {
      showToast('Only the locked Room Leader can add members.', 'warning');
      return;
    }
    if (room.members.length >= 8) {
      showToast('Squad Room already has 8 members.', 'warning');
      return;
    }
    const matched = state.accounts.find(a => a.inviteCode.toLowerCase() === inviteCode.toLowerCase());
    const finalName = matched ? matched.name : (scannedName || inviteCode);
    const finalCode = matched ? matched.inviteCode : inviteCode.toUpperCase();

    if (room.members.some(m => (m.inviteCode || '').toLowerCase() === finalCode.toLowerCase() || m.name.toLowerCase() === finalName.toLowerCase())) {
      showToast(`${finalName} is already in this Squad Room.`, 'info');
      return;
    }

    room.members.push({ name: finalName, inviteCode: finalCode, role: 'Member' });
    if (matched) {
      room.lockedRoles = room.lockedRoles || {};
      room.lockedRoles[matched.id] = 'Member';
    }
    saveAllState(true);
    renderSquadRooms();
    showToast(`Added ${finalName} to ${room.title} via QR!`, 'success');
  } else {
    addFriendByCode(inviteCode);
  }
}

// ============================================================================
// 5. INSTAGRAM-STYLE DIRECT MESSAGING DRAWER
// ============================================================================

function updateUnreadMessagesBadge() {
  const badge = document.getElementById('header-unread-badge');
  if (!badge || !state.currentUser) return;
  const unread = state.directMessages.filter(
    m => m.toCode === state.currentUser.inviteCode && !m.read
  ).length;

  if (unread > 0) {
    badge.textContent = unread;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function openMessagesDrawer(partnerCode = null) {
  document.getElementById('messages-drawer-modal').classList.remove('hidden');
  renderDmThreadsList();
  if (partnerCode) {
    selectDmConversation(partnerCode);
  } else if (state.activeDmPartnerCode) {
    selectDmConversation(state.activeDmPartnerCode);
  }
}

function closeMessagesDrawer() {
  document.getElementById('messages-drawer-modal').classList.add('hidden');
  updateUnreadMessagesBadge();
}

function openDirectMessageWith(inviteCode) {
  openMessagesDrawer(inviteCode);
}

function renderDmThreadsList(filterQuery = '') {
  const listEl = document.getElementById('dm-threads-list');
  if (!listEl || !state.currentUser) return;

  const q = (filterQuery || '').trim().toLowerCase();
  const candidates = state.accounts
    .map(raw => getLiveAccountByCode(raw.inviteCode) || raw)
    .filter(acc =>
      acc.inviteCode !== state.currentUser.inviteCode &&
      (!q || acc.name.toLowerCase().includes(q) || acc.inviteCode.toLowerCase().includes(q))
    );

  listEl.innerHTML = candidates.map(acc => {
    const threadMsgs = state.directMessages.filter(m =>
      (m.fromCode === state.currentUser.inviteCode && m.toCode === acc.inviteCode) ||
      (m.fromCode === acc.inviteCode && m.toCode === state.currentUser.inviteCode)
    );
    const lastMsg = threadMsgs[threadMsgs.length - 1];
    const unreadCount = threadMsgs.filter(m => m.toCode === state.currentUser.inviteCode && !m.read).length;
    const isActive = state.activeDmPartnerCode === acc.inviteCode;

    return `
      <button type="button" onclick="selectDmConversation('${escapeHtml(acc.inviteCode)}')"
        class="w-full p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition
        ${isActive ? 'bg-gradient-to-r from-sageSoft to-ivory border-sage shadow-2xs' : 'bg-ivory/80 hover:bg-sandLight/60 border-sand'}">
        <img src="${acc.avatar || PRESET_AVATARS.dino}" alt="${escapeHtml(acc.name)}" class="w-10 h-10 rounded-2xl object-cover border border-sand shrink-0" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-1">
            <p class="font-bold text-xs text-espresso truncate">${escapeHtml(acc.name)}</p>
            ${unreadCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full bg-terracotta text-white text-[10px] font-bold">${unreadCount}</span>` : ''}
          </div>
          <p class="text-[11px] text-mocha truncate">${lastMsg ? escapeHtml(lastMsg.text) : 'Tap to message about project'}</p>
        </div>
      </button>
    `;
  }).join('');
}

function selectDmConversation(partnerCode) {
  if (!state.currentUser) return;
  state.activeDmPartnerCode = partnerCode;
  const partner = getLiveAccountByCode(partnerCode);
  if (!partner) return;

  let changed = false;
  state.directMessages.forEach(m => {
    if (m.fromCode === partnerCode && m.toCode === state.currentUser.inviteCode && !m.read) {
      m.read = true;
      changed = true;
    }
  });
  if (changed) {
    saveAllState(true);
    updateUnreadMessagesBadge();
  }

  renderDmThreadsList(document.getElementById('dm-thread-search')?.value || '');

  const headerEl = document.getElementById('dm-active-header');
  headerEl.innerHTML = `
    <div class="flex items-center gap-2.5">
      <button type="button" onclick="closeMessagesDrawer(); visitTeammateProfilePage('${escapeHtml(partner.inviteCode)}')" class="shrink-0" title="Visit ${escapeHtml(partner.name)}'s profile">
        <img src="${partner.avatar || PRESET_AVATARS.dino}" alt="${escapeHtml(partner.name)}" class="w-9 h-9 rounded-xl object-cover border border-sand hover:scale-105 transition" />
      </button>
      <div>
        <p class="font-bold text-xs sm:text-sm text-espresso">${escapeHtml(partner.name)}</p>
        <p class="text-[10px] text-mocha">${escapeHtml(partner.course)} • ${escapeHtml(partner.inviteCode)}</p>
      </div>
    </div>
    <button type="button" onclick="closeMessagesDrawer(); visitTeammateProfilePage('${escapeHtml(partner.inviteCode)}')" class="px-2.5 py-1 rounded-xl bg-ivory border border-sand text-[11px] font-bold text-espresso hover:bg-sandLight transition">
      Visit Profile
    </button>
  `;

  const feedEl = document.getElementById('dm-messages-feed');
  const thread = state.directMessages.filter(m =>
    (m.fromCode === state.currentUser.inviteCode && m.toCode === partnerCode) ||
    (m.fromCode === partnerCode && m.toCode === state.currentUser.inviteCode)
  );

  if (thread.length === 0) {
    feedEl.innerHTML = `
      <div class="h-full flex items-center justify-center text-center text-xs text-mocha p-6">
        Say hi to ${escapeHtml(partner.name)} and coordinate your Squad Room deliverables!
      </div>
    `;
  } else {
    feedEl.innerHTML = thread.map(msg => {
      const isMine = msg.fromCode === state.currentUser.inviteCode;
      return `
        <div class="flex ${isMine ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs shadow-2xs ${isMine ? 'bg-sage text-white rounded-br-sm' : 'bg-cream border border-sand text-espresso rounded-bl-sm'}">
            <p class="leading-relaxed">${escapeHtml(msg.text)}</p>
            <p class="text-[9px] mt-1 opacity-75 text-right">${formatFullDateTime(msg.timestamp)}</p>
          </div>
        </div>
      `;
    }).join('');
    feedEl.scrollTop = feedEl.scrollHeight;
  }

  document.getElementById('dm-send-form').classList.remove('hidden');
}

function handleSendDirectMessage(event) {
  event.preventDefault();
  if (!state.currentUser || !state.activeDmPartnerCode) return;
  const input = document.getElementById('dm-message-input');
  const text = input.value.trim();
  if (!text) return;

  state.directMessages.push({
    id: 'msg-' + Date.now(),
    fromCode: state.currentUser.inviteCode,
    toCode: state.activeDmPartnerCode,
    text,
    timestamp: new Date().toISOString(),
    read: false
  });

  input.value = '';
  saveAllState(true);
  selectDmConversation(state.activeDmPartnerCode);
}

function renderProfileSection() {
  if (!state.currentUser) return;

  renderAddedFriendsList();
  document.getElementById('profile-preview-avatar').src = state.currentUser.avatar || PRESET_AVATARS.dino;
  document.getElementById('prof-name').value = state.currentUser.name || '';
  document.getElementById('prof-student-id').value = state.currentUser.studentId || '';
  document.getElementById('prof-year').value = state.currentUser.yearLevel || '3rd Year';
  document.getElementById('prof-course').value = state.currentUser.course || '';
  document.getElementById('prof-async-hours').value = state.currentUser.asyncHours || '7:00 PM – 10:00 PM';
  document.getElementById('prof-focus-default').value = state.currentUser.focusDefault || '25';
  document.getElementById('prof-reminders').checked = state.currentUser.reminders !== false;

  document.getElementById('profile-invite-id').textContent = state.currentUser.inviteCode;
  document.getElementById('profile-qr-caption').textContent = `${state.currentUser.name} • ${state.currentUser.studentId}`;

  const qrContainer = document.getElementById('profile-qr-container');
  qrContainer.innerHTML = '';
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: JSON.stringify({
        app: 'Never1159',
        inviteCode: state.currentUser.inviteCode,
        name: state.currentUser.name,
        studentId: state.currentUser.studentId
      }),
      width: 164,
      height: 164,
      colorDark: '#2F2A26',
      colorLight: '#FAF6F0'
    });
  }
}

function selectPresetAvatar(key) {
  if (!state.currentUser || !PRESET_AVATARS[key]) return;
  state.currentUser.avatar = PRESET_AVATARS[key];
  document.getElementById('profile-preview-avatar').src = state.currentUser.avatar;
  updateHeaderUser();
  saveAllState(true);
  showToast('Updated cozy mascot avatar!', 'success');
}

function handleProfilePhotoUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !state.currentUser) return;

  const reader = new FileReader();
  reader.onload = e => {
    state.currentUser.avatar = e.target.result;
    document.getElementById('profile-preview-avatar').src = state.currentUser.avatar;
    updateHeaderUser();
    saveAllState(true);
    showToast('Uploaded custom profile photo!', 'success');
  };
  reader.readAsDataURL(file);
}

function saveProfileChanges(event) {
  event.preventDefault();
  if (!state.currentUser) return;

  const previousName = state.currentUser.name;
  state.currentUser.name = document.getElementById('prof-name').value.trim();
  state.currentUser.studentId = document.getElementById('prof-student-id').value.trim();
  state.currentUser.yearLevel = document.getElementById('prof-year').value;
  state.currentUser.course = document.getElementById('prof-course').value.trim();
  state.currentUser.asyncHours = document.getElementById('prof-async-hours').value.trim();
  state.currentUser.focusDefault = document.getElementById('prof-focus-default').value;
  state.currentUser.reminders = document.getElementById('prof-reminders').checked;

  const accIdx = state.accounts.findIndex(
    a => a.inviteCode.toLowerCase() === state.currentUser.inviteCode.toLowerCase()
  );
  if (accIdx !== -1) {
    state.accounts[accIdx] = { ...state.accounts[accIdx], ...state.currentUser };
  }

  if (previousName && previousName !== state.currentUser.name) {
    state.rooms.forEach(room => {
      (room.members || []).forEach(m => {
        if (m.inviteCode === state.currentUser.inviteCode || m.name === previousName) {
          m.name = state.currentUser.name;
        }
      });
      (room.tasks || []).forEach(t => {
        if (t.assignee === previousName) {
          t.assignee = state.currentUser.name;
        }
      });
    });
  }

  setTimerDuration(state.currentUser.focusDefault);
  updateHeaderUser();
  saveAllState(true);
  renderProfileSection();
  showToast('Profile & study settings saved across all views!', 'success');
}

function copyPersonalInviteId() {
  if (!state.currentUser) return;
  copyTextToClipboard(state.currentUser.inviteCode).then(() => {
    showToast(`Copied Invite ID: ${state.currentUser.inviteCode}`, 'success');
  });
}

function downloadProfileQR() {
  const qrContainer = document.getElementById('profile-qr-container');
  const canvas = qrContainer?.querySelector('canvas');
  const img = qrContainer?.querySelector('img');
  const dataUrl = canvas ? canvas.toDataURL('image/png') : img?.src;

  if (!dataUrl) {
    showToast('QR code is still generating—try again in a moment.', 'warning');
    return;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${state.currentUser?.inviteCode || 'Never1159'}-QR.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Downloaded your personal QR pass!', 'success');
}

// ============================================================================
// 6. AUTHENTICATION, DEMO ACCOUNT, PERSISTENCE & INITIALIZATION
// ============================================================================

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginBtn = document.getElementById('tab-login-btn');
  const signupBtn = document.getElementById('tab-signup-btn');

  if (tab === 'signup') {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    signupBtn.className = 'py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-sageSoft to-ivory text-espresso shadow-sm transition';
    loginBtn.className = 'py-2.5 text-sm font-bold rounded-xl text-mocha hover:text-espresso transition';
  } else {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    loginBtn.className = 'py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-sageSoft to-ivory text-espresso shadow-sm transition';
    signupBtn.className = 'py-2.5 text-sm font-bold rounded-xl text-mocha hover:text-espresso transition';
  }
}

function generateInviteCode(name) {
  const clean = (name || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'STUD';
  const rand = Math.floor(100 + Math.random() * 900);
  return `N1159-${clean}${rand}`;
}

function seedDefaultAccountsAndRooms() {
  if (state.accounts.length === 0) {
    state.accounts = [
      {
        id: 'usr-maya',
        name: 'Maya Santos',
        email: 'maya@uni.edu',
        password: 'demo',
        studentId: '2026-10421',
        yearLevel: '3rd Year',
        course: 'BS Computer Science',
        inviteCode: 'N1159-MAYA',
        avatar: PRESET_AVATARS.dino,
        asyncHours: '7:00 PM – 10:00 PM',
        focusDefault: '25',
        reminders: true
      },
      {
        id: 'usr-liam',
        name: 'Liam Chen',
        email: 'liam@uni.edu',
        password: 'demo',
        studentId: '2026-10884',
        yearLevel: '3rd Year',
        course: 'BS Computer Science',
        inviteCode: 'N1159-LIAM',
        avatar: PRESET_AVATARS.bear,
        asyncHours: '6:00 PM – 9:30 PM',
        focusDefault: '45',
        reminders: true
      },
      {
        id: 'usr-samira',
        name: 'Samira Patel',
        email: 'samira@uni.edu',
        password: 'demo',
        studentId: '2026-10912',
        yearLevel: '3rd Year',
        course: 'BS Information Systems',
        inviteCode: 'N1159-SAMI',
        avatar: PRESET_AVATARS.cat,
        asyncHours: '8:00 PM – 11:00 PM',
        focusDefault: '25',
        reminders: true
      }
    ];
  }

  if (state.rooms.length === 0) {
    state.rooms = [
      {
        id: 'room-cs302',
        subject: 'CS 302 • Software Engineering',
        title: 'Campus Study Spot Finder App',
        dueDate: '2026-11-30T23:59',
        createdBy: 'usr-maya',
        lockedRoles: {
          'usr-maya': 'Leader',
          'usr-liam': 'Member',
          'usr-samira': 'Member'
        },
        members: [
          { name: 'Maya Santos', inviteCode: 'N1159-MAYA', role: 'Leader' },
          { name: 'Liam Chen', inviteCode: 'N1159-LIAM', role: 'Member' },
          { name: 'Samira Patel', inviteCode: 'N1159-SAMI', role: 'Member' }
        ],
        tasks: [
          {
            id: 't-1',
            title: 'User Interview & Wireframes',
            assignee: 'Maya Santos',
            checkpointDate: '2026-11-25T20:00',
            status: 'approved',
            submissionNote: 'Uploaded Figma flows',
            submissionLink: 'https://figma.com',
            revisionNote: ''
          },
          {
            id: 't-2',
            title: 'Interactive Map & Filter Logic',
            assignee: 'Liam Chen',
            checkpointDate: '2026-11-27T21:00',
            status: 'submitted',
            submissionNote: 'Ready for leader check!',
            submissionLink: 'https://github.com',
            revisionNote: ''
          },
          {
            id: 't-3',
            title: 'Final Demo Deck & Script',
            assignee: 'Samira Patel',
            checkpointDate: '2026-11-29T19:00',
            status: 'inprogress',
            submissionNote: '',
            submissionLink: '',
            revisionNote: ''
          }
        ]
      }
    ];
    state.activeRoomId = 'room-cs302';
  }
}

function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const yearLevel = document.getElementById('signup-year').value;
  const studentId = document.getElementById('signup-student-id').value.trim();
  const course = document.getElementById('signup-course').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;

  if (!name || !studentId || !course || !email || !password) {
    showToast('Please fill out all required sign-up fields.', 'warning');
    return;
  }

  if (state.accounts.some(a => a.email.toLowerCase() === email)) {
    showToast('An account with that email already exists. Try logging in!', 'warning');
    switchAuthTab('login');
    return;
  }

  const newAccount = {
    id: 'usr-' + Date.now(),
    name,
    email,
    password,
    studentId,
    yearLevel,
    course,
    inviteCode: generateInviteCode(name),
    avatar: PRESET_AVATARS.dino,
    asyncHours: '7:00 PM – 10:00 PM',
    focusDefault: '25',
    reminders: true
  };

  state.accounts.push(newAccount);
  state.currentUser = { ...newAccount };
  saveAllState(true);
  enterWorkspace();
  showToast(`Welcome to Never1159, ${name}! Your Invite ID is ${newAccount.inviteCode}.`, 'success');
}

function handleLogin(event) {
  event.preventDefault();
  const identifier = document.getElementById('login-identifier').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  const matched = state.accounts.find(
    a =>
      (a.email.toLowerCase() === identifier ||
        a.inviteCode.toLowerCase() === identifier ||
        (a.studentId || '').toLowerCase() === identifier) &&
      a.password === password
  );

  if (!matched) {
    showToast('Invalid credentials. Check your email/Invite ID or try Demo Student!', 'danger');
    return;
  }

  state.currentUser = { ...matched };
  saveAllState(true);
  enterWorkspace();
  showToast(`Welcome back, ${matched.name}!`, 'success');
}

function loginWithDemoAccount() {
  seedDefaultAccountsAndRooms();
  const demo = state.accounts.find(a => a.inviteCode === 'N1159-MAYA') || state.accounts[0];
  state.currentUser = { ...demo };
  saveAllState(true);
  enterWorkspace();
  showToast(`Logged in as Demo Student (${demo.name})!`, 'success');
}

function handleLogout() {
  pauseFocusTimer();
  state.currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  document.getElementById('workspace-view').classList.add('hidden');
  document.getElementById('landing-view').classList.remove('hidden');
  showToast('Logged out safely. See you before 11:58!', 'info');
}

function updateHeaderUser() {
  if (!state.currentUser) return;
  const avatarEl = document.getElementById('header-user-avatar');
  const nameEl = document.getElementById('header-user-name');
  if (avatarEl) avatarEl.src = state.currentUser.avatar || PRESET_AVATARS.dino;
  if (nameEl) nameEl.textContent = state.currentUser.name;
}

function enterWorkspace() {
  if (!state.currentUser) return;
  document.getElementById('landing-view').classList.add('hidden');
  document.getElementById('workspace-view').classList.remove('hidden');
  updateHeaderUser();
  updateUnreadMessagesBadge();
  setTimerDuration(state.currentUser.focusDefault || '25');
  navigateTo('home');
}

function dinoHelpfulTip() {
  const tips = [
    'Dino Tip: Split your project backward from Friday so Thursday night stays cozy!',
    'Dino Tip: Click any teammate’s profile picture in Squad Rooms to check their live progress or send a quick DM!',
    'Dino Tip: Use a 25-minute Calm Focus block right now—you’ll beat the 11:58 panic easily!'
  ];
  const pick = tips[Math.floor(Math.random() * tips.length)];
  showToast(pick, 'info');
}

function saveAllState(syncCloud = false) {
  try {
    if (state.currentUser) {
      const idx = state.accounts.findIndex(
        a => a.inviteCode.toLowerCase() === state.currentUser.inviteCode.toLowerCase()
      );
      if (idx !== -1) {
        state.accounts[idx] = { ...state.accounts[idx], ...state.currentUser };
      }
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
    }

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(state.accounts));
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(state.rooms));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROOM, state.activeRoomId || '');
    localStorage.setItem(STORAGE_KEYS.ASYNC_SLOT, JSON.stringify(state.asyncSlot));
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(state.friendsByUser));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(state.directMessages));

    if (syncCloud && state.currentUser && state.currentUser.email) {
      localStorage.setItem(
        STORAGE_KEYS.CLOUD_VAULT_PREFIX + state.currentUser.email.toLowerCase(),
        JSON.stringify({
          accounts: state.accounts,
          rooms: state.rooms,
          asyncSlot: state.asyncSlot,
          friendsByUser: state.friendsByUser,
          directMessages: state.directMessages
        })
      );
    }
  } catch (err) {
    console.warn('State save warning:', err);
  }
}

function loadAllState() {
  try {
    state.accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    state.rooms = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || '[]');
    state.activeRoomId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROOM) || null;
    state.asyncSlot = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASYNC_SLOT) || 'null');
    state.friendsByUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS) || '{}');
    state.directMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const savedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');

    seedDefaultAccountsAndRooms();

    if (savedUser) {
      const liveMatch = state.accounts.find(
        a => a.inviteCode.toLowerCase() === savedUser.inviteCode.toLowerCase()
      );
      state.currentUser = liveMatch ? { ...liveMatch } : savedUser;
    }
  } catch (err) {
    seedDefaultAccountsAndRooms();
  }
}

// ============================================================================
// 7. FORMATTING & TOAST UTILITIES
// ============================================================================

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStatusLabel(status) {
  const map = {
    todo: 'Not Started',
    inprogress: 'In Progress',
    submitted: 'Ready for Review',
    approved: 'Approved'
  };
  return map[status] || 'Not Started';
}

function getStatusPillClass(status) {
  const map = {
    todo: 'bg-sandLight text-mocha',
    inprogress: 'bg-honeySoft text-honey',
    submitted: 'bg-lavenderSoft text-lavender',
    approved: 'bg-sageSoft text-sage'
  };
  return map[status] || 'bg-sandLight text-mocha';
}

function formatShortDate(dateStr) {
  if (!dateStr) return 'No date';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDateTime(dateStr) {
  if (!dateStr) return 'No deadline';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const styles = {
    success: 'bg-sageSoft border-sage text-espresso',
    warning: 'bg-honeySoft border-honey text-espresso',
    danger: 'bg-terracottaSoft border-terracotta text-espresso',
    info: 'bg-ivory border-sand text-espresso'
  };

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto px-4 py-3 rounded-2xl border-2 shadow-cozy text-xs font-bold transition-all duration-300 ${styles[type] || styles.info}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3400);
}

window.addEventListener('DOMContentLoaded', () => {
  loadAllState();
  if (state.currentUser) {
    enterWorkspace();
  }
});

// Expose all interactive functions explicitly on window so inline handlers work reliably
Object.assign(window, {
  navigateTo,
  visitTeammateProfilePage,
  navigateBackFromTeammateProfile,
  renderTeammateProfilePage,
  renderHomeDashboard,
  openRoomFromHome,
  changeCalendarMonth,
  selectCalendarDate,
  setTimerDuration,
  startFocusTimer,
  pauseFocusTimer,
  resetFocusTimer,
  saveAsyncMeeting,
  renderSquadRooms,
  selectActiveRoom,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  openCreateRoomModal,
  closeCreateRoomModal,
  handleCreateRoom,
  addMemberToRoom,
  openAddTaskPrompt,
  submitNewTaskToRoom,
  deleteSquadRoom,
  openTaskActionModal,
  closeTaskActionModal,
  saveTaskSubmission,
  leaderVerifyTask,
  copyChatSummary,
  openRoomMemberPanel,
  closeMemberPanelModal,
  addFriendByCode,
  unfriendByCode,
  handleUserSearchInput,
  openQrScannerModal,
  closeQrScannerModal,
  startQrCameraScan,
  stopQrCameraScan,
  handleQrImageUpload,
  handleManualQrPayloadSubmit,
  openMessagesDrawer,
  closeMessagesDrawer,
  openDirectMessageWith,
  renderDmThreadsList,
  selectDmConversation,
  handleSendDirectMessage,
  renderProfileSection,
  selectPresetAvatar,
  handleProfilePhotoUpload,
  saveProfileChanges,
  copyPersonalInviteId,
  downloadProfileQR,
  switchAuthTab,
  handleSignup,
  handleLogin,
  loginWithDemoAccount,
  handleLogout,
  dinoHelpfulTip
});