const DATA_FILE_PATH = 'data/covers.json';

const Data = (() => {
  let _covers = [];
  let _fileSha = null;

  async function loadAll() {
    const { token, owner, repo } = Settings.get();
    try {
      const { content, sha } = await GithubApi.getFile(owner, repo, DATA_FILE_PATH, token);
      const parsed = JSON.parse(content);
      // 구버전 imageUrl(string) → imageUrls(array) 마이그레이션
      _covers = (parsed.covers || []).map(c => {
        if (!c.imageUrls) {
          return { ...c, imageUrls: c.imageUrl ? [c.imageUrl] : [] };
        }
        return c;
      });
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
      country: coverData.country || '',
      imageUrls: Array.isArray(coverData.imageUrls) ? coverData.imageUrls.filter(Boolean) : [],
      memo: coverData.memo || ''
    };
    _covers.push(newCover);
    await _persist(`Add cover: ${newCover.magazine} ${newCover.year}.${String(newCover.month).padStart(2, '0')}`);
    return newCover;
  }

  async function updateCover(id, coverData) {
    const idx = _covers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('커버를 찾을 수 없습니다.');
    _covers[idx] = {
      ..._covers[idx],
      magazine: coverData.magazine || '',
      year: parseInt(coverData.year, 10),
      month: parseInt(coverData.month, 10),
      issueInfo: coverData.issueInfo || '',
      brand: coverData.brand || '',
      country: coverData.country || '',
      imageUrls: Array.isArray(coverData.imageUrls) ? coverData.imageUrls.filter(Boolean) : [],
      memo: coverData.memo || ''
    };
    const c = _covers[idx];
    await _persist(`Update cover: ${c.magazine} ${c.year}.${String(c.month).padStart(2, '0')}`);
    return _covers[idx];
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

  return { loadAll, addCover, updateCover, deleteCover, getAll, getById };
})();
