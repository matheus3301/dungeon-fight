# Implantação pública

Jogo: https://dungeon-fight.mmonteiro.dev  
Código: https://github.com/matheus3301/dungeon-fight

O Coolify acompanha a branch `main` por uma instalação autenticada do GitHub App. O build usa o `Dockerfile` do repositório, com uma única instância do servidor Node.js. A aplicação atende na porta interna 4310; o proxy publica HTTPS e WebSocket no mesmo domínio.

## Configuração de runtime

| Variável | Configuração |
| --- | --- |
| `DATABASE_URL` | Segredo de runtime com o login exclusivo do jogo |
| `ALLOWED_ORIGINS` | `https://dungeon-fight.mmonteiro.dev` |
| `HOST` | `0.0.0.0` |
| `PORT` | `4310` |

Essas variáveis não são enviadas ao build. Credenciais não ficam no Git, na imagem ou no cliente. O código inicializa as tabelas ao abrir a conexão com PostgreSQL.

O banco `dungeon_fight` e o login `dungeon_fight_app` foram criados dentro do PostgreSQL compartilhado existente. O login tem limite de 20 conexões, sem superusuário, criação de bancos/roles, replicação ou bypass de RLS. O banco permanece na rede privada. Redis não participa desta implantação.

O health check é `GET /api/health`, na porta 4310 e host `127.0.0.1`. A resposta de produção deve indicar `ok: true` e `persistence: postgres`. A imagem inclui um probe com Node.js; o probe HTTP do Coolify também funciona com o `wget` incluído no Alpine.

## Operação

Para jogar, crie uma mesa, copie o convite e espere os participantes marcarem que estão prontos. O anfitrião inicia a aventura. O convite não inclui a credencial pessoal, que fica no navegador de cada participante.

Mantenha uma única réplica. Um novo deploy recupera os snapshots no Postgres; presença e conexões WebSocket são restabelecidas pelos clientes. Não use o banco público em testes automatizados: as integrações precisam de uma instância descartável.

Backup e restauração ainda precisam ser exercitados antes de tratar as partidas como dados com garantia de recuperação. Expiração de salas, teste de carga e coordenação entre vários workers continuam pendentes.
