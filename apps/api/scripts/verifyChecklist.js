/* Script: verifica existência da coluna template_version e conta itens */
const { PrismaClient } = require('../src/generated/prisma');

(async () => {
  const prisma = new PrismaClient();
  try {
    const cols = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'checklist_sessions' ORDER BY ordinal_position;`;
    console.log('Colunas checklist_sessions:', cols);
    const hasTemplateVersion = Array.isArray(cols) && cols.some(c => c.column_name === 'template_version');
    console.log('template_version presente?', hasTemplateVersion);
    if (!hasTemplateVersion) {
      console.log('Aplicando ALTER TABLE para adicionar template_version...');
      await prisma.$executeRawUnsafe('ALTER TABLE "public"."checklist_sessions" ADD COLUMN IF NOT EXISTS "template_version" INTEGER NOT NULL DEFAULT 1');
      const cols2 = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'checklist_sessions';`;
      console.log('Colunas após tentativa ALTER:', cols2);
    }
    const countSessions = await prisma.checklistSession.count();
    console.log('Total de sessões de checklist:', countSessions);
    if (countSessions > 0) {
      const one = await prisma.checklistSession.findFirst({ include: { items: true } });
      console.log('Exemplo de sessão:', { id: one.id, total_items: one.total_items, items: one.items.length, template_version: one.template_version });
    }
  } catch (e) {
    console.error('Erro no script de verificação:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
