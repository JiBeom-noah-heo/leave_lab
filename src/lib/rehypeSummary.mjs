// 글 끝 "## 정리" 제목과 그 뒤 내용을 <section class="summary">로 감싼다.
// 글 상세에서 정리 블록을 카드로 보여 주기 위한 것. 마지막 h2가 "정리"일 때만 동작한다.
const text = n => n.type === 'text' ? n.value : (n.children ?? []).map(text).join('');

export default function rehypeSummary() {
  return tree => {
    const kids = tree.children;
    let idx = -1;
    kids.forEach((n, i) => { if (n.type === 'element' && n.tagName === 'h2') idx = i; });
    if (idx < 0 || text(kids[idx]).trim() !== '정리') return;
    const section = { type: 'element', tagName: 'section', properties: { className: ['summary'] }, children: kids.slice(idx) };
    tree.children = [...kids.slice(0, idx), section];
  };
}
