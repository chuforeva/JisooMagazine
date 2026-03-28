const App = (() => {
  let _debounceTimer = null;
  let _lightboxImages = [];
  let _lightboxIndex = 0;

  async function init() {
    _showLoading(true);

    if (!Settings.isConfigured()) {
      _showLoading(false);
      Modal.openSettings(true);
      return;
    }

    try {
      await Data.loadAll();
      refresh();
    } catch (err) {
      _showLoading(false);
      if (err.status === 401 || err.status === 403) {
        window.showToast(err.message, 'danger');
        Modal.openSettings(false);
      } else {
        window.showToast(err.message || '데이터 로드 실패. 페이지를 새로고침해주세요.', 'danger');
      }
    }
  }

  async function reloadData() {
    try {
      await Data.loadAll();
      refresh();
      window.showToast('데이터를 새로 불러왔습니다.', 'warning');
    } catch (err) {
      window.showToast(err.message || '데이터 재로드 실패.', 'danger');
    }
  }

  function refresh() {
    _showLoading(false);
    const covers = Data.getAll();
    Filters.populateDropdowns(covers);
    const filtered = Filters.applyFilters(covers, Filters.getActiveFilters());
    Gallery.render(filtered);
  }

  function _onFilterChange() {
    const covers = Data.getAll();
    const filtered = Filters.applyFilters(covers, Filters.getActiveFilters());
    Gallery.render(filtered);
  }

  function _onSearchInput() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(_onFilterChange, 300);
  }

  function _showLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('d-none', !show);
  }

  function _openLightbox(imgs, startIndex) {
    _lightboxImages = imgs;
    _lightboxIndex = startIndex;
    _updateLightboxImage();
    document.getElementById('lightbox').classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }

  function _updateLightboxImage() {
    document.getElementById('lightbox-img').src = _lightboxImages[_lightboxIndex];
    const hasManyImgs = _lightboxImages.length > 1;
    document.getElementById('lightbox-prev').classList.toggle('d-none', !hasManyImgs);
    document.getElementById('lightbox-next').classList.toggle('d-none', !hasManyImgs);
  }

  function _closeLightbox() {
    document.getElementById('lightbox').classList.add('d-none');
    document.getElementById('lightbox-img').src = '';
    document.body.style.overflow = '';
    _lightboxImages = [];
    _lightboxIndex = 0;
  }

  function _wireEvents() {
    document.getElementById('btn-open-add').addEventListener('click', () => Modal.openAdd());
    document.getElementById('btn-open-settings').addEventListener('click', () => Modal.openSettings(false));
    document.getElementById('btn-clear-filters').addEventListener('click', () => {
      Filters.clearFilters();
      _onFilterChange();
    });

    document.getElementById('search-input').addEventListener('input', _onSearchInput);
    document.getElementById('filter-magazine').addEventListener('change', _onFilterChange);
    document.getElementById('filter-year').addEventListener('change', _onFilterChange);
    document.getElementById('filter-brand').addEventListener('change', _onFilterChange);
    document.getElementById('filter-country').addEventListener('change', _onFilterChange);
    document.getElementById('sort-order').addEventListener('change', _onFilterChange);

    // token 표시/숨기기
    document.getElementById('btn-toggle-token').addEventListener('click', () => {
      const input = document.getElementById('settings-token');
      const btn = document.getElementById('btn-toggle-token');
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '숨기기';
      } else {
        input.type = 'password';
        btn.textContent = '보기';
      }
    });

    // Lightbox
    document.getElementById('gallery-container').addEventListener('click', (e) => {
      const img = e.target.closest('.cover-img');
      if (!img || img.src.startsWith('data:')) return;
      const card = img.closest('.cover-card');
      const allImgs = [...card.querySelectorAll('.cover-img')]
        .map(i => i.src)
        .filter(src => src && !src.startsWith('data:'));
      const startIndex = Math.max(0, allImgs.indexOf(img.src));
      _openLightbox(allImgs, startIndex);
    });
    document.getElementById('lightbox-close').addEventListener('click', _closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      _lightboxIndex = (_lightboxIndex - 1 + _lightboxImages.length) % _lightboxImages.length;
      _updateLightboxImage();
    });
    document.getElementById('lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      _lightboxIndex = (_lightboxIndex + 1) % _lightboxImages.length;
      _updateLightboxImage();
    });
    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') _closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (document.getElementById('lightbox').classList.contains('d-none')) return;
      if (e.key === 'Escape') _closeLightbox();
      if (e.key === 'ArrowLeft') {
        _lightboxIndex = (_lightboxIndex - 1 + _lightboxImages.length) % _lightboxImages.length;
        _updateLightboxImage();
      }
      if (e.key === 'ArrowRight') {
        _lightboxIndex = (_lightboxIndex + 1) % _lightboxImages.length;
        _updateLightboxImage();
      }
    });
  }

  function _bootstrap() {
    Gallery.init();
    Modal.init();
    _wireEvents();
    window.showToast = showToast;
    init();
  }

  function showToast(message, type = 'success') {
    const toastEl = document.getElementById('app-toast');
    const toastMsg = document.getElementById('toast-message');
    toastMsg.textContent = message;
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
    toast.show();
  }

  document.addEventListener('DOMContentLoaded', _bootstrap);

  return { init, refresh, reloadData, showToast };
})();
