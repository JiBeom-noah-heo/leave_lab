// 계산기 규칙 파일(src/data/rules/*.json)의 공통 형식과 읽기 함수.
//
// 규칙 파일 하나 = 제도 하나. 값은 시행일별 versions에 나눠 두고, 뒤 버전은 바뀐 값만 적는다(앞 버전 위에 덮어쓴다).
// 출처는 sources에 한 번만 적고(직접 열어 확인한 것만, checked = 확인일), 값 묶음마다 sources 배열로 id를 건다.
// 값이 바뀌면: 새 version을 추가하고, asOf·changelog와 public/tools/_registry.json의 asOf를 같은 날짜로 고친다.

export interface Source {
  id: string;
  title: string;
  url: string;
  /** 직접 열어 확인한 날 (YYYY-MM-DD) */
  checked: string;
  note?: string;
}

export interface RuleVersion<V> {
  /** 이 버전이 적용되기 시작하는 날 (YYYY-MM-DD) */
  effectiveFrom: string;
  sources?: string[];
  note?: string;
  /** 첫 버전은 전체 값, 이후 버전은 바뀐 값만 */
  values: Partial<V> | V;
}

export interface RuleFile<V> {
  id: string;
  name: string;
  /** 출처를 마지막으로 확인한 날 */
  asOf: string;
  basisYear: number | null;
  sources: Source[];
  versions: RuleVersion<V>[];
  changelog: { date: string; note: string }[];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 객체는 키별로 합치고, 배열·숫자·문자열·null은 통째로 바꾼다. */
function merge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = k in out ? merge(out[k], v) : v;
  return out as T;
}

/** date(YYYY-MM-DD)에 시행 중인 값. date가 첫 시행일보다 이르면 null. */
export function valuesAt<V>(file: RuleFile<V>, date: string): V | null {
  const sorted = [...file.versions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
  let acc: V | null = null;
  for (const v of sorted) {
    if (v.effectiveFrom > date) break;
    acc = acc === null ? (v.values as V) : merge(acc, v.values);
  }
  return acc;
}

/** 가장 최근 버전까지 합친 값 */
export function latestValues<V>(file: RuleFile<V>): V {
  const last = [...file.versions].map(v => v.effectiveFrom).sort().at(-1)!;
  return valuesAt(file, last)!;
}

export function sourceById(file: RuleFile<unknown>, id: string): Source {
  const s = file.sources.find(x => x.id === id);
  if (!s) throw new Error(`${file.id}: 출처 id '${id}'가 sources에 없습니다`);
  return s;
}
