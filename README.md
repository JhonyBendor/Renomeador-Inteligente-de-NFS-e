# Renomeador-Inteligente-de-NFS-e
O **JB Renamer** é um aplicativo web, responsivo e extremamente veloz projetado para automatizar a padronização e renomeação de Notas Fiscais de Serviço Eletrônicas (NFS-e) em lote.
Principais Funcionalidades

* **Processamento 100% Client-Side (Privacidade Local)**: A leitura dos PDFs e a compactação ocorrem inteiramente no seu navegador. Nenhuma nota fiscal é enviada a servidores externos, garantindo privacidade absoluta e total conformidade com a LGPD.
* **Leitura Concorrente Inteligente**: Motor de parsing desenvolvido com expressões regulares avançadas para identificar e extrair metadados das NFS-e (Data de Emissão, Número da Nota, Razão Social do Prestador, CNPJ e Valor Total).
* **Compatibilidade com Diferentes Layouts**: Mapeia de forma inteligente seções de Emitente e Tomador, sendo compatível com o novo Padrão Nacional e formatos de diversas prefeituras municipais do Brasil.
* **Fórmula de Nomenclatura Dinâmica**: Crie seu próprio padrão de nomes usando variáveis/tags interativas como `{data}`, `{numero}`, `{prestador}`, `{cnpj}`, `{valor}` e `{original}`.
* **Ajustes Manuais Visuais**: Se alguma nota tiver dados parciais ou ilegíveis, você pode editar os metadados diretamente na tabela do painel antes de exportar.
* **Resiliência de Arquivos**: PDFs com erros de leitura não travam o processo e são incluídos no download final mantendo seus nomes originais, garantindo que você nunca perca nenhum documento.
* **Interface Premium**: Design moderno em *Dark Mode Glassmorphism* com suporte nativo a Tema Claro.

---

## 🛠️ Tecnologias Utilizadas

* [PDF.js (Mozilla)](https://mozilla.github.io/pdf.js/) — Extração programática de texto de PDFs.
* [JSZip](https://stuk.github.io/jszip/) — Compactação e descompactação de arquivos ZIP cliente-side.
* [Lucide Icons](https://lucide.dev/) — Iconografia moderna vetorial.
* Google Fonts (Outfit & JetBrains Mono) — Tipografia de alta legibilidade.
* HTML5, CSS3 e JavaScript puro (ES6+).

---

## 💻 Como Executar Localmente

Como a aplicação é estática, nenhuma instalação de banco de dados ou backend é necessária.

### Método 1: Abertura Direta (Sem Servidor)
1. Baixe os arquivos do projeto.
2. Dê um duplo clique no arquivo `index.html`. Ele abrirá no seu navegador de internet padrão.

### Método 2: Servidor Local (Recomendado)
Se preferir rodar com um servidor HTTP simples (útil para evitar bloqueios rígidos de segurança de arquivos locais em alguns navegadores):
* No terminal do seu computador (na pasta do projeto), rode:
  ```bash
  python -m http.server 8000
  ```
* Abra o seu navegador e acesse: `http://localhost:8000`

---

## 🌐 Como Publicar Online (Grátis em 10 Segundos)

Para gerar um link universal e usar o aplicativo de qualquer lugar (ou compartilhar com sua equipe):

1. **Vercel**:
   * Crie uma conta gratuita em [Vercel.com](https://vercel.com).
   * Vá em "Add New Project" e faça o upload manual da pasta do projeto na seção de diretório estático (*Vercel Drop*).
2. **Netlify**:
   * Acesse [app.netlify.com/drop](https://app.netlify.com/drop) e faça login.
   * Arraste a pasta inteira do projeto para a área pontilhada na tela.

---

## 📝 Licença e Autoria

Desenvolvido com carinho por **Jhony Bendor** para otimização de rotinas fiscais. 

Consulte o arquivo [`documentacao.md`](documentacao.md) para detalhes técnicos avançados do motor de extração heurística.

