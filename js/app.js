const App = (() => {
  let _debounceTimer = null;

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
