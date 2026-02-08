import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createArticleDto: CreateArticleDto) {
    return this.prisma.article.create({
      data: createArticleDto,
      include: { author: true },
    });
  }

  findAll() {
    return this.prisma.article.findMany({
      where: { published: true },
      include: { author: true },
    });
  }

  findDrafts() {
    return this.prisma.article.findMany({
      where: { published: false },
      include: { author: true },
    });
  }

  findOne(id: number) {
    return this.prisma.article.findUnique({
      where: { id },
      include: { author: true },
    });
  }

  update(id: number, updateArticleDto: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data: updateArticleDto,
      include: { author: true },
    });
  }

  remove(id: number) {
    return this.prisma.article.delete({
      where: { id },
      include: { author: true },
    });
  }
}
