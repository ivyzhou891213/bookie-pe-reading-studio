import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.type !== 'application/pdf')
      return Response.json({ error: '请选择 PDF 文件。' }, { status: 400 });
    if (file.size > 180 * 1024 * 1024)
      return Response.json(
        { error: '单个 PDF 请控制在 180MB 内。' },
        { status: 413 },
      );
    const id = `book-${randomUUID()}`;
    const targetDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(targetDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(targetDir, `${id}.pdf`), buffer);
    const title =
      file.name
        .replace(/\.pdf$/i, '')
        .replace(/[_-]+/g, ' ')
        .trim() || '未命名书籍';
    const pages = Math.max(
      1,
      (buffer.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length,
    );
    return Response.json({
      book: {
        id,
        title,
        short: 'MY',
        file: `/uploads/${id}.pdf`,
        cover: '/book-placeholder.svg',
        pages,
        color: '#1d1d1f',
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '上传失败。' },
      { status: 500 },
    );
  }
}
