// Test OpenAI integration  
import aiService from './src/services/aiService.js';

async function testOpenAI() {
  console.log('🧪 Testing OpenAI integration...\n');
  
  try {
    // Switch to OpenAI provider
    console.log('📡 Switching to OpenAI provider...');
    await aiService.switchProvider('openai');
    
    console.log('✅ Switched to OpenAI successfully\n');
    
    // Test DBML generation
    const prompt = 'Crear un diagrama conceptual con las tablas usuarios, roles, permisos. Los atributos genera tu.';
    
    console.log('🤖 Generating DBML with OpenAI...');
    console.log(`📝 Prompt: "${prompt}"\n`);
    
    const result = await aiService.generateDbml(prompt);
    
    console.log('✅ OpenAI Response:');
    console.log('Provider:', result.provider);
    console.log('Success:', result.success);
    console.log('Duration:', result.duration + 'ms');
    console.log('Explanation:', result.explanation);
    console.log('\n📄 Generated DBML:');
    console.log('---');
    console.log(result.dbmlCode);
    console.log('---\n');
    
    // Switch back to Gemini
    console.log('🔄 Switching back to Gemini...');
    await aiService.switchProvider('gemini');
    console.log('✅ Switched back to Gemini\n');
    
    console.log('🎉 OpenAI integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing OpenAI:', error.message);
    console.error('Details:', error);
  }
}

testOpenAI();