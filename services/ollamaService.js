const DEFAULT_OLLAMA_BASE_URL = 'https://ollama.com/api';
const DEFAULT_OLLAMA_MODEL = 'gpt-oss:20b';

const EXPECTED_JSON_SHAPE = {
  category: 'linkedin_lead | booking | job_opportunity | tech_opportunity | due_work | upcoming_item | ignore',
  priority: 'high | medium | low',
  summary: 'short useful summary',
  suggestedAction: 'next action for the user',
  confidence: 0.0,
  customerName: '',
  company: '',
  role: '',
  service: '',
  contactEmail: '',
  phone: '',
  dueDate: 'YYYY-MM-DD or empty string',
  dueTime: 'HH:MM or empty string',
  upcomingDate: 'YYYY-MM-DD or empty string',
  upcomingTime: 'HH:MM or empty string',
  missingFields: [],
};

const normalizeBaseUrl = (baseUrl) => {
  const trimmed = (baseUrl || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, '');
  if (trimmed.endsWith('/api') || trimmed.endsWith('/v1')) return trimmed;
  if (trimmed === 'https://ollama.com') return `${trimmed}/api`;
  return trimmed;
};

const isOpenAiCompatibleUrl = (baseUrl) => baseUrl.endsWith('/v1');

const buildMessages = (email) => [
  {
    role: 'system',
    content: [
      'You classify Gmail metadata for an opportunity dashboard.',
      'Use only the provided From, Subject, Date, and Snippet fields.',
      'Return only valid JSON. No markdown. No prose.',
      `The JSON object must have this shape: ${JSON.stringify(EXPECTED_JSON_SHAPE)}.`,
      'Dates must be YYYY-MM-DD when explicit or confidently inferable from the email date.',
      'Times must be HH:MM in 24-hour format when explicit.',
      'Use empty strings for unknown string fields.',
      'Use category linkedin_lead for LinkedIn messages, InMail, connection requests, recruiter outreach, and profile lead notifications.',
      'Use category ignore for payment notices, sports/shop promos, newsletters, and unrelated notifications.',
    ].join(' '),
  },
  {
    role: 'user',
    content: JSON.stringify({
      from: email.from || '',
      subject: email.subject || '',
      date: email.date || '',
      snippet: email.snippet || '',
    }),
  },
];

export const getOllamaConfig = () => ({
  configured: Boolean(process.env.OLLAMA_API_KEY),
  apiKey: process.env.OLLAMA_API_KEY,
  baseUrl: normalizeBaseUrl(process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL),
  model: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
});

const parseJsonContent = (content) => {
  if (!content) throw new Error('Ollama returned an empty response.');
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Ollama response did not contain JSON.');
    return JSON.parse(match[0]);
  }
};

const normalizeLlmResult = (result) => ({
  category: result.category || 'ignore',
  priority: result.priority || 'low',
  summary: result.summary || '',
  suggestedAction: result.suggestedAction || '',
  confidence: Number(result.confidence || 0),
  customerName: result.customerName || '',
  company: result.company || '',
  role: result.role || '',
  service: result.service || '',
  contactEmail: result.contactEmail || '',
  phone: result.phone || '',
  dueDate: result.dueDate || '',
  dueTime: result.dueTime || '',
  upcomingDate: result.upcomingDate || '',
  upcomingTime: result.upcomingTime || '',
  missingFields: Array.isArray(result.missingFields) ? result.missingFields : [],
});

export const enrichEmailWithOllama = async (email) => {
  const config = getOllamaConfig();
  if (!config.configured) {
    throw new Error('OLLAMA_API_KEY is not configured.');
  }

  const messages = buildMessages(email);
  const openAiCompatible = isOpenAiCompatibleUrl(config.baseUrl);
  const url = openAiCompatible
    ? `${config.baseUrl}/chat/completions`
    : `${config.baseUrl}/chat`;
  const body = openAiCompatible
    ? {
        model: config.model,
        temperature: 0,
        messages,
      }
    : {
        model: config.model,
        messages,
        stream: false,
        options: {
          temperature: 0,
        },
      };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Ollama request failed with status ${response.status}.`);
  }

  const content = openAiCompatible
    ? payload.choices?.[0]?.message?.content
    : payload.message?.content;
  return normalizeLlmResult(parseJsonContent(content));
};

export const mergeLlmResultIntoLead = (lead, llm) => {
  const extracted = lead.extracted || {};
  return {
    ...lead,
    category: llm.category === 'ignore' ? lead.category : llm.category,
    priority: llm.priority,
    summary: llm.summary,
    suggestedAction: llm.suggestedAction,
    confidence: llm.confidence,
    llmProvider: 'ollama',
    llmModel: getOllamaConfig().model,
    extracted: {
      ...extracted,
      customerName: llm.customerName || extracted.customerName || '',
      email: llm.contactEmail || extracted.email || '',
      phone: llm.phone || extracted.phone || '',
      service: llm.service || llm.role || extracted.service || '',
      company: llm.company || '',
      role: llm.role || '',
      dueDate: llm.dueDate || extracted.dueDate || '',
      dueTime: llm.dueTime || extracted.dueTime || '',
      upcomingDate: llm.upcomingDate || extracted.upcomingDate || '',
      upcomingTime: llm.upcomingTime || extracted.upcomingTime || '',
      detectedDate: llm.dueDate || llm.upcomingDate || extracted.detectedDate || '',
      detectedTime: llm.dueTime || llm.upcomingTime || extracted.detectedTime || '',
      context: llm.dueDate ? 'due' : llm.upcomingDate ? 'upcoming' : extracted.context || '',
      missingFields: llm.missingFields,
    },
  };
};

export const enrichLeadsWithOllama = async (leads, limit = 20) => {
  const slice = leads.slice(0, limit);
  const enriched = await Promise.all(slice.map(async (lead) => {
    try {
      const llm = await enrichEmailWithOllama(lead);
      return mergeLlmResultIntoLead(lead, llm);
    } catch (error) {
      return {
        ...lead,
        llmProvider: 'ollama',
        llmError: error.message,
      };
    }
  }));

  return [
    ...enriched,
    ...leads.slice(limit),
  ];
};
