document.addEventListener('DOMContentLoaded', function () {
  const menuContainer = document.getElementById('menuContainer');
  if (!menuContainer) return;

  // 모든 h1~h4 태그 찾기 (h5, h6 제외)
  const headings = Array.from(document.body.querySelectorAll('h1, h2, h3, h4'));
  if (headings.length === 0) return;

  // id 자동 부여
  headings.forEach((heading, idx) => {
    if (!heading.id) {
      heading.id = `heading-auto-${idx}`;
    }
  });

  // 목차 생성
  let toc = '';
  let prevLevel = 0;
  headings.forEach((heading, idx) => {
    const level = parseInt(heading.tagName.substring(1));
    const text = heading.textContent;
    const id = heading.id;

    if (idx === 0) {
      toc += '<ul>';
    } else if (level > prevLevel) {
      toc += '<ul>'.repeat(level - prevLevel);
    } else if (level < prevLevel) {
      toc += '</li>'.repeat(prevLevel - level) + '</ul>'.repeat(prevLevel - level) + '<li>';
    } else {
      toc += '</li><li>';
    }
    toc += `<a href="#${id}">${text}</a>`;
    prevLevel = level;
  });
  toc += '</li></ul>'.repeat(prevLevel > 0 ? prevLevel : 1);

  // Example, Figure, Table 목록 생성 함수 (설명 텍스트 포함)
  function makeList(selector, labelPrefix) {
    const items = Array.from(document.body.querySelectorAll(selector));
    if (items.length === 0) return '';
    let list = `<div class="toc-sublist"><strong>${labelPrefix} 목록</strong><ul>`;
    items.forEach((item, idx) => {
      const labelSpan = item.querySelector('span.label');
      if (!labelSpan) return;
      if (!item.id) item.id = `${labelPrefix.toLowerCase()}-auto-${idx}`;
      // label 뒤 설명 텍스트 추출
      let desc = '';
      let node = labelSpan.nextSibling;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          desc += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          desc += node.textContent;
        }
        node = node.nextSibling;
      }
      list += `<li><a href="#${item.id}">${labelSpan.textContent.trim()}${desc ? ' ' + desc.trim() : ''}</a></li>`;
    });
    list += '</ul></div>';
    return list;
  }

  // Equation 목록 생성 함수 (라벨 없으면 임의 생성)
  function makeEquationList() {
    const items = Array.from(document.body.querySelectorAll('div[data-type="equation"]'));
    if (items.length === 0) return '';
    let list = `<div class="toc-sublist"><strong>Equation 목록</strong><ul>`;
    let eqCount = 1;
    items.forEach((item, idx) => {
      // id 부여
      if (!item.id) item.id = `equation-auto-${idx}`;
      // 라벨 span이 있으면 사용, 없으면 임의 생성
      let label = '';
      const labelSpan = item.querySelector('span.label');
      if (labelSpan) {
        label = labelSpan.textContent.trim();
      } else {
        label = `Equation ${eqCount++}.`;
      }
      // 수식 설명: math 태그의 alttext 속성 일부
      let desc = '';
      const math = item.querySelector('math');
      if (math && math.getAttribute('alttext')) {
        desc = math.getAttribute('alttext').slice(0, 60) + (math.getAttribute('alttext').length > 60 ? '...' : '');
      }
      list += `<li><a href="#${item.id}">${label}${desc ? ' ' + desc : ''}</a></li>`;
    });
    list += '</ul></div>';
    return list;
  }

  // Example: h5 > span.label("Example ...")
  const exampleList = makeList('h5', 'Example');
  // Figure: h6 > span.label("Figure ...")
  const figureList = makeList('h6', 'Figure');
  // Table: caption > span.label("Table ...")
  const tableList = makeList('caption', 'Table');
  // Equation: div[data-type="equation"]
  const equationList = makeEquationList();

  // menuContainer에 삽입 (목차 + 각 목록)
  menuContainer.innerHTML = toc + (exampleList || '') + (figureList || '') + (tableList || '') + (equationList || '');
}); 
