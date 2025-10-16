document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const messageEl = document.getElementById('message');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = (nameEl && 'value' in nameEl ? nameEl.value : '').trim();
    const email = (emailEl && 'value' in emailEl ? emailEl.value : '').trim();
    const message = (messageEl && 'value' in messageEl ? messageEl.value : '').trim();

    if (!name || !email || !message) {
      alert('Please fill out all fields.');
      return;
    }

    alert('Thanks, I got your message!');
    form.reset();
  });
});
