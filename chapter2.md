# 📖 Chapter 2: Validasi Input & Error Handling

> **Tujuan:** Belajar memvalidasi data input dari client, mentransformasi parameter URL, dan menangani error secara profesional menggunakan Exception Filters.

---

## 📋 Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Bagian A: Validasi Input](#bagian-a-validasi-input)
   - [Langkah 1: Memahami Pipes di NestJS](#langkah-1-memahami-pipes-di-nestjs)
   - [Langkah 2: Mengaktifkan ValidationPipe](#langkah-2-mengaktifkan-validationpipe)
   - [Langkah 3: Menambahkan Aturan Validasi ke DTO](#langkah-3-menambahkan-aturan-validasi-ke-dto)
   - [Langkah 4: Memfilter Properti yang Tidak Diperlukan](#langkah-4-memfilter-properti-yang-tidak-diperlukan)
3. [Bagian B: Transformasi Input](#bagian-b-transformasi-input)
   - [Langkah 5: Menggunakan ParseIntPipe](#langkah-5-menggunakan-parseintpipe)
4. [Bagian C: Error Handling](#bagian-c-error-handling)
   - [Langkah 6: Melempar Exception Secara Langsung](#langkah-6-melempar-exception-secara-langsung)
   - [Langkah 7: Membuat Exception Filter](#langkah-7-membuat-exception-filter)
   - [Langkah 8: Menerapkan Exception Filter](#langkah-8-menerapkan-exception-filter)
5. [Ringkasan](#ringkasan)

---

## Pendahuluan

Di Chapter 1, kita sudah membangun REST API dasar. Tapi ada beberapa masalah:

| ❌ Masalah | 💡 Solusi |
|-----------|----------|
| Client bisa mengirim data sembarangan | **Validasi Input** |
| Parameter URL `id` diterima sebagai string | **Transformasi Input** |
| Error database mengembalikan "Internal Server Error" | **Exception Filter** |
| Client bisa mengirim field yang tidak diinginkan | **Whitelist Filtering** |

Mari kita perbaiki satu per satu!

---

## Bagian A: Validasi Input

### Langkah 1: Memahami Pipes di NestJS

**Pipes** adalah fitur NestJS yang memproses data **sebelum** sampai ke route handler.

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Client  │ ──> │   Pipe   │ ──> │ Route Handler│
│ (Request)│     │(Validasi)│     │ (Controller) │
└──────────┘     └──────────┘     └──────────────┘
                      │
                  Jika invalid
                      │
                      ▼
               ┌──────────────┐
               │ Error 400    │
               │ Bad Request  │
               └──────────────┘
```

Pipes punya **2 kegunaan utama:**
1. **Validasi** — Memeriksa apakah data valid, jika tidak → lempar exception
2. **Transformasi** — Mengubah data ke bentuk yang diinginkan (misal: string → number)

### Langkah 2: Mengaktifkan ValidationPipe

#### 2.1 Instal Package yang Diperlukan

```bash
npm install class-validator class-transformer
```

| Package | Fungsi |
|---------|--------|
| `class-validator` | Menyediakan decorator untuk validasi (seperti `@IsString()`, `@MinLength()`) |
| `class-transformer` | Menyediakan decorator untuk transformasi data |

#### 2.2 Aktifkan ValidationPipe Secara Global

Update `src/main.ts`:

```typescript
// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';  // ← Tambahkan

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Aktifkan validasi global dengan whitelist
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

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

> 💡 **`whitelist: true`** → Secara otomatis membuang field yang tidak didefinisikan di DTO. Ini mencegah client mengirim data berbahaya!

### Langkah 3: Menambahkan Aturan Validasi ke DTO

Update `src/articles/dto/create-article.dto.ts`:

```typescript
// src/articles/dto/create-article.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @ApiProperty()
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  @ApiProperty({ required: false })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  body: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  published?: boolean = false;
}
```

#### Penjelasan Decorator Validasi

| Decorator | Fungsi |
|-----------|--------|
| `@IsString()` | Memastikan nilai bertipe string |
| `@IsNotEmpty()` | Memastikan nilai tidak kosong |
| `@MinLength(5)` | Minimum 5 karakter |
| `@MaxLength(300)` | Maksimum 300 karakter |
| `@IsOptional()` | Field boleh tidak diisi |
| `@IsBoolean()` | Memastikan nilai bertipe boolean |

#### Contoh: Request yang Tidak Valid

Jika kamu mengirim request berikut ke `POST /articles`:

```json
{
  "title": "Hi",
  "body": ""
}
```

Kamu akan mendapat response **HTTP 400** seperti ini:

```json
{
  "statusCode": 400,
  "message": [
    "title must be longer than or equal to 5 characters",
    "body should not be empty"
  ],
  "error": "Bad Request"
}
```

> 💡 **Keren kan?** NestJS otomatis memberikan pesan error yang jelas untuk setiap aturan yang dilanggar!

### Langkah 4: Memfilter Properti yang Tidak Diperlukan

Dengan `whitelist: true` yang sudah kita aktifkan di Langkah 2, NestJS akan **otomatis membuang** field yang tidak ada di DTO.

#### Contoh: Tanpa Whitelist ❌

```json
// Request ke POST /articles
{
  "title": "Artikel Test",
  "body": "Isi artikel",
  "createdAt": "2020-01-01",   // ← Field ini TIDAK ada di DTO
  "hackerField": "malicious"    // ← Field ini juga TIDAK ada
}
```

**Tanpa whitelist:** Semua field diteruskan ke database (BAHAYA! 🚨)

**Dengan whitelist:** Hanya `title`, `body` yang diteruskan, field lain dibuang ✅

---

## Bagian B: Transformasi Input

### Langkah 5: Menggunakan ParseIntPipe

#### Masalah

Parameter URL di NestJS selalu diterima sebagai **string**. Tapi `id` di model kita bertipe **number**.

```typescript
// SEBELUM: id adalah string "123"
@Get(':id')
findOne(@Param('id') id: string) {
  return this.articlesService.findOne(+id);  // harus convert manual
}
```

#### Solusi: ParseIntPipe

```typescript
// SESUDAH: id otomatis jadi number 123
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.articlesService.findOne(id);  // sudah number!
}
```

#### Update Controller Lengkap

```typescript
// src/articles/articles.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,  // ← Tambahkan
} from '@nestjs/common';

@Controller('articles')
@ApiTags('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  // ... (POST dan GET findAll tetap sama)

  @Get(':id')
  @ApiOkResponse({ type: ArticleEntity })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ArticleEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: ArticleEntity })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.remove(id);
  }
}
```

**Keuntungan `ParseIntPipe`:**

| Sebelum | Sesudah |
|---------|---------|
| `id` bertipe `string` | `id` bertipe `number` |
| Harus convert manual (`+id`) | Otomatis dikonversi |
| Swagger menunjukkan `string` | Swagger menunjukkan `integer` ✅ |
| Tidak ada validasi | Jika bukan angka → Error 400 otomatis |

---

## Bagian C: Error Handling

### Langkah 6: Melempar Exception Secara Langsung

#### Masalah

Saat ini, jika kamu request artikel dengan ID yang tidak ada:

```
GET /articles/99999
```

Hasilnya: **HTTP 200 dengan body kosong** 😕

Seharusnya: **HTTP 404 Not Found** ✅

#### Solusi: Throw NotFoundException

```typescript
// src/articles/articles.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,  // ← Tambahkan
} from '@nestjs/common';

// ... di dalam controller:

@Get(':id')
@ApiOkResponse({ type: ArticleEntity })
async findOne(@Param('id', ParseIntPipe) id: number) {
  const article = await this.articlesService.findOne(id);

  if (!article) {
    throw new NotFoundException(`Article with ID ${id} does not exist.`);
  }

  return article;
}
```

Sekarang, request ke ID yang tidak ada akan mengembalikan:

```json
{
  "statusCode": 404,
  "message": "Article with ID 99999 does not exist.",
  "error": "Not Found"
}
```

#### Exception Bawaan NestJS yang Berguna

| Exception | HTTP Code | Kapan Digunakan |
|-----------|-----------|-----------------|
| `BadRequestException` | 400 | Data request tidak valid |
| `UnauthorizedException` | 401 | Belum login / token invalid |
| `ForbiddenException` | 403 | Tidak punya akses |
| `NotFoundException` | 404 | Resource tidak ditemukan |
| `ConflictException` | 409 | Data konflik (duplikat) |

### Langkah 7: Membuat Exception Filter

#### Masalah

Beberapa error dari Prisma **tidak ditangani** secara otomatis. Contoh: mencoba membuat artikel dengan judul yang sudah ada.

```json
// POST /articles (judul duplikat)
{
  "statusCode": 500,
  "message": "Internal server error"   // ← Tidak informatif! 😕
}
```

#### Solusi: Exception Filter untuk Prisma

##### 7.1 Generate Filter

```bash
npx nest generate filter prisma-client-exception
```

##### 7.2 Implementasi Filter

```typescript
// src/prisma-client-exception/prisma-client-exception.filter.ts

import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.error(exception.message);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    switch (exception.code) {
      // Unique constraint violation
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: message,
        });
        break;
      }

      // Record not found
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: message,
        });
        break;
      }

      // Default: Internal Server Error
      default:
        super.catch(exception, host);
        break;
    }
  }
}
```

#### Penjelasan Kode Error Prisma

| Kode | Arti | HTTP Status |
|------|------|-------------|
| `P2002` | Unique constraint violation (data duplikat) | 409 Conflict |
| `P2025` | Record tidak ditemukan | 404 Not Found |
| Lainnya | Error tidak dikenal | 500 Internal Server Error |

### Langkah 8: Menerapkan Exception Filter

Update `src/main.ts` untuk mengaktifkan filter secara global:

```typescript
// src/main.ts

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validasi input
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Median')
    .setDescription('The Median API description')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // ✅ Exception Filter untuk Prisma errors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  await app.listen(3000);
}
bootstrap();
```

#### Hasil: Error yang Lebih Informatif

**Sebelum (tanpa filter):**
```json
{ "statusCode": 500, "message": "Internal server error" }
```

**Sesudah (dengan filter):**
```json
{
  "statusCode": 409,
  "message": "Unique constraint failed on the fields: (`title`)"
}
```

---

## 💡 Bonus: Alur Lengkap Request → Response

```
Client Request
     │
     ▼
┌─────────────────┐
│ ValidationPipe   │ ← Validasi input (DTO rules)
│ ParseIntPipe     │ ← Transformasi parameter URL
└─────────────────┘
     │ (valid)
     ▼
┌─────────────────┐
│ Controller       │ ← Route handler
│ (findOne, dll)   │ ← Manual check (NotFoundException)
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Service          │ ← Business logic
│ (Prisma query)   │
└─────────────────┘
     │
     ▼ (jika error)
┌─────────────────┐
│ Exception Filter │ ← Tangkap Prisma errors
│ (P2002, P2025)   │ ← Convert ke HTTP error yang jelas
└─────────────────┘
     │
     ▼
Client Response (JSON)
```

---

## Ringkasan

| ✅ | Yang Sudah Dipelajari |
|----|----------------------|
| 1 | Mengaktifkan `ValidationPipe` untuk validasi input |
| 2 | Menggunakan decorator validasi (`@IsString`, `@MinLength`, dll) |
| 3 | Memfilter field yang tidak diinginkan dengan `whitelist` |
| 4 | Mentransformasi parameter URL dengan `ParseIntPipe` |
| 5 | Melempar exception secara langsung (`NotFoundException`) |
| 6 | Membuat Exception Filter untuk error Prisma |
| 7 | Mengubah error 500 menjadi error yang informatif (409, 404) |

### ➡️ Selanjutnya

Di **[Chapter 3](../chapter-3/README.md)**, kamu akan belajar:
- Menambahkan model `User` dan relasi one-to-many
- Membuat CRUD endpoints untuk Users
- Menyembunyikan field sensitif (password) dari response

---

## 📝 Laporan Praktikum — Chapter 2

> **Instruksi:** Centang setiap langkah yang sudah selesai dikerjakan sebagai bukti laporan praktikum.
> Ubah `[ ]` menjadi `[x]` untuk menandai selesai.

### Part A: Validasi Input
- [x] Menginstal `class-validator` dan `class-transformer`
- [x] Mengaktifkan `ValidationPipe` secara global di `main.ts`
- [x] Menambahkan decorator validasi ke `CreateArticleDto` (`@IsNotEmpty`, `@IsString`, `@IsBoolean`, dll)
- [x] Menguji validasi — mengirim body kosong dan melihat error 400
- [x] Menguji validasi — mengirim tipe data yang salah dan melihat error 400
- [x] Mengaktifkan opsi `whitelist: true` di `ValidationPipe`
- [x] Menguji whitelist — mengirim field tambahan dan memverifikasi field tersebut dibuang

### Part B: Transformasi Parameter
- [x] Menambahkan `ParseIntPipe` ke parameter `id` di endpoint `GET /articles/:id`
- [x] Menambahkan `ParseIntPipe` ke parameter `id` di endpoint `PATCH /articles/:id`
- [x] Menambahkan `ParseIntPipe` ke parameter `id` di endpoint `DELETE /articles/:id`
- [x] Menguji — mengirim `id` berupa string (contoh: `abc`) dan melihat error 400
- [x] Menguji — mengirim `id` berupa angka dan memverifikasi berhasil

### Part C: Error Handling
- [x] Menambahkan `NotFoundException` di `findOne` (ketika artikel tidak ditemukan)
- [x] Menguji — mengakses artikel yang tidak ada dan melihat error 404
- [x] Membuat file `PrismaClientExceptionFilter`
- [x] Menangani error `P2002` (Unique constraint violation) → 409 Conflict
- [x] Menangani error `P2025` (Record not found) → 404 Not Found
- [x] Mendaftarkan `PrismaClientExceptionFilter` secara global di `main.ts`
- [x] Menguji — membuat artikel dengan judul duplikat dan melihat error 409
- [x] Menguji — mengupdate/menghapus artikel yang tidak ada dan melihat error 404

### Verifikasi Akhir
- [x] Semua endpoint validasi berfungsi dengan benar
- [x] Error response menampilkan pesan yang jelas dan informatif
- [x] Tidak ada error 500 (Internal Server Error) yang tidak tertangani

### ✅ Status Chapter 2
- [x] **SEMUA LANGKAH SELESAI** — Chapter 2 telah dikerjakan seluruhnya

| Item | Keterangan |
|------|------------|
| Nama | ___________ANUGRAH ALIFIANDI______________ |
| NIM | _____________105841110821____________ |
| Tanggal | ____________09-FEBRUARI-2026_____________ |
| Tanda Tangan | _________________________ |
