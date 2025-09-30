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

        const usoImediatoCheckbox = form.elements['uso_imediato'];
        entry['uso_imediato'] = usoImediatoCheckbox.checked ? 'Sim' : 'Não';
        
        dataToExport.push(entry);
        
        contador.textContent = `${dataToExport.length} linha(s) para exportar.`;
        renderPreviewTable();
        
        form.reset();
        form.elements[0].focus();
    });

    /**
     * Esta função desenha a tabela de visualização com os dados do array 'dataToExport'.
     * AGORA INCLUI A LÓGICA DE EXCLUSÃO.
     */
    function renderPreviewTable() {
        previewThead.innerHTML = '';
        previewTbody.innerHTML = '';

        if (dataToExport.length === 0) {
            // Limpa o contador se não houver mais linhas
            contador.textContent = '0 linha(s) para exportar.';
            return;
        }

        // Cria o cabeçalho (thead)
        const headers = Object.keys(dataToExport[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            headerRow.appendChild(th);
        });
        
        // Adiciona a coluna de Ações no cabeçalho
        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Ações';
        headerRow.appendChild(actionsTh);
        previewThead.appendChild(headerRow);

        // Cria as linhas de dados (tbody)
        dataToExport.forEach((rowData, index) => { // Adicionamos 'index' para saber a posição do item
            const row = document.createElement('tr');
            
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = rowData[header];
                row.appendChild(td);
            });

            // Cria a célula com o botão de exclusão
            const actionsTd = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir';
            deleteBtn.className = 'delete-btn'; // Opcional: para estilização
            
            // Adiciona o evento de clique para o botão
            deleteBtn.addEventListener('click', () => {
                // Remove o item do array 'dataToExport' na posição 'index'
                dataToExport.splice(index, 1);
                
                // Atualiza o contador de linhas
                contador.textContent = `${dataToExport.length} linha(s) para exportar.`;

                // Redesenha a tabela com os dados atualizados
                renderPreviewTable();
            });

            actionsTd.appendChild(deleteBtn);
            row.appendChild(actionsTd);
            previewTbody.appendChild(row);
        });
    }

    // O restante do seu código (downloadBtn, arrayToCsv, etc.) permanece o mesmo...

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
            const values = headers.map(header => sanitizeCell(row[header]));
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
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
});