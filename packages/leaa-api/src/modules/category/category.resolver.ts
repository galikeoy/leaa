import { Args, Query, Mutation, Resolver } from '@nestjs/graphql';
import { Int } from 'type-graphql';

import { Category } from '@leaa/common/entrys';
import {
  CategoriesArgs,
  CategoriesWithPaginationObject,
  CategoryArgs,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@leaa/common/dtos/category';
import { CategoryService } from './category.service';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => CategoriesWithPaginationObject)
  async categories(@Args() args: CategoriesArgs): Promise<CategoriesWithPaginationObject | undefined> {
    return this.categoryService.categories(args);
  }

  @Query(() => Category)
  async category(
    @Args({ name: 'id', type: () => Int }) id: number,
    @Args() args?: CategoryArgs,
  ): Promise<Category | undefined> {
    return this.categoryService.category(id, args);
  }

  @Mutation(() => Category)
  async createCategory(@Args('category') args: CreateCategoryInput): Promise<Category | undefined> {
    return this.categoryService.craeteCategory(args);
  }

  @Mutation(() => Category)
  async updateCategory(
    @Args({ name: 'id', type: () => Int }) id: number,
    @Args('category') args: UpdateCategoryInput,
  ): Promise<Category | undefined> {
    return this.categoryService.updateCategory(id, args);
  }

  @Mutation(() => Category)
  async deleteCategory(@Args({ name: 'id', type: () => Int }) id: number): Promise<Category | undefined> {
    return this.categoryService.deleteCategory(id);
  }
}