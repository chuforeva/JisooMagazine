const DATA_FILE_PATH = 'data/covers.json';

const Data = (() => {
  let _covers = [];
  let _fileSha = null;

  async function loadAll() {
    const { token, owner, repo } = Settings.get();
    try {
      const { content, sha } = await GithubApi.getFile(owner, repo, DATA_FILE_PATH, token);
      const parsed = JSON.parse(content);
      _covers = parsed.covers || [];
      _fileSha = sha;
      return _covers;
    } catch (err) {
      if (err.status === 404) {
        _covers = [];
        _fileSha = null;
        return _covers;
      }
      throw err;
    }
  }

  async function addCover(coverData) {
    const newCover = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      magazine: coverData.magazine || '',
      year: parseInt(coverData.year, 10),
      month: parseInt(coverData.month, 10),
      issueInfo: coverData.issueInfo || '',
      brand: coverData.brand || '',
      imageUrl: coverData.imageUrl || '',
      memo: coverData.memo || ''
    };
    _covers.push(newCover);
    await _persist(`Add cover: ${newCover.magazine} ${newCover.year}.${String(newCover.month).padStart(2, '0')}`);
    return newCover;
  }

  async function deleteCover(id) {
    const cover = _covers.find(c => c.id === id);
    _covers = _covers.filter(c => c.id !== id);
    const label = cover ? `${cover.magazine} ${cover.year}.${String(cover.month).padStart(2, '0')}` : id;
    await _persist(`Delete cover: ${label}`);
  }

  function getAll() {
    return [..._covers];
  }

  function getById(id) {
    return _covers.find(c => c.id === id) || null;
  }

  async function _persist(commitMessage) {
    const { token, owner, repo } = Settings.get();
    const payload = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      covers: _covers
    };
    const content = JSON.stringify(payload, null, 2);
    const result = await GithubApi.putFile(owner, repo, DATA_FILE_PATH, content, _fileSha, token, commitMessage);
    _fileSha = result.sha;
  }

  return { loadAll, addCover, deleteCover, getAll, getById };
})();
