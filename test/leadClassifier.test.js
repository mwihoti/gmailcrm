import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLead, classifyLeads, extractLeadDetails } from '../services/leadClassifier.js';

test('classifies likely booking emails and extracts review hints', () => {
  const lead = classifyLead({
    id: 'msg_1',
    threadId: 'thread_1',
    from: 'Jane Smith <jane@example.com>',
    subject: 'Safari consultation booking',
    snippet: 'Can we book a consultation on 2026-06-03 at 9am? Call +254 712 345 678.',
    date: 'Tue, 02 Jun 2026 09:00:00 +0300',
  });

  assert.equal(lead.emailId, 'msg_1');
  assert.equal(lead.extracted.customerName, 'Jane Smith');
  assert.equal(lead.extracted.email, 'jane@example.com');
  assert.equal(lead.extracted.requestedDate, '2026-06-03');
  assert.equal(lead.extracted.requestedTime, '09:00');
  assert.equal(lead.extracted.service, 'booking');
  assert.ok(lead.score > 3);
});

test('ignores unrelated emails', () => {
  assert.equal(classifyLead({
    id: 'msg_2',
    subject: 'Newsletter',
    snippet: 'Weekly product updates',
  }), null);
});

test('does not match short tech terms inside unrelated words', () => {
  const promoEmail = {
    id: 'promo_1',
    from: 'Shop <promo@example.com>',
    subject: 'Daniel, Ride yako mpya iko tayari',
    snippet: 'A promo from 2008 2019 with no standalone technology topic.',
  };

  assert.equal(classifyLead(promoEmail), null);
  assert.equal(extractLeadDetails(promoEmail).phone, '');

  assert.equal(classifyLead({
    id: 'promo_2',
    subject: 'Can’t Tame Us. Introducing the 26/27 Home Kit.',
    snippet: 'Football kit announcement with no standalone technology topic.',
  }), null);
});

test('classifies job opportunity emails', () => {
  const lead = classifyLead({
    id: 'job_1',
    from: 'Recruiter <jobs@example.com>',
    subject: 'Remote software engineer role',
    snippet: 'We are hiring a backend developer. Are you open to an interview?',
  });

  assert.equal(lead.category, 'job_opportunity');
  assert.ok(lead.matchedKeywords.includes('software engineer'));
  assert.ok(lead.score >= 7);
});

test('classifies tech opportunity emails', () => {
  const lead = classifyLead({
    id: 'tech_1',
    from: 'Community <hello@example.com>',
    subject: 'AI hackathon for developer community',
    snippet: 'Join a startup-focused cloud and open source event.',
  });

  assert.equal(lead.category, 'tech_opportunity');
  assert.ok(lead.matchedKeywords.includes('hackathon'));
});

test('classifies due work and extracts due timing', () => {
  const lead = classifyLead({
    id: 'due_1',
    from: 'Course <course@example.com>',
    subject: 'Assignment due date',
    snippet: 'Please submit by 12 June at 5pm.',
    date: 'Tue, 02 Jun 2026 09:00:00 +0300',
  });

  assert.equal(lead.category, 'due_work');
  assert.equal(lead.extracted.detectedDate, '2026-06-12');
  assert.equal(lead.extracted.detectedTime, '17:00');
  assert.equal(lead.extracted.dueDate, '2026-06-12');
  assert.equal(lead.extracted.dueTime, '17:00');
});

test('classifies upcoming items and extracts relative timing', () => {
  const lead = classifyLead({
    id: 'upcoming_1',
    from: 'Events <events@example.com>',
    subject: 'Upcoming AI webinar',
    snippet: 'The webinar is scheduled tomorrow at 14:30.',
    date: 'Tue, 02 Jun 2026 09:00:00 +0300',
  });

  assert.equal(lead.category, 'upcoming_item');
  assert.equal(lead.extracted.detectedDate, '2026-06-03');
  assert.equal(lead.extracted.detectedTime, '14:30');
  assert.equal(lead.extracted.upcomingDate, '2026-06-03');
});

test('sorts leads by score descending', () => {
  const leads = classifyLeads([
    { id: 'low', subject: 'service', snippet: 'Need service' },
    { id: 'high', subject: 'appointment booking', snippet: '2026-06-03 14:00 phone +254700000000' },
  ]);

  assert.equal(leads[0].emailId, 'high');
});

test('extracts sender names without angle-bracket emails', () => {
  const extracted = extractLeadDetails({
    from: '"John Doe" <john@example.com>',
    subject: 'quote',
    snippet: '',
  });

  assert.equal(extracted.customerName, 'John Doe');
});
