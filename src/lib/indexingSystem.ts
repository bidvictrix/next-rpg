import fs from 'fs/promises';
import path from 'path';

/**
 * JSON 파일 인덱싱 시스템
 * 대용량 JSON 파일의 빠른 검색을 위한 인덱스 생성 및 관리
 */

interface IndexEntry {
  id: string;
  type: string;
  dataPath: string;
  lastModified: number;
  size: number;
  checksum: string;
}

interface DataIndex {
  skills: Record<string, IndexEntry>;
  monsters: Record<string, IndexEntry>;
  items: Record<string, IndexEntry>;
  events: Record<string, IndexEntry>;
  players: Record<string, IndexEntry>;
}

const INDEX_FILE_PATH = path.join(process.cwd(), 'data/.index.json');

/**
 * 체크섬 계산 함수
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash).toString(16);
}

/**
 * 인덱스 파일 로드
 */
export async function loadIndex(): Promise<DataIndex> {
  try {
    const indexContent = await fs.readFile(INDEX_FILE_PATH, 'utf-8');
    return JSON.parse(indexContent) as DataIndex;
  } catch (error) {
    // 인덱스 파일이 없으면 기본 구조 생성
    const defaultIndex: DataIndex = {
      skills: {},
      monsters: {},
      items: {},
      events: {},
      players: {}
    };
    await saveIndex(defaultIndex);
    return defaultIndex;
  }
}

/**
 * 인덱스 파일 저장
 */
export async function saveIndex(index: DataIndex): Promise<void> {
  try {
    await fs.writeFile(INDEX_FILE_PATH, JSON.stringify(index, null, 2), 'utf-8');
  } catch (error) {
    console.error('인덱스 저장 실패:', error);
    throw new Error('인덱스를 저장할 수 없습니다.');
  }
}

/**
 * 단일 데이터 파일 인덱싱
 */
export async function indexDataFile(
  filePath: string, 
  type: keyof DataIndex, 
  idField: string = 'id'
): Promise<void> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const fileStats = await fs.stat(filePath);
    const data = JSON.parse(fileContent);
    
    const index = await loadIndex();
    const checksum = calculateChecksum(fileContent);
    
    // 데이터 타입에 따른 처리
    let items: Record<string, unknown> = {};
    
    switch (type) {
      case 'skills':
        items = data.skills || {};
        break;
      case 'monsters':
        items = data.monsters || {};
        break;
      case 'items':
        items = data.items || {};
        break;
      case 'events':
        items = data.events || {};
        break;
      case 'players':
        items = data; // 플레이어는 직접 객체
        break;
    }
    
    // 각 항목에 대한 인덱스 엔트리 생성
    for (const [key, item] of Object.entries(items)) {
    const itemRecord = item as Record<string, unknown>;
    const itemId = (itemRecord[idField] as string) || key;
      
      index[type][itemId] = {
        id: itemId,
        type,
        dataPath: filePath,
        lastModified: fileStats.mtime.getTime(),
        size: JSON.stringify(item).length,
        checksum: calculateChecksum(JSON.stringify(item))
      };
    }
    
    await saveIndex(index);
  } catch (error) {
    console.error(`파일 인덱싱 실패 (${filePath}):`, error);
    throw new Error(`파일을 인덱싱할 수 없습니다: ${filePath}`);
  }
}

/**
 * 전체 데이터 디렉토리 인덱싱
 */
export async function indexAllDataFiles(): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // 게임 데이터 파일들 인덱싱
    const gameDataFiles = [
      { path: path.join(dataDir, 'game/skills.json'), type: 'skills' as const },
      { path: path.join(dataDir, 'game/monsters.json'), type: 'monsters' as const },
      { path: path.join(dataDir, 'game/items.json'), type: 'items' as const },
      { path: path.join(dataDir, 'admin/events.json'), type: 'events' as const }
    ];
    
    for (const { path: filePath, type } of gameDataFiles) {
      try {
        await indexDataFile(filePath, type);
      } catch (error) {
        console.warn(`파일 인덱싱 실패 (건너뜀): ${filePath}`, error);
      }
    }
    
    // 플레이어 데이터 파일들 인덱싱
    const playersDir = path.join(dataDir, 'players');
    try {
      const playerFiles = await fs.readdir(playersDir);
      
      for (const playerFile of playerFiles) {
        if (playerFile.endsWith('.json')) {
          const playerPath = path.join(playersDir, playerFile);
          try {
            await indexDataFile(playerPath, 'players');
          } catch (error) {
            console.warn(`플레이어 파일 인덱싱 실패 (건너뜀): ${playerFile}`, error);
          }
        }
      }
    } catch (error) {
      console.warn('플레이어 디렉토리 인덱싱 실패:', error);
    }
    
    console.log('전체 데이터 인덱싱 완료');
  } catch (error) {
    console.error('전체 인덱싱 실패:', error);
    throw new Error('전체 데이터를 인덱싱할 수 없습니다.');
  }
}

/**
 * 인덱스 기반 빠른 검색
 */
export async function searchByIndex(
  type: keyof DataIndex,
  query: {
    id?: string;
    filters?: Record<string, unknown>;
    limit?: number;
    offset?: number;
  }
): Promise<{
  results: IndexEntry[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const index = await loadIndex();
    const typeIndex = index[type];
    
    let results = Object.values(typeIndex);
    
    // ID 필터
    if (query.id) {
      results = results.filter(entry => 
        entry.id.toLowerCase().includes(query.id!.toLowerCase())
      );
    }
    
    // 크기로 정렬 (큰 것부터)
    results.sort((a, b) => b.size - a.size);
    
    const total = results.length;
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    
    const paginatedResults = results.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    return {
      results: paginatedResults,
      total,
      hasMore
    };
  } catch (error) {
    console.error('인덱스 검색 실패:', error);
    return {
      results: [],
      total: 0,
      hasMore: false
    };
  }
}

/**
 * 인덱스 무결성 검사
 */
export async function validateIndex(): Promise<{
  isValid: boolean;
  errors: string[];
  fixable: string[];
}> {
  const errors: string[] = [];
  const fixable: string[] = [];
  
  try {
    const index = await loadIndex();
    
    for (const [type, typeIndex] of Object.entries(index)) {
      for (const [id, entry] of Object.entries(typeIndex)) {
        try {
          // 파일 존재 확인
          const fileStats = await fs.stat(entry.dataPath);
          
          // 수정 시간 확인
          if (fileStats.mtime.getTime() !== entry.lastModified) {
            fixable.push(`${type}/${id}: 파일이 수정됨 - 재인덱싱 필요`);
          }
          
          // 파일 내용 확인
          const fileContent = await fs.readFile(entry.dataPath, 'utf-8');
          const currentChecksum = calculateChecksum(fileContent);
          
          if (currentChecksum !== entry.checksum) {
            fixable.push(`${type}/${id}: 체크섬 불일치 - 재인덱싱 필요`);
          }
        } catch (error) {
          errors.push(`${type}/${id}: 파일 접근 실패 - ${entry.dataPath}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0 && fixable.length === 0,
      errors,
      fixable
    };
  } catch (error) {
    console.error('인덱스 검증 실패:', error);
    return {
      isValid: false,
      errors: ['인덱스 검증 중 오류 발생'],
      fixable: []
    };
  }
}

/**
 * 인덱스 최적화 (중복 제거, 정리)
 */
export async function optimizeIndex(): Promise<void> {
  try {
    const index = await loadIndex();
    let optimized = false;
    
    // 각 타입별로 중복 제거 및 정리
    for (const [type, typeIndex] of Object.entries(index)) {
      const cleanedIndex: Record<string, IndexEntry> = {};
      
      for (const [id, entry] of Object.entries(typeIndex)) {
        // 파일 존재 확인
        try {
          await fs.access(entry.dataPath);
          cleanedIndex[id] = entry;
        } catch (error) {
          console.log(`존재하지 않는 파일 제거: ${entry.dataPath}`);
          optimized = true;
        }
      }
      
    (index as unknown as Record<string, unknown>)[type] = cleanedIndex as unknown as unknown;
    }
    
    if (optimized) {
      await saveIndex(index);
      console.log('인덱스 최적화 완료');
    }
  } catch (error) {
    console.error('인덱스 최적화 실패:', error);
    throw new Error('인덱스를 최적화할 수 없습니다.');
  }
}

/**
 * 인덱스 통계 정보
 */
export async function getIndexStats(): Promise<{
  totalEntries: number;
  byType: Record<string, number>;
  totalSize: number;
  lastUpdated: Date | null;
}> {
  try {
    const index = await loadIndex();
    let totalEntries = 0;
    let totalSize = 0;
    const byType: Record<string, number> = {};
    
    for (const [type, typeIndex] of Object.entries(index)) {
      const count = Object.keys(typeIndex).length;
      byType[type] = count;
      totalEntries += count;
      
      // 크기 계산
      for (const entry of Object.values(typeIndex)) {
        totalSize += entry.size;
      }
    }
    
    // 인덱스 파일의 수정 시간
    let lastUpdated: Date | null = null;
    try {
      const indexStats = await fs.stat(INDEX_FILE_PATH);
      lastUpdated = indexStats.mtime;
    } catch (error) {
      // 인덱스 파일이 없음
    }
    
    return {
      totalEntries,
      byType,
      totalSize,
      lastUpdated
    };
  } catch (error) {
    console.error('인덱스 통계 조회 실패:', error);
    return {
      totalEntries: 0,
      byType: {},
      totalSize: 0,
      lastUpdated: null
    };
  }
}

/**
 * 자동 인덱스 관리 (백그라운드 작업)
 */
export class IndexManager {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  
  /**
   * 자동 인덱싱 시작
   */
  start(intervalMs: number = 300000): void { // 기본 5분
    if (this.isRunning) {
      console.warn('인덱스 매니저가 이미 실행 중입니다.');
      return;
    }
    
    this.isRunning = true;
    
    // 즉시 한 번 실행
    this.runMaintenance();
    
    // 주기적 실행
    this.interval = setInterval(() => {
      this.runMaintenance();
    }, intervalMs);
    
    console.log(`인덱스 매니저 시작 (간격: ${intervalMs}ms)`);
  }
  
  /**
   * 자동 인덱싱 중지
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('인덱스 매니저 중지');
  }
  
  /**
   * 인덱스 유지보수 실행
   */
  private async runMaintenance(): Promise<void> {
    try {
      // 인덱스 검증
      const validation = await validateIndex();
      
      if (validation.fixable.length > 0) {
        console.log('인덱스 재구성 필요, 전체 재인덱싱 시작...');
        await indexAllDataFiles();
      }
      
      // 인덱스 최적화
      await optimizeIndex();
      
    } catch (error) {
      console.error('인덱스 유지보수 실패:', error);
    }
  }
}

// 싱글톤 인덱스 매니저 인스턴스
export const indexManager = new IndexManager();

export { IndexEntry, DataIndex };
