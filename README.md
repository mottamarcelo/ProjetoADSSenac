# Orientações para execução do projeto


## Frontend
>Para criação do projeto React foi utilizado o Vite

1) Pré-requisitos:
Ter o node.js instalado (para verificar, rodar o comando node -v e npm -v no terminal)

2) Instalar dependências:
No terminal navegar até a pasta do projeto e executar o comando: npm install

3) Rodar o projeto:
No terminal, executar o comando: npm run dev

4) Abrir no navegador:
Verificar qual a instância, provavelmente http://localhost:5173/


## Backend
Passo a passo para rodar e testar o projeto FastAPI
1️⃣ Abrir o terminal e ativar o projeto
No seu PC:

Abra o PowerShell, CMD ou terminal do VS Code.

Navegue até a pasta do backend:

cd "C:\Users\user\Desktop\Guto\Senac\Rota Certa\backend"


Ative o ambiente virtual:

.\venv\Scripts\Activate
Você verá (venv) no início da linha.

2️⃣ Garantir que o .env existe e está correto
Na raiz do backend, tenha um arquivo .env com as variáveis necessárias:

DATABASE_URL=sqlite:///./test.db  # ou PostgreSQL, MySQL, etc.
SECRET_KEY=minha_chave_secreta
Dica: o .env deve estar no mesmo nível da pasta app.

3️⃣ Rodar o servidor FastAPI
Com o venv ativo, execute:

uvicorn app.main:app --reload
Saída esperada:

arduino
Copiar
Editar
INFO: Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO: Started reloader process [...]
--reload permite que o servidor reinicie automaticamente quando você alterar arquivos Python.

4️⃣ Testar no PC via navegador
Abra o navegador.

Digite o endereço:

arduino
Copiar
Editar
http://127.0.0.1:8000/docs
Isso abrirá a interface Swagger UI do FastAPI.

Você pode ver todos os endpoints e testar GET, POST, etc. diretamente do navegador.

5️⃣ Testar no celular
Para testar no celular, o celular e o PC precisam estar na mesma rede Wi-Fi.

Descubra o IP local do seu PC:

No PowerShell:

powershell
Copiar
Editar
ipconfig
Procure o IPv4 da sua rede, algo como 192.168.1.100.

Rode o servidor permitindo acesso externo:

powershell
Copiar
Editar
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
--host 0.0.0.0 permite que outros dispositivos da rede acessem.

--port 8000 é a porta do servidor (pode ser qualquer outra).

No navegador do celular, digite:

http://192.168.1.100:8000/docs
Substitua 192.168.1.100 pelo IP do seu PC.

Agora você verá a mesma interface Swagger no celular.

6️⃣ Testar endpoints
GET /: deve retornar:

json
Copiar
Editar
{"message": "API funcionando!"}
Para outros endpoints, você pode usar a Swagger UI ou aplicativos como Postman ou Insomnia.

7️⃣ Dicas finais
Se você alterar código Python, o servidor recarrega sozinho por causa do --reload.

Para parar o servidor, pressione CTRL+C no terminal.

Se quiser acessar do celular fora da rede local (internet), precisaria configurar redirecionamento de porta ou usar um túnel como ngrok.
