const Filters = (() => {
  function _normalize(val) {
    return (val || '').trim().toLowerCase();
  }

  function populateDropdowns(covers) {
    const magazines = [...new Set(covers.map(c => c.magazine).filter(Boolean))].sort();
    const years = [...new Set(covers.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);
    const brands = [...new Set(covers.map(c => c.brand).filter(Boolean))].sort();
    const countries = [...new Set(covers.map(c => c.country).filter(Boolean))].sort();

    _rebuildSelect('filter-magazine', magazines, getActiveFilters().magazine);
    _rebuildSelect('filter-year', years, getActiveFilters().year);
    _rebuildSelect('filter-brand', brands, getActiveFilters().brand);
    _rebuildSelect('filter-country', countries, getActiveFilters().country);
  }

  function _rebuildSelect(id, values, currentVal) {
    const el = document.getElementById(id);
    const placeholder = {
      'filter-magazine': '전체 잡지',
      'filter-year': '전체 연도',
      'filter-brand': '전체 브랜드',
      'filter-country': '전체 국가'
    };
    el.innerHTML = `<option value="">${placeholder[id]}</option>`;
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      if (String(v) === String(currentVal)) opt.selected = true;
      el.appendChild(opt);
    });
  }

  function getActiveFilters() {
    return {
      search: (document.getElementById('search-input')?.value || '').trim(),
      magazine: document.getElementById('filter-magazine')?.value || '',
      year: document.getElementById('filter-year')?.value || '',
      brand: document.getElementById('filter-brand')?.value || '',
      country: document.getElementById('filter-country')?.value || '',
      sortOrder: document.getElementById('sort-order')?.value || 'newest'
    };
  }

  function applyFilters(covers, filters) {
    const { search, magazine, year, brand, country, sortOrder } = filters;
    const result = covers.filter(c => {
      if (magazine && c.magazine !== magazine) return false;
      if (year && String(c.year) !== String(year)) return false;
      if (brand && c.brand !== brand) return false;
      if (country && c.country !== country) return false;
      if (search) {
        const q = _normalize(search);
        const haystack = _normalize(
          [c.magazine, c.issueInfo, c.brand, c.country, c.memo, String(c.year)].join(' ')
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return result.sort((a, b) => {
      const aVal = a.year * 100 + a.month;
      const bVal = b.year * 100 + b.month;
      return sortOrder === 'oldest' ? aVal - bVal : bVal - aVal;
    });
  }

  function clearFilters() {
    const el = (id) => document.getElementById(id);
    el('search-input').value = '';
    el('filter-magazine').value = '';
    el('filter-year').value = '';
    el('filter-brand').value = '';
    el('filter-country').value = '';
    el('sort-order').value = 'newest';
  }

  return { populateDropdowns, getActiveFilters, applyFilters, clearFilters };
})();
