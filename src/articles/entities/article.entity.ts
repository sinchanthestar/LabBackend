import { ApiProperty } from '@nestjs/swagger';
import { Article, User } from '@prisma/client';
import { UserEntity } from '../../users/entities/user.entity';

type ArticleWithAuthor = Article & { author?: User | null };

export class ArticleEntity implements Article {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  description: string | null;

  @ApiProperty()
  body: string;

  @ApiProperty()
  published: boolean;

  @ApiProperty({ required: false, nullable: true })
  authorId: number | null;

  @ApiProperty({ required: false, nullable: true, type: () => UserEntity })
  author?: UserEntity | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  constructor(article: ArticleWithAuthor) {
    this.id = article.id;
    this.title = article.title;
    this.description = article.description;
    this.body = article.body;
    this.published = article.published;
    this.authorId = article.authorId;
    this.author = article.author ? new UserEntity(article.author) : null;
    this.createdAt = article.createdAt;
    this.updatedAt = article.updatedAt;
  }
}
