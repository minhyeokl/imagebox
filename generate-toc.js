document.addEventListener('DOMContentLoaded', function () {
  const menuContainer = document.getElementById('menuContainer');
  if (!menuContainer) return;

  // 모든 chapter를 문서 순서대로 찾기
  const chapters = Array.from(document.querySelectorAll('section[data-type="chapter"]'));
  if (chapters.length === 0) return;

  let toc = '<ul>';
  let chapterCounters = {};

  chapters.forEach((chapterSection, chapterIdx) => {
    // chapter 제목 처리
    const chapterH1 = chapterSection.querySelector('div.chapter > h1');
    if (!chapterH1) return;
    
    // sidebar 내부 제목은 제외
    let isInSidebar = false;
    let parent = chapterH1.parentElement;
    while (parent) {
      if (parent.matches && (parent.matches('aside[data-type="sidebar"]') || parent.matches('div.sidebar'))) {
        isInSidebar = true;
        break;
      }
      parent = parent.parentElement;
    }
    if (isInSidebar) return;

    // chapter 번호 추출
    const labelSpan = chapterH1.querySelector('span.label');
    let chapterNumber = '';
    let chapterNumberStr = '';
    if (labelSpan) {
      const match = labelSpan.textContent.match(/Chapter\s+(\d+)/i);
      if (match) {
        chapterNumber = match[1];
        chapterNumberStr = chapterNumber + '. ';
        chapterCounters[chapterNumber] = [];
      }
    }

    // chapter id 부여
    if (!chapterH1.id) {
      chapterH1.id = `chapter-${chapterIdx}`;
    }

    // chapter를 목차에 추가
    if (chapterIdx > 0) toc += '</li>';
    toc += `<li><a href="#${chapterH1.id}">${chapterNumberStr}${chapterH1.textContent}</a>`;

    // 해당 chapter 내의 모든 sect 찾기
    const sects = Array.from(chapterSection.querySelectorAll('section[data-type^="sect"]')).sort((a, b) => {
      const aType = a.getAttribute('data-type');
      const bType = b.getAttribute('data-type');
      const aLevel = parseInt(aType.replace('sect', ''));
      const bLevel = parseInt(bType.replace('sect', ''));
      // 문서 순서대로 정렬
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    if (sects.length > 0) {
      toc += '<ul>';
      let prevSectLevel = 0;

      sects.forEach((sectSection, sectIdx) => {
        const sectType = sectSection.getAttribute('data-type');
        const sectLevel = parseInt(sectType.replace('sect', ''));
        const sectH = sectSection.querySelector(`div.${sectType} > h${sectLevel}`);
        
        if (!sectH) return;

        // sidebar, note, warning, tip 내부 제목은 제외
        let isInSpecial = false;
        let parent = sectH.parentElement;
        while (parent) {
          if (parent.matches && (
            parent.matches('div[data-type="note"]') ||
            parent.matches('div[data-type="warning"]') ||
            parent.matches('div[data-type="tip"]') ||
            parent.matches('aside[data-type="sidebar"]') ||
            parent.matches('div.sidebar')
          )) {
            isInSpecial = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (isInSpecial) return;

        // sect 번호 계산
        let sectNumberStr = '';
        if (chapterNumber && chapterCounters[chapterNumber] !== undefined) {
          let stack = chapterCounters[chapterNumber];
          
          if (stack.length < sectLevel) {
            while (stack.length < sectLevel) stack.push(1);
          } else if (stack.length === sectLevel) {
            stack[sectLevel - 1]++;
          } else {
            stack = stack.slice(0, sectLevel);
            stack[sectLevel - 1]++;
            chapterCounters[chapterNumber] = stack;
          }
          
          sectNumberStr = chapterNumber + '.' + stack.join('.') + '. ';
        }

        // sect id 부여
        if (!sectH.id) {
          sectH.id = `sect-${chapterIdx}-${sectIdx}`;
        }

        // HTML 구조 생성
        if (sectIdx === 0) {
          // 첫 번째 sect
          toc += '<li>';
        } else if (sectLevel > prevSectLevel) {
          toc += '<ul>'.repeat(sectLevel - prevSectLevel) + '<li>';
        } else if (sectLevel < prevSectLevel) {
          toc += '</li>'.repeat(prevSectLevel - sectLevel) + '</ul>'.repeat(prevSectLevel - sectLevel) + '<li>';
        } else {
          toc += '</li><li>';
        }

        toc += `<a href="#${sectH.id}">${sectNumberStr}${sectH.textContent}</a>`;
        prevSectLevel = sectLevel;
      });

      // sect 목록 닫기
      toc += '</li>'.repeat(prevSectLevel > 0 ? prevSectLevel : 1) + '</ul>'.repeat(prevSectLevel > 0 ? prevSectLevel : 1);
    }
  });

  toc += '</li></ul>';

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
