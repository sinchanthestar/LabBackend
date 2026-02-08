# 📖 Chapter 3: Mengelola Data Relasional & User Management

> **Tujuan:** Menambahkan model `User`, membuat relasi one-to-many antara User dan Article, membangun CRUD untuk Users, dan menyembunyikan field sensitif (password) dari response API.

---

## 📋 Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Bagian A: Menambahkan Model User ke Database](#bagian-a-menambahkan-model-user-ke-database)
   - [Langkah 1: Update Prisma Schema](#langkah-1-update-prisma-schema)
   - [Langkah 2: Jalankan Migrasi](#langkah-2-jalankan-migrasi)
   - [Langkah 3: Update Seed Script](#langkah-3-update-seed-script)
3. [Bagian B: Membuat CRUD untuk Users](#bagian-b-membuat-crud-untuk-users)
   - [Langkah 4: Generate Resource Users](#langkah-4-generate-resource-users)
   - [Langkah 5: Definisikan Entity & DTO](#langkah-5-definisikan-entity--dto)
   - [Langkah 6: Implementasi UsersService](#langkah-6-implementasi-usersservice)
   - [Langkah 7: Implementasi UsersController](#langkah-7-implementasi-userscontroller)
4. [Bagian C: Menyembunyikan Password dari Response](#bagian-c-menyembunyikan-password-dari-response)
   - [Langkah 8: Menggunakan ClassSerializerInterceptor](#langkah-8-menggunakan-classserializerinterceptor)
   - [Langkah 9: Update Controller agar Return Entity](#langkah-9-update-controller-agar-return-entity)
5. [Bagian D: Menampilkan Author di Article](#bagian-d-menampilkan-author-di-article)
   - [Langkah 10: Include Author di Response Article](#langkah-10-include-author-di-response-article)
6. [Ringkasan](#ringkasan)

---

## Pendahuluan

Sampai saat ini, API kita hanya punya satu model: `Article`. Tapi di dunia nyata, sebuah artikel pasti punya **penulis (author)**. Di chapter ini kita akan:

```
┌──────────┐         ┌──────────────┐
│   User   │ 1 ──> * │   Article    │
│          │         │              │
│ id       │         │ id           │
│ name     │         │ title        │
│ email    │         │ body         │
│ password │         │ authorId ──┐ │
└──────────┘         └────────────│─┘
                                  │
                          Foreign Key
```

> 💡 **One-to-Many:** Satu user bisa menulis banyak artikel, tapi satu artikel hanya punya satu author.

---

## Bagian A: Menambahkan Model User ke Database

### Langkah 1: Update Prisma Schema

Update `prisma/schema.prisma`:

```prisma
// prisma/schema.prisma

model Article {
  id          Int      @id @default(autoincrement())
  title       String   @unique
  description String?
  body        String
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  author      User?    @relation(fields: [authorId], references: [id])  // ← BARU
  authorId    Int?                                                       // ← BARU
}

model User {                                    // ← MODEL BARU
  id        Int       @id @default(autoincrement())
  name      String?
  email     String    @unique
  password  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  articles  Article[]                            // ← Relasi ke banyak artikel
}
```

#### Penjelasan Relasi

| Kode | Penjelasan |
|------|------------|
| `author User? @relation(...)` | Setiap Article **boleh punya** satu User sebagai author (opsional karena `?`) |
| `fields: [authorId]` | Field di tabel Article yang menjadi foreign key |
| `references: [id]` | Field di tabel User yang direferensikan |
| `authorId Int?` | Kolom foreign key yang sebenarnya di database |
| `articles Article[]` | Satu User bisa punya banyak Article (array) |

### Langkah 2: Jalankan Migrasi

```bash
npx prisma migrate dev --name "add-user-model"
```

Output yang diharapkan:

```
The following migration(s) have been created and applied:

migrations/
  └─ 20230318100533_add_user_model/
    └─ migration.sql

Your database is now in sync with your schema.
```

### Langkah 3: Update Seed Script

Update `prisma/seed.ts` untuk menambahkan data user:

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ✅ Buat 2 user dummy
  const user1 = await prisma.user.upsert({
    where: { email: 'sabin@adams.com' },
    update: {},
    create: {
      email: 'sabin@adams.com',
      name: 'Sabin Adams',
      password: 'password-sabin',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'alex@ruheni.com' },
    update: {},
    create: {
      email: 'alex@ruheni.com',
      name: 'Alex Ruheni',
      password: 'password-alex',
    },
  });

  // ✅ Buat 3 artikel dummy dengan author
  const post1 = await prisma.article.upsert({
    where: { title: 'Prisma Adds Support for MongoDB' },
    update: { authorId: user1.id },
    create: {
      title: 'Prisma Adds Support for MongoDB',
      body: 'Support for MongoDB has been one of the most requested features...',
      description: "We are excited to share that today's Prisma ORM release adds stable support for MongoDB!",
      published: false,
      authorId: user1.id,  // ← Artikel ini milik user1
    },
  });

  const post2 = await prisma.article.upsert({
    where: { title: "What's new in Prisma? (Q1/22)" },
    update: { authorId: user2.id },
    create: {
      title: "What's new in Prisma? (Q1/22)",
      body: 'Our engineers have been working hard, issuing new releases with many improvements...',
      description: 'Learn about everything in the Prisma ecosystem and community from January to March 2022.',
      published: true,
      authorId: user2.id,  // ← Artikel ini milik user2
    },
  });

  const post3 = await prisma.article.upsert({
    where: { title: 'Prisma Client Just Became a Lot More Flexible' },
    update: {},
    create: {
      title: 'Prisma Client Just Became a Lot More Flexible',
      body: 'Prisma Client extensions provide a powerful new way to add functionality to Prisma...',
      description: 'This article will explore various ways you can use Prisma Client extensions...',
      published: true,
      // ← Artikel ini TIDAK punya author (opsional)
    },
  });

  console.log({ user1, user2, post1, post2, post3 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Jalankan seed:

```bash
npx prisma db seed
```

> ⚠️ **Penting:** Password masih disimpan dalam plain text. Ini TIDAK aman untuk produksi! Kita akan memperbaikinya di Chapter 4.

---

## Bagian B: Membuat CRUD untuk Users

### Langkah 4: Generate Resource Users

```bash
npx nest generate resource
```

Jawab pertanyaan:
1. **Nama:** `users`
2. **Transport:** `REST API`
3. **CRUD entry points?** `Yes`

Lalu tambahkan `PrismaModule` dan inject `PrismaService`:

```typescript
// src/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule],  // ← Tambahkan
})
export class UsersModule {}
```

### Langkah 5: Definisikan Entity & DTO

#### User Entity

```typescript
// src/users/entities/user.entity.ts

import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class UserEntity implements User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  // ⚠️ Tidak ada @ApiProperty() → password TIDAK muncul di Swagger docs
  password: string;
}
```

> 💡 **Perhatikan:** Kita **sengaja tidak menambahkan** `@ApiProperty()` ke `password` agar tidak muncul di dokumentasi Swagger. Tapi ini belum cukup — password masih muncul di response body! Kita akan perbaiki di Bagian C.

#### Create User DTO

```typescript
// src/users/dto/create-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty()
  password: string;
}
```

#### Update Article Entity (tambahkan `authorId`)

```typescript
// src/articles/entities/article.entity.ts

import { Article } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  authorId: number | null;  // ← BARU: foreign key ke User
}
```

### Langkah 6: Implementasi UsersService

```typescript
// src/users/users.service.ts

import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // CREATE — Membuat user baru
  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  // READ — Mengambil semua user
  findAll() {
    return this.prisma.user.findMany();
  }

  // READ — Mengambil satu user berdasarkan ID
  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // UPDATE — Memperbarui user
  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  // DELETE — Menghapus user
  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
```

### Langkah 7: Implementasi UsersController

```typescript
// src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreatedResponse({ type: UserEntity })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOkResponse({ type: UserEntity, isArray: true })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: UserEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: UserEntity })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
```

### 📊 Endpoint Users yang Dibuat

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/users` | Membuat user baru |
| `GET` | `/users` | Mengambil semua user |
| `GET` | `/users/:id` | Mengambil user berdasarkan ID |
| `PATCH` | `/users/:id` | Memperbarui user |
| `DELETE` | `/users/:id` | Menghapus user |

---

## Bagian C: Menyembunyikan Password dari Response

### ❌ Masalah: Password Terekspos!

Saat ini, jika kamu request `GET /users/1`, hasilnya:

```json
{
  "id": 1,
  "name": "Sabin Adams",
  "email": "sabin@adams.com",
  "password": "password-sabin",  // ← 🚨 BAHAYA! Password terekspos!
  "createdAt": "2023-03-20T22:05:56.758Z",
  "updatedAt": "2023-03-20T22:05:56.758Z"
}
```

### Langkah 8: Menggunakan ClassSerializerInterceptor

#### 8.1 Aktifkan Interceptor Secara Global

Update `src/main.ts`:

```typescript
// src/main.ts

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // ✅ Aktifkan ClassSerializerInterceptor secara global
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Median')
    .setDescription('The Median API description')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
```

#### 8.2 Tambahkan `@Exclude()` ke Password di UserEntity

```typescript
// src/users/entities/user.entity.ts

import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';  // ← Tambahkan

export class UserEntity implements User {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);  // ← Constructor untuk konversi
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @Exclude()  // ← Password akan DIHILANGKAN dari response!
  password: string;
}
```

> 💡 **Cara Kerja:**
> 1. `@Exclude()` menandai field yang harus dihilangkan
> 2. `ClassSerializerInterceptor` akan memproses response
> 3. Field yang ditandai `@Exclude()` dihapus dari JSON response
> 4. **TAPI** interceptor hanya bekerja pada instance class, bukan plain object!

#### 8.3 Kenapa Perlu Constructor?

```typescript
// ❌ Ini TIDAK akan bekerja:
findOne(id: number) {
  return this.usersService.findOne(id);  // Return plain object dari Prisma
}

// ✅ Ini AKAN bekerja:
async findOne(id: number) {
  return new UserEntity(await this.usersService.findOne(id));  // Return UserEntity instance
}
```

### Langkah 9: Update Controller agar Return Entity

```typescript
// src/users/users.controller.ts (updated)

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreatedResponse({ type: UserEntity })
  async create(@Body() createUserDto: CreateUserDto) {
    return new UserEntity(await this.usersService.create(createUserDto));
  }

  @Get()
  @ApiOkResponse({ type: UserEntity, isArray: true })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => new UserEntity(user));  // ← Map ke UserEntity
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return new UserEntity(await this.usersService.findOne(id));
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: UserEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return new UserEntity(await this.usersService.update(id, updateUserDto));
  }

  @Delete(':id')
  @ApiOkResponse({ type: UserEntity })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return new UserEntity(await this.usersService.remove(id));
  }
}
```

### ✅ Hasil: Password Tersembunyi!

```json
{
  "id": 1,
  "name": "Sabin Adams",
  "email": "sabin@adams.com",
  "createdAt": "2023-03-20T22:05:56.758Z",
  "updatedAt": "2023-03-20T22:05:56.758Z"
  // ← Password TIDAK ada! ✅
}
```

---

## Bagian D: Menampilkan Author di Article

### Langkah 10: Include Author di Response Article

#### 10.1 Update ArticlesService

```typescript
// src/articles/articles.service.ts

findOne(id: number) {
  return this.prisma.article.findUnique({
    where: { id },
    include: {
      author: true,  // ← Sertakan data author
    },
  });
}
```

#### 10.2 Update ArticleEntity

```typescript
// src/articles/entities/article.entity.ts

import { Article } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from 'src/users/entities/user.entity';

export class ArticleEntity implements Article {
  constructor({ author, ...data }: Partial<ArticleEntity>) {
    Object.assign(this, data);

    if (author) {
      this.author = new UserEntity(author);  // ← Konversi ke UserEntity
    }
  }

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, nullable: true })
  authorId: number | null;

  @ApiProperty({ required: false, type: UserEntity })
  author?: UserEntity;  // ← BARU: Data author lengkap
}
```

> 💡 **Kenapa convert ke `UserEntity`?** Agar `@Exclude()` pada password juga berfungsi di dalam response article!

#### 10.3 Update ArticlesController

Semua method di controller harus diubah agar return `ArticleEntity`:

```typescript
// src/articles/articles.controller.ts

@Controller('articles')
@ApiTags('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiCreatedResponse({ type: ArticleEntity })
  async create(@Body() createArticleDto: CreateArticleDto) {
    return new ArticleEntity(await this.articlesService.create(createArticleDto));
  }

  @Get()
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  async findAll() {
    const articles = await this.articlesService.findAll();
    return articles.map((article) => new ArticleEntity(article));
  }

  @Get('drafts')
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  async findDrafts() {
    const drafts = await this.articlesService.findDrafts();
    return drafts.map((draft) => new ArticleEntity(draft));
  }

  @Get(':id')
  @ApiOkResponse({ type: ArticleEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return new ArticleEntity(await this.articlesService.findOne(id));
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: ArticleEntity })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return new ArticleEntity(await this.articlesService.update(id, updateArticleDto));
  }

  @Delete(':id')
  @ApiOkResponse({ type: ArticleEntity })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return new ArticleEntity(await this.articlesService.remove(id));
  }
}
```

#### ✅ Hasil: Article dengan Author (tanpa Password!)

```json
{
  "id": 1,
  "title": "Prisma Adds Support for MongoDB",
  "description": "We are excited to share...",
  "body": "Support for MongoDB has been...",
  "published": false,
  "createdAt": "2023-03-20T22:05:56.789Z",
  "updatedAt": "2023-03-20T22:05:56.789Z",
  "authorId": 1,
  "author": {
    "id": 1,
    "name": "Sabin Adams",
    "email": "sabin@adams.com",
    "createdAt": "2023-03-20T22:05:56.758Z",
    "updatedAt": "2023-03-20T22:05:56.758Z"
    // ← Password TIDAK ada! ✅
  }
}
```

---

## Ringkasan

| ✅ | Yang Sudah Dipelajari |
|----|----------------------|
| 1 | Membuat model `User` dengan relasi one-to-many ke `Article` |
| 2 | Menjalankan migrasi untuk schema baru |
| 3 | Memperbarui seed script dengan data user |
| 4 | Membangun CRUD endpoints lengkap untuk Users |
| 5 | Menggunakan `@Exclude()` untuk menyembunyikan password |
| 6 | Menggunakan `ClassSerializerInterceptor` secara global |
| 7 | Menampilkan relasi (author) dalam response Article |
| 8 | Memastikan password tetap tersembunyi di nested object |

### ➡️ Selanjutnya

Di **[Chapter 4](../chapter-4/README.md)**, kamu akan belajar:
- Implementasi JWT Authentication
- Melindungi endpoint dengan Auth Guard
- Hashing password dengan bcrypt
- Integrasi authentication di Swagger

---

## 📝 Laporan Praktikum — Chapter 3

> **Instruksi:** Centang setiap langkah yang sudah selesai dikerjakan sebagai bukti laporan praktikum.
> Ubah `[ ]` menjadi `[x]` untuk menandai selesai.

### Part A: Model User & Relasi
- [x] Menambahkan model `User` di `prisma/schema.prisma`
- [x] Menambahkan field `authorId` dan relasi `author` di model `Article`
- [x] Menjalankan migrasi (`npx prisma migrate dev --name "add-user-model"`)
- [x] Memverifikasi tabel `User` berhasil dibuat di database
- [x] Memperbarui `prisma/seed.ts` dengan data user (Sabin & Alex)
- [x] Menghubungkan artikel dengan author di seed script
- [x] Menjalankan seed ulang (`npx prisma db seed`)
- [x] Memverifikasi data user dan relasi berhasil masuk ke database

### Part B: CRUD Users
- [x] Membuat resource Users (`npx nest generate resource`)
- [x] Mengimpor `PrismaModule` di `UsersModule`
- [x] Membuat `UserEntity` dengan decorator `@ApiProperty`
- [x] Membuat `CreateUserDto` dengan validasi (`@IsNotEmpty`, `@IsEmail`, dll)
- [x] Mengimplementasikan `POST /users` (Create)
- [x] Mengimplementasikan `GET /users` (Read All)
- [x] Mengimplementasikan `GET /users/:id` (Read One)
- [x] Mengimplementasikan `PATCH /users/:id` (Update)
- [x] Mengimplementasikan `DELETE /users/:id` (Delete)
- [x] Menambahkan `@ApiTags('users')` dan response types ke controller
- [x] Menguji semua endpoint Users di Swagger

### Part C: Menyembunyikan Password
- [x] Menambahkan `@Exclude()` pada field `password` di `UserEntity`
- [x] Menambahkan constructor di `UserEntity` (`constructor(partial: Partial<UserEntity>)`)
- [x] Membungkus response dengan `new UserEntity(...)` di setiap method controller
- [x] Mengaktifkan `ClassSerializerInterceptor` secara global di `main.ts`
- [x] Menguji — memverifikasi password TIDAK muncul di response `GET /users`
- [x] Menguji — memverifikasi password TIDAK muncul di response `GET /users/:id`

### Part D: Relasi Author di Articles
- [x] Memperbarui `ArticleEntity` — menambahkan field `authorId` dan `author`
- [x] Memperbarui `ArticlesService.findOne` — menambahkan `include: { author: true }`
- [x] Memperbarui `ArticlesService.findAll` — menambahkan `include: { author: true }`
- [x] Memperbarui `ArticlesService.findDrafts` — menambahkan `include: { author: true }`
- [x] Menguji — memverifikasi field `author` muncul di response Article
- [x] Menguji — memverifikasi password author TIDAK muncul di response Article

### ✅ Status Chapter 3
- [x] **SEMUA LANGKAH SELESAI** — Chapter 3 telah dikerjakan seluruhnya

| Item | Keterangan |
|------|------------|
| Nama | ANUGRAH ALIFIANDI_________________________ |
| NIM | 105841110821_________________________ |
| Tanggal | 09-FEBRUARI-2026_________________________ |
| Tanda Tangan | _________________________ |
