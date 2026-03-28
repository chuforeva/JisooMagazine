const Settings = (() => {
  // =============================================
  // ★ 본인의 GitHub 저장소 정보를 여기에 입력하세요 ★
  const OWNER = 'chuforeva';  // 예: 'your-github-username'
  const REPO  = 'JisooMagazine';  // 예: 'jisoo-magazine'
  // =============================================

  const KEY = 'jisoo-mag-settings';

  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }

  function get() {
    const s = _load();
    return {
      owner: OWNER || s.owner || '',
      repo:  REPO  || s.repo  || '',
      token: s.token || ''
    };
  }

  function save({ token }) {
    const s = _load();
    localStorage.setItem(KEY, JSON.stringify({ ...s, token }));
  }

  function logout() {
    const s = _load();
    delete s.token;
    localStorage.setItem(KEY, JSON.stringify(s));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function isConfigured() {
    const { owner, repo } = get();
    return !!(owner && owner.trim() && repo && repo.trim());
  }

  function isAdmin() {
    return !!get().token;
  }

  return { get, save, logout, clear, isConfigured, isAdmin };
})();
