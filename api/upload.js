const { google } = require('googleapis');
const stream = require('stream');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Limpeza e Validação das Variáveis
        // O .trim() remove espaços vazios acidentais no início ou fim
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL ? process.env.GOOGLE_CLIENT_EMAIL.trim() : null;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : null;
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID ? process.env.GOOGLE_DRIVE_FOLDER_ID.trim() : null;

        if (!clientEmail || !privateKey || !folderId) {
            throw new Error('CONFIGURAÇÃO INCOMPLETA: Verifique as variáveis de ambiente na Vercel.');
        }

        const { csvContent, fileName } = req.body;

        // 2. Autenticação
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/drive'], // Escopo mais amplo para evitar erros de permissão
        });

        const drive = google.drive({ version: 'v3', auth });

        // 3. Preparar Stream
        const bufferStream = new stream.PassThrough();
        bufferStream.end(csvContent);

        // 4. Upload com parâmetros de segurança
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId], // Obrigatório: ID da pasta destino
                mimeType: 'text/csv',
            },
            media: {
                mimeType: 'text/csv',
                body: bufferStream,
            },
            fields: 'id', // Retorna apenas o ID para economizar dados
            supportsAllDrives: true, // Importante: Permite salvar em Drives Compartilhados se necessário
        });

        return res.status(200).json({ success: true, fileId: response.data.id });

    } catch (error) {
        console.error('Erro detalhado:', error);
        
        // Mensagem amigável para o erro de Quota
        if (error.message && error.message.includes('Service Accounts do not have storage quota')) {
            return res.status(403).json({ 
                error: 'Erro de Permissão ou ID', 
                details: 'O Robô não encontrou a pasta. Verifique se o ID da pasta na Vercel está correto e se o email do robô é EDITOR dessa pasta.' 
            });
        }

        return res.status(500).json({ 
            error: 'Falha no servidor', 
            details: error.message 
        });
    }
}