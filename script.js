// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const form = document.getElementById('data-form');
    const addBtn = document.getElementById('add-btn');
    const downloadBtn = document.getElementById('download-btn');
    const contador = document.getElementById('contador');

    // Array para armazenar os dados a serem exportados (padrão "acumulador")
    let dataToExport = [];

    // Evento de clique para o botão "Adicionar para Exportação"
    addBtn.addEventListener('click', () => {
        // Valida o formulário antes de prosseguir
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Usa a API FormData para extrair os dados do formulário
        const formData = new FormData(form);
        const entry = {};

        // Itera sobre os pares chave/valor do FormData
        for (const [key, value] of formData.entries()) {
            // Para os campos <select>, captura o texto visível em vez do valor interno
            if (key === 'processo_anm' |

key === 'municipio') {
                const selectElement = form.elements[key];
                const selectedText = selectElement.options[selectElement.selectedIndex].text;
                entry[key] = selectedText;
            } else {
                entry[key] = value;
            }
        }

        // Adiciona o objeto de dados ao array acumulador
        dataToExport.push(entry);

        // Atualiza o contador visual
        contador.textContent = `${dataToExport.length} linha(s) para exportar.`;

        // Limpa o formulário para a próxima entrada
        form.reset();
        
        // Foca no primeiro campo para facilitar a entrada contínua
        form.elements[0].focus();
    });

    // Evento de clique para o botão "Download CSV"
    downloadBtn.addEventListener('click', () => {
        if (dataToExport.length === 0) {
            alert('Nenhum dado para exportar. Adicione pelo menos uma linha.');
            return;
        }

        // Converte o array de objetos para uma string CSV
        const csvString = arrayToCsv(dataToExport);
        
        // Inicia o download do arquivo CSV
        downloadCsv(csvString, 'exportacao_dados.csv');
    });

    /**
     * Converte um array de objetos em uma string formatada como CSV.
     * Lida com caracteres especiais como vírgulas e aspas nos dados.
     * @param {Array<Object>} data - O array de objetos a ser convertido.
     * @returns {string} A string formatada como CSV.
     */
    function arrayToCsv(data) {
    if (data.length === 0) {
        return '';
    }

    // Pega os cabeçalhos do PRIMEIRO objeto do array
    const headers = Object.keys(data[0]); 
    
    // Inicializa como um array vazio
    const csvRows = []; 

    // Adiciona a linha de cabeçalho
    csvRows.push(headers.map(sanitizeCell).join(','));

    // Itera sobre cada objeto (linha) nos dados
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            return sanitizeCell(value);
        });
        csvRows.push(values.join(','));
    }

    // Une todas as linhas com quebras de linha
    return csvRows.join('\r\n');
}

    /**
     * Sanitiza o conteúdo de uma célula para o formato CSV.
     * Envolve o valor em aspas se contiver vírgulas, aspas ou quebras de linha.
     * Escapa aspas duplas internas duplicando-as.
     * @param {*} value - O valor da célula.
     * @returns {string} O valor sanitizado e formatado para CSV.
     */
    function sanitizeCell(value) {
        if (value === null |

value === undefined) {
            return '""';
        }
        const stringValue = String(value);
        // Se o valor contém vírgula, aspas ou quebra de linha, ele deve ser citado
        if (/[",\n\r]/.test(stringValue)) {
            // Escapa aspas duplas internas duplicando-as
            const escapedValue = stringValue.replace(/"/g, '""');
            return `"${escapedValue}"`;
        }
        return `"${stringValue}"`; // É uma boa prática citar todos os campos de texto
    }

    /**
     * Inicia o download de uma string de dados como um arquivo no navegador.
     * @param {string} data - O conteúdo do arquivo a ser baixado.
     * @param {string} filename - O nome do arquivo sugerido para o download.
     */
    function downloadCsv(data, filename) {
        // Cria um Blob com o tipo MIME correto para CSV e codificação UTF-8
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });

        // Cria uma URL temporária para o Blob
        const url = URL.createObjectURL(blob);

        // Cria um elemento de âncora (link) dinamicamente
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        // Adiciona o link ao corpo do documento e simula um clique
        document.body.appendChild(link);
        link.click();
        
        // Remove o link do corpo do documento após o clique
        document.body.removeChild(link);

        // Revoga a URL do objeto para liberar memória (com um pequeno atraso)
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
});