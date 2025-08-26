// Script temporário para testar o checklist aprimorado
import { ChecklistService } from './src/services/ChecklistService';
import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function testChecklistEnhancement() {
  try {
    console.log('🧪 Testando checklist aprimorado...\n');
    
    // Criar usuário de teste temporário
    console.log('0. Criando usuário de teste...');
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-checklist-12345',
        email: 'teste-checklist@example.com',
        name: 'Usuário Teste Checklist'
      }
    });
    console.log(`👤 Usuário criado: ${testUser.email}`);
    
    const userId = testUser.id;
    
    // 1. Criar nova sessão com 50 itens
    console.log('\n1. Criando nova sessão...');
    const newSession = await ChecklistService.createSession(userId, 'Teste Checklist v2');
    
    if (newSession) {
      console.log(`✅ Sessão criada: ${newSession.id}`);
      console.log(`📝 Título: ${newSession.title}`);
      console.log(`📊 Total de itens: ${newSession.total_items}`);
      console.log(`🏷️  Versão do template: ${newSession.template_version}`);
      console.log(`📋 Itens carregados: ${newSession.items?.length || 0}`);
      
      // Verificar algumas categorias
      if (newSession.items && newSession.items.length > 0) {
        const categories = [...new Set(newSession.items.map(item => item.category))];
        console.log(`🗂️  Categorias encontradas (${categories.length}): ${categories.join(', ')}`);
        
        // Mostrar alguns itens de exemplo
        console.log('\n📋 Exemplos de itens:');
        newSession.items.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. [${item.category}] ${item.text}`);
        });
        
        // Testar atualização de um item
        console.log('\n2. Testando atualização de item...');
        const firstItem = newSession.items[0];
        const updatedSession = await ChecklistService.updateItem(userId, newSession.id, firstItem.item_id, true);
        
        if (updatedSession) {
          console.log(`✅ Item atualizado: ${firstItem.text.substring(0, 50)}... - Checked: true`);
          console.log(`📊 Progresso: ${updatedSession.progress}/${updatedSession.total_items}`);
        }
      }
      
      // 3. Listar sessões
      console.log('\n3. Listando sessões do usuário...');
      const sessions = await ChecklistService.listSessions(userId);
      console.log(`📋 Sessões encontradas: ${sessions.length}`);
      sessions.forEach(s => {
        console.log(`  - ${s.title} (v${s.template_version}) - Progresso: ${s.progress}/${s.total_items}`);
      });
      
      // 4. Obter sessão com itens
      console.log('\n4. Obtendo sessão com itens...');
      const sessionWithItems = await ChecklistService.getSessionWithItems(userId, newSession.id);
      if (sessionWithItems) {
        console.log(`✅ Sessão carregada com ${sessionWithItems.items.length} itens`);
        console.log(`🏷️  Versão confirmada: ${sessionWithItems.template_version}`);
      }
      
      // 5. Limpar teste
      console.log('\n5. Limpando dados de teste...');
      await ChecklistService.deleteSession(userId, newSession.id);
      console.log('🗑️  Sessão de teste removida');
    }
    
    // Limpar usuário de teste
    await prisma.user.delete({ where: { id: userId } });
    console.log('👤 Usuário de teste removido');
    
    console.log('\n🎉 Teste concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testChecklistEnhancement().then(() => {
  console.log('\n✨ Checklist aprimorado funcionando corretamente!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Falha no teste:', error);
  process.exit(1);
});
