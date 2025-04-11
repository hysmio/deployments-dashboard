import { EntityTarget, FindOptionsWhere, Repository, ObjectLiteral, FindManyOptions } from "typeorm";
import { initializeDB } from "../db";

export class BaseRepository<T extends ObjectLiteral> {
  protected entityTarget: EntityTarget<T>;
  protected repository: Repository<T> | null = null;
  
  constructor(entityTarget: EntityTarget<T>) {
    this.entityTarget = entityTarget;
  }
  
  protected async getRepository(): Promise<Repository<T>> {
    if (!this.repository) {
      const dataSource = await initializeDB();
      this.repository = dataSource.getRepository<T>(this.entityTarget);
    }
    return this.repository;
  }
  
  async findAll(options?: FindManyOptions<T> | undefined): Promise<T[]> {
    const repo = await this.getRepository();
    return repo.find(options);
  }
  
  async findOne(conditions: FindOptionsWhere<T>): Promise<T | null> {
    const repo = await this.getRepository();
    return repo.findOne({ where: conditions });
  }
  
  async findBy(conditions: FindOptionsWhere<T>): Promise<T[]> {
    const repo = await this.getRepository();
    return repo.find({ where: conditions });
  }
  
  async save(entity: T): Promise<T> {
    const repo = await this.getRepository();
    return repo.save(entity);
  }
  
  async update(id: string | number, data: T): Promise<void> {
    const repo = await this.getRepository();
    await repo.update(id, data);
  }
  
  async delete(id: string | number): Promise<void> {
    const repo = await this.getRepository();
    await repo.delete(id);
  }
  
  async count(conditions: FindOptionsWhere<T>): Promise<number> {
    const repo = await this.getRepository();
    return repo.count({ where: conditions });
  }
} 