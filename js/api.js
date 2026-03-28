const BASE_URL = 'https://api.github.com';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function _headers(token) {
  const h = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function _headersWrite(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

function _decodeBase64(str) {
  return decodeURIComponent(escape(atob(str.replace(/\n/g, ''))));
}

function _encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function _errorMessage(status) {
  const messages = {
    401: '토큰이 유효하지 않습니다. Settings에서 PAT를 확인해주세요.',
    403: '이 저장소에 대한 쓰기 권한이 없습니다. 토큰 권한을 확인해주세요.',
    404: '저장소 또는 파일을 찾을 수 없습니다. Settings의 owner/repo를 확인해주세요.',
    409: '파일 충돌이 감지되었습니다. 페이지를 새로고침합니다.',
    422: '잘못된 요청입니다.',
  };
  return messages[status] || `GitHub API 오류 (HTTP ${status})`;
}

const GithubApi = {
  async getFile(owner, repo, path, token) {
    const url = `${BASE_URL}/repos/${owner}/${repo}/contents/${path}`;
    const res = await fetch(url, { headers: _headers(token) });

    if (!res.ok) {
      throw new ApiError(res.status, _errorMessage(res.status));
    }

    const json = await res.json();
    return {
      content: _decodeBase64(json.content),
      sha: json.sha
    };
  },

  async putFile(owner, repo, path, content, sha, token, commitMessage) {
    const url = `${BASE_URL}/repos/${owner}/${repo}/contents/${path}`;
    const body = {
      message: commitMessage || 'Update covers.json via Jisoo Magazine Tracker',
      content: _encodeBase64(content)
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: _headersWrite(token),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new ApiError(res.status, _errorMessage(res.status) + (errText ? ` (${errText})` : ''));
    }

    const json = await res.json();
    return { sha: json.content.sha };
  }
};
