const Gallery = (() => {
  const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'><rect width='300' height='400' fill='%2328282e'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%23666'>No Image</text></svg>";

  function _formatMonth(month) {
    return String(month).padStart(2, '0');
  }

  function _truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
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

  function _getImageUrls(cover) {
    if (cover.imageUrls && cover.imageUrls.length > 0) return cover.imageUrls;
    if (cover.imageUrl) return [cover.imageUrl]; // 구버전 호환
    return [];
  }

  function _buildImageHtml(cover) {
    const urls = _getImageUrls(cover);
    const alt = _escapeHtml(cover.magazine);
    const carId = `car-${_escapeHtml(cover.id)}`;

    if (urls.length === 0) {
      return `<img class="cover-img" src="${PLACEHOLDER}" alt="${alt}" loading="lazy">`;
    }

    if (urls.length === 1) {
      return `<img class="cover-img" src="${_escapeHtml(urls[0])}" alt="${alt}" onerror="this.src='${PLACEHOLDER}'" loading="lazy">`;
    }

    // 다중 이미지 → carousel
    const items = urls.map((url, i) => `
      <div class="carousel-item${i === 0 ? ' active' : ''}">
        <img class="cover-img" src="${_escapeHtml(url)}" alt="${alt} ${i + 1}" onerror="this.src='${PLACEHOLDER}'" loading="lazy">
      </div>
    `).join('');

    return `
      <div id="${carId}" class="carousel slide" data-bs-ride="false" data-bs-wrap="true">
        <div class="carousel-inner">${items}</div>
        <button class="carousel-control-prev" type="button" data-bs-target="#${carId}" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#${carId}" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
        </button>
      </div>
      <span class="img-count-badge">${urls.length}장</span>
    `;
  }

  function _createCard(cover) {
    const col = document.createElement('div');
    col.className = 'gallery-col';
    const yearMonth = `${cover.year}.${_formatMonth(cover.month)}`;

    col.innerHTML = `
      <div class="card cover-card h-100">
        <div class="cover-img-wrapper">
          ${_buildImageHtml(cover)}
        </div>
        <div class="card-body p-2 pt-3">
          <div class="d-flex flex-wrap gap-1 mb-2">
            <span class="badge bg-primary text-truncate" style="max-width:140px" title="${_escapeHtml(cover.magazine)}">${_escapeHtml(cover.magazine)}</span>
            ${cover.country ? `<span class="badge bg-light text-dark border">${_escapeHtml(cover.country)}</span>` : ''}
            <span class="badge bg-secondary">${_escapeHtml(yearMonth)}</span>
          </div>
          ${cover.issueInfo ? `<p class="card-title fw-semibold mb-1 small">${_escapeHtml(cover.issueInfo)}</p>` : ''}
          ${cover.brand ? `<p class="card-text text-muted small mb-1"><i class="bi bi-tag me-1"></i>${_escapeHtml(cover.brand)}</p>` : ''}
          ${cover.memo ? `<p class="card-text small text-secondary">${_escapeHtml(_truncate(cover.memo, 80))}</p>` : ''}
        </div>
        ${Settings.isAdmin() ? `
        <div class="card-footer bg-transparent border-top-0 px-2 pb-2 d-flex gap-1 justify-content-end">
          <button class="btn btn-sm btn-outline-secondary btn-edit" data-id="${_escapeHtml(cover.id)}" title="수정"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${_escapeHtml(cover.id)}" title="삭제"><i class="bi bi-trash"></i></button>
        </div>` : ''}
      </div>
    `;
    return col;
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
    resultCount.textContent = covers.length === total
      ? `총 ${total}개`
      : `${covers.length} / ${total}개`;
  }

  function init() {
    document.getElementById('gallery-container').addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete');
      if (deleteBtn) { Modal.openDeleteConfirm(deleteBtn.dataset.id); return; }
      const editBtn = e.target.closest('.btn-edit');
      if (editBtn) Modal.openEdit(editBtn.dataset.id);
    });
  }

  return { render, init };
})();
