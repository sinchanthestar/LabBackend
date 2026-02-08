# 📖 Chapter 1: Membangun REST API dengan NestJS dan Prisma

> **Tujuan:** Membuat proyek NestJS dari nol, menghubungkan ke database PostgreSQL menggunakan Prisma, membangun CRUD API untuk artikel, dan mendokumentasikannya dengan Swagger.

---

## 📋 Daftar Isi

1. [Apa yang Akan Kita Bangun?](#apa-yang-akan-kita-bangun)
2. [Teknologi yang Digunakan](#teknologi-yang-digunakan)
3. [Prasyarat](#prasyarat)
4. [Langkah 1: Membuat Proyek NestJS](#langkah-1-membuat-proyek-nestjs)
5. [Langkah 2: Menjalankan Database PostgreSQL](#langkah-2-menjalankan-database-postgresql)
6. [Langkah 3: Menyiapkan Prisma](#langkah-3-menyiapkan-prisma)
7. [Langkah 4: Membuat Model Data](#langkah-4-membuat-model-data)
8. [Langkah 5: Migrasi Database](#langkah-5-migrasi-database)
9. [Langkah 6: Mengisi Database dengan Data Awal (Seed)](#langkah-6-mengisi-database-dengan-data-awal-seed)
10. [Langkah 7: Membuat Prisma Service](#langkah-7-membuat-prisma-service)
11. [Langkah 8: Menyiapkan Swagger](#langkah-8-menyiapkan-swagger)
12. [Langkah 9: Membuat CRUD untuk Articles](#langkah-9-membuat-crud-untuk-articles)
13. [Langkah 10: Mengatur Response Types di Swagger](#langkah-10-mengatur-response-types-di-swagger)
14. [Ringkasan](#ringkasan)

---

## Apa yang Akan Kita Bangun?

Kita akan membuat backend REST API untuk aplikasi blog bernama **"Median"** (klon sederhana Medium). API ini memiliki fitur:

- ✅ **CRUD Articles** — Create, Read, Update, Delete artikel
- ✅ **Database PostgreSQL** — Menyimpan data secara persisten
- ✅ **Prisma ORM** — Query database dengan cara yang type-safe
- ✅ **Swagger UI** — Dokumentasi API otomatis

---

## Teknologi yang Digunakan

| Teknologi | Fungsi |
|-----------|--------|
| **NestJS** | Framework backend Node.js |
| **Prisma** | ORM (Object-Relational Mapper) |
| **PostgreSQL** | Database relasional |
| **Swagger** | Dokumentasi API |
| **TypeScript** | Bahasa pemrograman |

---

## Prasyarat

Sebelum memulai, pastikan kamu sudah menginstal:

- ✅ **Node.js** — [Download di sini](https://nodejs.org/)
- ✅ **Docker** atau **PostgreSQL** — [Docker Desktop](https://www.docker.com/) (disarankan)
- ✅ **VS Code** — [Download di sini](https://code.visualstudio.com/)
- ✅ **Ekstensi Prisma untuk VS Code** (opsional, tapi sangat membantu)

---

## Langkah 1: Membuat Proyek NestJS

### 1.1 Instal NestJS CLI & Buat Proyek

```bash
npx @nestjs/cli new .
```

> 💡 **Penjelasan:** Perintah ini membuat proyek NestJS baru di folder saat ini. Pilih **npm** ketika ditanya manajer paket.

### 1.2 Struktur Proyek yang Dihasilkan

```
median/
  ├── node_modules/
  ├── src/
  │   ├── app.controller.spec.ts   ← File test
  │   ├── app.controller.ts        ← Controller utama (route handler)
  │   ├── app.module.ts            ← Modul utama aplikasi
  │   ├── app.service.ts           ← Service utama (logika bisnis)
  │   └── main.ts                  ← Entry point aplikasi
  ├── test/
  ├── package.json
  ├── tsconfig.json
  └── nest-cli.json
```

### 1.3 Jalankan Server

```bash
npm run start:dev
```

Buka http://localhost:3000/ — kamu akan melihat pesan **"Hello World!"** 🎉

> 💡 **Tips:** Perintah `start:dev` mengaktifkan **hot-reload**, artinya server otomatis restart setiap kali kamu mengubah kode.

---

## Langkah 2: Menjalankan Database PostgreSQL

Kita akan menggunakan **Docker** untuk menjalankan PostgreSQL dengan mudah.

### 2.1 Buat File `docker-compose.yml`

Buat file `docker-compose.yml` di root proyek:

```yaml
# docker-compose.yml

version: '3.8'
services:
  postgres:
    image: postgres:13.5
    restart: always
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=mypassword
      - POSTGRES_DB=median-db
    volumes:
      - postgres:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres:
```

> 💡 **Penjelasan sederhana:**
> - `image: postgres:13.5` → Menggunakan PostgreSQL versi 13.5
> - `environment` → Username & password untuk database
> - `ports: '5432:5432'` → Membuka port 5432 agar bisa diakses
> - `volumes` → Data disimpan persisten (tidak hilang saat container restart)

### 2.2 Jalankan PostgreSQL

```bash
docker-compose up -d
```

> Flag `-d` berarti **detached mode** — container berjalan di background.

### 2.3 Verifikasi

Cek apakah container berjalan:

```bash
docker-compose ps
```

Kamu seharusnya melihat container postgres dengan status **Up**.

---

## Langkah 3: Menyiapkan Prisma

### 3.1 Instal Prisma CLI

```bash
npm install -D prisma
```

### 3.2 Inisialisasi Prisma

```bash
npx prisma init
```

Perintah ini membuat:
- 📁 Folder `prisma/` dengan file `schema.prisma`
- 📄 File `.env` untuk menyimpan connection string

### 3.3 Atur Connection String

Buka file `.env` dan ubah `DATABASE_URL`:

```env
DATABASE_URL="postgres://myuser:mypassword@localhost:5432/median-db"
```

> 💡 **Format:** `postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME`

### 3.4 Memahami Prisma Schema

Buka `prisma/schema.prisma`:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Penjelasan 3 komponen utama:**

| Komponen | Fungsi |
|----------|--------|
| **datasource** | Menentukan database yang digunakan (PostgreSQL) dan connection string |
| **generator** | Menghasilkan Prisma Client (query builder type-safe) |
| **model** | Mendefinisikan tabel-tabel database (akan ditambahkan nanti) |

---

## Langkah 4: Membuat Model Data

### 4.1 Definisikan Model `Article`

Tambahkan model berikut di `prisma/schema.prisma`:

```prisma
model Article {
  id          Int      @id @default(autoincrement())
  title       String   @unique
  description String?
  body        String
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.2 Penjelasan Setiap Field

| Field | Tipe | Penjelasan |
|-------|------|------------|
| `id` | `Int` | Primary key, auto-increment |
| `title` | `String` | Judul artikel, harus unik |
| `description` | `String?` | Deskripsi singkat (opsional, ditandai `?`) |
| `body` | `String` | Isi lengkap artikel |
| `published` | `Boolean` | Status: draf (false) atau dipublikasikan (true) |
| `createdAt` | `DateTime` | Tanggal dibuat, otomatis diisi saat pembuatan |
| `updatedAt` | `DateTime` | Tanggal diubah, otomatis diperbarui saat update |

> 💡 **Catatan Penting:**
> - `@id` → Menandai sebagai primary key
> - `@default(autoincrement())` → ID otomatis bertambah
> - `@unique` → Nilai harus unik (tidak boleh duplikat)
> - `?` setelah tipe → Field bersifat opsional (boleh null)

---

## Langkah 5: Migrasi Database

### 5.1 Jalankan Migrasi

```bash
npx prisma migrate dev --name "init"
```

### 5.2 Apa yang Terjadi di Balik Layar?

Perintah ini melakukan **3 hal** sekaligus:

```
┌──────────────────────────────────┐
│ 1. SAVE: Membuat file migrasi   │ → prisma/migrations/xxx_init/migration.sql
│ 2. EXECUTE: Menjalankan SQL      │ → Membuat tabel "Article" di database
│ 3. GENERATE: Buat Prisma Client  │ → node_modules/@prisma/client
└──────────────────────────────────┘
```

### 5.3 SQL yang Dihasilkan

Prisma otomatis membuat SQL berikut:

```sql
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Article_title_key" ON "Article"("title");
```

---

## Langkah 6: Mengisi Database dengan Data Awal (Seed)

### 6.1 Buat File Seed

Buat file `prisma/seed.ts`:

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const post1 = await prisma.article.upsert({
    where: { title: 'Prisma Adds Support for MongoDB' },
    update: {},
    create: {
      title: 'Prisma Adds Support for MongoDB',
      body: 'Support for MongoDB has been one of the most requested features since the initial release of...',
      description: "We are excited to share that today's Prisma ORM release adds stable support for MongoDB!",
      published: false,
    },
  });

  const post2 = await prisma.article.upsert({
    where: { title: "What's new in Prisma? (Q1/22)" },
    update: {},
    create: {
      title: "What's new in Prisma? (Q1/22)",
      body: 'Our engineers have been working hard, issuing new releases with many improvements...',
      description: 'Learn about everything in the Prisma ecosystem and community from January to March 2022.',
      published: true,
    },
  });

  console.log({ post1, post2 });
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

> 💡 **Kenapa `upsert` bukan `create`?**
> `upsert` = **update + insert**. Jika data sudah ada → update, jika belum → create. Ini mencegah error duplikat saat menjalankan seed berulang kali.

### 6.2 Tambahkan Script Seed ke `package.json`

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 6.3 Jalankan Seed

```bash
npx prisma db seed
```

Output yang diharapkan:

```
🌱  The seed command has been executed.
```

---

## Langkah 7: Membuat Prisma Service

### 7.1 Generate Module & Service

```bash
npx nest generate module prisma
npx nest generate service prisma
```

### 7.2 Update Prisma Service

```typescript
// src/prisma/prisma.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {}
```

> 💡 **Penjelasan:** `PrismaService` mewarisi semua method dari `PrismaClient`, sehingga kita bisa menggunakannya untuk query database.

### 7.3 Export dari Prisma Module

```typescript
// src/prisma/prisma.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],  // ← Penting! Agar modul lain bisa menggunakan
})
export class PrismaModule {}
```

> 💡 **Kenapa `exports`?** Tanpa `exports`, modul lain (seperti Articles) tidak bisa mengakses `PrismaService`.

---

## Langkah 8: Menyiapkan Swagger

### 8.1 Instal Dependencies

```bash
npm install --save @nestjs/swagger swagger-ui-express
```

### 8.2 Konfigurasi Swagger di `main.ts`

```typescript
// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

### 8.3 Akses Swagger UI

Buka http://localhost:3000/api — kamu akan melihat dokumentasi API interaktif! 🎉

---

## Langkah 9: Membuat CRUD untuk Articles

### 9.1 Generate Resource

```bash
npx nest generate resource
```

Jawab pertanyaan CLI:
1. **Nama resource:** `articles`
2. **Transport layer:** `REST API`
3. **Generate CRUD?** `Yes`

### 9.2 Import PrismaModule ke Articles Module

```typescript
// src/articles/articles.module.ts

import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService],
  imports: [PrismaModule],  // ← Tambahkan ini
})
export class ArticlesModule {}
```

### 9.3 Inject PrismaService ke Articles Service

```typescript
// src/articles/articles.service.ts

import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  // CRUD operations akan diimplementasikan di bawah
}
```

### 9.4 Definisikan DTO (Data Transfer Object)

```typescript
// src/articles/dto/create-article.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ required: false, default: false })
  published?: boolean = false;
}
```

### 9.5 Implementasi Semua CRUD Operations

```typescript
// src/articles/articles.service.ts (lengkap)

import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  // CREATE — Membuat artikel baru
  create(createArticleDto: CreateArticleDto) {
    return this.prisma.article.create({ data: createArticleDto });
  }

  // READ — Mengambil semua artikel yang sudah dipublikasikan
  findAll() {
    return this.prisma.article.findMany({ where: { published: true } });
  }

  // READ — Mengambil semua artikel draft (belum dipublikasikan)
  findDrafts() {
    return this.prisma.article.findMany({ where: { published: false } });
  }

  // READ — Mengambil satu artikel berdasarkan ID
  findOne(id: number) {
    return this.prisma.article.findUnique({ where: { id } });
  }

  // UPDATE — Memperbarui artikel berdasarkan ID
  update(id: number, updateArticleDto: UpdateArticleDto) {
    return this.prisma.article.update({
      where: { id },
      data: updateArticleDto,
    });
  }

  // DELETE — Menghapus artikel berdasarkan ID
  remove(id: number) {
    return this.prisma.article.delete({ where: { id } });
  }
}
```

### 9.6 Update Controller

```typescript
// src/articles/articles.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ArticleEntity } from './entities/article.entity';

@Controller('articles')
@ApiTags('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiCreatedResponse({ type: ArticleEntity })
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  findAll() {
    return this.articlesService.findAll();
  }

  @Get('drafts')
  @ApiOkResponse({ type: ArticleEntity, isArray: true })
  findDrafts() {
    return this.articlesService.findDrafts();
  }

  @Get(':id')
  @ApiOkResponse({ type: ArticleEntity })
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ArticleEntity })
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(+id, updateArticleDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: ArticleEntity })
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
```

### 📊 Rangkuman Endpoint yang Dibuat

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/articles` | Membuat artikel baru |
| `GET` | `/articles` | Mengambil semua artikel yang dipublikasikan |
| `GET` | `/articles/drafts` | Mengambil semua artikel draft |
| `GET` | `/articles/:id` | Mengambil satu artikel berdasarkan ID |
| `PATCH` | `/articles/:id` | Memperbarui artikel berdasarkan ID |
| `DELETE` | `/articles/:id` | Menghapus artikel berdasarkan ID |

---

## Langkah 10: Mengatur Response Types di Swagger

### 10.1 Buat Article Entity

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
}
```

> 💡 **Kenapa `implements Article`?** Ini memastikan `ArticleEntity` memiliki field yang sama persis dengan model Prisma. TypeScript akan memberi peringatan jika ada yang kurang.

---

## Ringkasan

Selamat! 🎉 Di chapter ini kamu sudah berhasil:

| ✅ | Yang Sudah Dipelajari |
|----|----------------------|
| 1 | Membuat proyek NestJS dari nol |
| 2 | Menjalankan PostgreSQL dengan Docker |
| 3 | Mengintegrasikan Prisma sebagai ORM |
| 4 | Membuat model data dan migrasi database |
| 5 | Membuat seed untuk data awal |
| 6 | Membangun CRUD REST API untuk Articles |
| 7 | Mendokumentasikan API dengan Swagger |

### ➡️ Selanjutnya

Di **[Chapter 2](../chapter-2/README.md)**, kamu akan belajar:
- Validasi input menggunakan `ValidationPipe`
- Transformasi data URL dengan `ParseIntPipe`
- Error handling dengan Exception Filters

---

## 📝 Laporan Praktikum — Chapter 1

> **Instruksi:** Centang setiap langkah yang sudah selesai dikerjakan sebagai bukti laporan praktikum.
> Ubah `[x]` menjadi `[x]` untuk menandai selesai.

### Persiapan Lingkungan
- [x] Menginstal Node.js dan npm
- [x] Menginstal Docker Desktop
- [x] Menginstal ekstensi Prisma di VS Code

### Setup Proyek NestJS
- [x] Membuat proyek baru dengan `npx @nestjs/cli new .`
- [x] Menjalankan server development (`npm run start:dev`)
- [x] Mengakses `http://localhost:3000` dan melihat "Hello World!"

### Setup Database PostgreSQL
- [x] Membuat file `docker-compose.yml`
- [x] Menjalankan container PostgreSQL dengan `docker-compose up`
- [x] Memverifikasi database berjalan di port 5432

### Setup Prisma
- [x] Menginstal Prisma CLI (`npm install -D prisma`)
- [x] Menginisialisasi Prisma (`npx prisma init`)
- [x] Mengonfigurasi `DATABASE_URL` di file `.env`

### Model Data & Migrasi
- [x] Membuat model `Article` di `prisma/schema.prisma`
- [x] Menjalankan migrasi pertama (`npx prisma migrate dev --name "init"`)
- [x] Memverifikasi tabel `Article` berhasil dibuat

### Seed Database
- [x] Membuat file `prisma/seed.ts`
- [x] Menambahkan konfigurasi seed di `package.json`
- [x] Menjalankan seed (`npx prisma db seed`)
- [x] Memverifikasi data berhasil masuk ke database

### Prisma Service
- [x] Membuat Prisma module (`npx nest generate module prisma`)
- [x] Membuat Prisma service (`npx nest generate service prisma`)
- [x] Mengonfigurasi `PrismaService` extends `PrismaClient`
- [x] Menambahkan `PrismaService` ke `exports` di `PrismaModule`

### Swagger
- [x] Menginstal dependensi Swagger (`@nestjs/swagger`, `swagger-ui-express`)
- [x] Mengonfigurasi Swagger di `main.ts`
- [x] Mengakses Swagger UI di `http://localhost:3000/api`

### CRUD Articles
- [x] Membuat resource Articles (`npx nest generate resource`)
- [x] Mengimpor `PrismaModule` di `ArticlesModule`
- [x] Mengimplementasikan `POST /articles` (Create)
- [x] Mengimplementasikan `GET /articles` (Read All - Published)
- [x] Mengimplementasikan `GET /articles/drafts` (Read All - Drafts)
- [x] Mengimplementasikan `GET /articles/:id` (Read One)
- [x] Mengimplementasikan `PATCH /articles/:id` (Update)
- [x] Mengimplementasikan `DELETE /articles/:id` (Delete)

### Swagger Response Types
- [x] Membuat `ArticleEntity` dengan decorator `@ApiProperty`
- [x] Menambahkan `@ApiOkResponse` / `@ApiCreatedResponse` ke setiap endpoint
- [x] Menambahkan `@ApiTags('articles')` ke controller
- [x] Memverifikasi response types muncul di Swagger UI

### ✅ Status Chapter 1
- [x] **SEMUA LANGKAH SELESAI** — Chapter 1 telah dikerjakan seluruhnya

| Item | Keterangan |
|------|------------|
| Nama | _____ANUGRAH ALIFIANDI____________________ |
| NIM | ______105841110821___________________ |
| Tanggal | _________09-FEBRUARI-2026________________ |
| Tanda Tangan | _________________________ |
