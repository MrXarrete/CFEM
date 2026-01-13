const { google } = require('googleapis');
const stream = require('stream');

export default async function handler(req, res) {
    // 1. Validação de Método
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 2. Debug: Verificar se as variáveis existem (sem revelar o valor por segurança)
        if (!process.env.GOOGLE_CLIENT_EMAIL) {
            throw new Error('ERRO DE CONFIGURAÇÃO: A variável GOOGLE_CLIENT_EMAIL está faltando na Vercel.');
        }
        if (!process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error('ERRO DE CONFIGURAÇÃO: A variável GOOGLE_PRIVATE_KEY está faltando na Vercel.');
        }
        if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
            throw new Error('ERRO DE CONFIGURAÇÃO: A variável GOOGLE_DRIVE_FOLDER_ID está faltando na Vercel.');
        }

        const { csvContent, fileName } = req.body;

        // 3. Tratamento da Chave Privada
        // Isso resolve o problema tanto se a chave tiver quebras de linha reais quanto literais (\n)
        const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

        // 4. Autenticação Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // 5. Preparar o Arquivo
        const bufferStream = new stream.PassThrough();
        bufferStream.end(csvContent);

        // 6. Upload
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
                mimeType: 'text/csv',
            },
            media: {
                mimeType: 'text/csv',
                body: bufferStream,
            },
        });

        return res.status(200).json({ success: true, fileId: response.data.id });

    } catch (error) {
        console.error('Erro detalhado:', error);
        // Retorna a mensagem de erro exata para o frontend (navegador) para facilitar o debug
        return res.status(500).json({ 
            error: 'Falha no servidor', 
            details: error.message 
        });
    }
}