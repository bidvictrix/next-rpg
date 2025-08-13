import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllSkills, 
  addSkill, 
  updateSkill, 
  deleteSkill, 
  validateSkill,
  createSkillsBackup
} from '@/lib/skillDataManager';

// GET: 모든 스킬 조회
export async function GET() {
  try {
    const skills = await getAllSkills();
    return NextResponse.json({ 
      success: true, 
      data: skills 
    });
  } catch (error) {
    console.error('스킬 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '스킬 데이터를 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 스킬 추가
export async function POST(request: NextRequest) {
  try {
    const skillData = await request.json();
    
    // 스킬 데이터 검증
    const validationErrors = validateSkill(skillData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 스킬 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createSkillsBackup();
    
    // 스킬 추가
    const newSkill = {
      ...skillData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };
    
    await addSkill(newSkill);
    
    return NextResponse.json({ 
      success: true, 
      data: newSkill,
      message: '스킬이 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('스킬 추가 실패:', error);
    return NextResponse.json(
      { success: false, error: '스킬을 추가할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 기존 스킬 수정
export async function PUT(request: NextRequest) {
  try {
    const skillData = await request.json();
    
    // 스킬 데이터 검증
    const validationErrors = validateSkill(skillData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효하지 않은 스킬 데이터입니다.',
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createSkillsBackup();
    
    // 스킬 수정
    const updatedSkill = {
      ...skillData,
      updatedAt: new Date().toISOString()
    };
    
    await updateSkill(updatedSkill);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedSkill,
      message: '스킬이 성공적으로 수정되었습니다.' 
    });
  } catch (error) {
    console.error('스킬 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '스킬을 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 스킬 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('id');
    
    if (!skillId) {
      return NextResponse.json(
        { success: false, error: '스킬 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 백업 생성
    await createSkillsBackup();
    
    // 스킬 삭제
    await deleteSkill(skillId);
    
    return NextResponse.json({ 
      success: true,
      message: '스킬이 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('스킬 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '스킬을 삭제할 수 없습니다.' },
      { status: 500 }
    );
  }
}
