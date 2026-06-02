import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCrmSummary,
  buildOrganizationsFromMessages,
  organizationNameFromMessage,
} from '../services/crmService.js';

test('groups messages by organization domain and analyzes opportunities', () => {
  const organizations = buildOrganizationsFromMessages([
    {
      id: '1',
      from: 'Microsoft <replyto@email.microsoft.com>',
      subject: 'Post-Build AI cloud sessions',
      date: 'Tue, 02 Jun 2026 09:00:00 +0000',
      snippet: 'Join our cloud and AI engineering webinar tomorrow at 14:00.',
    },
    {
      id: '2',
      from: 'Microsoft Events <events@email.microsoft.com>',
      subject: 'Reminder: Azure session',
      date: 'Tue, 02 Jun 2026 10:00:00 +0000',
      snippet: 'The meeting is scheduled tomorrow.',
    },
    {
      id: '3',
      from: 'Recruiter <jobs@example.com>',
      subject: 'Backend engineer interview',
      date: 'Tue, 02 Jun 2026 11:00:00 +0000',
      snippet: 'We are hiring a backend engineer. Interview tomorrow at 10am.',
    },
  ]);

  assert.equal(organizations.length, 2);
  assert.equal(organizations[0].opportunityCount > 0, true);

  const microsoft = organizations.find((org) => org.domain === 'email.microsoft.com');
  assert.equal(microsoft.messageCount, 2);
  assert.equal(microsoft.contacts.length, 2);
  assert.equal(microsoft.analysis.stage, 'Upcoming');
});

test('builds CRM summary from organizations', () => {
  const organizations = buildOrganizationsFromMessages([
    {
      id: '1',
      from: 'Course <course@example.com>',
      subject: 'Assignment deadline',
      date: 'Tue, 02 Jun 2026 09:00:00 +0000',
      snippet: 'Submit by 12 June at 5pm.',
    },
  ]);

  const summary = buildCrmSummary(organizations);
  assert.equal(summary.organizationCount, 1);
  assert.equal(summary.dueOrganizationCount, 1);
  assert.equal(summary.topOrganizations[0].stage, 'Needs attention');
});

test('derives organization name from display name or domain', () => {
  assert.equal(organizationNameFromMessage({
    from: 'OpenAI <noreply@tm.openai.com>',
  }), 'OpenAI');

  assert.equal(organizationNameFromMessage({
    from: 'noreply@example.org',
  }), 'Example');
});
