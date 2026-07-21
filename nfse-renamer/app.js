// Configuração do PDF.js
const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Estado global da aplicação
const state = {
    filesQueue: [],      // Lista de arquivos na fila
    namingPattern: '{data} {numero} {prestador}',
    dateFormat: 'DD-MM-AAAA',
    cleanAccents: true,
    uppercaseNames: true,
    searchQuery: '',
    theme: 'dark'
};

// Elementos do DOM
const DOM = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    patternInput: document.getElementById('pattern-input'),
    livePatternPreview: document.getElementById('live-pattern-preview'),
    chips: document.querySelectorAll('.chip'),
    dateFormatSelect: document.getElementById('date-format'),
    cleanAccentsCheck: document.getElementById('clean-accents'),
    uppercaseNamesCheck: document.getElementById('uppercase-names'),
    
    // Stats
    statTotal: document.getElementById('stat-total'),
    statSuccess: document.getElementById('stat-success'),
    statFailed: document.getElementById('stat-failed'),
    statTimeSaved: document.getElementById('stat-time-saved'),
    
    // Tabela e Fila
    filesTbody: document.getElementById('files-tbody'),
    emptyRow: document.getElementById('empty-row'),
    clearQueueBtn: document.getElementById('clear-queue-btn'),
    searchInput: document.getElementById('search-input'),
    
    // Barra de Exportação
    exportBar: document.getElementById('export-bar'),
    readyCount: document.getElementById('ready-count'),
    downloadZipBtn: document.getElementById('download-zip-btn'),
    
    // Modal
    editModal: document.getElementById('edit-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    btnSaveModal: document.getElementById('btn-save-modal'),
    editForm: document.getElementById('edit-form'),
    editFileId: document.getElementById('edit-file-id'),
    modalOriginalName: document.getElementById('modal-original-name'),
    modalNumero: document.getElementById('modal-numero'),
    modalData: document.getElementById('modal-data'),
    modalPrestador: document.getElementById('modal-prestador'),
    modalCnpj: document.getElementById('modal-cnpj'),
    modalValor: document.getElementById('modal-valor'),
    
    // Theme Toggle
    themeToggle: document.getElementById('theme-toggle')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    initTheme();
    updateLiveExample();
});

// Inicializa Eventos da Página
function initEvents() {
    // Eventos de Upload (Drag & Drop)
    DOM.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.add('dragover');
    });
    
    DOM.dropZone.addEventListener('dragleave', () => {
        DOM.dropZone.classList.remove('dragover');
    });
    
    DOM.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleUploadedFiles(e.dataTransfer.files);
        }
    });
    
    DOM.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedFiles(e.target.files);
        }
    });

    // Padrão de Nomenclatura e Configurações
    DOM.patternInput.addEventListener('input', (e) => {
        state.namingPattern = e.target.value;
        updateLiveExample();
        updateAllProposedNames();
    });

    DOM.chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.getAttribute('data-tag');
            insertTagAtCursor(tag);
        });
    });

    DOM.dateFormatSelect.addEventListener('change', (e) => {
        state.dateFormat = e.target.value;
        updateLiveExample();
        updateAllProposedNames();
    });

    DOM.cleanAccentsCheck.addEventListener('change', (e) => {
        state.cleanAccents = e.target.checked;
        updateLiveExample();
        updateAllProposedNames();
    });

    DOM.uppercaseNamesCheck.addEventListener('change', (e) => {
        state.uppercaseNames = e.target.checked;
        updateLiveExample();
        updateAllProposedNames();
    });

    // Limpar Fila
    DOM.clearQueueBtn.addEventListener('click', clearQueue);

    // Busca/Filtro
    DOM.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderTable();
    });

    // Download ZIP
    DOM.downloadZipBtn.addEventListener('click', downloadRenamedZip);

    // Fechar Modal
    DOM.closeModalBtn.addEventListener('click', closeModal);
    DOM.btnCancelModal.addEventListener('click', closeModal);
    DOM.btnSaveModal.addEventListener('click', saveModalChanges);
    window.addEventListener('click', (e) => {
        if (e.target === DOM.editModal) closeModal();
    });

    // Alternador de Tema
    DOM.themeToggle.addEventListener('click', toggleTheme);

    // Atalho de teclado para fechar modal com Esc
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.editModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Inicializar Tema (Salvo ou Default Dark)
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    state.theme = savedTheme;
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = DOM.themeToggle.querySelector('i, svg');
    if (icon) {
        if (state.theme === 'light') {
            icon.setAttribute('data-lucide', 'moon');
            DOM.themeToggle.setAttribute('title', 'Ativar Modo Escuro');
        } else {
            icon.setAttribute('data-lucide', 'sun');
            DOM.themeToggle.setAttribute('title', 'Ativar Modo Claro');
        }
    }
    if (window.lucide) lucide.createIcons();
}

// Inserir tag no cursor do input do padrão
function insertTagAtCursor(tag) {
    const input = DOM.patternInput;
    const startPos = input.selectionStart;
    const endPos = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, startPos) + tag + text.substring(endPos, text.length);
    input.focus();
    input.selectionStart = startPos + tag.length;
    input.selectionEnd = startPos + tag.length;
    
    state.namingPattern = input.value;
    updateLiveExample();
    updateAllProposedNames();
}

// Processa arquivos recebidos por Drag & Drop ou Input
async function handleUploadedFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.toLowerCase().endsWith('.zip')) {
            await processZipFile(file);
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
            addFileToQueue(file);
        }
    }
    
    // Inicia o processamento concorrente das notas na fila que ainda estão 'loading'
    processQueue();
}

// Processa Arquivos ZIP de NFS-e
async function processZipFile(zipFile) {
    try {
        const zip = await JSZip.loadAsync(zipFile);
        const entries = [];
        
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith('.pdf')) {
                entries.push(zipEntry);
            }
        });

        if (entries.length === 0) {
            alert(`Nenhum arquivo PDF encontrado dentro do ZIP "${zipFile.name}".`);
            return;
        }

        for (const entry of entries) {
            const fileData = await entry.async('uint8array');
            const blob = new Blob([fileData], { type: 'application/pdf' });
            
            // Pega apenas o nome do arquivo, removendo subdiretórios se houver
            const baseName = entry.name.split('/').pop();
            const virtualFile = new File([blob], baseName, { type: 'application/pdf' });
            
            addFileToQueue(virtualFile, fileData);
        }
    } catch (err) {
        console.error("Erro ao ler arquivo ZIP:", err);
        alert(`Erro ao ler arquivo ZIP "${zipFile.name}": ` + err.message);
    }
}

// Adiciona um arquivo PDF individual à fila de processamento
function addFileToQueue(file, rawData = null) {
    // Evita duplicatas pelo nome
    if (state.filesQueue.some(item => item.originalName === file.name)) {
        return;
    }

    const fileId = 'file_' + Math.random().toString(36).substr(2, 9);
    
    state.filesQueue.push({
        id: fileId,
        file: file,
        rawData: rawData, // Mantido caso o arquivo tenha vindo de um ZIP
        originalName: file.name,
        status: 'loading',
        statusMessage: 'Aguardando processamento...',
        metadata: {
            numero: '',
            prestador: '',
            cnpj: '',
            data: '',
            valor: ''
        },
        renamedName: ''
    });

    renderTable();
    updateStats();
}

// Limpa toda a fila e reinicia estados
function clearQueue() {
    state.filesQueue = [];
    DOM.searchInput.value = '';
    state.searchQuery = '';
    renderTable();
    updateStats();
    updateExportBar();
}

// Processa a Fila de Notas de forma assíncrona
async function processQueue() {
    const pendingFiles = state.filesQueue.filter(item => item.status === 'loading');
    
    // Processamento paralelo limitado para não travar a UI (máx 3 concorrentes)
    const limit = 3;
    let index = 0;

    async function worker() {
        while (index < pendingFiles.length) {
            const item = pendingFiles[index++];
            await processSingleFile(item);
        }
    }

    const workers = [];
    for (let i = 0; i < Math.min(limit, pendingFiles.length); i++) {
        workers.push(worker());
    }
    
    await Promise.all(workers);
}

// Processa uma nota fiscal individual: lê texto e extrai campos
async function processSingleFile(queueItem) {
    try {
        if (!queueItem.rawData) {
            const buffer = await queueItem.file.arrayBuffer();
            queueItem.rawData = new Uint8Array(buffer);
        }

        // Faz uma cópia dos bytes (clonagem) para o PDF.js não desanexar/zerar o buffer original
        const pdfData = queueItem.rawData.slice();

        // Lê texto do PDF usando PDF.js
        const pdfText = await extractTextFromPdf(pdfData);
        
        // Aplica o motor de análise heurística para preencher o metadata
        const metadata = parseNfseText(pdfText, queueItem.originalName);
        
        queueItem.metadata = metadata;
        
        // Verifica se conseguiu ler os dados mínimos (número e prestador)
        const hasMinData = metadata.numero && metadata.prestador;
        queueItem.status = hasMinData ? 'success' : 'warning';
        queueItem.statusMessage = hasMinData 
            ? 'Nota processada com sucesso!' 
            : 'Dados extraídos incompletos. Verifique os campos.';
            
    } catch (err) {
        console.error(`Erro ao processar PDF ${queueItem.originalName}:`, err);
        queueItem.status = 'error';
        queueItem.statusMessage = 'Falha ao ler o PDF: ' + err.message;
    }

    // Calcula o novo nome
    queueItem.renamedName = generateNewName(queueItem);
    
    // Atualiza apenas a linha correspondente na tabela para melhor performance
    updateTableRow(queueItem);
    updateStats();
    updateExportBar();
}

// Extrai o texto cru de todas as páginas do PDF
async function extractTextFromPdf(pdfData) {
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let fullText = "";
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Concatena as strings respeitando alguma estrutura básica de linha
        let lastY = null;
        let pageText = "";
        
        for (const item of textContent.items) {
            // Se mudou de linha vertical (Y), adiciona uma quebra de linha
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += "\n";
            }
            pageText += item.str + " ";
            lastY = item.transform[5];
        }
        
        fullText += pageText + "\n";
    }
    
    return fullText;
}

// Motor de Análise (Parsing) de NFS-e Brasileira
function parseNfseText(text, filename) {
    // Normaliza texto removendo espaços duplicados e padronizando quebras de linha
    const normalizedText = text.replace(/[ \t]+/g, ' ').trim();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const meta = {
        numero: '',
        prestador: '',
        cnpj: '',
        data: '',
        valor: ''
    };

    // 1. EXTRAÇÃO DE NÚMERO DA NOTA
    // Regexes em ordem de especificidade para mesma linha
    const numRegexes = [
        /NFS-e\s*Nº\s*:?\s*(\d+)/i,
        /Número\s*da\s*Nota\s*:?\s*(\d+)/i,
        /Nº\s*da\s*Nota\s*:?\s*(\d+)/i,
        /Nota\s*Fiscal\s*Nº\s*(\d+)/i,
        /Nota\s*Fiscal\s*Eletrônica\s*Nº\s*(\d+)/i,
        /Nº\s*Nota\s*:?\s*(\d+)/i,
        /Nº\s*:\s*(\d+)/i,
        /\bNº\b\s*(\d+)/i,
        /Número\s*:?\s*(\d+)/i
    ];
    
    for (const regex of numRegexes) {
        const match = normalizedText.match(regex);
        if (match && match[1]) {
            // Remove zeros à esquerda excessivos se for um número muito longo
            meta.numero = match[1].trim().replace(/^0+(?=\d{4,})/, '');
            break;
        }
    }

    // Se não encontrou na mesma linha, busca em linhas consecutivas (rótulo na linha i, número puro na linha i+1)
    if (!meta.numero) {
        const labelRegexes = [
            /Número\s*da\s*NFS-e/i,
            /Número\s*da\s*Nota/i,
            /Nº\s*da\s*Nota/i,
            /NFS-e\s*Nº/i,
            /Nº\s*Nota/i,
            /Número/i,
            /Código\s*de\s*Verificação/i
        ];
        
        for (let i = 0; i < lines.length; i++) {
            if (labelRegexes.some(r => r.test(lines[i]))) {
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    // O número da nota deve ser puramente numérico e ter tamanho razoável (1 a 15 dígitos)
                    if (/^\d+$/.test(nextLine) && nextLine.length >= 1 && nextLine.length <= 15) {
                        meta.numero = nextLine;
                        break;
                    }
                }
            }
        }
    }

    // Se falhar tudo, tenta extrair algum número do próprio nome do arquivo original como último recurso
    if (!meta.numero) {
        const fileNumMatch = filename.match(/\b\d{4,9}\b/);
        if (fileNumMatch) {
            meta.numero = fileNumMatch[0];
        }
    }

    // 2. EXTRAÇÃO DE CNPJ (Prestador e Tomador)
    // CNPJs geralmente vêm com pontos, barra e hífen: 00.000.000/0000-00
    const cnpjRegex = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
    const cnpjsFound = normalizedText.match(cnpjRegex) || [];
    
    if (cnpjsFound.length > 0) {
        // Em notas de serviço, o primeiro CNPJ é do Prestador (Emissor) e o segundo é do Tomador (Cliente)
        meta.cnpj = cnpjsFound[0];
    } else {
        // Tenta achar CNPJs apenas com dígitos
        const rawCnpjRegex = /\b\d{14}\b/g;
        const rawCnpjs = normalizedText.match(rawCnpjRegex) || [];
        if (rawCnpjs.length > 0) {
            // Formata o CNPJ sem formatação para facilitar visualização
            const c = rawCnpjs[0];
            meta.cnpj = `${c.substr(0,2)}.${c.substr(2,3)}.${c.substr(5,3)}/${c.substr(8,4)}-${c.substr(12,2)}`;
        }
    }

    // 3. EXTRAÇÃO DE DATA DE EMISSÃO
    // Busca datas de emissão
    const dateLabels = [
        /Data\s*(?:e\s*Hora)?\s*de\s*Emissão\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
        /Data\s*Emissão\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
        /Emissão\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
        /Competência\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
        /Data\s*de\s*Geração\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i
    ];

    for (const regex of dateLabels) {
        const match = normalizedText.match(regex);
        if (match && match[1]) {
            meta.data = match[1];
            break;
        }
    }

    // Se não encontrou pela label, pega a primeira data padrão dd/mm/aaaa que encontrar
    if (!meta.data) {
        const generalDateRegex = /\b\d{2}\/\d{2}\/\d{4}\b/;
        const dateMatch = normalizedText.match(generalDateRegex);
        if (dateMatch) {
            meta.data = dateMatch[0];
        }
    }

    // 4. EXTRAÇÃO DO NOME DO PRESTADOR (Razão Social / Nome Fantasia)
    // Encontra os limites das seções para evitar confundir Prestador com Tomador
    let emitenteIdx = -1;
    let tomadorIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (emitenteIdx === -1 && (/EMITENTE/i.test(line) || /PRESTADOR/i.test(line) || /DADOS DO EMITENTE/i.test(line) || /Prestador do Serviço/i.test(line))) {
            emitenteIdx = i;
        }
        if (tomadorIdx === -1 && (/TOMADOR/i.test(line) || /CLIENTE/i.test(line) || /DADOS DO TOMADOR/i.test(line) || /Tomador do Serviço/i.test(line))) {
            tomadorIdx = i;
        }
    }
    
    // Se não achou emitenteIdx, assume 0. Se não achou tomadorIdx, assume fim das linhas
    const searchStart = emitenteIdx !== -1 ? emitenteIdx : 0;
    const searchEnd = tomadorIdx !== -1 ? tomadorIdx : lines.length;
    
    // Tier 1: Procura por rótulo específico de Razão Social/Nome dentro do bloco do Prestador
    const subLabels = [
        /Nome\s*\/\s*Nome\s*Empresarial/i,
        /Nome\s*Empresarial/i,
        /Razão\s*Social/i,
        /Razao\s*Social/i,
        /Nome\s*\/\s*Razão\s*Social/i,
        /Nome\s*Fantasia/i,
        /Nome\s*Completo/i
    ];
    
    for (let i = searchStart; i < searchEnd; i++) {
        const line = lines[i];
        if (subLabels.some(r => r.test(line))) {
            // Se o rótulo tem dois pontos ou texto depois dele na mesma linha (ex: "Razão Social: EMPRESA LTDA")
            const parts = line.split(/:(.+)/);
            if (parts.length > 1 && parts[1].trim().length > 3) {
                meta.prestador = cleanPrestadorName(parts[1]);
                break;
            }
            // Senão, o nome está na linha de baixo! (Caso do Padrão Nacional)
            if (i + 1 < searchEnd) {
                const nextLine = lines[i + 1].trim();
                // Verifica se a próxima linha não é outro rótulo comum ou metadado
                if (nextLine && nextLine.length > 3 && !/CNPJ|CPF|NIF|Endereço|Inscrição|Simples/i.test(nextLine)) {
                    meta.prestador = cleanPrestadorName(nextLine);
                    break;
                }
            }
        }
    }

    // Tier 2: Se não achou, busca no bloco do prestador linhas que possuam termos corporativos
    if (!meta.prestador) {
        const corpTerms = /\b(LTDA|S\/A|S\.A\.|MEI|EIRELI|ME|EPP|COOPERATIVA|ASSOCIACAO|SERVICOS|TECNOLOGIA|CONSULTORIA|COMERCIO|CONSTRUTORA|CULTURA|S\/S|SS)\b/i;
        for (let i = searchStart; i < searchEnd; i++) {
            const line = lines[i];
            // Exclui títulos e dados fiscais
            if (corpTerms.test(line) && line.length > 4 && line.length < 70 && !/CNPJ|CPF|NIF|Endereço|Inscrição|Prestador|Emitente|Tomador|Cliente/i.test(line)) {
                meta.prestador = cleanPrestadorName(line);
                break;
            }
        }
    }

    // Tier 3: Se falhar tudo, tenta usar a linha imediatamente vizinha ao CNPJ do Prestador
    if (!meta.prestador && meta.cnpj) {
        for (let i = searchStart; i < searchEnd; i++) {
            if (lines[i].includes(meta.cnpj)) {
                // Tenta olhar a linha de cima
                if (i > searchStart && lines[i-1].length > 4 && lines[i-1].length < 70 && !/CNPJ|CPF|NIF|Endereço|Prestador|Emitente/i.test(lines[i-1])) {
                    meta.prestador = cleanPrestadorName(lines[i-1]);
                    break;
                }
                // Tenta olhar a linha de baixo
                if (i + 1 < searchEnd && lines[i+1].length > 4 && lines[i+1].length < 70 && !/CNPJ|CPF|NIF|Endereço|Prestador|Emitente/i.test(lines[i+1])) {
                    meta.prestador = cleanPrestadorName(lines[i+1]);
                    break;
                }
            }
        }
    }

    // Tier 4: Última alternativa - varre todas as linhas da seção procurando um nome corporativo
    if (!meta.prestador) {
        const corpTerms = /\b(LTDA|S\/A|S\.A\.|MEI|EIRELI|ME|EPP|COOPERATIVA|ASSOCIACAO|SERVICOS|TECNOLOGIA|CONSULTORIA|COMERCIO|CONSTRUTORA|CULTURA)\b/i;
        for (const line of lines) {
            if (corpTerms.test(line) && line.length < 70 && !/TOMADOR|CLIENTE|PREFEITURA|SECRETARIA|CNPJ|CPF|NIF|ENDEREÇO/i.test(line)) {
                const name = cleanPrestadorName(line);
                if (name.length > 4) {
                    meta.prestador = name;
                    break;
                }
            }
        }
    }

    // 5. EXTRAÇÃO DE VALOR TOTAL
    const valRegexes = [
        /Valor\s*Total\s*da\s*Nota\s*:?\s*R\$\s*([\d.,]+)/i,
        /Valor\s*Total\s*do\s*Serviço\s*:?\s*R\$\s*([\d.,]+)/i,
        /VALOR\s*LIQUIDO\s*DA\s*NOTA\s*:?\s*R\$\s*([\d.,]+)/i,
        /VALOR\s*DA\s*NOTA\s*:?\s*R\$\s*([\d.,]+)/i,
        /VALOR\s*TOTAL\s*:?\s*R\$\s*([\d.,]+)/i,
        /Valor\s*do\s*Serviço\s*:?\s*R\$\s*([\d.,]+)/i,
        /Valor\s*Líquido\s*:?\s*R\$\s*([\d.,]+)/i,
        /R\$\s*([\d.,]+)/
    ];

    for (const regex of valRegexes) {
        const match = normalizedText.match(regex);
        if (match && match[1]) {
            meta.valor = match[1].trim();
            break;
        }
    }

    return meta;
}

// Limpa caracteres e ruídos comuns do nome do prestador
function cleanPrestadorName(name) {
    return name
        .replace(/^(Nome\s*\/\s*Nome\s*Empresarial|Nome\s*Empresarial|Nome\/Razão Social|Razão Social|Prestador de Serviços|Nome\s*\/\s*Razão\s*Social|Nome|Razao Social|Emitente|Prestador|Nome\s*Completo)\s*:?\s*/i, '') // remove labels
        .replace(/(?:CNPJ|CPF|INSCRIÇÃO|IE|IM|ENDEREÇO|FONE).*$/i, '') // remove dados adicionais na mesma linha
        .replace(/[^A-Za-z0-9À-ÿ\s.&()-\/]/g, '') // remove símbolos estranhos, mantendo acentuação e padrão de empresa
        .replace(/\s+/g, ' ') // remove espaços duplos
        .trim();
}

// Formata a data de DD/MM/AAAA para o padrão desejado pelo usuário
function formatEmissionDate(dateStr, format) {
    if (!dateStr) return '';
    const match = dateStr.match(/(\d{2})[/-](\d{2})[/-](\d{4})/);
    if (!match) return dateStr;

    const [_, day, month, year] = match;

    switch (format) {
        case 'AAAA-MM-DD':
            return `${year}-${month}-${day}`;
        case 'DD-MM-AAAA':
            return `${day}-${month}-${year}`;
        case 'DD.MM.AAAA':
            return `${day}.${month}.${year}`;
        case 'DDMMAAAA':
            return `${day}${month}${year}`;
        case 'AAAAMM':
            return `${year}${month}`;
        default:
            return `${year}-${month}-${day}`;
    }
}

// Sanitiza o nome do arquivo para garantir que seja válido no Windows/Linux/Mac
function sanitizeFilename(name) {
    // Caracteres proibidos no Windows: \ / : * ? " < > |
    let sanitized = name.replace(/[\\/:*?"<>|]/g, '-');
    
    if (state.cleanAccents) {
        // Normaliza removendo acentos
        sanitized = sanitized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    
    // Remove espaços extras
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
}

// Gera o novo nome do arquivo com base na fórmula (padrão de nomenclatura)
function generateNewName(queueItem) {
    const meta = queueItem.metadata;
    let pattern = state.namingPattern;

    // Formata a data de acordo com a configuração
    const dateFormatted = formatEmissionDate(meta.data, state.dateFormat);

    // Ajusta o nome do prestador (maiúsculo se configurado)
    let prestador = meta.prestador || 'SEM_PRESTADOR';
    if (state.uppercaseNames) {
        prestador = prestador.toUpperCase();
    }

    // Nome original sem a extensão .pdf
    const originalWithoutExt = queueItem.originalName.replace(/\.pdf$/i, '');

    // Limpa o valor para não conter barras/caracteres inválidos
    const valorCleaned = (meta.valor || 'SEM_VALOR').replace(/[\/\\:]/g, '-');

    // Substitui as tags
    let newName = pattern
        .replace(/{numero}/g, meta.numero || 'SEM_NUMERO')
        .replace(/{prestador}/g, prestador)
        .replace(/{cnpj}/g, meta.cnpj || 'SEM_CNPJ')
        .replace(/{data}/g, dateFormatted || 'SEM_DATA')
        .replace(/{valor}/g, valorCleaned)
        .replace(/{original}/g, originalWithoutExt);

    // Garante que o nome final seja válido para o sistema operacional
    newName = sanitizeFilename(newName);

    // Se o resultado final ficou vazio por algum motivo, mantém o nome original
    if (!newName || newName === '.pdf') {
        return queueItem.originalName;
    }

    return newName + '.pdf';
}

// Atualiza o exemplo de prévia do padrão na barra lateral em tempo real
function updateLiveExample() {
    const dummyItem = {
        originalName: 'nota_fiscal_servico_original_1092.pdf',
        metadata: {
            numero: '4589',
            prestador: 'Inovação e Tecnologia Fiscal Ltda',
            cnpj: '12.345.678/0001-90',
            data: '21/07/2026',
            valor: '1.250,00'
        }
    };

    DOM.livePatternPreview.textContent = generateNewName(dummyItem);
}

// Recalcula e atualiza o novo nome proposto de todos os itens da fila
function updateAllProposedNames() {
    state.filesQueue.forEach(item => {
        if (item.status === 'success' || item.status === 'warning') {
            item.renamedName = generateNewName(item);
            
            // Atualiza na tela apenas a célula de nome proposto
            const row = document.getElementById(item.id);
            if (row) {
                const previewCell = row.querySelector('.new-name-cell');
                if (previewCell) {
                    previewCell.textContent = item.renamedName;
                    previewCell.classList.remove('error-preview');
                }
            }
        }
    });
}

// Renderiza a tabela inteira do zero (usado em grandes mudanças de estado)
function renderTable() {
    // Remove linhas antigas
    const rows = DOM.filesTbody.querySelectorAll('tr:not(#empty-row)');
    rows.forEach(r => r.remove());

    const filteredQueue = state.filesQueue.filter(item => {
        if (!state.searchQuery) return true;
        
        return item.originalName.toLowerCase().includes(state.searchQuery) ||
               item.metadata.numero.includes(state.searchQuery) ||
               item.metadata.prestador.toLowerCase().includes(state.searchQuery) ||
               item.metadata.cnpj.includes(state.searchQuery);
    });

    if (filteredQueue.length === 0) {
        DOM.emptyRow.style.display = '';
        DOM.clearQueueBtn.setAttribute('disabled', 'true');
        return;
    }

    DOM.emptyRow.style.display = 'none';
    DOM.clearQueueBtn.removeAttribute('disabled');

    filteredQueue.forEach(item => {
        const tr = createTableRowElement(item);
        DOM.filesTbody.appendChild(tr);
    });

    lucide.createIcons();
}

// Cria o elemento de linha TR para a tabela
function createTableRowElement(item) {
    const tr = document.createElement('tr');
    tr.id = item.id;

    // Badges de Status
    let statusHtml = '';
    if (item.status === 'loading') {
        statusHtml = `<span class="status-badge loading"><i data-lucide="loader-2"></i>Lendo</span>`;
    } else if (item.status === 'success') {
        statusHtml = `<span class="status-badge success" title="${item.statusMessage}"><i data-lucide="check"></i>Sucesso</span>`;
    } else if (item.status === 'warning') {
        statusHtml = `<span class="status-badge warning" title="${item.statusMessage}"><i data-lucide="alert-circle"></i>Incompleto</span>`;
    } else {
        statusHtml = `<span class="status-badge error" title="${item.statusMessage}"><i data-lucide="x-circle"></i>Erro</span>`;
    }

    // Formata o novo nome proposto para exibir na tabela
    let previewName = item.renamedName || 'Aguardando leitura...';
    let previewClass = 'new-name-cell';
    if (item.status === 'error') {
        previewName = 'Falha ao processar';
        previewClass += ' error-preview';
    }

    tr.innerHTML = `
        <td class="original-name-cell" title="${item.originalName}">${item.originalName}</td>
        <td style="text-align: center;">${statusHtml}</td>
        <td class="col-numero">${item.metadata.numero || '-'}</td>
        <td class="col-prestador">${item.metadata.prestador || '-'}</td>
        <td class="col-cnpj">${item.metadata.cnpj || '-'}</td>
        <td class="col-data">${item.metadata.data || '-'}</td>
        <td class="col-valor">${item.metadata.valor ? 'R$ ' + item.metadata.valor : '-'}</td>
        <td class="${previewClass}" title="${previewName}">${previewName}</td>
        <td style="text-align: center;">
            <div style="display: inline-flex; gap: 4px;">
                <button class="btn-action-cell edit-btn" onclick="openEditModal('${item.id}')" title="Editar Metadados" ${item.status === 'loading' ? 'disabled' : ''}>
                    <i data-lucide="edit-3"></i>
                </button>
                <button class="btn-action-cell delete-btn" onclick="removeFileFromQueue('${item.id}')" title="Remover da Fila">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </td>
    `;

    return tr;
}

// Atualiza uma única linha da tabela que já existe (melhora a performance em updates frequentes)
function updateTableRow(item) {
    const oldRow = document.getElementById(item.id);
    if (!oldRow) return;

    const newRow = createTableRowElement(item);
    oldRow.parentNode.replaceChild(newRow, oldRow);
    lucide.createIcons();
}

// Remove um arquivo específico da fila
function removeFileFromQueue(fileId) {
    state.filesQueue = state.filesQueue.filter(item => item.id !== fileId);
    
    // Deleta a linha do DOM diretamente
    const row = document.getElementById(fileId);
    if (row) row.remove();

    if (state.filesQueue.length === 0) {
        DOM.emptyRow.style.display = '';
        DOM.clearQueueBtn.setAttribute('disabled', 'true');
    }

    updateStats();
    updateExportBar();
}

// Atualiza as estatísticas globais no painel superior
function updateStats() {
    const total = state.filesQueue.length;
    const success = state.filesQueue.filter(item => item.status === 'success').length;
    const failed = state.filesQueue.filter(item => item.status === 'warning' || item.status === 'error').length;
    
    DOM.statTotal.textContent = total;
    DOM.statSuccess.textContent = success;
    DOM.statFailed.textContent = failed;

    // Calcula tempo economizado estimado (aproximadamente 2 minutos por NFS-e renomeada com sucesso)
    const totalMinutesSaved = (success * 2);
    if (totalMinutesSaved >= 60) {
        const hours = Math.floor(totalMinutesSaved / 60);
        const mins = totalMinutesSaved % 60;
        DOM.statTimeSaved.textContent = `${hours}h ${mins}m`;
    } else {
        DOM.statTimeSaved.textContent = `${totalMinutesSaved} min`;
    }
}

// Atualiza a visibilidade e dados da barra de exportação
function updateExportBar() {
    // Mostra a barra se houver qualquer arquivo na fila para exportar (sucesso, aviso ou erro)
    const exportableCount = state.filesQueue.length;
    
    if (exportableCount > 0) {
        DOM.readyCount.textContent = exportableCount;
        DOM.exportBar.classList.remove('hidden-bar');
    } else {
        DOM.exportBar.classList.add('hidden-bar');
    }
}

// Abre o modal de edição manual de metadados
function openEditModal(fileId) {
    const item = state.filesQueue.find(i => i.id === fileId);
    if (!item) return;

    DOM.editFileId.value = item.id;
    DOM.modalOriginalName.value = item.originalName;
    DOM.modalNumero.value = item.metadata.numero;
    DOM.modalData.value = item.metadata.data;
    DOM.modalPrestador.value = item.metadata.prestador;
    DOM.modalCnpj.value = item.metadata.cnpj;
    DOM.modalValor.value = item.metadata.valor;

    DOM.editModal.classList.add('active');
}

// Fecha o modal de edição
function closeModal() {
    DOM.editModal.classList.remove('active');
    DOM.editForm.reset();
}

// Salva as alterações feitas manualmente no modal
function saveModalChanges() {
    const fileId = DOM.editFileId.value;
    const item = state.filesQueue.find(i => i.id === fileId);
    
    if (item) {
        item.metadata.numero = DOM.modalNumero.value.trim();
        item.metadata.data = DOM.modalData.value.trim();
        item.metadata.prestador = DOM.modalPrestador.value.trim();
        item.metadata.cnpj = DOM.modalCnpj.value.trim();
        item.metadata.valor = DOM.modalValor.value.trim();

        // Se o usuário corrigiu a nota e os campos mínimos estão preenchidos, muda status para success
        if (item.metadata.numero && item.metadata.prestador) {
            item.status = 'success';
            item.statusMessage = 'Nota corrigida manualmente.';
        } else {
            item.status = 'warning';
            item.statusMessage = 'Nota corrigida, mas com dados parciais.';
        }

        // Recalcula o nome final proposto
        item.renamedName = generateNewName(item);

        // Atualiza a tabela e stats
        updateTableRow(item);
        updateStats();
        updateExportBar();
    }
    
    closeModal();
}

// Gera o ZIP renomeado e faz o download para o computador do usuário
async function downloadRenamedZip() {
    const exportableItems = state.filesQueue;
    
    if (exportableItems.length === 0) {
        alert("Não há notas fiscais na fila para baixar.");
        return;
    }

    const btn = DOM.downloadZipBtn;
    const btnSpan = btn.querySelector('span');
    const btnIcon = btn.querySelector('i, svg');
    const originalText = btnSpan ? btnSpan.textContent : "Renomear e Baixar ZIP";

    // Desabilita o botão e mostra estado de carregamento de forma segura
    btn.setAttribute('disabled', 'true');
    if (btnSpan) btnSpan.textContent = "Compactando...";
    if (btnIcon) {
        btnIcon.setAttribute('data-lucide', 'loader-2');
        btnIcon.classList.add('spin-animation'); // Estilo CSS para girar o ícone
    }
    if (window.lucide) lucide.createIcons();

    try {
        const zip = new JSZip();
        
        // Mantém controle de nomes duplicados adicionando um sufixo numérico (ex: nome(1).pdf)
        const nameCountMap = {};

        for (const item of exportableItems) {
            let finalName = item.renamedName;
            
            // Se o item deu erro de processamento ou não tem nome novo gerado, mantém o nome original
            if (item.status === 'error' || !finalName) {
                finalName = item.originalName;
            }

            // Se o rawData por algum motivo estiver nulo ou ausente, tenta recarregá-lo do arquivo original
            if (!item.rawData && item.file) {
                const buffer = await item.file.arrayBuffer();
                item.rawData = new Uint8Array(buffer);
            }

            if (!item.rawData) {
                console.warn(`Dados de arquivo ausentes para ${item.originalName}, pulando...`);
                continue;
            }

            // Verifica duplicatas
            if (nameCountMap[finalName]) {
                const count = nameCountMap[finalName];
                nameCountMap[finalName] = count + 1;
                
                // Adiciona sufixo antes da extensão
                const baseName = finalName.replace(/\.pdf$/i, '');
                finalName = `${baseName} (${count}).pdf`;
            } else {
                nameCountMap[finalName] = 1;
            }

            // Adiciona o arquivo no ZIP
            zip.file(finalName, item.rawData);
        }

        // Gera o arquivo ZIP
        const blob = await zip.generateAsync({ type: 'blob' });
        
        // Dispara o download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notas_fiscais_renomeadas.zip';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Erro ao gerar arquivo ZIP de exportação:", err);
        alert("Erro ao exportar arquivos ZIP: " + err.message);
    } finally {
        // Reabilita o botão
        btn.removeAttribute('disabled');
        if (btnSpan) btnSpan.textContent = originalText;
        
        // Re-seleciona o ícone atual (pois o lucide substituiu o elemento no DOM)
        const activeIcon = btn.querySelector('i, svg');
        if (activeIcon) {
            activeIcon.setAttribute('data-lucide', 'folder-archive');
            activeIcon.classList.remove('spin-animation');
        }
        if (window.lucide) lucide.createIcons();
    }
}

// Injeta estilo CSS específico de animação de rotação para o ícone de load
const style = document.createElement('style');
style.textContent = `
    .spin-animation {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);
window.openEditModal = openEditModal;
window.removeFileFromQueue = removeFileFromQueue;
