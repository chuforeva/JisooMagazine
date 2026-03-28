const Modal = (() => {
  let _pendingDeleteId = null;
  let _addModalInstance = null;
  let _deleteModalInstance = null;
  let _settingsModalInstance = null;

  function init() {
    _addModalInstance = new bootstrap.Modal(document.getElementById('modal-add'));
    _deleteModalInstance = new bootstrap.Modal(document.getElementById('modal-delete'));
    _settingsModalInstance = new bootstrap.Modal(document.getElementById('modal-settings'), {
      backdrop: 'static',
      keyboard: false
    });

    document.getElementById('form-add').addEventListener('submit', _handleAddSubmit);
    document.getElementById('btn-confirm-delete').addEventListener('click', _handleDeleteConfirm);
    document.getElementById('btn-save-settings').addEventListener('click', _handleSaveSettings);
    document.getElementById('btn-test-connection').addEventListener('click', _handleTestConnection);
    document.getElementById('btn-clear-settings').addEventListener('click', _handleClearSettings);
  }

  function openAdd() {
    document.getElementById('form-add').reset();
    _setAddLoading(false);
    _addModalInstance.show();
  }

  function openDeleteConfirm(id) {
    _pendingDeleteId = id;
    const cover = Data.getById(id);
    const label = cover
      ? `"${cover.magazine} ${cover.year}.${String(cover.month).padStart(2, '0')}"`
      : '이 항목';
    document.getElementById('delete-confirm-text').textContent = `${label}을(를) 삭제하시겠습니까?`;
    _deleteModalInstance.show();
  }

  function openSettings(firstRun = false) {
    const s = Settings.get();
    document.getElementById('settings-owner').value = s.owner || '';
    document.getElementById('settings-repo').value = s.repo || '';
    document.getElementById('settings-token').value = s.token || '';
    document.getElementById('settings-connection-status').textContent = '';
    document.getElementById('settings-onboarding').classList.toggle('d-none', !firstRun);
    _settingsModalInstance.show();
  }

  function closeSettings() {
    _settingsModalInstance.hide();
  }

  async function _handleAddSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('form-add');
    const data = Object.fromEntries(new FormData(form));

    _setAddLoading(true);
    try {
      await Data.addCover(data);
      _addModalInstance.hide();
      App.refresh();
      window.showToast('커버가 추가되었습니다.', 'success');
    } catch (err) {
      window.showToast(err.message || '추가 실패. 다시 시도해주세요.', 'danger');
      if (err.status === 409) {
        await App.reloadData();
      }
    } finally {
      _setAddLoading(false);
    }
  }

  async function _handleDeleteConfirm() {
    if (!_pendingDeleteId) return;
    const btn = document.getElementById('btn-confirm-delete');
    btn.disabled = true;
    btn.textContent = '삭제 중...';
    try {
      await Data.deleteCover(_pendingDeleteId);
      _deleteModalInstance.hide();
      App.refresh();
      window.showToast('삭제되었습니다.', 'success');
    } catch (err) {
      window.showToast(err.message || '삭제 실패. 다시 시도해주세요.', 'danger');
      if (err.status === 409) {
        await App.reloadData();
      }
    } finally {
      btn.disabled = false;
      btn.textContent = '삭제';
      _pendingDeleteId = null;
    }
  }

  function _handleSaveSettings() {
    const token = document.getElementById('settings-token').value.trim();
    const owner = document.getElementById('settings-owner').value.trim();
    const repo = document.getElementById('settings-repo').value.trim();

    if (!token || !owner || !repo) {
      window.showToast('모든 항목을 입력해주세요.', 'warning');
      return;
    }

    Settings.save({ token, owner, repo });
    _settingsModalInstance.hide();
    App.init();
  }

  async function _handleTestConnection() {
    const token = document.getElementById('settings-token').value.trim();
    const owner = document.getElementById('settings-owner').value.trim();
    const repo = document.getElementById('settings-repo').value.trim();
    const statusEl = document.getElementById('settings-connection-status');

    if (!token || !owner || !repo) {
      statusEl.textContent = '모든 항목을 먼저 입력해주세요.';
      statusEl.className = 'small text-warning mt-1';
      return;
    }

    statusEl.textContent = '연결 확인 중...';
    statusEl.className = 'small text-muted mt-1';

    try {
      await GithubApi.getFile(owner, repo, 'data/covers.json', token);
      statusEl.textContent = '연결 성공!';
      statusEl.className = 'small text-success mt-1';
    } catch (err) {
      if (err.status === 404) {
        statusEl.textContent = '연결 성공 (data/covers.json 없음 → 첫 저장 시 자동 생성됩니다)';
        statusEl.className = 'small text-success mt-1';
      } else {
        statusEl.textContent = err.message || '연결 실패';
        statusEl.className = 'small text-danger mt-1';
      }
    }
  }

  function _handleClearSettings() {
    if (!confirm('설정을 초기화하면 GitHub 토큰이 삭제됩니다. 계속하시겠습니까?')) return;
    Settings.clear();
    location.reload();
  }

  function _setAddLoading(loading) {
    const btn = document.getElementById('btn-add-submit');
    btn.disabled = loading;
    btn.textContent = loading ? '저장 중...' : '저장';
  }

  return { init, openAdd, openDeleteConfirm, openSettings, closeSettings };
})();
