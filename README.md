# 텍스트 기반 MMO RPG (Next.js)

이 프로젝트는 이미지 없이 **완전한 텍스트 인터랙션**으로 진행되는 확장형 MMO RPG입니다. 모든 게임/콘텐츠/플레이어 데이터는 **서버 내 JSON 파일**로 관리되며, 관리자 대시보드를 통해 실시간으로 편집/검증/백업 가능합니다.

## 핵심 목표
- 무한 성장 (레벨, 스탯, 스킬 트리) 구조
- 실시간 MMO 상호작용: 채팅, 파티, 길드, 거래, PvP, 경매장
- 텍스트 전투 & 스킬/아이템/몬스터 동적 확장
- 파일 기반(데이터베이스 미사용) 고성능 JSON 인덱싱 + 캐싱 구조
- 관리자 실시간 콘텐츠 운영 파이프라인

## 기술 스택
- Framework: Next.js 15 (App Router, Edge-friendly 구조)
- Language: TypeScript 5
- Runtime: Node.js (JSON 파일 기반 I/O)
- UI: React 19 + (향후) TailwindCSS 4 설정 포함
- 상태 및 로직: 커스텀 매니저 & 시스템 계층 (DB 미사용)
- 캐싱: 메모리 기반 LRU + TTL (`DataCache`, `GameDataCache`)
- 원자성 저장: 임시파일 기반 `atomicWrite`

## 디렉토리 개요
```
/data               ← 게임 런타임 JSON 저장소 (players / game / admin)
/src/app            ← Next.js 페이지 (게임 클라이언트 & 관리자 UI)
/src/components     ← 게임 UI 컴포넌트 (PlayerStatus, SkillTree 등)
/src/lib            ← 핵심 도메인/시스템 로직
  admin/            ← 모니터링 & 콘텐츠 매니저
  mmo/              ← 파티, 길드, 채팅, 거래, PvP, 경매
  world/            ← 월드 이벤트, 보스 레이드, 존 시스템
  ...System.ts      ← battle, skill, item, level, stat, caching, indexing
  ...DataManager.ts ← 스킬/몬스터/아이템/이벤트 세부 데이터 핸들러
/src/types          ← 타입 정의 (player, skill, game)
```

## 주요 시스템 구조
| 영역 | 설명 |
|------|------|
| Data Layer | `dataManager` (CRUD, 백업, 원자성 저장, 검색) + 세부 *DataManager* 모듈 |
| Caching Layer | `cachingSystem.ts` (다중 도메인 캐시, LRU, TTL, 통계 리포트) |
| Indexing | `indexingSystem.ts` (대량 JSON 조회 최적화 – 일부 구축, 고도화 예정) |
| Player | 생성/로드/저장/레벨/스탯/인벤토리/온라인 상태 관리 (`playerManager`) |
| Battle | 턴 기반 전투, 기본 공격, 스킬/아이템/도주/보상 계산 (`battleSystem`) |
| Skill | 무한 트리 구조, 효과/요구조건/확률/스케일링 (`skillSystem`) |
| Item | 소비/장비/제작 레시피/경제 밸런스 (`itemSystem`) |
| Level/Stat | 지수 경험치, 파생 스탯 재계산 (`levelSystem`, `statSystem`) |
| MMO | 채팅, 파티, 길드, 거래, 경매장, PvP (`mmo/*`) |
| World | 존, 월드 이벤트, 보스 레이드 (`world/*`, `worldEventSystem`) |
| Admin | 활동/밸런스/리소스 모니터링 + 실시간 콘텐츠 편집 (`admin/*`) |
| Engine | `gameEngine` (틱 루프, 몬스터 AI, 스폰, 월드 이벤트, 전투 상태) |

## 관리자 대시보드 기능
구현됨:
- 스킬/몬스터/아이템/이벤트 JSON 실시간 CRUD
- 카테고리/드롭테이블/스폰/효과/AI/레시피 편집
- 검증 + 백업/복원 + 인덱싱/캐싱
- 활동/밸런스/시스템 리소스 모니터링

부분/예정:
- 아이템 관리 UI 고도화 (미리보기) → 8.4 잔여
- 이벤트 관리 UI 고도화 → 8.5 잔여
- 플레이어 수동 편집 / 제재 / 로그 탐색 → 8.3 잔여

## 현재 진행 상황 (2025-08-18)
- 완료: 123 / 139 (plan.md 기준)
- 현재 포커스: 9.1 데이터 최적화 (대용량 처리 단계 착수)
- 다음: 9.2 UI 성능 최적화, 9.3 확장성 구조

남은 주요 TODO (발췌):
- 대용량 JSON 스트리밍 / 압축 / 백그라운드 동기화 / 인덱스 고도화 / 트랜잭션 무결성
- React 렌더링 최적화 (메모, 가상 스크롤, 지연 로딩, 디바운싱)
- 모듈형 플러그인/동적 로더/멀티 워커
- 테스트 (단위/통합/게임 로직)
- 배포 환경 분리 & 모니터링

## 실행 방법
1. 의존성 설치
```
npm install
```
2. 개발 서버
```
npm run dev
```
3. 빌드 / 실행
```
npm run build
npm start
```
4. Lint
```
npm run lint
```

## API 개요 (일부)
| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/skills` | GET/POST/PUT/DELETE | 스킬 CRUD |
| `/api/skills/categories` | GET/POST | 카테고리 관리 |
| `/api/monsters` | GET/POST/PUT/DELETE | 몬스터 CRUD |
| `/api/monsters/categories` | GET/POST | 몬스터 카테고리 |
| `/api/items` | GET/POST/PUT/DELETE | 아이템 CRUD |
| `/api/items/categories` | GET/POST | 아이템 카테고리 |
| `/api/items/recipes` | GET/POST/PUT/DELETE | 제작 레시피 |
| `/api/events` | GET/POST/PUT/DELETE | 이벤트 CRUD/스케줄 |

> 인증/권한 로직은 향후 보안 레이어 추가 예정.

## 데이터 구조 예시 (요약)
- 플레이어: `/data/players/{id}.json` (info, level, stats, inventory, skills, location, playtime)
- 스킬: `/data/game/skills.json` (효과 배열: damage/heal/buff/debuff, 확률, 스케일링)
- 몬스터: `/data/game/monsters.json` (AI 설정, 드롭테이블, 스폰 정보)
- 아이템: `/data/game/items.json` (타입 consumable/equipment, 효과/레시피)
- 이벤트: `/data/admin/events.json` (스케줄, 상태, 보상)

## 성능 전략
- 메모리 캐시 (TTL + LRU) 다계층 구조
- JSON 인덱싱 (키/카테고리/ID 맵) - 추가 최적화 예정
- 원자적 쓰기 + 백업 버전 체인
- 몬스터/이벤트 처리 틱 기반 (`gameEngine`)
- 확률 및 전투 연산 최소화된 파생 스탯 캐싱

## 전투 시스템 개요
- 기본 공격: 명중/회피/크리티컬 확률 산출
- 스킬: 다중 효과 적용, 확률 발동, 스탯 스케일링
- 아이템: 소비형 회복/버프/마나/레시피
- 도주/방어/턴 관리 + 보상(경험치, 골드, 드롭)

## 확장 가이드
1. 새 도메인 데이터 추가 → `/data/game/*.json` 생성
2. 타입 정의 → `src/types/*`
3. 전용 DataManager / 시스템 모듈 작성 → `src/lib/*System.ts`
4. 캐싱 필요 시 `GameDataCache`에 게터/세터 추가
5. 관리자 UI 페이지 추가 → `src/app/admin/{domain}/page.tsx`

## 향후 테스트 계획
- 플레이어 매니저 CRUD & 레벨업 로직 단위 테스트
- 전투 수치 시뮬레이션 (명중/크리티컬 분포) 통합 테스트
- 스킬/아이템 효과 조합 회귀 테스트

## 기여 방법
1. Issue/기능 제안 작성 (형식: feat:, fix:, perf:, refactor:)
2. 브랜치 생성: `feature/설명` 또는 `fix/이슈번호`
3. PR 시: 변경 요약 + 영향 범위 + 롤백 계획 기재

## 라이선스
사내/개인 학습용 (추후 명시 예정)

## 연락 / 지원
관리자 대시보드 개선 또는 시스템 설계 관련 제안은 Issue로 제출해주세요.

---
본 README는 plan.md 진행 상황을 반영하여 2025-08-18에 갱신되었습니다.
