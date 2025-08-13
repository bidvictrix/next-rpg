import fs from 'fs/promises';
import path from 'path';

// JSON 파일 CRUD 작업을 위한 기본 데이터 매니저
export class DataManager {
  private basePath: string;

  constructor(basePath: string = './data') {
    this.basePath = basePath;
  }

  /**
   * JSON 파일 읽기
   */
  async readFile<T>(filePath: string): Promise<T | null> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const data = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null; // 파일이 없으면 null 반환
      }
      throw new Error(`파일 읽기 실패: ${filePath} - ${(error as Error).message}`);
    }
  }

  /**
   * JSON 파일 쓰기
   */
  async writeFile<T>(filePath: string, data: T): Promise<void> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      
      // 디렉토리가 없으면 생성
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });

      // 데이터를 JSON 형태로 저장
      await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`파일 쓰기 실패: ${filePath} - ${(error as Error).message}`);
    }
  }

  /**
   * 파일 존재 여부 확인
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false; // 파일이 이미 없음
      }
      throw new Error(`파일 삭제 실패: ${filePath} - ${(error as Error).message}`);
    }
  }

  /**
   * 디렉토리 내 모든 파일 목록 조회
   */
  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.basePath, dirPath);
      const files = await fs.readdir(fullPath);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []; // 디렉토리가 없으면 빈 배열
      }
      throw new Error(`디렉토리 읽기 실패: ${dirPath} - ${(error as Error).message}`);
    }
  }

  /**
   * 백업 파일 생성
   */
  async createBackup(filePath: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      
      const data = await this.readFile(filePath);
      if (data !== null) {
        await this.writeFile(backupPath, data);
      }
      
      return backupPath;
    } catch (error) {
      throw new Error(`백업 생성 실패: ${filePath} - ${(error as Error).message}`);
    }
  }

  /**
   * 파일 복원
   */
  async restoreFromBackup(originalPath: string, backupPath: string): Promise<void> {
    try {
      const backupData = await this.readFile(backupPath);
      if (backupData !== null) {
        await this.writeFile(originalPath, backupData);
      } else {
        throw new Error('백업 파일이 존재하지 않습니다');
      }
    } catch (error) {
      throw new Error(`복원 실패: ${originalPath} - ${(error as Error).message}`);
    }
  }

  /**
   * 파일 크기 조회 (바이트)
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch (error) {
      throw new Error(`파일 크기 조회 실패: ${filePath} - ${(error as Error).message}`);
    }
  }

  /**
   * 파일 수정 시간 조회
   */
  async getLastModified(filePath: string): Promise<Date> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      return stats.mtime;
    } catch (error) {
      throw new Error(`수정 시간 조회 실패: ${filePath} - ${(error as Error).message}`);
    }
  }

  /**
   * 파일 검색 (이름 또는 내용 기반)
   */
  async searchFiles(dirPath: string, searchTerm: string, searchInContent: boolean = false): Promise<string[]> {
    try {
      const files = await this.listFiles(dirPath);
      const results: string[] = [];

      for (const file of files) {
        // 파일명으로 검색
        if (file.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(file);
          continue;
        }

        // 내용으로 검색 (옵션)
        if (searchInContent) {
          try {
            const filePath = path.join(dirPath, file);
            const content = await this.readFile<any>(filePath);
            const contentString = JSON.stringify(content).toLowerCase();
            
            if (contentString.includes(searchTerm.toLowerCase())) {
              results.push(file);
            }
          } catch {
            // 파일 읽기 실패 시 무시
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`파일 검색 실패: ${dirPath} - ${(error as Error).message}`);
    }
  }

  /**
   * 배치 작업 - 여러 파일 동시 처리
   */
  async batchOperation<T>(
    operations: Array<{
      type: 'read' | 'write' | 'delete';
      filePath: string;
      data?: T;
    }>
  ): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
    const results = await Promise.allSettled(
      operations.map(async (op) => {
        switch (op.type) {
          case 'read':
            return await this.readFile(op.filePath);
          case 'write':
            if (op.data === undefined) {
              throw new Error('쓰기 작업에는 데이터가 필요합니다');
            }
            await this.writeFile(op.filePath, op.data);
            return true;
          case 'delete':
            return await this.deleteFile(op.filePath);
          default:
            throw new Error(`지원되지 않는 작업 타입: ${(op as any).type}`);
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, result: result.value };
      } else {
        return { 
          success: false, 
          error: result.reason?.message || '알 수 없는 오류',
          result: null
        };
      }
    });
  }

  /**
   * 데이터 압축 저장 (큰 파일용)
   */
  async writeCompressed<T>(filePath: string, data: T): Promise<void> {
    try {
      // 실제 환경에서는 압축 라이브러리 사용
      // 여기서는 단순히 minify된 JSON으로 저장
      const fullPath = path.join(this.basePath, filePath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(fullPath, JSON.stringify(data), 'utf-8');
    } catch (error) {
      throw new Error(`압축 저장 실패: ${filePath} - ${(error as Error).message}`);
    }
  }

  /**
   * 트랜잭션 방식 저장 (원자성 보장)
   */
  async atomicWrite<T>(filePath: string, data: T): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    
    try {
      // 임시 파일에 먼저 저장
      await this.writeFile(tempPath, data);
      
      // 성공하면 원본 파일로 이동
      const fullTempPath = path.join(this.basePath, tempPath);
      const fullPath = path.join(this.basePath, filePath);
      
      await fs.rename(fullTempPath, fullPath);
    } catch (error) {
      // 실패 시 임시 파일 정리
      try {
        await this.deleteFile(tempPath);
      } catch {
        // 임시 파일 삭제 실패는 무시
      }
      
      throw new Error(`원자성 쓰기 실패: ${filePath} - ${(error as Error).message}`);
    }
  }
}

// 싱글톤 인스턴스
export const dataManager = new DataManager();

// 타입 안전한 래퍼 함수들
export const readPlayerData = (playerId: string) => 
  dataManager.readFile(`players/${playerId}.json`);

export const writePlayerData = (playerId: string, data: any) => 
  dataManager.writeFile(`players/${playerId}.json`, data);

export const readGameData = <T>(fileName: string) => 
  dataManager.readFile<T>(`game/${fileName}.json`);

export const writeGameData = <T>(fileName: string, data: T) => 
  dataManager.writeFile(`game/${fileName}.json`, data);

export const readAdminData = <T>(fileName: string) => 
  dataManager.readFile<T>(`admin/${fileName}.json`);

export const writeAdminData = <T>(fileName: string, data: T) => 
  dataManager.writeFile(`admin/${fileName}.json`, data);