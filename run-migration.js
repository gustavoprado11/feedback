// Script para executar migration no Supabase
// Execute com: node run-migration.js

const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔄 Executando migration: add_weekly_reports_enabled...\n');

  try {
    // Ler o arquivo SQL
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260112_add_weekly_reports_enabled.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 SQL a ser executado:');
    console.log(sql);
    console.log('\n');

    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erro ao executar migration:', error.message);

      // Tentar executar manualmente
      console.log('\n⚠️ Tentando executar comando por comando...\n');

      // Adicionar coluna
      const { error: error1 } = await supabase.from('establishments').select('weekly_reports_enabled').limit(1);

      if (error1 && error1.message.includes('column')) {
        console.log('✅ Coluna weekly_reports_enabled já existe ou precisa ser criada manualmente');
        console.log('\nExecute este SQL manualmente no Supabase Dashboard:');
        console.log('----------------------------------------');
        console.log(sql);
        console.log('----------------------------------------');
      } else {
        console.log('✅ Coluna weekly_reports_enabled já existe!');
      }

      return;
    }

    console.log('✅ Migration executada com sucesso!');
    console.log('Dados:', data);

    // Verificar se a coluna foi criada
    const { data: testData, error: testError } = await supabase
      .from('establishments')
      .select('id, name, weekly_reports_enabled')
      .limit(1);

    if (testError) {
      console.error('\n⚠️ Erro ao verificar coluna:', testError.message);
      console.log('\nPor favor, execute este SQL manualmente no Supabase Dashboard:');
      console.log('----------------------------------------');
      console.log(sql);
      console.log('----------------------------------------');
    } else {
      console.log('\n✅ Coluna weekly_reports_enabled verificada com sucesso!');
      if (testData && testData.length > 0) {
        console.log('Exemplo:', testData[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.log('\n⚠️ Execute este SQL manualmente no Supabase Dashboard:');
    console.log('----------------------------------------');
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260112_add_weekly_reports_enabled.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log(sql);
    console.log('----------------------------------------');
  }
}

runMigration();
