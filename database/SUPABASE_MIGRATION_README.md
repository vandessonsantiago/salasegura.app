# 📄 Scripts de Migração para Supabase

## 🎯 Scripts Disponíveis

### 1. **supabase_migration.sql** (Automático)
- ✅ **Executa limpeza automática** de duplicatas
- ✅ **Adiciona constraints únicos** imediatamente
- ✅ **Mantém o agendamento mais recente** em caso de duplicatas
- ⚠️  **Cuidado:** Pode remover dados automaticamente

### 2. **supabase_migration_safe.sql** (Manual)
- 🔍 **Apenas analisa** duplicatas existentes
- 📋 **Mostra exemplos** de duplicatas encontradas
- 🛑 **Não remove dados** automaticamente
- ✅ **Permite decisão manual** sobre limpeza

## 🚀 Como Executar no Supabase

### Passo 1: Acesse o Supabase Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Entre no seu projeto
3. Navegue para **SQL Editor**

### Passo 2: Execute o Script
1. Copie o conteúdo do arquivo desejado
2. Cole no SQL Editor
3. Clique em **Run** ou pressione **Ctrl+Enter**

### Passo 3: Verifique os Resultados
- Observe os logs no painel de saída
- Verifique se as constraints foram adicionadas
- Confirme que não há erros

## 📊 O que Cada Script Faz

### Script Automático (`supabase_migration.sql`)
```sql
1. Cria backup da tabela (opcional)
2. Conta duplicatas existentes
3. Remove duplicatas (mantém mais recente)
4. Adiciona constraints únicos
5. Cria índices de performance
6. Log de conclusão
```

### Script Seguro (`supabase_migration_safe.sql`)
```sql
1. Analisa duplicatas sem removê-las
2. Mostra exemplos de duplicatas
3. (Comentado) Limpeza manual se desejada
4. (Comentado) Adição de constraints
5. Verificação final
```

## 🔍 Verificação Pós-Migração

Após executar qualquer script, verifique:

```sql
-- Verificar se constraints foram adicionadas
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'agendamentos'
AND constraint_name LIKE '%unique%';

-- Verificar se ainda há duplicatas
SELECT user_id, data, horario, COUNT(*)
FROM agendamentos
WHERE user_id IS NOT NULL
GROUP BY user_id, data, horario
HAVING COUNT(*) > 1;

-- Verificar índices criados
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'agendamentos'
AND indexname LIKE '%unique%';
```

## ⚠️ Importante

### Antes de Executar:
- ✅ **Faça backup** dos dados importantes
- ✅ **Teste em staging** primeiro se possível
- ✅ **Verifique duplicatas** existentes
- ✅ **Entenda o impacto** da limpeza automática

### Após Executar:
- ✅ **Teste a aplicação** completamente
- ✅ **Monitore logs** por alguns dias
- ✅ **Verifique performance** das queries
- ✅ **Atualize documentação** se necessário

## 🆘 Troubleshooting

### Se o script falhar:
1. **Verifique permissões** do usuário no Supabase
2. **Confirme que não há locks** na tabela
3. **Execute em partes** se necessário
4. **Verifique logs de erro** detalhados

### Se constraints não forem adicionadas:
1. **Certifique-se** de que não há duplicatas restantes
2. **Verifique sintaxe** do comando ALTER TABLE
3. **Confirme** que a tabela existe

### Se performance degradar:
1. **Monitore queries** que usam os novos índices
2. **Ajuste índices** se necessário
3. **Considere índices parciais** para casos específicos

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Teste com dados de exemplo primeiro
3. Consulte a documentação do PostgreSQL
4. Entre em contato se precisar de ajuda específica

---

**Status:** ✅ Scripts prontos para execução
**Data:** 31 de agosto de 2025
