const Gallery = (() => {
  const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23e9ecef"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%236c757d">No Image</text></svg>';

  function _formatMonth(month) {
    return String(month).padStart(2, '0');
  }

  function _truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }

  function _createCard(cover) {
    const col = document.createElement('div');
    col.className = 'gallery-col';

    const imgSrc = cover.imageUrl || PLACEHOLDER;
    const yearMonth = `${cover.year}.${_formatMonth(cover.month)}`;

    col.innerHTML = `
      <div class="card cover-card h-100">
        <div class="cover-img-wrapper">
          <img
            class="card-img-top cover-img"
            src="${_escapeHtml(imgSrc)}"
            alt="${_escapeHtml(cover.magazine)}"
            onerror="this.src='${PLACEHOLDER}'"
            loading="lazy"
          >
        </div>
        <div class="card-body pb-2">
          <div class="d-flex flex-wrap gap-1 mb-2">
            <span class="badge bg-primary text-truncate" style="max-width:140px" title="${_escapeHtml(cover.magazine)}">${_escapeHtml(cover.magazine)}</span>
            <span class="badge bg-secondary">${_escapeHtml(yearMonth)}</span>
          </div>
          ${cover.issueInfo ? `<p class="card-title fw-semibold mb-1 small">${_escapeHtml(cover.issueInfo)}</p>` : ''}
          ${cover.brand ? `<p class="card-text text-muted small mb-1"><span class="me-1">🏷</span>${_escapeHtml(cover.brand)}</p>` : ''}
          ${cover.memo ? `<p class="card-text small text-secondary">${_escapeHtml(_truncate(cover.memo, 80))}</p>` : ''}
        </div>
        <div class="card-footer bg-transparent border-top-0 text-end pt-0">
          <button
            class="btn btn-sm btn-outline-danger btn-delete"
            data-id="${_escapeHtml(cover.id)}"
            title="삭제"
          >삭제</button>
        </div>
      </div>
    `;
    return col;
  }

  function _escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function render(covers) {
    const container = document.getElementById('gallery-container');
    const emptyState = document.getElementById('empty-state');
    const resultCount = document.getElementById('result-count');

    container.innerHTML = '';

    if (covers.length === 0) {
      emptyState.classList.remove('d-none');
    } else {
      emptyState.classList.add('d-none');
      const fragment = document.createDocumentFragment();
      covers.forEach(cover => fragment.appendChild(_createCard(cover)));
      container.appendChild(fragment);
    }

    const total = Data.getAll().length;
    if (covers.length === total) {
      resultCount.textContent = `총 ${total}개`;
    } else {
      resultCount.textContent = `${covers.length} / ${total}개`;
    }
  }

  // 이벤트 위임: 갤러리 컨테이너에 단일 핸들러
  function init() {
    document.getElementById('gallery-container').addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-delete');
      if (btn) {
        Modal.openDeleteConfirm(btn.dataset.id);
      }
    });
  }

  return { render, init };
})();
