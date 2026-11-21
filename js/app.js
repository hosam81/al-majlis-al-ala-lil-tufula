/* ==========================================================================
   المجلس الأعلى للطفولة — Interactive 3D & Media Scripts
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  init3DEmblemScene();
  initArchiveTracker();
  initDocumentForm();
  initNarrationControls();
  initReunionAudioControls();
});

/* Interactive 3D Emblem & Orbital Particles Canvas (No external CDN required) */
function init3DEmblemScene() {
  const canvas = document.getElementById('council3DCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.offsetWidth || 480;
  let height = canvas.height = canvas.offsetHeight || 330;

  let angleY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;

  const nodes = [];
  const count = 42;
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const phi = Math.acos(2 * ((i * 0.6180339) % 1) - 1);
    nodes.push({
      theta,
      phi,
      radius: 95 + (i % 3) * 14,
      color: i % 3 === 0 ? '#f5b700' : (i % 3 === 1 ? '#4ecdc4' : '#ffffff'),
      size: i % 4 === 0 ? 4.2 : 2.8
    });
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetTiltY = nx * 0.8;
    targetTiltX = ny * 0.6;
  });

  canvas.addEventListener('mouseleave', () => {
    targetTiltX = 0;
    targetTiltY = 0;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2 - 12;

    // Soft radial aura
    const grad = ctx.createRadialGradient(cx, cy, 15, cx, cy, 150);
    grad.addColorStop(0, 'rgba(78, 205, 196, 0.25)');
    grad.addColorStop(0.6, 'rgba(245, 183, 0, 0.08)');
    grad.addColorStop(1, 'rgba(11, 44, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.fill();

    angleY += 0.012;
    const rotY = angleY + targetTiltY;
    const rotX = targetTiltX;

    const projected = nodes.map(n => {
      const x0 = n.radius * Math.sin(n.phi) * Math.cos(n.theta + rotY);
      const y0 = n.radius * Math.cos(n.phi);
      const z0 = n.radius * Math.sin(n.phi) * Math.sin(n.theta + rotY);

      const y1 = y0 * Math.cos(rotX) - z0 * Math.sin(rotX);
      const z1 = y0 * Math.sin(rotX) + z0 * Math.cos(rotX);

      const scale = 320 / (320 + z1);
      return {
        x: cx + x0 * scale,
        y: cy + y1 * scale,
        z: z1,
        scale,
        color: n.color,
        size: n.size * scale
      };
    });

    projected.sort((a, b) => b.z - a.z);

    // Draw connecting lattice lines
    ctx.lineWidth = 0.8;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const dx = projected[i].x - projected[j].x;
        const dy = projected[i].y - projected[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 62) {
          ctx.strokeStyle = `rgba(205, 229, 247, ${(1 - dist / 62) * 0.28})`;
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw 3D orbital nodes
    projected.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Core 3D Emblem Ring & Typography
    ctx.strokeStyle = 'rgba(245, 183, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 22, Math.sin(angleY * 0.5) * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Cairo, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('المجلس الأعلى للطفولة', cx, height - 34);
    ctx.fillStyle = '#ffd56b';
    ctx.font = '600 13px Cairo, Arial, sans-serif';
    ctx.fillText('طرابلس — ليبيا', cx, height - 14);

    requestAnimationFrame(render);
  }
  render();
}

const DEFAULT_RECORDS = [
  {
    code: 'HCC-TRP-2026-0104',
    subject: 'تنسيق المراسلات الإدارية ومتابعة الأرشيف المؤسسي',
    entity: 'رئاسة المجلس — طرابلس (بالتنسيق مع أ. أحمد الكوافي)',
    date: '2026-11-12',
    status: 'قيد المتابعة'
  },
  {
    code: 'HCC-TRP-2026-0118',
    subject: 'إعداد وإخراج الفيلم الوثائقي التعريفي لأنشطة الطفولة',
    entity: 'إدارة الإعلام والتوثيق الرقمي',
    date: '2026-11-16',
    status: 'معتمد'
  },
  {
    code: 'HCC-TRP-2026-0129',
    subject: 'تحديث البوابة الرقمية وتبويب لم شمل الليبيين والأرشيف',
    entity: 'المكتب الفني وتكنولوجيا المعلومات',
    date: '2026-11-21',
    status: 'معتمد'
  }
];

function getRecords() {
  try {
    const saved = localStorage.getItem('hcc_libya_records_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_RECORDS.slice();
}

function saveRecords(records) {
  try {
    localStorage.setItem('hcc_libya_records_v1', JSON.stringify(records));
  } catch (e) {}
}

function renderRecords(filterText = '') {
  const tbody = document.getElementById('archiveTableBody');
  if (!tbody) return;
  const q = filterText.trim().toLowerCase();
  const records = getRecords().filter(item =>
    !q ||
    item.code.toLowerCase().includes(q) ||
    item.subject.toLowerCase().includes(q) ||
    item.entity.toLowerCase().includes(q) ||
    item.status.toLowerCase().includes(q)
  );
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">لا توجد سجلات مطابقة لمعيار البحث الحالي.</td></tr>';
    return;
  }
  tbody.innerHTML = records.map(r => {
    const statusClass = r.status === 'معتمد' ? 'status-active' : 'status-review';
    return `
      <tr>
        <td><strong>${escapeHtml(r.code)}</strong></td>
        <td>${escapeHtml(r.subject)}</td>
        <td>${escapeHtml(r.entity)}</td>
        <td>${escapeHtml(r.date)}</td>
        <td><span class="status-pill ${statusClass}">${escapeHtml(r.status)}</span></td>
      </tr>
    `;
  }).join('');
}

function initArchiveTracker() {
  renderRecords();
  const searchInput = document.getElementById('archiveSearch');
  if (searchInput) searchInput.addEventListener('input', (e) => renderRecords(e.target.value));
  const addForm = document.getElementById('addArchiveForm');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('recCode').value.trim();
      const subject = document.getElementById('recSubject').value.trim();
      const entity = document.getElementById('recEntity').value.trim();
      const date = document.getElementById('recDate').value || new Date().toISOString().slice(0, 10);
      const status = document.getElementById('recStatus').value;
      if (!code || !subject || !entity) return;
      const records = getRecords();
      records.unshift({ code, subject, entity, date, status });
      saveRecords(records);
      renderRecords(searchInput ? searchInput.value : '');
      addForm.reset();
      showAlert('archiveAlert', 'تم تسجيل المعاملة وحفظها بنجاح في سجل الأرشيف.');
    });
  }
}

function initDocumentForm() {
  const form = document.getElementById('correspondenceForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const sender = document.getElementById('senderName').value.trim();
    const refNo = document.getElementById('refNumber').value.trim();
    const topic = document.getElementById('correspondenceTopic').value.trim();
    const notes = document.getElementById('correspondenceNotes').value.trim();
    if (!sender || !topic) return;
    const previewBox = document.getElementById('correspondencePreview');
    if (previewBox) {
      previewBox.style.display = 'block';
      previewBox.innerHTML = `
        <h4 style="color:#0f3d5e; margin-bottom:8px;">مسودة مذكرة مراسلة جاهزة للطباعة أو الاعتماد</h4>
        <p><strong>الجهة / المرسل:</strong> ${escapeHtml(sender)}</p>
        <p><strong>رقم الإشارة / القيد:</strong> ${escapeHtml(refNo || 'يُحدد عند القيد الرسمي')}</p>
        <p><strong>الموضوع:</strong> ${escapeHtml(topic)}</p>
        <p><strong>التفاصيل والبيانات:</strong> ${escapeHtml(notes || 'مرفق ضمن السجل الإداري.')}</p>
        <button type="button" class="btn btn-primary" style="margin-top:12px;" onclick="window.print()">طباعة المذكرة</button>
      `;
    }
    showAlert('formAlert', 'تم تجهيز مسودة المراسلة بنجاح ويمكنك طباعتها أو نسخ بياناتها.');
  });
}

function initNarrationControls() {
  const readBtn = document.getElementById('readNarrationBtn');
  const stopBtn = document.getElementById('stopNarrationBtn');
  const scriptEl = document.getElementById('fullDocumentaryScript');
  if (!readBtn || !scriptEl || !('speechSynthesis' in window)) return;
  readBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptEl.innerText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  });
  if (stopBtn) stopBtn.addEventListener('click', () => window.speechSynthesis.cancel());
}

function initReunionAudioControls() {
  const playClipBtn = document.getElementById('playReunionClipBtn');
  const stopClipBtn = document.getElementById('stopReunionClipBtn');
  const audioEl = document.getElementById('reunionAudioPlayer');
  const sourceInput = document.getElementById('reunionDirectAudioUrl');
  const applySourceBtn = document.getElementById('applyReunionAudioBtn');
  const filePicker = document.getElementById('reunionLocalFile');

  if (filePicker && audioEl) {
    filePicker.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const objUrl = URL.createObjectURL(file);
      audioEl.src = objUrl;
      audioEl.load();
      audioEl.play().catch(() => {});
      showAlert('reunionAlert', 'تم تحميل وتشغيل ملف الصوت المختار من جهازك مباشرة: ' + file.name);
    });
  }

  if (playClipBtn && audioEl) {
    playClipBtn.addEventListener('click', () => {
      audioEl.play().catch(() => {
        showAlert('reunionAlert', 'اختر ملف الأغنية من جهازك أو ضع ملف lam-al-shaml.mp3 داخل مجلد assets/audio/ لتشغيله مباشرة.');
      });
    });
  }
  if (stopClipBtn && audioEl) {
    stopClipBtn.addEventListener('click', () => {
      audioEl.pause();
      audioEl.currentTime = 0;
    });
  }
  if (applySourceBtn && audioEl && sourceInput) {
    applySourceBtn.addEventListener('click', () => {
      const url = sourceInput.value.trim();
      if (!url) return;
      audioEl.src = url;
      localStorage.setItem('hcc_reunion_audio_url', url);
      audioEl.load();
      showAlert('reunionAlert', 'تم تعيين مصدر المقطع الصوتي في مشغل لم شمل الليبيين.');
    });
    const savedAudio = localStorage.getItem('hcc_reunion_audio_url');
    if (savedAudio) {
      sourceInput.value = savedAudio;
      audioEl.src = savedAudio;
    }
  }
}

function showAlert(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.style.display = 'block';
  el.style.background = '#e4f5ee';
  el.style.color = '#115e49';
  el.style.border = '1px solid #9adbc3';
  el.style.padding = '12px 16px';
  el.style.borderRadius = '8px';
  el.style.marginTop = '12px';
  el.style.fontWeight = '700';
  el.textContent = message;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}