import fs from 'fs/promises';
import path from 'path';
import { Skill, SkillCategory } from '@/types/skills';

interface SkillData {
  skills: Record<string, Skill>;
  skillCategories: Record<string, SkillCategory>;
}

const SKILLS_FILE_PATH = path.join(process.cwd(), 'data/game/skills.json');

/**
 * JSON 파일에서 스킬 데이터를 로드하는 함수
 */
export async function loadSkillsData(): Promise<SkillData> {
  try {
    const fileContent = await fs.readFile(SKILLS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent) as SkillData;
    return data;
  } catch (error) {
    console.error('스킬 데이터 로드 실패:', error);
    throw new Error('스킬 데이터를 로드할 수 없습니다.');
  }
}

/**
 * JSON 파일에 스킬 데이터를 저장하는 함수
 */
export async function saveSkillsData(data: SkillData): Promise<void> {
  try {
    await fs.writeFile(SKILLS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('스킬 데이터 저장 실패:', error);
    throw new Error('스킬 데이터를 저장할 수 없습니다.');
  }
}

/**
 * 특정 스킬을 가져오는 함수
 */
export async function getSkill(skillId: string): Promise<Skill | null> {
  try {
    const data = await loadSkillsData();
    return data.skills[skillId] || null;
  } catch (error) {
    console.error(`스킬 ${skillId} 조회 실패:`, error);
    return null;
  }
}

/**
 * 모든 스킬을 배열로 가져오는 함수
 */
export async function getAllSkills(): Promise<Skill[]> {
  try {
    const data = await loadSkillsData();
    return Object.values(data.skills);
  } catch (error) {
    console.error('모든 스킬 조회 실패:', error);
    return [];
  }
}

/**
 * 새로운 스킬을 추가하는 함수
 */
export async function addSkill(skill: Skill): Promise<void> {
  try {
    const data = await loadSkillsData();
    data.skills[skill.id] = skill;
    await saveSkillsData(data);
  } catch (error) {
    console.error(`스킬 ${skill.id} 추가 실패:`, error);
    throw new Error('스킬을 추가할 수 없습니다.');
  }
}

/**
 * 기존 스킬을 수정하는 함수
 */
export async function updateSkill(skill: Skill): Promise<void> {
  try {
    const data = await loadSkillsData();
    if (!data.skills[skill.id]) {
      throw new Error(`스킬 ${skill.id}가 존재하지 않습니다.`);
    }
    data.skills[skill.id] = skill;
    await saveSkillsData(data);
  } catch (error) {
    console.error(`스킬 ${skill.id} 수정 실패:`, error);
    throw new Error('스킬을 수정할 수 없습니다.');
  }
}

/**
 * 스킬을 삭제하는 함수
 */
export async function deleteSkill(skillId: string): Promise<void> {
  try {
    const data = await loadSkillsData();
    if (!data.skills[skillId]) {
      throw new Error(`스킬 ${skillId}가 존재하지 않습니다.`);
    }
    delete data.skills[skillId];
    
    // 카테고리에서도 제거
    Object.values(data.skillCategories).forEach(category => {
      category.skills = category.skills.filter(id => id !== skillId);
    });
    
    await saveSkillsData(data);
  } catch (error) {
    console.error(`스킬 ${skillId} 삭제 실패:`, error);
    throw new Error('스킬을 삭제할 수 없습니다.');
  }
}

/**
 * 스킬 카테고리를 가져오는 함수
 */
export async function getSkillCategories(): Promise<SkillCategory[]> {
  try {
    const data = await loadSkillsData();
    return Object.values(data.skillCategories);
  } catch (error) {
    console.error('스킬 카테고리 조회 실패:', error);
    return [];
  }
}

/**
 * 스킬 카테고리를 추가/수정하는 함수
 */
export async function updateSkillCategory(category: SkillCategory): Promise<void> {
  try {
    const data = await loadSkillsData();
    data.skillCategories[category.id] = category;
    await saveSkillsData(data);
  } catch (error) {
    console.error(`스킬 카테고리 ${category.id} 수정 실패:`, error);
    throw new Error('스킬 카테고리를 수정할 수 없습니다.');
  }
}

/**
 * 스킬 데이터 검증 함수
 */
export function validateSkill(skill: Partial<Skill>): string[] {
  const errors: string[] = [];
  
  if (!skill.id || skill.id.trim() === '') {
    errors.push('스킬 ID는 필수입니다.');
  }
  
  if (!skill.name || skill.name.trim() === '') {
    errors.push('스킬 이름은 필수입니다.');
  }
  
  if (!skill.description || skill.description.trim() === '') {
    errors.push('스킬 설명은 필수입니다.');
  }
  
  if (!skill.type || !['active', 'passive', 'toggle'].includes(skill.type)) {
    errors.push('스킬 타입은 active, passive, toggle 중 하나여야 합니다.');
  }
  
  if (!skill.category || !['combat', 'magic', 'support', 'passive', 'utility'].includes(skill.category)) {
    errors.push('스킬 카테고리는 combat, magic, support, passive, utility 중 하나여야 합니다.');
  }
  
  if (!skill.rarity || !['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].includes(skill.rarity)) {
    errors.push('스킬 희소성은 common, uncommon, rare, epic, legendary, mythic 중 하나여야 합니다.');
  }
  
  if (!skill.maxLevel || skill.maxLevel < 1) {
    errors.push('최대 레벨은 1 이상이어야 합니다.');
  }
  
  if (!skill.baseExperience || skill.baseExperience < 1) {
    errors.push('기본 경험치는 1 이상이어야 합니다.');
  }
  
  if (!skill.effects || !Array.isArray(skill.effects)) {
    errors.push('스킬 효과는 배열이어야 합니다.');
  }
  
  if (!skill.requirements || !Array.isArray(skill.requirements)) {
    errors.push('스킬 요구사항은 배열이어야 합니다.');
  }
  
  return errors;
}

/**
 * 스킬 데이터 백업 생성 함수
 */
export async function createSkillsBackup(): Promise<string> {
  try {
    const data = await loadSkillsData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(process.cwd(), `data/backups/skills-backup-${timestamp}.json`);
    
    // 백업 디렉토리 생성
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8');
    return backupPath;
  } catch (error) {
    console.error('스킬 데이터 백업 실패:', error);
    throw new Error('스킬 데이터 백업을 생성할 수 없습니다.');
  }
}

/**
 * 스킬 데이터 복원 함수
 */
export async function restoreSkillsFromBackup(backupPath: string): Promise<void> {
  try {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent) as SkillData;
    
    // 데이터 검증
    if (!backupData.skills || !backupData.skillCategories) {
      throw new Error('유효하지 않은 백업 파일입니다.');
    }
    
    await saveSkillsData(backupData);
  } catch (error) {
    console.error('스킬 데이터 복원 실패:', error);
    throw new Error('스킬 데이터를 복원할 수 없습니다.');
  }
}
