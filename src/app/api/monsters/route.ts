import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllMonsters, 
  addMonster, 
  updateMonster, 
  deleteMonster, 
  validateMonster,
  createMonstersBackup,
  getMonstersByLevel,
  getMonstersByType,
  getMonstersByArea,
  getMonsterStats
} from '@/lib/monsterDataManager';

// GET: 모든 몬스터 조회 또는 필터링
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const levelMin = searchParams.get('levelMin');
    const levelMax = searchParams.get('levelMax');
    const type = searchParams.get('type');
    const area = searchParams.get('area');
    const stats = searchParams.get('stats');
    
    let monsters;
    
    if (stats === 'true') {
      // 통계 정보 요청
      const monsterStats = await getMonsterStats();
      return NextResponse.json({ 
        success: true, 
        data: monsterStats 
      });
    } else if (levelMin && levelMax) {
      // 레벨별 필터링
      monsters = await getMonstersByLevel(parseInt(levelMin), parseInt(levelMax));
    } else if (type) {
      // 타입별 필터링
      monsters = await getMonstersByType(type as any);
    } else if (area) {
      // 지역별 필터링
      monsters = await getMonstersByArea(area);
    } else {
      // 모든 몬스터 조회
      monsters = await getAllMonsters();
    }
    
    return NextResponse.json({ 
      success: true, 
      data: monsters 
    });
  } catch (error) {
    console.error('몬스터 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '몬스터 데이터를 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 몬스터 추가
export async function POST(request: NextRequest) {
  try {
    const monsterData = await request.json();
    
    // 몬스터 데이터 검증
    const validationErrors = validateMonster(monsterData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 몬스터 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createMonstersBackup();
    
    // 몬스터 추가
    const newMonster = {
      ...monsterData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      killCount: 0
    };
    
    await addMonster(newMonster);
    
    return NextResponse.json({ 
      success: true, 
      data: newMonster,
      message: '몬스터가 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('몬스터 추가 실패:', error);
    return NextResponse.json(
      { success: false, error: '몬스터를 추가할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 기존 몬스터 수정
export async function PUT(request: NextRequest) {
  try {
    const monsterData = await request.json();
    
    // 몬스터 데이터 검증
    const validationErrors = validateMonster(monsterData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 몬스터 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createMonstersBackup();
    
    // 몬스터 수정
    const updatedMonster = {
      ...monsterData,
      updatedAt: new Date().toISOString()
    };
    
    await updateMonster(updatedMonster);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedMonster,
      message: '몬스터가 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('몬스터 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '몬스터를 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 몬스터 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monsterId = searchParams.get('id');
    
    if (!monsterId) {
      return NextResponse.json(
        { success: false, error: '몬스터 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createMonstersBackup();
    
    // 몬스터 삭제
    await deleteMonster(monsterId);
    
    return NextResponse.json({ 
      success: true,
      message: '몬스터가 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('몬스터 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '몬스터를 삭제할 수 없습니다.' },
      { status: 500 }
    );
  }
}
