const STORAGE_KEY = 'jisoo-mag-settings';

const Settings = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  save(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  },

  get() {
    return this.load();
  },

  isConfigured() {
    const { token, owner, repo } = this.load();
    return !!(token && token.trim() && owner && owner.trim() && repo && repo.trim());
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
