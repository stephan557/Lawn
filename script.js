// Set minimum date to today
const dateInput = document.getElementById('date');
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

const form = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const formMessage = document.getElementById('formMessage');

const formTitle = document.getElementById('formTitle');
const formSub = document.getElementById('formSub');
const photoGroup = document.getElementById('photoGroup');
const photosInput = document.getElementById('photos');
const photoPreview = document.getElementById('photoPreview');

const typeRadios = document.querySelectorAll('input[name="requestType"]');

// ----- Type toggle: switch UI between Booking and Quotation
function getType() {
  const selected = document.querySelector('input[name="requestType"]:checked');
  return selected ? selected.value : 'booking';
}

function applyType() {
  const type = getType();
  if (type === 'quotation') {
    formTitle.textContent = 'Request a Quotation';
    formSub.textContent = 'Send your details and photos — we\'ll quote within 24 hours.';
    btnText.textContent = 'Confirm Quotation';
    photoGroup.classList.remove('hidden');
  } else {
    formTitle.textContent = 'Book an Appointment';
    formSub.textContent = 'Pick your preferred date and time — we\'ll confirm via email.';
    btnText.textContent = 'Confirm Booking';
    photoGroup.classList.add('hidden');
    // Clear any selected photos when switching back
    photosInput.value = '';
    photoPreview.innerHTML = '';
  }
  // Update visual selection on the option cards
  document.querySelectorAll('.rt-option').forEach((opt) => {
    const radio = opt.querySelector('input[type="radio"]');
    opt.classList.toggle('selected', radio.checked);
  });
}

typeRadios.forEach((r) => r.addEventListener('change', applyType));
applyType();

// ----- Photo preview thumbnails
photosInput.addEventListener('change', () => {
  photoPreview.innerHTML = '';
  const files = Array.from(photosInput.files || []).slice(0, 5);
  files.forEach((file) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';
    thumb.innerHTML = `<img src="${url}" alt="${file.name}" />`;
    photoPreview.appendChild(thumb);
  });
});

// ----- Submit handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const type = getType();
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
    const fd = new FormData();
    fd.append('requestType', type);
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    if (type === 'quotation') {
      Array.from(photosInput.files || []).slice(0, 5).forEach((f) => fd.append('photos', f));
    }

    const res = await fetch('/book', { method: 'POST', body: fd });
    const result = await res.json();

    if (result.success) {
      showMessage(result.message || 'Submitted successfully!', 'success');
      form.reset();
      photoPreview.innerHTML = '';
      applyType();
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
    btnText.textContent = getType() === 'quotation' ? 'Confirm Quotation' : 'Confirm Booking';
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
