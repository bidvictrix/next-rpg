import fs from 'fs/promises';
import path from 'path';
import { GameEvent } from '@/types/game';

interface EventData {
  events: Record<string, GameEvent>;
  eventCategories: Record<string, EventCategory>;
}

interface EventCategory {
  id: string;
  name: string;
  description: string;
  events: string[];
}

const EVENTS_FILE_PATH = path.join(process.cwd(), 'data/admin/events.json');

/**
 * JSON 파일에서 이벤트 데이터를 로드하는 함수
 */
export async function loadEventsData(): Promise<EventData> {
  try {
    const fileContent = await fs.readFile(EVENTS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent) as EventData;
    return data;
  } catch (error) {
    console.error('이벤트 데이터 로드 실패:', error);
    // 파일이 없으면 기본 구조 생성
    const defaultData: EventData = {
      events: {},
      eventCategories: {}
    };
    await saveEventsData(defaultData);
    return defaultData;
  }
}

/**
 * JSON 파일에 이벤트 데이터를 저장하는 함수
 */
export async function saveEventsData(data: EventData): Promise<void> {
  try {
    // 디렉토리 생성
    await fs.mkdir(path.dirname(EVENTS_FILE_PATH), { recursive: true });
    await fs.writeFile(EVENTS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('이벤트 데이터 저장 실패:', error);
    throw new Error('이벤트 데이터를 저장할 수 없습니다.');
  }
}

/**
 * 특정 이벤트를 가져오는 함수
 */
export async function getEvent(eventId: string): Promise<GameEvent | null> {
  try {
    const data = await loadEventsData();
    return data.events[eventId] || null;
  } catch (error) {
    console.error(`이벤트 ${eventId} 조회 실패:`, error);
    return null;
  }
}

/**
 * 모든 이벤트를 배열로 가져오는 함수
 */
export async function getAllEvents(): Promise<GameEvent[]> {
  try {
    const data = await loadEventsData();
    return Object.values(data.events);
  } catch (error) {
    console.error('모든 이벤트 조회 실패:', error);
    return [];
  }
}

/**
 * 새로운 이벤트를 추가하는 함수
 */
export async function addEvent(event: GameEvent): Promise<void> {
  try {
    const data = await loadEventsData();
    data.events[event.id] = event;
    await saveEventsData(data);
  } catch (error) {
    console.error(`이벤트 ${event.id} 추가 실패:`, error);
    throw new Error('이벤트를 추가할 수 없습니다.');
  }
}

/**
 * 기존 이벤트를 수정하는 함수
 */
export async function updateEvent(event: GameEvent): Promise<void> {
  try {
    const data = await loadEventsData();
    if (!data.events[event.id]) {
      throw new Error(`이벤트 ${event.id}가 존재하지 않습니다.`);
    }
    data.events[event.id] = event;
    await saveEventsData(data);
  } catch (error) {
    console.error(`이벤트 ${event.id} 수정 실패:`, error);
    throw new Error('이벤트를 수정할 수 없습니다.');
  }
}

/**
 * 이벤트를 삭제하는 함수
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const data = await loadEventsData();
    if (!data.events[eventId]) {
      throw new Error(`이벤트 ${eventId}가 존재하지 않습니다.`);
    }
    delete data.events[eventId];
    
    // 카테고리에서도 제거
    Object.values(data.eventCategories).forEach(category => {
      category.events = category.events.filter(id => id !== eventId);
    });
    
    await saveEventsData(data);
  } catch (error) {
    console.error(`이벤트 ${eventId} 삭제 실패:`, error);
    throw new Error('이벤트를 삭제할 수 없습니다.');
  }
}

/**
 * 이벤트 카테고리를 가져오는 함수
 */
export async function getEventCategories(): Promise<EventCategory[]> {
  try {
    const data = await loadEventsData();
    return Object.values(data.eventCategories);
  } catch (error) {
    console.error('이벤트 카테고리 조회 실패:', error);
    return [];
  }
}

/**
 * 이벤트 카테고리를 추가/수정하는 함수
 */
export async function updateEventCategory(category: EventCategory): Promise<void> {
  try {
    const data = await loadEventsData();
    data.eventCategories[category.id] = category;
    await saveEventsData(data);
  } catch (error) {
    console.error(`이벤트 카테고리 ${category.id} 수정 실패:`, error);
    throw new Error('이벤트 카테고리를 수정할 수 없습니다.');
  }
}

/**
 * 활성 이벤트 조회 함수
 */
export async function getActiveEvents(): Promise<GameEvent[]> {
  try {
    const events = await getAllEvents();
    const now = new Date();
    
    return events.filter(event => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      return now >= startTime && now <= endTime;
    });
  } catch (error) {
    console.error('활성 이벤트 조회 실패:', error);
    return [];
  }
}

/**
 * 예정된 이벤트 조회 함수
 */
export async function getUpcomingEvents(): Promise<GameEvent[]> {
  try {
    const events = await getAllEvents();
    const now = new Date();
    
    return events.filter(event => {
      const startTime = new Date(event.startTime);
      return now < startTime;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } catch (error) {
    console.error('예정된 이벤트 조회 실패:', error);
    return [];
  }
}

/**
 * 종료된 이벤트 조회 함수
 */
export async function getExpiredEvents(): Promise<GameEvent[]> {
  try {
    const events = await getAllEvents();
    const now = new Date();
    
    return events.filter(event => {
      const endTime = new Date(event.endTime);
      return now > endTime;
    }).sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
  } catch (error) {
    console.error('종료된 이벤트 조회 실패:', error);
    return [];
  }
}

/**
 * 타입별 이벤트 조회 함수
 */
export async function getEventsByType(type: GameEvent['type']): Promise<GameEvent[]> {
  try {
    const events = await getAllEvents();
    return events.filter(event => event.type === type);
  } catch (error) {
    console.error('타입별 이벤트 조회 실패:', error);
    return [];
  }
}

/**
 * 이벤트 데이터 검증 함수
 */
export function validateEvent(event: Partial<GameEvent>): string[] {
  const errors: string[] = [];
  
  if (!event.id || event.id.trim() === '') {
    errors.push('이벤트 ID는 필수입니다.');
  }
  
  if (!event.name || event.name.trim() === '') {
    errors.push('이벤트 이름은 필수입니다.');
  }
  
  if (!event.description || event.description.trim() === '') {
    errors.push('이벤트 설명은 필수입니다.');
  }
  
  if (!event.type || !['exp_boost', 'drop_boost', 'special_spawn', 'pvp', 'raid'].includes(event.type)) {
    errors.push('이벤트 타입은 exp_boost, drop_boost, special_spawn, pvp, raid 중 하나여야 합니다.');
  }
  
  if (!event.startTime) {
    errors.push('이벤트 시작 시간은 필수입니다.');
  }
  
  if (!event.endTime) {
    errors.push('이벤트 종료 시간은 필수입니다.');
  }
  
  if (event.startTime && event.endTime) {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    if (startTime >= endTime) {
      errors.push('이벤트 종료 시간은 시작 시간보다 늦어야 합니다.');
    }
  }
  
  if (!event.duration || event.duration <= 0) {
    errors.push('이벤트 지속 시간은 0보다 커야 합니다.');
  }
  
  if (!event.effects || !Array.isArray(event.effects)) {
    errors.push('이벤트 효과는 배열이어야 합니다.');
  }
  
  return errors;
}

/**
 * 이벤트 스케줄링 헬퍼 함수
 */
export function createEventSchedule(
  startDate: Date,
  duration: number,
  recurring: boolean,
  schedule?: string
): { startTime: string; endTime: string; recurring: boolean; schedule?: string } {
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
  
  return {
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    recurring,
    schedule
  };
}

/**
 * 이벤트 데이터 백업 생성 함수
 */
export async function createEventsBackup(): Promise<string> {
  try {
    const data = await loadEventsData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(process.cwd(), `data/backups/events-backup-${timestamp}.json`);
    
    // 백업 디렉토리 생성
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8');
    return backupPath;
  } catch (error) {
    console.error('이벤트 데이터 백업 실패:', error);
    throw new Error('이벤트 데이터 백업을 생성할 수 없습니다.');
  }
}

/**
 * 이벤트 데이터 복원 함수
 */
export async function restoreEventsFromBackup(backupPath: string): Promise<void> {
  try {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent) as EventData;
    
    // 데이터 검증
    if (!backupData.events || !backupData.eventCategories) {
      throw new Error('유효하지 않은 백업 파일입니다.');
    }
    
    await saveEventsData(backupData);
  } catch (error) {
    console.error('이벤트 데이터 복원 실패:', error);
    throw new Error('이벤트 데이터를 복원할 수 없습니다.');
  }
}

/**
 * 이벤트 통계 정보 가져오기
 */
export async function getEventStats(): Promise<{
  total: number;
  active: number;
  upcoming: number;
  expired: number;
  byType: Record<string, number>;
  totalDuration: number;
}> {
  try {
    const events = await getAllEvents();
    const activeEvents = await getActiveEvents();
    const upcomingEvents = await getUpcomingEvents();
    const expiredEvents = await getExpiredEvents();
    
    const total = events.length;
    const active = activeEvents.length;
    const upcoming = upcomingEvents.length;
    const expired = expiredEvents.length;
    
    const byType: Record<string, number> = {};
    let totalDuration = 0;
    
    events.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
      totalDuration += event.duration;
    });
    
    return {
      total,
      active,
      upcoming,
      expired,
      byType,
      totalDuration
    };
  } catch (error) {
    console.error('이벤트 통계 조회 실패:', error);
    return {
      total: 0,
      active: 0,
      upcoming: 0,
      expired: 0,
      byType: {},
      totalDuration: 0
    };
  }
}

export { EventCategory };
