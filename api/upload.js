const { google } = require('googleapis');
const stream = require('stream');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { csvContent, fileName } = req.body;

        // Configuração da Autenticação usando variáveis de ambiente
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Corrige quebras de linha
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Transforma a string CSV em um stream legível para o Drive
        const bufferStream = new stream.PassThrough();
        bufferStream.end(csvContent);

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // ID da pasta
                mimeType: 'text/csv',
            },
            media: {
                mimeType: 'text/csv',
                body: bufferStream,
            },
        });

        return res.status(200).json({ success: true, fileId: response.data.id });

    } catch (error) {
        console.error('Erro no upload:', error);
        return res.status(500).json({ error: 'Falha ao salvar no Drive', details: error.message });
    }
}