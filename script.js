// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const form = document.getElementById('data-form');
    const addBtn = document.getElementById('add-btn');
    const downloadBtn = document.getElementById('download-btn');
    const contador = document.getElementById('contador');
    // NOVO: Referências para a tabela de visualização
    const previewThead = document.querySelector('#preview-table thead');
    const previewTbody = document.getElementById('preview-body');

    // Array para armazenar os dados a serem exportados (padrão "acumulador")
    let dataToExport = [];

    // Evento de clique para o botão "Adicionar para Exportação"
    addBtn.addEventListener('click', () => {
        // Valida o formulário antes de prosseguir
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const entry = {};

        for (const [key, value] of formData.entries()) {
            // CORRIGIDO: Usando o operador OU lógico (||)
            if (key === 'processo_anm' || key === 'municipio') {
                const selectElement = form.elements[key];
                const selectedText = selectElement.options[selectElement.selectedIndex].text;
                entry[key] = selectedText;
            } else {
                entry[key] = value;
            }
        }

        dataToExport.push(entry);

        contador.textContent = `${dataToExport.length} linha(s) para exportar.`;

        // NOVO: Chama a função para renderizar a tabela na tela
        renderPreviewTable();

        form.reset();
        form.elements[0].focus();
    });

    /**
     * NOVO: Esta função desenha a tabela de visualização com os dados do array 'dataToExport'.
     */
    function renderPreviewTable() {
        // Limpa o conteúdo anterior da tabela
        previewThead.innerHTML = '';
        previewTbody.innerHTML = '';

        if (dataToExport.length === 0) {
            return; // Se não há dados, não faz nada
        }

        // Cria o cabeçalho (thead)
        const headers = Object.keys(dataToExport[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText.replace(/_/g, ' ').toUpperCase(); // Formata o texto do cabeçalho
            headerRow.appendChild(th);
        });
        previewThead.appendChild(headerRow);

        // Cria as linhas de dados (tbody)
        dataToExport.forEach(rowData => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = rowData[header];
                row.appendChild(td);
            });
            previewTbody.appendChild(row);
        });
    }


    // Evento de clique para o botão "Download CSV"
    downloadBtn.addEventListener('click', () => {
        if (dataToExport.length === 0) {
            alert('Nenhum dado para exportar. Adicione pelo menos uma linha.');
            return;
        }
        const csvString = arrayToCsv(dataToExport);
        downloadCsv(csvString, 'exportacao_dados.csv');
    });

    /**
     * Converte um array de objetos em uma string formatada como CSV.
     */
    function arrayToCsv(data) {
        if (data.length === 0) {
            return '';
        }
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(',')); // Cabeçalho simples para o CSV

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return sanitizeCell(value);
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\r\n');
    }
// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const form = document.getElementById('data-form');
    const addBtn = document.getElementById('add-btn');
    const downloadBtn = document.getElementById('download-btn');
    const contador = document.getElementById('contador');
    const previewThead = document.querySelector('#preview-table thead');
    const previewTbody = document.getElementById('preview-body');

    let dataToExport = [];

    addBtn.addEventListener('click', () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const entry = {};

        // Itera sobre os pares chave/valor do FormData
        for (const [key, value] of formData.entries()) {
            if (key === 'processo_anm' || key === 'municipio') {
                const selectElement = form.elements[key];
                const selectedText = selectElement.options[selectElement.selectedIndex].text;
                entry[key] = selectedText;
            } else {
                entry[key] = value;
            }
        }

        // --- LÓGICA ESPECIAL PARA O CHECKBOX ---
        // O FormData retorna 'on' se o checkbox estiver marcado. Vamos traduzir para "Sim" ou "Não".
        const usoImediatoCheckbox = form.elements['uso_imediato'];
        entry['uso_imediato'] = usoImediatoCheckbox.checked ? 'Sim' : 'Não';
        // --- FIM DA LÓGICA DO CHECKBOX ---

        dataToExport.push(entry);

        contador.textContent = `${dataToExport.length} linha(s) para exportar.`;
        renderPreviewTable();

        form.reset();
        form.elements[0].focus();
    });

    function renderPreviewTable() {
        previewThead.innerHTML = '';
        previewTbody.innerHTML = '';

        if (dataToExport.length === 0) return;

        const headers = Object.keys(dataToExport[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            // Formata o texto do cabeçalho para ficar mais legível
            th.textContent = headerText.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            headerRow.appendChild(th);
        });
        previewThead.appendChild(headerRow);

        dataToExport.forEach(rowData => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = rowData[header];
                row.appendChild(td);
            });
            previewTbody.appendChild(row);
        });
    }

    downloadBtn.addEventListener('click', () => {
        if (dataToExport.length === 0) {
            alert('Nenhum dado para exportar. Adicione pelo menos uma linha.');
            return;
        }
        const csvString = arrayToCsv(dataToExport);
        downloadCsv(csvString, 'exportacao_dados.csv');
    });

    function arrayToCsv(data) {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return sanitizeCell(value);
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\r\n');
    }

    function sanitizeCell(value) {
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        if (/[",\n\r]/.test(stringValue)) {
            const escapedValue = stringValue.replace(/"/g, '""');
            return `"${escapedValue}"`;
        }
        return `"${stringValue}"`;
    }

    function downloadCsv(data, filename) {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
});
    /**
     * Sanitiza o conteúdo de uma célula para o formato CSV.
     */
    function sanitizeCell(value) {
        // CORRIGIDO: Usando o operador OU lógico (||)
        if (value === null || value === undefined) {
            return '""';
        }
        const stringValue = String(value);
        if (/[",\n\r]/.test(stringValue)) {
            const escapedValue = stringValue.replace(/"/g, '""');
            return `"${escapedValue}"`;
        }
        return `"${stringValue}"`;
    }

    /**
     * Inicia o download de uma string de dados como um arquivo no navegador.
     */
    function downloadCsv(data, filename) {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
});