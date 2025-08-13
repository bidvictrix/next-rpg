import { NextRequest, NextResponse } from 'next/server';
import { 
  getCraftingRecipes, 
  updateCraftingRecipe, 
  createItemsBackup 
} from '@/lib/itemDataManager';

// GET: 모든 제작 레시피 조회
export async function GET() {
  try {
    const recipes = await getCraftingRecipes();
    return NextResponse.json({ 
      success: true, 
      data: recipes 
    });
  } catch (error) {
    console.error('제작 레시피 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '제작 레시피 데이터를 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 제작 레시피 추가
export async function POST(request: NextRequest) {
  try {
    const recipeData = await request.json();
    
    // 레시피 데이터 검증
    if (!recipeData.id || !recipeData.resultItem || !recipeData.materials) {
      return NextResponse.json(
        { 
          success: false, 
          error: '레시피 ID, 결과 아이템, 재료는 필수입니다.' 
        },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(recipeData.materials) || recipeData.materials.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '재료는 배열이며 최소 1개 이상이어야 합니다.' 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createItemsBackup();
    
    // 레시피 추가
    await updateCraftingRecipe(recipeData);
    
    return NextResponse.json({ 
      success: true, 
      data: recipeData,
      message: '제작 레시피가 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('제작 레시피 추가 실패:', error);
    return NextResponse.json(
      { success: false, error: '제작 레시피를 추가할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 기존 제작 레시피 수정
export async function PUT(request: NextRequest) {
  try {
    const recipeData = await request.json();
    
    // 레시피 데이터 검증
    if (!recipeData.id || !recipeData.resultItem || !recipeData.materials) {
      return NextResponse.json(
        { 
          success: false, 
          error: '레시피 ID, 결과 아이템, 재료는 필수입니다.' 
        },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(recipeData.materials) || recipeData.materials.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '재료는 배열이며 최소 1개 이상이어야 합니다.' 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createItemsBackup();
    
    // 레시피 수정
    await updateCraftingRecipe(recipeData);
    
    return NextResponse.json({ 
      success: true, 
      data: recipeData,
      message: '제작 레시피가 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('제작 레시피 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '제작 레시피를 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}
