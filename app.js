const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menu.textContent = open ? '×' : '☰';
  nav.classList.toggle('open', open);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.click(); menu.focus();
  }
});
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), {threshold: .08});
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(1000px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}
const filterButtons = [...document.querySelectorAll('[data-filter]')];
function filterLands(filter, updateUrl = true) {
  if (!filterButtons.some(button => button.dataset.filter === filter)) filter = 'all';
  let count = 0;
  document.querySelectorAll('[data-category]').forEach(card => {
    card.hidden = filter !== 'all' && card.dataset.category !== filter;
    if (!card.hidden) count++;
  });
  filterButtons.forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('.results').textContent = `Showing ${filter === 'all' ? 'all ' : ''}${count} land ${count === 1 ? 'type' : 'types'}`;
  if (updateUrl && location.protocol !== 'file:') {
    const url = new URL(location.href);
    if (filter === 'all') url.searchParams.delete('type'); else url.searchParams.set('type', filter);
    history.replaceState(null, '', url);
  }
}
filterButtons.forEach(button => button.addEventListener('click', () => filterLands(button.dataset.filter)));
if (filterButtons.length) filterLands(new URLSearchParams(location.search).get('type') || 'all', false);
const form = document.querySelector('#enquiry-form');
let enquiryText = '';
if (form) {
  const requested = new URLSearchParams(location.search).get('service');
  if ([...form.elements.service.options].some(option => option.value === requested)) form.elements.service.value = requested;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    enquiryText = `Hello Vihar Earth,\n\nI would like to discuss ${data.get('service')}.\n\nName: ${data.get('name')}\nPhone: ${data.get('phone')}\nEmail: ${data.get('email')}\nPreferred location: ${data.get('location') || 'Open to suggestions'}\n\n${data.get('message')}\n\nI consent to being contacted about this enquiry.`;
    const uri = `mailto:bhansaris@gmail.com?subject=${encodeURIComponent('Vihar Earth enquiry — ' + data.get('service'))}&body=${encodeURIComponent(enquiryText)}`;
    const status = document.querySelector('#form-status');
    status.hidden = false;
    status.textContent = 'Your enquiry is prepared. Send it from your email app to complete your enquiry. If no email app opens, copy the text and email bhansaris@gmail.com.';
    const fallback = document.querySelector('#email-fallback');
    fallback.href = uri; fallback.hidden = false;
    document.querySelector('#copy-enquiry').hidden = false;
    location.href = uri;
  });
  document.querySelector('#copy-enquiry').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(enquiryText);
      document.querySelector('#form-status').textContent = 'Enquiry copied. Paste it into an email to bhansaris@gmail.com and send when ready.';
    } catch {
      const area = document.createElement('textarea');
      area.value = enquiryText; area.readOnly = true; area.setAttribute('aria-label', 'Prepared enquiry — select and copy');
      document.querySelector('#form-status').replaceChildren(area); area.select();
    }
  });
}
