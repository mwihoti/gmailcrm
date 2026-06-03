import { classifyLead } from './leadClassifier.js';

const PERSONAL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

const CATEGORY_LABELS = {
  linkedin_lead: 'LinkedIn Lead',
  booking: 'Booking',
  job_opportunity: 'Job Opportunity',
  tech_opportunity: 'Tech Opportunity',
  due_work: 'Due Work',
  upcoming_item: 'Upcoming Item',
};

const parseFrom = (from = '') => {
  const emailMatch = from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = emailMatch?.[0] || '';
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const displayName = from
    .replace(/<[^>]+>/g, '')
    .replace(/["']/g, '')
    .trim();

  return {
    email,
    domain,
    displayName,
  };
};

const titleCase = (value = '') => value
  .split(/[\s.-]+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
  .join(' ');

export const organizationNameFromMessage = (message) => {
  const sender = parseFrom(message.from);
  if (sender.displayName && sender.displayName !== sender.email) return sender.displayName;
  if (!sender.domain) return 'Unknown Organization';

  const root = sender.domain.split('.').slice(0, -1).join(' ') || sender.domain;
  return titleCase(root);
};

const organizationKeyFromMessage = (message) => {
  const sender = parseFrom(message.from);
  if (sender.domain && !PERSONAL_DOMAINS.has(sender.domain)) return sender.domain;
  return sender.email || sender.displayName || message.from || 'unknown';
};

const compareDatesDesc = (a, b) => {
  const aTime = new Date(a.date || 0).getTime();
  const bTime = new Date(b.date || 0).getTime();
  return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
};

const increment = (target, key) => {
  target[key] = (target[key] || 0) + 1;
};

const topCategory = (categoryCounts) => Object.entries(categoryCounts)
  .sort(([, a], [, b]) => b - a)[0]?.[0] || 'general';

const deriveStage = ({ messageCount, opportunityCount, dueCount, upcomingCount }) => {
  if (dueCount > 0) return 'Needs attention';
  if (upcomingCount > 0) return 'Upcoming';
  if (opportunityCount > 1) return 'Active opportunity';
  if (opportunityCount === 1) return 'New opportunity';
  if (messageCount > 2) return 'Engaged';
  return 'Observed';
};

const deriveSuggestedAction = (org) => {
  if (org.dueCount > 0) return 'Review due work or deadline and decide the next step.';
  if (org.upcomingCount > 0) return 'Check upcoming date/time and add it to the calendar if relevant.';
  if (org.categoryCounts.linkedin_lead) return 'Review the LinkedIn lead and reply if it is relevant.';
  if (org.categoryCounts.job_opportunity) return 'Review the role and reply or save as a job lead.';
  if (org.categoryCounts.booking) return 'Review booking details and create a calendar booking if confirmed.';
  if (org.categoryCounts.tech_opportunity) return 'Review whether this tech opportunity is worth following.';
  return 'Review recent messages and decide whether to keep monitoring.';
};

const buildAnalysis = (org) => {
  const top = topCategory(org.categoryCounts);
  const topLabel = CATEGORY_LABELS[top] || 'General';
  const latestSubject = org.messages[0]?.subject || 'No subject';

  return {
    stage: deriveStage(org),
    topCategory: top,
    topCategoryLabel: topLabel,
    suggestedAction: deriveSuggestedAction(org),
    summary: `${org.name} has ${org.messageCount} recent message${org.messageCount === 1 ? '' : 's'}; ${org.opportunityCount} matched opportunity signal${org.opportunityCount === 1 ? '' : 's'}. Latest: ${latestSubject}`,
  };
};

export const buildOrganizationsFromMessages = (messages) => {
  const groups = new Map();

  messages.forEach((message) => {
    const sender = parseFrom(message.from);
    const key = organizationKeyFromMessage(message);
    const classified = classifyLead(message);

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        name: organizationNameFromMessage(message),
        domain: sender.domain,
        contacts: new Set(),
        messageCount: 0,
        opportunityCount: 0,
        dueCount: 0,
        upcomingCount: 0,
        categoryCounts: {},
        latestDate: '',
        latestSubject: '',
        score: 0,
        messages: [],
      });
    }

    const org = groups.get(key);
    if (sender.email) org.contacts.add(sender.email);
    org.messageCount += 1;
    org.messages.push({
      id: message.id,
      threadId: message.threadId,
      from: message.from,
      subject: message.subject,
      date: message.date,
      snippet: message.snippet,
      category: classified?.category || 'general',
      source: classified?.source || 'gmail',
      score: classified?.score || 0,
      extracted: classified?.extracted || {},
    });

    if (classified) {
      org.opportunityCount += 1;
      org.score += classified.score || 0;
      increment(org.categoryCounts, classified.category);
      if (classified.category === 'due_work') org.dueCount += 1;
      if (classified.category === 'upcoming_item') org.upcomingCount += 1;
    } else {
      increment(org.categoryCounts, 'general');
    }
  });

  return [...groups.values()].map((org) => {
    org.messages.sort(compareDatesDesc);
    org.latestDate = org.messages[0]?.date || '';
    org.latestSubject = org.messages[0]?.subject || '';
    org.contacts = [...org.contacts];
    org.analysis = buildAnalysis(org);
    return org;
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.messageCount - a.messageCount;
  });
};

export const buildCrmSummary = (organizations) => ({
  organizationCount: organizations.length,
  opportunityOrganizationCount: organizations.filter((org) => org.opportunityCount > 0).length,
  dueOrganizationCount: organizations.filter((org) => org.dueCount > 0).length,
  upcomingOrganizationCount: organizations.filter((org) => org.upcomingCount > 0).length,
  topOrganizations: organizations.slice(0, 5).map((org) => ({
    id: org.id,
    name: org.name,
    score: org.score,
    stage: org.analysis.stage,
    suggestedAction: org.analysis.suggestedAction,
  })),
});
