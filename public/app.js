const state = {
  leads: [],
  messages: [],
  organizations: [],
  selectedLead: null,
  selectedOrganization: null,
};

const els = {
  alert: document.getElementById('alert'),
  connectionStatus: document.getElementById('connection-status'),
  settingsConnected: document.getElementById('settings-connected'),
  settingsRedirect: document.getElementById('settings-redirect'),
  settingsLlm: document.getElementById('settings-llm'),
  leadsBody: document.getElementById('leads-body'),
  leadDetail: document.getElementById('lead-detail'),
  crmBody: document.getElementById('crm-body'),
  crmDetail: document.getElementById('crm-detail'),
  crmSummary: document.getElementById('crm-summary'),
  messagesBody: document.getElementById('messages-body'),
  eventsList: document.getElementById('events-list'),
  availabilityResult: document.getElementById('availability-result'),
  bookingResult: document.getElementById('booking-result'),
  bookingForm: document.getElementById('booking-form'),
};

if (document.getElementById('email-limit')) {
  document.getElementById('email-limit').max = '150';
  document.getElementById('email-limit').value = '150';
}

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const showAlert = (message, type = '') => {
  els.alert.textContent = message;
  els.alert.className = `alert ${type}`.trim();
  window.clearTimeout(showAlert.timer);
  showAlert.timer = window.setTimeout(() => {
    els.alert.classList.add('hidden');
  }, 5000);
};

const setLoadingRow = (tbody, columns, message) => {
  tbody.innerHTML = `<tr><td colspan="${columns}" class="empty">${escapeHtml(message)}</td></tr>`;
};

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
};

const formData = (form) => Object.fromEntries(new FormData(form).entries());

const cleanPayload = (payload) => {
  const next = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== '') next[key] = value;
  });
  if (next.durationMinutes) next.durationMinutes = Number(next.durationMinutes);
  return next;
};

const formatCategory = (category = 'booking') => category
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const formatTiming = (lead) => {
  const extracted = lead.extracted || {};
  const context = extracted.context
    ? `${extracted.context.charAt(0).toUpperCase()}${extracted.context.slice(1)}`
    : 'Detected';
  const detected = [
    extracted.detectedDate,
    extracted.detectedTime,
  ].filter(Boolean).join(' ');
  const received = lead.date ? `Received: ${lead.date}` : '';

  if (detected && received) return `${context}: ${detected} / ${received}`;
  return detected ? `${context}: ${detected}` : received || 'No timing found';
};

const activateTab = (tab) => {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tab}`);
  });
};

const loadAuthStatus = async () => {
  try {
    const status = await api('/auth/status');
    els.connectionStatus.textContent = status.connected ? 'Google connected' : 'Google not connected';
    els.connectionStatus.className = `status-pill ${status.connected ? 'connected' : 'disconnected'}`;
    els.settingsConnected.textContent = status.connected ? 'Connected' : 'Not connected';
    els.settingsRedirect.textContent = status.redirectUri || 'Not configured';
    els.settingsLlm.textContent = status.llm?.configured
      ? `Ollama configured (${status.llm.model})`
      : `Ollama not configured (${status.llm?.model || 'no model'})`;
  } catch (error) {
    els.connectionStatus.textContent = 'Connection unknown';
    els.connectionStatus.className = 'status-pill disconnected';
    els.settingsConnected.textContent = 'Could not check';
    els.settingsRedirect.textContent = 'Could not check';
    els.settingsLlm.textContent = 'Could not check';
  }
};

const renderLeads = (leads) => {
  if (!leads.length) {
    setLoadingRow(els.leadsBody, 5, 'No LinkedIn, booking, job, tech, due, or upcoming opportunities found in the current restricted inbox scan.');
    return;
  }

  els.leadsBody.innerHTML = leads.map((lead, index) => {
    const extracted = lead.extracted || {};
    const extractedText = [
      extracted.customerName,
      extracted.email,
      extracted.phone,
      extracted.requestedDate,
      extracted.requestedTime,
    ].filter(Boolean).join(' / ') || 'Needs review';

    return `
      <tr>
        <td>
          <span class="cell-title">${escapeHtml(lead.subject || 'No subject')}</span>
          <span class="cell-subtitle">${escapeHtml(lead.from || 'Unknown sender')}</span>
          <br><span class="cell-subtitle">${escapeHtml(lead.date || 'No received date')}</span>
        </td>
        <td>
          <span class="cell-title">${escapeHtml(formatCategory(lead.category))}</span>
          <span class="cell-subtitle">${escapeHtml(lead.reasonMatched || 'Lead signal')}</span><br>
          <span class="cell-subtitle">Score ${escapeHtml(lead.score ?? 'n/a')}${lead.confidence ? ` / Confidence ${escapeHtml(lead.confidence)}` : ''}</span>
        </td>
        <td>${escapeHtml(formatTiming(lead))}</td>
        <td>${escapeHtml(extractedText)}</td>
        <td><button class="button small" type="button" data-lead-index="${index}">Review</button></td>
      </tr>
    `;
  }).join('');
};

const renderLeadDetail = (lead) => {
  if (!lead) {
    els.leadDetail.className = 'empty-block';
    els.leadDetail.textContent = 'Choose a lead to review details and prefill the booking form.';
    return;
  }

  const extracted = lead.extracted || {};
  els.leadDetail.className = '';
  els.leadDetail.innerHTML = `
    <div class="detail-row"><span>From</span><span>${escapeHtml(lead.from || 'Unknown')}</span></div>
    <div class="detail-row"><span>Subject</span><span>${escapeHtml(lead.subject || 'No subject')}</span></div>
    <div class="detail-row"><span>Received</span><span>${escapeHtml(lead.date || 'No received date')}</span></div>
    <div class="detail-row"><span>Snippet</span><span>${escapeHtml(lead.snippet || 'No snippet')}</span></div>
    <div class="detail-row"><span>Type</span><span>${escapeHtml(formatCategory(lead.category))}</span></div>
    <div class="detail-row"><span>Source</span><span>${escapeHtml(formatCategory(lead.source || extracted.source || 'gmail'))}</span></div>
    <div class="detail-row"><span>Priority</span><span>${escapeHtml(lead.priority || 'Not set')}</span></div>
    <div class="detail-row"><span>Summary</span><span>${escapeHtml(lead.summary || 'Not generated')}</span></div>
    <div class="detail-row"><span>Action</span><span>${escapeHtml(lead.suggestedAction || 'Not generated')}</span></div>
    <div class="detail-row"><span>LLM</span><span>${escapeHtml(lead.llmProvider ? `${lead.llmProvider} ${lead.llmModel || ''}` : 'Not used')}${lead.llmError ? `: ${escapeHtml(lead.llmError)}` : ''}</span></div>
    <div class="detail-row"><span>Timing</span><span>${escapeHtml(formatTiming(lead))}</span></div>
    <div class="detail-row"><span>Due</span><span>${escapeHtml([extracted.dueDate, extracted.dueTime].filter(Boolean).join(' ') || 'Not detected')}</span></div>
    <div class="detail-row"><span>Upcoming</span><span>${escapeHtml([extracted.upcomingDate, extracted.upcomingTime].filter(Boolean).join(' ') || 'Not detected')}</span></div>
    <div class="detail-row"><span>Matched</span><span>${escapeHtml((lead.matchedKeywords || []).join(', ') || lead.reasonMatched || 'Keyword')}</span></div>
    <div class="detail-row"><span>Email</span><span>${escapeHtml(extracted.email || 'Not found')}</span></div>
    <div class="detail-row"><span>Phone</span><span>${escapeHtml(extracted.phone || 'Not found')}</span></div>
    <div class="lead-actions">
      <button id="prefill-lead" class="button primary" type="button">Prefill Booking</button>
      <button id="dismiss-lead" class="button danger" type="button">Dismiss Locally</button>
    </div>
  `;

  document.getElementById('prefill-lead').addEventListener('click', () => prefillBookingFromLead(lead));
  document.getElementById('dismiss-lead').addEventListener('click', () => dismissLead(lead.emailId));
};

const renderCrmSummary = (summary = {}) => {
  const values = [
    ['Organizations', summary.organizationCount || 0],
    ['With Opportunities', summary.opportunityOrganizationCount || 0],
    ['Due Work', summary.dueOrganizationCount || 0],
    ['Upcoming', summary.upcomingOrganizationCount || 0],
  ];

  els.crmSummary.innerHTML = values.map(([label, value]) => `
    <div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
  `).join('');
};

const renderOrganizations = (organizations) => {
  if (!organizations.length) {
    setLoadingRow(els.crmBody, 4, 'No organizations found in the current Gmail scan.');
    return;
  }

  els.crmBody.innerHTML = organizations.map((org, index) => `
    <tr>
      <td>
        <span class="cell-title">${escapeHtml(org.name)}</span>
        <span class="cell-subtitle">${escapeHtml(org.domain || org.contacts?.[0] || 'No domain')}</span>
      </td>
      <td>
        <span class="cell-title">${escapeHtml(org.analysis?.stage || 'Observed')}</span>
        <span class="cell-subtitle">${escapeHtml(org.analysis?.topCategoryLabel || 'General')} / Score ${escapeHtml(org.score || 0)}</span>
      </td>
      <td>
        <span class="cell-title">${escapeHtml(org.messageCount)} message${org.messageCount === 1 ? '' : 's'}</span>
        <span class="cell-subtitle">${escapeHtml(org.latestDate || 'No date')}</span>
      </td>
      <td><button class="button small" type="button" data-org-index="${index}">Review</button></td>
    </tr>
  `).join('');
};

const renderOrganizationDetail = (org) => {
  if (!org) {
    els.crmDetail.className = 'empty-block';
    els.crmDetail.textContent = 'Choose an organization to review contacts, messages, and recommended next action.';
    return;
  }

  els.crmDetail.className = '';
  const contacts = org.contacts?.length ? org.contacts.join(', ') : 'No contacts found';
  const categoryCounts = Object.entries(org.categoryCounts || {})
    .map(([category, count]) => `${formatCategory(category)}: ${count}`)
    .join(', ') || 'No categories';

  els.crmDetail.innerHTML = `
    <div class="detail-row"><span>Organization</span><span>${escapeHtml(org.name)}</span></div>
    <div class="detail-row"><span>Domain</span><span>${escapeHtml(org.domain || 'No domain')}</span></div>
    <div class="detail-row"><span>Contacts</span><span>${escapeHtml(contacts)}</span></div>
    <div class="detail-row"><span>Stage</span><span>${escapeHtml(org.analysis?.stage || 'Observed')}</span></div>
    <div class="detail-row"><span>Summary</span><span>${escapeHtml(org.analysis?.summary || 'No summary')}</span></div>
    <div class="detail-row"><span>Next Action</span><span>${escapeHtml(org.analysis?.suggestedAction || 'Review recent messages')}</span></div>
    <div class="detail-row"><span>Categories</span><span>${escapeHtml(categoryCounts)}</span></div>
    <div class="detail-row"><span>Latest</span><span>${escapeHtml(org.latestSubject || 'No subject')} / ${escapeHtml(org.latestDate || 'No date')}</span></div>
    <div class="message-list">
      ${(org.messages || []).slice(0, 8).map((message) => `
        <div class="message-item">
          <strong>${escapeHtml(message.subject || 'No subject')}</strong>
          <span class="muted">${escapeHtml(message.date || 'No date')} / ${escapeHtml(formatCategory(message.category || 'general'))}</span>
          <p class="muted">${escapeHtml(message.snippet || '')}</p>
        </div>
      `).join('')}
    </div>
  `;
};

const loadCrm = async () => {
  setLoadingRow(els.crmBody, 4, 'Building CRM from recent Gmail metadata...');
  renderOrganizationDetail(null);
  try {
    const data = await api('/crm/organizations?limit=150');
    state.organizations = data.organizations || [];
    state.selectedOrganization = null;
    renderCrmSummary(data.summary);
    renderOrganizations(state.organizations);
  } catch (error) {
    setLoadingRow(els.crmBody, 4, error.message);
    showAlert(error.message, 'error');
  }
};

const loadLeads = async () => {
  setLoadingRow(els.leadsBody, 5, 'Scanning restricted inbox metadata...');
  try {
    const leads = await api('/agent/booking-leads');
    state.leads = leads;
    state.selectedLead = null;
    renderLeads(leads);
    renderLeadDetail(null);
  } catch (error) {
    setLoadingRow(els.leadsBody, 5, error.message);
    showAlert(error.message, 'error');
  }
};

const loadLinkedInLeads = async () => {
  setLoadingRow(els.leadsBody, 5, 'Scanning recent Gmail metadata for LinkedIn leads...');
  try {
    const leads = await api('/agent/linkedin-leads');
    state.leads = leads;
    state.selectedLead = null;
    renderLeads(leads);
    renderLeadDetail(null);
  } catch (error) {
    setLoadingRow(els.leadsBody, 5, error.message);
    showAlert(error.message, 'error');
  }
};

const loadSmartLeads = async () => {
  setLoadingRow(els.leadsBody, 5, 'Scanning and enriching opportunities with Ollama...');
  try {
    const leads = await api('/agent/smart-opportunities?limit=20');
    state.leads = leads;
    state.selectedLead = null;
    renderLeads(leads);
    renderLeadDetail(null);
    showAlert('Ollama enrichment finished.', 'success');
  } catch (error) {
    setLoadingRow(els.leadsBody, 5, error.message);
    showAlert(error.message, 'error');
  }
};

const dismissLead = (emailId) => {
  state.leads = state.leads.filter((lead) => lead.emailId !== emailId);
  state.selectedLead = null;
  renderLeads(state.leads);
  renderLeadDetail(null);
};

const prefillBookingFromLead = (lead) => {
  const extracted = lead.extracted || {};
  const form = els.bookingForm;
  form.emailId.value = lead.emailId || '';
  form.customerName.value = extracted.customerName || '';
  form.phone.value = extracted.phone || '';
  form.email.value = extracted.email || '';
  form.service.value = extracted.service || (lead.matchedKeywords || [])[0] || '';
  form.date.value = extracted.requestedDate || '';
  form.startTime.value = extracted.requestedTime || '';
  form.durationMinutes.value = extracted.durationMinutes || 30;
  form.notes.value = `Source: ${lead.subject || 'Gmail lead'}\n${lead.snippet || ''}`.trim();
  activateTab('booking');
  showAlert('Lead details copied into the booking form.', 'success');
};

const renderMessages = (messages) => {
  if (!messages.length) {
    setLoadingRow(els.messagesBody, 4, 'No messages found.');
    return;
  }

  els.messagesBody.innerHTML = messages.map((message) => `
    <tr>
      <td>${escapeHtml(message.from || 'Unknown')}</td>
      <td><span class="cell-title">${escapeHtml(message.subject || 'No subject')}</span></td>
      <td>${escapeHtml(message.date || 'Unknown')}</td>
      <td class="snippet">${escapeHtml(message.snippet || '')}</td>
    </tr>
  `).join('');
};

const loadMessages = async (event) => {
  event?.preventDefault();
  const query = document.getElementById('email-query').value.trim();
  const limit = document.getElementById('email-limit').value;
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (limit) params.set('limit', limit);

  setLoadingRow(els.messagesBody, 4, 'Loading Gmail metadata...');
  try {
    const messages = await api(`/gmail/latest?${params.toString()}`);
    state.messages = messages;
    renderMessages(messages);
  } catch (error) {
    setLoadingRow(els.messagesBody, 4, error.message);
    showAlert(error.message, 'error');
  }
};

const renderEvents = (events) => {
  if (!events.length) {
    els.eventsList.className = 'event-list empty-block';
    els.eventsList.textContent = 'No upcoming events found.';
    return;
  }

  els.eventsList.className = 'event-list';
  els.eventsList.innerHTML = events.map((event) => {
    const start = event.start?.dateTime || event.start?.date || 'Unknown start';
    const end = event.end?.dateTime || event.end?.date || 'Unknown end';
    return `
      <div class="event-card">
        <strong>${escapeHtml(event.summary || 'Untitled event')}</strong>
        <span class="muted">${escapeHtml(start)} to ${escapeHtml(end)}</span>
      </div>
    `;
  }).join('');
};

const loadEvents = async () => {
  els.eventsList.className = 'event-list empty-block';
  els.eventsList.textContent = 'Loading calendar events...';
  try {
    renderEvents(await api('/calendar/events'));
  } catch (error) {
    els.eventsList.textContent = error.message;
    showAlert(error.message, 'error');
  }
};

const setResult = (element, text, type = '') => {
  element.textContent = text;
  element.className = `result-box ${type}`.trim();
};

const checkAvailability = async (payload, target = els.availabilityResult) => {
  setResult(target, 'Checking calendar slot...');
  const result = await api('/calendar/check-availability', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (result.available) {
    setResult(target, 'Slot is available.', 'good');
  } else {
    const conflicts = result.conflicts.map((conflict) => conflict.summary || conflict.id).join(', ');
    setResult(target, `Slot has conflicts: ${conflicts || 'calendar event'}`, 'warn');
  }
  return result;
};

const handleAvailabilitySubmit = async (event) => {
  event.preventDefault();
  try {
    await checkAvailability(cleanPayload(formData(event.currentTarget)));
  } catch (error) {
    setResult(els.availabilityResult, error.message, 'bad');
    showAlert(error.message, 'error');
  }
};

const handleBookingSlotCheck = async () => {
  const payload = cleanPayload(formData(els.bookingForm));
  try {
    await checkAvailability({
      date: payload.date,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes,
    }, els.bookingResult);
  } catch (error) {
    setResult(els.bookingResult, error.message, 'bad');
    showAlert(error.message, 'error');
  }
};

const handleBookingSubmit = async (event) => {
  event.preventDefault();
  const payload = cleanPayload(formData(event.currentTarget));
  const isLeadBooking = Boolean(payload.emailId);
  const path = isLeadBooking ? '/agent/create-booking-from-lead' : '/calendar/bookings';

  setResult(els.bookingResult, 'Submitting booking...');
  try {
    const result = await api(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const booking = result.booking || result;
    setResult(els.bookingResult, `Booking created: ${booking.summary || booking.id || 'calendar event'}`, 'good');
    showAlert('Booking created successfully.', 'success');
    loadEvents();
  } catch (error) {
    setResult(els.bookingResult, error.message, 'bad');
    showAlert(error.message, 'error');
  }
};

const clearBooking = () => {
  els.bookingForm.reset();
  els.bookingForm.emailId.value = '';
  setResult(els.bookingResult, 'No booking submitted yet.');
};

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => activateTab(button.dataset.tab));
});

els.leadsBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-lead-index]');
  if (!button) return;
  state.selectedLead = state.leads[Number(button.dataset.leadIndex)];
  renderLeadDetail(state.selectedLead);
});

els.crmBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-org-index]');
  if (!button) return;
  state.selectedOrganization = state.organizations[Number(button.dataset.orgIndex)];
  renderOrganizationDetail(state.selectedOrganization);
});

document.getElementById('refresh-leads').addEventListener('click', loadLeads);
document.getElementById('linkedin-leads').addEventListener('click', loadLinkedInLeads);
document.getElementById('smart-leads').addEventListener('click', loadSmartLeads);
document.getElementById('refresh-crm').addEventListener('click', loadCrm);
document.getElementById('email-search-form').addEventListener('submit', loadMessages);
document.getElementById('refresh-events').addEventListener('click', loadEvents);
document.getElementById('availability-form').addEventListener('submit', handleAvailabilitySubmit);
document.getElementById('check-booking-slot').addEventListener('click', handleBookingSlotCheck);
document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
document.getElementById('clear-booking').addEventListener('click', clearBooking);

loadAuthStatus();
loadEvents();
