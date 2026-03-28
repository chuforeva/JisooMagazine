const Modal = (() => {
  let _pendingDeleteId = null;
  let _addModalInstance = null;
  let _editModalInstance = null;
  let _deleteModalInstance = null;
  let _settingsModalInstance = null;
  const _previewDebounces = new Map();

  function init() {
    _addModalInstance = new bootstrap.Modal(document.getElementById('modal-add'));
    _editModalInstance = new bootstrap.Modal(document.getElementById('modal-edit'));
    _deleteModalInstance = new bootstrap.Modal(document.getElementById('modal-delete'));
    _settingsModalInstance = new bootstrap.Modal(document.getElementById('modal-settings'));

    document.getElementById('form-add').addEventListener('submit', _handleAddSubmit);
    document.getElementById('btn-confirm-delete').addEventListener('click', _handleDeleteConfirm);
    document.getElementById('btn-save-settings').addEventListener('click', _handleSaveSettings);
    document.getElementById('btn-test-connection').addEventListener('click', _handleTestConnection);
    document.getElementById('btn-clear-settings').addEventListener('click', _handleClearSettings);
    document.getElementById('btn-add-image-url').addEventListener('click', _addImageRow);

    document.getElementById('form-edit').addEventListener('submit', _handleEditSubmit);
    document.getElementById('btn-add-edit-image-url').addEventListener('click', _addEditImageRow);

    // 수정 모달 이미지 컨테이너 이벤트 위임
    const editImgContainer = document.getElementById('edit-image-urls-container');
    editImgContainer.addEventListener('input', (e) => {
      const input = e.target.closest('.image-url-input');
      if (!input) return;
      const row = input.closest('.image-url-row');
      clearTimeout(_previewDebounces.get(input));
      const url = input.value.trim();
      if (!url) { _resetRowPreview(row); return; }
      _setRowPreviewStatus(row, 'loading');
      _previewDebounces.set(input, setTimeout(() => _updateRowPreview(row, url), 500));
    });
    editImgContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-remove-image');
      if (!btn) return;
      const rows = editImgContainer.querySelectorAll('.image-url-row');
      if (rows.length <= 1) return;
      btn.closest('.image-url-row').remove();
    });

    // 이미지 컨테이너 이벤트 위임
    const imgContainer = document.getElementById('image-urls-container');
    imgContainer.addEventListener('input', (e) => {
      const input = e.target.closest('.image-url-input');
      if (!input) return;
      const row = input.closest('.image-url-row');
      clearTimeout(_previewDebounces.get(input));
      const url = input.value.trim();
      if (!url) { _resetRowPreview(row); return; }
      _setRowPreviewStatus(row, 'loading');
      _previewDebounces.set(input, setTimeout(() => _updateRowPreview(row, url), 500));
    });

    imgContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-remove-image');
      if (!btn) return;
      const rows = imgContainer.querySelectorAll('.image-url-row');
      if (rows.length <= 1) return; // 최소 1개 유지
      btn.closest('.image-url-row').remove();
    });

    // settings token 보기/숨기기는 app.js에서 처리
  }

  function openAdd() {
    document.getElementById('form-add').reset();
    _resetImageRows();
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
    document.getElementById('settings-token').value = s.token || '';
    document.getElementById('settings-connection-status').textContent = '';
    const isAdmin = Settings.isAdmin();
    document.getElementById('settings-admin-status').classList.toggle('d-none', !isAdmin);
    document.getElementById('btn-clear-settings').classList.toggle('d-none', !isAdmin);
    _settingsModalInstance.show();
  }

  function closeSettings() {
    _settingsModalInstance.hide();
  }

  function openEdit(id) {
    const cover = Data.getById(id);
    if (!cover) return;
    const form = document.getElementById('form-edit');
    form.elements['id'].value = cover.id;
    form.elements['magazine'].value = cover.magazine || '';
    form.elements['year'].value = cover.year || '';
    form.elements['month'].value = cover.month || '';
    form.elements['issueInfo'].value = cover.issueInfo || '';
    form.elements['brand'].value = cover.brand || '';
    form.elements['country'].value = cover.country || '';
    form.elements['memo'].value = cover.memo || '';
    _resetEditImageRows(cover.imageUrls || []);
    _setEditLoading(false);
    _editModalInstance.show();
  }

  async function _handleEditSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('form-edit');
    const formData = Object.fromEntries(new FormData(form));
    const imageUrls = [...document.querySelectorAll('#edit-image-urls-container .image-url-input')]
      .map(el => el.value.trim())
      .filter(Boolean);
    const coverData = { ...formData, imageUrls };
    _setEditLoading(true);
    try {
      await Data.updateCover(formData.id, coverData);
      _editModalInstance.hide();
      App.refresh();
      window.showToast('수정되었습니다.', 'success');
    } catch (err) {
      window.showToast(err.message || '수정 실패. 다시 시도해주세요.', 'danger');
      if (err.status === 409) await App.reloadData();
    } finally {
      _setEditLoading(false);
    }
  }

  async function _handleAddSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('form-add');
    const formData = Object.fromEntries(new FormData(form));
    const imageUrls = [...document.querySelectorAll('#image-urls-container .image-url-input')]
      .map(el => el.value.trim())
      .filter(Boolean);
    const coverData = { ...formData, imageUrls };

    _setAddLoading(true);
    try {
      await Data.addCover(coverData);
      _addModalInstance.hide();
      App.refresh();
      window.showToast('커버가 추가되었습니다.', 'success');
    } catch (err) {
      window.showToast(err.message || '추가 실패. 다시 시도해주세요.', 'danger');
      if (err.status === 409) await App.reloadData();
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
      if (err.status === 409) await App.reloadData();
    } finally {
      btn.disabled = false;
      btn.textContent = '삭제';
      _pendingDeleteId = null;
    }
  }

  function _handleSaveSettings() {
    const token = document.getElementById('settings-token').value.trim();
    if (!token) {
      window.showToast('토큰을 입력해주세요.', 'warning');
      return;
    }
    Settings.save({ token });
    _settingsModalInstance.hide();
    App.refresh();
    window.showToast('관리자 모드로 로그인됐습니다.', 'success');
  }

  async function _handleTestConnection() {
    const token = document.getElementById('settings-token').value.trim();
    const { owner, repo } = Settings.get();
    const statusEl = document.getElementById('settings-connection-status');
    if (!token) {
      statusEl.textContent = '토큰을 먼저 입력해주세요.';
      statusEl.className = 'small text-warning mt-1';
      return;
    }
    if (!owner || !repo) {
      statusEl.textContent = 'settings.js에 owner/repo가 설정되지 않았습니다.';
      statusEl.className = 'small text-danger mt-1';
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
    Settings.logout();
    _settingsModalInstance.hide();
    App.refresh();
    window.showToast('로그아웃됐습니다.', 'warning');
  }

  // --- 이미지 URL 다중 입력 관리 ---

  function _createImageRow() {
    const row = document.createElement('div');
    row.className = 'image-url-row mb-2';
    row.innerHTML = `
      <div class="row g-2 align-items-start">
        <div class="col-12 col-md-7">
          <div class="input-group input-group-sm">
            <input type="url" class="form-control image-url-input" placeholder="https://example.com/cover.jpg">
            <button type="button" class="btn btn-outline-secondary btn-remove-image" title="제거">−</button>
          </div>
          <div class="image-url-status form-text"></div>
        </div>
        <div class="col-12 col-md-5">
          <div class="image-url-preview-wrapper d-none border rounded overflow-hidden" style="aspect-ratio:2/3;max-height:120px;">
            <img class="image-url-preview" src="" alt="미리보기" style="width:100%;height:100%;object-fit:cover;object-position:top;">
          </div>
        </div>
      </div>
    `;
    return row;
  }

  function _addImageRow() {
    document.getElementById('image-urls-container').appendChild(_createImageRow());
  }

  function _resetImageRows() {
    const container = document.getElementById('image-urls-container');
    _previewDebounces.clear();
    container.innerHTML = '';
    container.appendChild(_createImageRow());
  }

  function _resetRowPreview(row) {
    row.querySelector('.image-url-preview-wrapper').classList.add('d-none');
    row.querySelector('.image-url-preview').src = '';
    const status = row.querySelector('.image-url-status');
    status.textContent = '';
    status.className = 'image-url-status form-text';
  }

  function _setRowPreviewStatus(row, state) {
    const status = row.querySelector('.image-url-status');
    const map = {
      loading: ['로드 중...', 'image-url-status form-text text-muted'],
      ok:      ['✓ 확인됨',   'image-url-status form-text text-success'],
      error:   ['불러올 수 없음', 'image-url-status form-text text-danger'],
    };
    if (map[state]) {
      [status.textContent, status.className] = map[state];
    }
  }

  function _updateRowPreview(row, url) {
    const img = row.querySelector('.image-url-preview');
    const wrapper = row.querySelector('.image-url-preview-wrapper');
    img.onload = () => { wrapper.classList.remove('d-none'); _setRowPreviewStatus(row, 'ok'); };
    img.onerror = () => { wrapper.classList.add('d-none'); _setRowPreviewStatus(row, 'error'); };
    img.src = url;
  }

  function _setAddLoading(loading) {
    const btn = document.getElementById('btn-add-submit');
    btn.disabled = loading;
    btn.textContent = loading ? '저장 중...' : '저장';
  }

  function _addEditImageRow() {
    document.getElementById('edit-image-urls-container').appendChild(_createImageRow());
  }

  function _resetEditImageRows(urls) {
    const container = document.getElementById('edit-image-urls-container');
    container.innerHTML = '';
    const list = urls && urls.length > 0 ? urls : [''];
    list.forEach(url => {
      const row = _createImageRow();
      if (url) {
        const input = row.querySelector('.image-url-input');
        input.value = url;
        _setRowPreviewStatus(row, 'loading');
        _previewDebounces.set(input, setTimeout(() => _updateRowPreview(row, url), 200));
      }
      container.appendChild(row);
    });
  }

  function _setEditLoading(loading) {
    const btn = document.getElementById('btn-edit-submit');
    btn.disabled = loading;
    btn.textContent = loading ? '저장 중...' : '저장';
  }

  return { init, openAdd, openDeleteConfirm, openSettings, closeSettings, openEdit };
})();
