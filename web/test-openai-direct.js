// Test OpenAI integration usando CommonJS
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno manualmente
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

async function testOpenAI() {
  console.log('🧪 Testing OpenAI integration...\n');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in .env file');
    }
    
    console.log('✅ OpenAI API Key found\n');
    
    const prompt = 'Crear un diagrama conceptual con las tablas usuarios, roles, permisos. Los atributos genera tu.';
    
    console.log('🤖 Testing OpenAI API directly...');
    console.log(`📝 Prompt: "${prompt}"\n`);
    
    const systemPrompt = `Eres un arquitecto de bases de datos experto especializado en generar código DBML válido y bien estructurado.

REGLAS OBLIGATORIAS:
1. Genera SOLO código DBML válido, sin explicaciones adicionales
2. Usa nombres en inglés para tablas y campos (snake_case)
3. Incluye siempre primary keys con [pk]
4. Añade timestamps: created_at, updated_at con [default: \`now()\`]
5. Usa referencias explícitas: Ref: tabla1.campo > tabla2.campo
6. Para relaciones many-to-many, crea tablas intermedias

EJEMPLO DE FORMATO:
Table users {
  id integer [pk, increment]
  username varchar(50) [unique, not null]
  created_at timestamp [default: \`now()\`]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    const dbmlCode = result.choices[0].message.content.trim();
    
    console.log('✅ OpenAI Response received!');
    console.log('Model:', result.model);
    console.log('Usage tokens:', result.usage?.total_tokens || 'N/A');
    console.log('\n📄 Generated DBML:');
    console.log('---');
    console.log(dbmlCode);
    console.log('---\n');
    
    console.log('🎉 OpenAI integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing OpenAI:', error.message);
    
    if (error.message.includes('401')) {
      console.error('🔑 API Key might be invalid or expired');
    } else if (error.message.includes('429')) {
      console.error('⏱️ Rate limit exceeded, try again later');
    } else if (error.message.includes('insufficient_quota')) {
      console.error('💰 OpenAI quota exceeded');
    }
  }
}

testOpenAI();