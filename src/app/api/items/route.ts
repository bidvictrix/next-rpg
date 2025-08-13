import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllItems, 
  addItem, 
  updateItem, 
  deleteItem, 
  validateItem,
  createItemsBackup,
  getItemsByType,
  getItemsByRarity,
  getItemsByLevel,
  getItemsByEquipmentSlot,
  getCraftableItems,
  getItemStats,
  adjustItemPrice,
  adjustItemPricesByType
} from '@/lib/itemDataManager';

// GET: 모든 아이템 조회 또는 필터링
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const rarity = searchParams.get('rarity');
    const levelMin = searchParams.get('levelMin');
    const levelMax = searchParams.get('levelMax');
    const equipmentSlot = searchParams.get('equipmentSlot');
    const craftable = searchParams.get('craftable');
    const stats = searchParams.get('stats');
    
    let items;
    
    if (stats === 'true') {
      // 통계 정보 요청
      const itemStats = await getItemStats();
      return NextResponse.json({ 
        success: true, 
        data: itemStats 
      });
    } else if (type) {
      // 타입별 필터링
      items = await getItemsByType(type as import('@/types/game').Item['type']);
    } else if (rarity) {
      // 희소성별 필터링
      items = await getItemsByRarity(rarity as import('@/types/game').Item['rarity']);
    } else if (levelMin && levelMax) {
      // 레벨별 필터링
      items = await getItemsByLevel(parseInt(levelMin), parseInt(levelMax));
    } else if (equipmentSlot) {
      // 장비 슬롯별 필터링
      items = await getItemsByEquipmentSlot(equipmentSlot);
    } else if (craftable === 'true') {
      // 제작 가능한 아이템만
      items = await getCraftableItems();
    } else {
      // 모든 아이템 조회
      items = await getAllItems();
    }
    
    return NextResponse.json({ 
      success: true, 
      data: items 
    });
  } catch (error) {
    console.error('아이템 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '아이템 데이터를 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 아이템 추가
export async function POST(request: NextRequest) {
  try {
    const itemData = await request.json();
    
    // 아이템 데이터 검증
    const validationErrors = validateItem(itemData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 아이템 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createItemsBackup();
    
    // 아이템 추가
    const newItem = {
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await addItem(newItem);
    
    return NextResponse.json({ 
      success: true, 
      data: newItem,
      message: '아이템이 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('아이템 추가 실패:', error);
    return NextResponse.json(
      { success: false, error: '아이템을 추가할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 기존 아이템 수정
export async function PUT(request: NextRequest) {
  try {
    const itemData = await request.json();
    
    // 아이템 데이터 검증
    const validationErrors = validateItem(itemData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 아이템 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createItemsBackup();
    
    // 아이템 수정
    const updatedItem = {
      ...itemData,
      updatedAt: new Date().toISOString()
    };
    
    await updateItem(updatedItem);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedItem,
      message: '아이템이 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('아이템 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '아이템을 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 아이템 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: '아이템 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createItemsBackup();
    
    // 아이템 삭제
    await deleteItem(itemId);
    
    return NextResponse.json({ 
      success: true,
      message: '아이템이 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('아이템 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '아이템을 삭제할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// PATCH: 아이템 가격 조정
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();
    
    // 백업 생성
    await createItemsBackup();
    
    if (action === 'adjustPrice') {
      // 개별 아이템 가격 조정
      const { itemId, newPrice } = body;
      await adjustItemPrice(itemId, newPrice);
      
      return NextResponse.json({ 
        success: true,
        message: '아이템 가격이 성공적으로 조정되었습니다.' 
      });
    } else if (action === 'adjustPricesByType') {
      // 타입별 일괄 가격 조정
      const { type, multiplier } = body;
      await adjustItemPricesByType(type, multiplier);
      
      return NextResponse.json({ 
        success: true,
        message: `${type} 타입 아이템 가격이 일괄 조정되었습니다.` 
      });
    } else {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 액션입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('아이템 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '아이템을 업데이트할 수 없습니다.' },
      { status: 500 }
    );
  }
}
