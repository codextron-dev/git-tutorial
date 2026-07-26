(function () {
  'use strict';
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* no-op */ }
    document.body.removeChild(ta);
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {
        fallbackCopy(text);
        return true;
      }
    }
    fallbackCopy(text);
    return true;
  }

  document.querySelectorAll('.code-block').forEach((block) => {
    const btn = block.querySelector('.copy-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const text = block.getAttribute('data-copy-text') || block.querySelector('code').textContent;
      await copyText(text);
      btn.classList.add('is-copied');
      showToast('Copied to clipboard');
      setTimeout(() => btn.classList.remove('is-copied'), 1600);
    });
  });

  /* ============================================
     TABS (download step)
     ============================================ */
  document.querySelectorAll('[data-tabs]').forEach((tabGroup) => {
    const buttons = tabGroup.querySelectorAll('.tab-btn');
    const panels = tabGroup.querySelectorAll('.tab-panel');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
        panels.forEach((p) => p.classList.toggle('is-active', p.getAttribute('data-panel') === target));
      });
    });
  });

  /* ============================================
     REMOTE URL BUILDER (step 08)
     ============================================ */
  const repoInput = document.getElementById('repoUrl');
  const remoteBlock = document.getElementById('remoteBlock');
  const remoteCode = document.getElementById('remoteCode');
  const DEFAULT_URL = 'https://github.com/username/repo.git';

  function updateRemoteCommand() {
    const raw = repoInput.value.trim();
    const url = raw.length ? raw : DEFAULT_URL;
    const command = 'git remote add origin ' + url;
    remoteBlock.setAttribute('data-copy-text', command);

    remoteCode.innerHTML = '';
    remoteCode.append('git remote add origin ');
    const span = document.createElement('span');
    if (!raw.length) span.className = 'placeholder-text';
    span.textContent = url;
    remoteCode.appendChild(span);
  }

  if (repoInput) {
    repoInput.addEventListener('input', updateRemoteCommand);
    updateRemoteCommand();
  }

  /* ============================================
     HERO TERMINAL — TYPING ANIMATION
     ============================================ */
  const typingEl = document.getElementById('heroTyping');

  const script = [
    { type: 'cmd', text: 'git init' },
    { type: 'out', text: 'Initialized empty Git repository in ~/my-project/.git/' },
    { type: 'cmd', text: 'git add .' },
    { type: 'cmd', text: 'git commit -m "Initial Commit"' },
    { type: 'out', text: '3 files changed, 128 insertions(+)' },
    { type: 'cmd', text: 'git branch -M main' },
    { type: 'cmd', text: 'git remote add origin https://github.com/you/my-project.git' },
    { type: 'cmd', text: 'git push -u origin main' },
    { type: 'out', text: 'Branch \'main\' set up to track \'origin/main\'.' }
  ];

  function buildLine(kind, text) {
    const row = document.createElement('div');
    if (kind === 'cmd') {
      row.innerHTML = '<span class="line-prompt">$ </span><span class="line-cmd"></span>';
    } else {
      row.innerHTML = '<span class="line-out"></span>';
    }
    typingEl.appendChild(row);
    return row.querySelector('span:last-child');
  }

  async function typeInto(el, text, speed) {
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await sleep(speed);
    }
  }

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function runHeroAnimation() {
    if (!typingEl) return;
    const caret = document.createElement('span');
    caret.className = 'caret';
    typingEl.appendChild(caret);

    while (true) {
      for (const step of script) {
        caret.remove();
        const target = buildLine(step.type, step.text);
        if (step.type === 'cmd') {
          await typeInto(target, step.text, 32);
        } else {
          target.textContent = step.text;
        }
        typingEl.appendChild(caret);
        typingEl.scrollTop = typingEl.scrollHeight;
        await sleep(step.type === 'cmd' ? 260 : 420);
      }
      await sleep(1400);
      typingEl.innerHTML = '';
      typingEl.appendChild(caret);
      await sleep(500);
    }
  }

  /* ============================================
     LOADING BAR CLEANUP
     ============================================ */
  const loadingBar = document.getElementById('loadingBar');
  if (loadingBar) {
    setTimeout(() => loadingBar.remove(), 1000);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typingEl) {
    if (reduceMotion) {
      script.forEach((s) => {
        const target = buildLine(s.type, s.text);
        target.textContent = s.text;
      });
    } else {
      runHeroAnimation();
    }
  }

  /* ============================================
     SCROLL-SPY PROGRESS RAIL
     ============================================ */
  const railDots = document.getElementById('railDots');
  const stepEls = Array.from(document.querySelectorAll('.step'));

  stepEls.forEach((step) => {
    const dot = document.createElement('li');
    dot.setAttribute('data-target', step.id);
    dot.setAttribute('title', step.querySelector('h2').textContent);
    dot.addEventListener('click', () => {
      document.getElementById(step.id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    railDots.appendChild(dot);
  });

  const dotEls = Array.from(railDots.children);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          dotEls.forEach((d) => d.classList.toggle('is-active', d.getAttribute('data-target') === id));
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  stepEls.forEach((step) => observer.observe(step));

})();
