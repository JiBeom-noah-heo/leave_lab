"""blog_bot 발행 어댑터: 정적 사이트(Astro) 저장소에 markdown을 쓰고 git push한다.

기존 WordPress/Ghost 발행 단계를 이 모듈의 publish()로 교체한다.
push가 곧 배포(Cloudflare Pages가 main 브랜치를 빌드).

환경변수
  LEAVE_LAB_REPO    로컬 클론 경로 (필수)
  LEAVE_LAB_BRANCH  기본 main
  LEAVE_LAB_NO_PUSH 1이면 커밋까지만 (로컬 확인용)
"""
from __future__ import annotations

import os
import re
import subprocess
import unicodedata
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Literal

Lang = Literal["ko", "th"]
Series = Literal["검증일지", "실험로그", "가이드"]
Verdict = Literal["GO", "NO-GO", "HOLD"]


@dataclass
class Source:
    title: str
    url: str


@dataclass
class Post:
    title: str
    description: str          # 20~160자. 검색 결과 스니펫
    body_md: str              # frontmatter 제외 본문
    lang: Lang = "ko"
    series: Series = "실험로그"
    date: date = field(default_factory=date.today)
    tags: list[str] = field(default_factory=list)
    sources: list[Source] = field(default_factory=list)
    verdict: Verdict | None = None
    slug: str | None = None   # 없으면 제목에서 생성
    draft: bool = False


class PublishError(RuntimeError):
    pass


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).strip().lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text[:80].strip("-") or "post"


def _yaml_str(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def render_frontmatter(p: Post) -> str:
    if not (20 <= len(p.description) <= 160):
        raise PublishError("description은 20~160자")
    if p.series == "검증일지" and (not p.verdict or not p.sources):
        raise PublishError("검증일지는 verdict와 sources가 필수")
    lines = [
        "---",
        f"title: {_yaml_str(p.title)}",
        f"description: {_yaml_str(p.description)}",
        f"date: {p.date.isoformat()}",
        f"lang: {p.lang}",
        f"series: {p.series}",
    ]
    if p.verdict:
        lines.append(f"verdict: {p.verdict}")
    lines.append("tags: [" + ", ".join(_yaml_str(t) for t in p.tags) + "]")
    if p.sources:
        lines.append("sources:")
        for s in p.sources:
            lines.append(f"  - {{ title: {_yaml_str(s.title)}, url: {_yaml_str(s.url)} }}")
    else:
        lines.append("sources: []")
    lines.append(f"draft: {'true' if p.draft else 'false'}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


def _git(repo: Path, *args: str) -> str:
    r = subprocess.run(["git", *args], cwd=repo, capture_output=True, text=True)
    if r.returncode != 0:
        raise PublishError(f"git {' '.join(args)} 실패: {r.stderr.strip()}")
    return r.stdout


def publish(post: Post) -> Path:
    """markdown 파일을 쓰고 커밋·푸시한다. 성공 시 파일 경로 반환.

    실패해도 파일은 남긴다(재시도 가능). 같은 slug가 있으면 덮어쓴다(수정 발행).
    """
    repo = Path(os.environ.get("LEAVE_LAB_REPO", "")).expanduser()
    if not repo.is_dir() or not (repo / ".git").exists():
        raise PublishError("LEAVE_LAB_REPO가 git 저장소가 아닙니다")
    branch = os.environ.get("LEAVE_LAB_BRANCH", "main")

    slug = post.slug or _slugify(post.title)
    rel = Path("src/content/log") / post.lang / f"{post.date.isoformat()}-{slug}.md"
    target = repo / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(render_frontmatter(post) + post.body_md.strip() + "\n", encoding="utf-8")

    _git(repo, "checkout", branch)
    _git(repo, "pull", "--ff-only", "origin", branch)
    _git(repo, "add", str(rel))
    status = _git(repo, "status", "--porcelain", str(rel))
    if not status.strip():
        return target  # 변경 없음
    _git(repo, "commit", "-m", f"post({post.lang}): {post.title}")
    if os.environ.get("LEAVE_LAB_NO_PUSH") != "1":
        _git(repo, "push", "origin", branch)
    return target


if __name__ == "__main__":
    # 로컬 확인: LEAVE_LAB_REPO=~/leave-lab LEAVE_LAB_NO_PUSH=1 python static_site.py
    demo = Post(
        title="발행 어댑터 동작 확인",
        description="blog_bot에서 정적 사이트로 발행되는지 확인하는 테스트 글입니다. 발행 후 삭제합니다.",
        body_md="## 확인\n\n이 글이 보이면 어댑터가 동작합니다.",
        series="실험로그",
        tags=["테스트"],
        draft=True,
    )
    print(publish(demo))
