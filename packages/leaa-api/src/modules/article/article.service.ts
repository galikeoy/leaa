import { Injectable } from '@nestjs/common';
import nodejieba from 'nodejieba';
import htmlToText from 'html-to-text';
import { Repository, FindOneOptions } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Article, Category, Tag } from '@leaa/common/src/entrys';
import {
  ArticlesArgs,
  ArticlesWithPaginationObject,
  ArticleArgs,
  CreateArticleInput,
  UpdateArticleInput,
} from '@leaa/common/src/dtos/article';
import { formatUtil, paginationUtil, curdUtil, stringUtil, loggerUtil } from '@leaa/api/src/utils';
import { TagService } from '@leaa/api/src/modules/tag/tag.service';

const CONSTRUCTOR_NAME = 'ArticleService';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article) private readonly articleRepository: Repository<Article>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
    private readonly tagService: TagService,
  ) {}

  async articles(args: ArticlesArgs): Promise<ArticlesWithPaginationObject> {
    const nextArgs = formatUtil.formatArgs(args);

    const qb = await this.articleRepository.createQueryBuilder('article');

    // relations
    qb.leftJoinAndSelect('article.categories', 'categories');
    qb.leftJoinAndSelect('article.tags', 'tags');

    if (nextArgs.q) {
      const qLike = `%${nextArgs.q}%`;

      console.log(qLike);
      qb.andWhere('article.title LIKE :title', { title: qLike });
      qb.andWhere('article.slug LIKE :slug', { slug: qLike });
    }

    if (nextArgs.tagName) {
      qb.andWhere('tags.name IN (:...tagName)', { tagName: nextArgs.tagName });
    }

    if (nextArgs.categoryName) {
      qb.andWhere('categories.name IN (:...categoryName)', { categoryName: nextArgs.categoryName });
    }

    if (nextArgs.categoryId) {
      qb.andWhere('categories.id IN (:...categoryId)', { categoryId: nextArgs.categoryId });
    }

    const [items, total] = await qb.getManyAndCount();

    return paginationUtil.calcPageInfo({ items, total, page: nextArgs.page, pageSize: nextArgs.pageSize });
  }

  async article(id: number, args?: ArticleArgs & FindOneOptions<Article>): Promise<Article | undefined> {
    let nextArgs: FindOneOptions<Article> = {};

    if (args) {
      nextArgs = args;
      nextArgs.relations = ['tags', 'categories'];
    }

    return this.articleRepository.findOne(id, nextArgs);
  }

  async articleBySlug(slug: string, args?: ArticleArgs & FindOneOptions<Article>): Promise<Article | undefined> {
    const article = await this.articleRepository.findOne({ where: { slug } });

    if (!article) {
      const message = 'not found article';

      loggerUtil.warn(message, CONSTRUCTOR_NAME);

      return undefined;
    }

    return this.article(article.id, args);
  }

  async createArticle(args: CreateArticleInput): Promise<Article | undefined> {
    const relationArgs: { categories?: Category[] } = {};

    // category
    let categoryObjects;
    if (args.categoryIds) {
      categoryObjects = await this.categoryRepository.findByIds(args.categoryIds);
    }
    relationArgs.categories = categoryObjects;

    return this.articleRepository.save({ ...args, ...relationArgs });
  }

  contentHtmlToText(content?: string, title?: string): string {
    const resultTitle = `${title || ''}\n\n`;

    const resultText = htmlToText.fromString(content, { wordwrap: false, ignoreHref: false });

    return resultTitle + resultText;
  }

  async updateArticle(id: number, args: UpdateArticleInput): Promise<Article | undefined> {
    const relationArgs: { tags?: Tag[]; categories?: Category[] } = {};

    const trimSlug = args.slug ? args.slug.trim().toLowerCase() : args.slug;
    const trimDescription = args.description ? args.description.trim() : args.description;

    // tags
    let tagObjects;
    if (args.tagIds && args.tagIds.length > 0) {
      tagObjects = await this.tagRepository.findByIds(args.tagIds);
    }
    relationArgs.tags = tagObjects;

    // category
    let categoryObjects;
    if (args.categoryIds) {
      categoryObjects = await this.categoryRepository.findByIds(args.categoryIds);
    }
    relationArgs.categories = categoryObjects;

    const nextArgs = {
      ...args,
      slug: !args.slug && args.title ? stringUtil.getSlug(args.title) : trimSlug,
      description: trimDescription,
    };

    // auto add tag from article content (by jieba)
    if (args.content && (!args.tagIds || (args.tagIds && args.tagIds.length === 0))) {
      const allText = this.contentHtmlToText(args.content, args.title);
      // @ts-ignore
      const jiebaAllTags = nodejieba.tagWordsToStr(nodejieba.tag(allText));
      const jiebaExtractTags: { word: string; weight: number }[] = nodejieba.extractWithWords(jiebaAllTags, 5);
      const jiebaTag = jiebaExtractTags.map(tag => tag.word);

      // batch create tags
      relationArgs.tags = await this.tagService.createTags(jiebaTag);
    }

    return curdUtil.commonUpdate(this.articleRepository, CONSTRUCTOR_NAME, id, nextArgs, relationArgs);
  }

  async deleteArticle(id: number): Promise<Article | undefined> {
    return curdUtil.commonDelete(this.articleRepository, CONSTRUCTOR_NAME, id);
  }
}
