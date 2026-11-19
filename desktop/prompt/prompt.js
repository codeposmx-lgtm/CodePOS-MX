'use strict';

(async () => {
  const api = window.codeposPrompt;
  const config = await api.config();
  if (!config) { api.cancel(); return; }
  document.title = config.title;
  document.getElementById('title').textContent = config.title;
  document.getElementById('message').textContent = config.message;
  document.getElementById('confirm').textContent = config.confirm;

  const container = document.getElementById('fields');
  const inputs = config.fields.map((field, index) => {
    const id = `field-${index}`;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = field.label;
    const input = document.createElement('input');
    input.id = id;
    input.type = field.secure ? 'password' : 'text';
    input.placeholder = field.placeholder ?? '';
    input.value = field.initial ?? '';
    input.spellcheck = false;
    container.append(label, input);
    return input;
  });
  inputs[0]?.focus();
  api.resize(document.documentElement.scrollHeight);

  document.getElementById('form').addEventListener('submit', event => {
    event.preventDefault();
    api.submit(inputs.map(input => input.value));
  });
  document.getElementById('cancel').addEventListener('click', () => api.cancel());
  document.addEventListener('keydown', event => { if (event.key === 'Escape') api.cancel(); });
})();
