# Documentação do Projeto: JB Renamer

Esta documentação descreve o funcionamento, arquitetura, tecnologias e guias de distribuição para o aplicativo web **JB Renamer** (desenvolvido por Jhony Bendor).

---

## 1. Visão Geral do Projeto

O objetivo deste aplicativo é eliminar a necessidade de renomear Notas Fiscais de Serviço Eletrônicas (NFS-e) manualmente. Ele lê os arquivos PDF, extrai os dados cruciais (Data de Emissão, Número da Nota, Nome do Prestador, CNPJ do Prestador e Valor Total) utilizando heurísticas avançadas de expressões regulares, e renomeia os arquivos automaticamente de acordo com um padrão customizável.

### Diferencial Crítico: Privacidade 100% Local
Diferente de soluções convencionais que enviam arquivos para servidores externos para processamento, esta ferramenta é executada **inteiramente no navegador do usuário**.
* **Sem upload de dados**: As notas fiscais nunca saem do computador do usuário.
* **Segurança e Conformidade**: Totalmente em linha com as diretrizes de compliance de dados (LGPD) e segurança da informação corporativa.
* **Sem custo de servidor**: Pode ser executado em qualquer máquina, inclusive offline.

---

## 2. Tecnologias Utilizadas

A aplicação foi desenvolvida utilizando tecnologias web puras (Vanilla stack), garantindo leveza, compatibilidade e facilidade de distribuição:

1. **HTML5**: Estrutura semântica da aplicação.
2. **CSS3 (Vanilla)**: Folha de estilos contendo o design system premium (Dark Mode com efeito *Glassmorphism*, transições e animações fluidas, responsividade total).
3. **JavaScript (ES6+)**: Mecanismos de controle de estado da fila, manipulação de arquivos e parsing.
4. **PDF.js (Mozilla)** (via CDN): Biblioteca utilizada para renderizar os documentos PDF e extrair os blocos de texto contidos em suas páginas de forma programática.
5. **JSZip** (via CDN): Biblioteca para descompactar lotes de notas em arquivos `.zip` enviados pelo usuário e empacotar novamente os arquivos renomeados para download em um novo arquivo `.zip`.
6. **Lucide Icons** (via CDN): Biblioteca de vetores SVG de alta definição para a iconografia moderna do sistema.
7. **Google Fonts (Outfit & JetBrains Mono)**: Tipografia moderna e legível para a interface do dashboard e visualizações de código.

---

## 3. Estrutura de Arquivos do Projeto

O projeto é autossuficiente e composto por apenas 3 arquivos principais:

* `index.html`: O arquivo de entrada da aplicação, contendo o layout e as importações de CDNs.
* `style.css`: Toda a estilização visual (tema escuro/claro, botões, modais, etc.).
* `app.js`: A inteligência da aplicação (motor de análise, processamento de fila e downloads).

---

## 4. Como o Motor de Análise (Parsing) Funciona

O motor de análise contido em `app.js` opera de forma estruturada e em camadas (*Tiers*) para garantir compatibilidade com centenas de layouts municipais e o Padrão Nacional:

### A. Separação de Zonas
O script divide o texto do PDF buscando a zona do **Emitente (Prestador)** e a zona do **Tomador (Cliente)**. Isso impede que o nome do cliente seja confundido com o nome do prestador.

### B. Heurística do Nome do Prestador
* **Tier 1 (Legendados)**: O motor procura por termos como `Nome / Nome Empresarial`, `Nome Empresarial`, `Razão Social`. Se o texto do nome não estiver na mesma linha (ex: após `:`), o script lê a linha de baixo (essencial para o Padrão Nacional das NFS-e).
* **Tier 2 (Sufixos Corporativos)**: Busca palavras indicadoras de empresas (como `LTDA`, `S/A`, `MEI`, `EPP`, `EIRELI`, `CULTURA`, `SERVIÇOS`) especificamente na zona do prestador.
* **Tier 3 (Vizinhança de CNPJ)**: Localiza o CNPJ do prestador (primeiro CNPJ encontrado) e inspeciona as linhas vizinhas acima e abaixo.

### C. Heurística de Números e Datas
* O número da nota é buscado através de expressões regulares comuns de identificadores (ex: `NFS-e Nº`, `Nota Fiscal Nº`) ou lendo a linha seguinte a legendas de número de forma consecutiva.
* Datas de emissão são padronizadas a partir de strings brasileiras `DD/MM/AAAA` e convertidas no formato desejado.

---

## 5. Como Compartilhar e Distribuir o Aplicativo

Como o aplicativo é estático e baseado inteiramente em cliente-side (navegador), distribuí-lo é extremamente simples. Há duas formas principais:

### Método A: Compartilhamento Local (Sem Internet)
1. Compacte a pasta `nfse-renamer` em um arquivo `.zip`.
2. Envie esse arquivo por E-mail, WhatsApp, Teams ou pendrive para qualquer pessoa.
3. O destinatário precisa apenas **descompactar a pasta** e dar **dois cliques no arquivo `index.html`**. O aplicativo abrirá no navegador padrão e estará 100% funcional imediatamente!

### Método B: Publicação Online Gratuita (Link Universal)
Para gerar um link online onde qualquer pessoa no mundo possa acessar por navegador sem precisar baixar nada, você pode usar plataformas de hospedagem gratuitas:

#### Opção 1: Vercel (Recomendado pela simplicidade)
1. Acesse o site da **Vercel** (https://vercel.com).
2. Crie uma conta gratuita (pode usar login do Google ou GitHub).
3. Vá no painel principal da Vercel e procure pela seção de **Drag and Drop** (arrastar e soltar) para sites estáticos (geralmente em https://vercel.com/new e rolar até encontrar *"Deploy a static directory"*).
4. Arraste a pasta inteira `nfse-renamer` para lá.
5. Em menos de 10 segundos, a Vercel gerará um link universal seguro (ex: `https://jb-renamer.vercel.app`) para você enviar para quem quiser!

#### Opção 2: Netlify (Igualmente simples)
1. Acesse o site **Netlify** (https://netlify.com) e entre em sua conta gratuita.
2. Acesse a área de "Add new site" -> "Deploy manually" (ou vá direto em https://app.netlify.com/drop).
3. Arraste e solte a pasta `nfse-renamer` no local indicado.
4. O Netlify publicará o site instantaneamente e fornecerá um link compartilhado pronto para uso.

#### Opção 3: GitHub Pages (Ideal para desenvolvedores)
1. Crie um repositório no GitHub contendo os 3 arquivos (`index.html`, `style.css`, `app.js`).
2. Ative o **GitHub Pages** nas configurações do repositório (*Settings -> Pages*).
3. O projeto ficará disponível no link `https://[seu-usuario].github.io/[nome-do-repositorio]/`.
