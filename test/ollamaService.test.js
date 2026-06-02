import test from 'node:test';
import assert from 'node:assert/strict';
import { getOllamaConfig, mergeLlmResultIntoLead } from '../services/ollamaService.js';

test('reports Ollama configuration without exposing the API key', () => {
  const previousKey = process.env.OLLAMA_API_KEY;
  const previousModel = process.env.OLLAMA_MODEL;
  process.env.OLLAMA_API_KEY = 'test-key';
  process.env.OLLAMA_MODEL = 'gpt-oss:20b-cloud';

  const config = getOllamaConfig();
  assert.equal(config.configured, true);
  assert.equal(config.model, 'gpt-oss:20b-cloud');

  if (previousKey === undefined) delete process.env.OLLAMA_API_KEY;
  else process.env.OLLAMA_API_KEY = previousKey;
  if (previousModel === undefined) delete process.env.OLLAMA_MODEL;
  else process.env.OLLAMA_MODEL = previousModel;
});

test('merges Ollama enrichment into an existing lead', () => {
  const lead = {
    category: 'tech_opportunity',
    extracted: {
      customerName: 'Daniel',
      detectedDate: '',
    },
  };
  const merged = mergeLlmResultIntoLead(lead, {
    category: 'job_opportunity',
    priority: 'high',
    summary: 'Backend role from recruiter.',
    suggestedAction: 'Review and reply.',
    confidence: 0.91,
    customerName: '',
    company: 'Acme',
    role: 'Backend Engineer',
    service: '',
    contactEmail: 'jobs@example.com',
    phone: '',
    dueDate: '2026-06-12',
    dueTime: '17:00',
    upcomingDate: '',
    upcomingTime: '',
    missingFields: ['phone'],
  });

  assert.equal(merged.category, 'job_opportunity');
  assert.equal(merged.priority, 'high');
  assert.equal(merged.extracted.email, 'jobs@example.com');
  assert.equal(merged.extracted.role, 'Backend Engineer');
  assert.equal(merged.extracted.dueDate, '2026-06-12');
  assert.deepEqual(merged.extracted.missingFields, ['phone']);
});
