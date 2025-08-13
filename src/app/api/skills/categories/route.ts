import { NextRequest, NextResponse } from 'next/server';
import { 
  getSkillCategories, 
  updateSkillCategory, 
  createSkillsBackup 
} from '@/lib/skillDataManager';

// GET: 모든 스킬 카테고리 조회
export async function GET() {
  try {
    const categories = await getSkillCategories();
    return NextResponse.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    console.error('스킬 카테고리 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '스킬 카테고리 데이터를 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 스킬 카테고리 추가 또는 수정
export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json();
    
    // 카테고리 데이터 검증
    if (!categoryData.id || !categoryData.name) {
      return NextResponse.json(
        { 
          success: false, 
          error: '카테고리 ID와 이름은 필수입니다.' 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createSkillsBackup();
    
    // 카테고리 추가/수정
    await updateSkillCategory(categoryData);
    
    return NextResponse.json({ 
      success: true, 
      data: categoryData,
      message: '스킬 카테고리가 성공적으로 저장되었습니다.' 
    });
  } catch (error) {
    console.error('스킬 카테고리 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: '스킬 카테고리를 저장할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 기존 스킬 카테고리 수정
export async function PUT(request: NextRequest) {
  try {
    const categoryData = await request.json();
    
    // 카테고리 데이터 검증
    if (!categoryData.id || !categoryData.name) {
      return NextResponse.json(
        { 
          success: false, 
          error: '카테고리 ID와 이름은 필수입니다.' 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createSkillsBackup();
    
    // 카테고리 수정
    await updateSkillCategory(categoryData);
    
    return NextResponse.json({ 
      success: true, 
      data: categoryData,
      message: '스킬 카테고리가 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('스킬 카테고리 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '스킬 카테고리를 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}
