import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllEvents, 
  addEvent, 
  updateEvent, 
  deleteEvent, 
  validateEvent,
  createEventsBackup,
  getActiveEvents,
  getUpcomingEvents,
  getExpiredEvents,
  getEventsByType,
  getEventStats
} from '@/lib/eventDataManager';

// GET: 모든 이벤트 조회 또는 필터링
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const stats = searchParams.get('stats');
    
    let events;
    
    if (stats === 'true') {
      // 통계 정보 요청
      const eventStats = await getEventStats();
      return NextResponse.json({ 
        success: true, 
        data: eventStats 
      });
    } else if (status === 'active') {
      // 활성 이벤트 조회
      events = await getActiveEvents();
    } else if (status === 'upcoming') {
      // 예정된 이벤트 조회
      events = await getUpcomingEvents();
    } else if (status === 'expired') {
      // 종료된 이벤트 조회
      events = await getExpiredEvents();
    } else if (type) {
      // 타입별 필터링
      // GameEvent['type']로 단언하여 정확한 타입 전달
      events = await getEventsByType(type as import('@/types/game').GameEvent['type']);
    } else {
      // 모든 이벤트 조회
      events = await getAllEvents();
    }
    
    return NextResponse.json({ 
      success: true, 
      data: events 
    });
  } catch (error) {
    console.error('이벤트 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '이벤트 데이터를 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 이벤트 추가
export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    // 이벤트 데이터 검증
    const validationErrors = validateEvent(eventData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 이벤트 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createEventsBackup();
    
    // 이벤트 추가
    const newEvent = {
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await addEvent(newEvent);
    
    return NextResponse.json({ 
      success: true, 
      data: newEvent,
      message: '이벤트가 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('이벤트 추가 실패:', error);
    return NextResponse.json(
      { success: false, error: '이벤트를 추가할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 기존 이벤트 수정
export async function PUT(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    // 이벤트 데이터 검증
    const validationErrors = validateEvent(eventData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 이벤트 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createEventsBackup();
    
    // 이벤트 수정
    const updatedEvent = {
      ...eventData,
      updatedAt: new Date().toISOString()
    };
    
    await updateEvent(updatedEvent);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedEvent,
      message: '이벤트가 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('이벤트 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '이벤트를 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 이벤트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json(
        { success: false, error: '이벤트 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createEventsBackup();
    
    // 이벤트 삭제
    await deleteEvent(eventId);
    
    return NextResponse.json({ 
      success: true,
      message: '이벤트가 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('이벤트 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '이벤트를 삭제할 수 없습니다.' },
      { status: 500 }
    );
  }
}
