// Set minimum date to today
const dateInput = document.getElementById('date');
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

const form = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const formMessage = document.getElementById('formMessage');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    notes: document.getElementById('notes').value.trim(),
  };

  if (!data.name || !data.email || !data.phone || !data.address || !data.date || !data.time) {
    showMessage('Please fill in all required fields.', 'error');
    return;
  }

  setLoading(true);
  hideMessage();

  try {
    const res = await fetch('/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (result.success) {
      showMessage('Booking confirmed! Check your email for details. We\'ll be in touch shortly.', 'success');
      form.reset();
    } else {
      showMessage(result.message || 'Something went wrong. Please try again.', 'error');
    }
  } catch (err) {
    showMessage('Network error. Please check your connection and try again.', 'error');
  } finally {
    setLoading(false);
  }
});

function setLoading(loading) {
  submitBtn.disabled = loading;
  if (loading) {
    btnText.textContent = 'Sending...';
    btnSpinner.classList.remove('hidden');
  } else {
    btnText.textContent = 'Confirm Booking';
    btnSpinner.classList.add('hidden');
  }
}

function showMessage(msg, type) {
  formMessage.textContent = msg;
  formMessage.className = `form-message ${type}`;
  formMessage.classList.remove('hidden');
  formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessage() {
  formMessage.classList.add('hidden');
}
