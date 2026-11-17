import { trajectory } from "../shared/trajectory";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  heroes,
  bosses,
  equipment,
  powerInfo,
  challengeInfo,
  type Color,
} from "../shared/content";
import type { View, Shot, Command } from "../shared/types";
import "./style.css";
const socket = io({ transports: ["websocket"], autoConnect: true });
type Session = {
  name: string;
  token: string;
  code?: string;
  createId?: string;
};
type State = View & { onlineIds?: string[] };
const colors: Color[] = ["red", "green", "blue", "white"];
const colorName: Record<Color, string> = {
  red: "Rubro",
  green: "Jade",
  blue: "Safira",
  white: "Bônus",
};
const heroDef = (id: string) => heroes.find((x) => x.id === id)!;
function newToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function Sprite({
  src,
  size = 64,
  className = "",
}: {
  src: string;
  size?: number;
  className?: string;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (
      !src.includes("/0x72/") ||
      !src.includes("_idle_anim_f0") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % 4), 220);
    return () => clearInterval(timer);
  }, [src]);
  return (
    <img
      className={`sprite ${className}`}
      src={src.replace(/_idle_anim_f0/, `_idle_anim_f${frame}`)}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}
function Die({
  color,
  active = false,
  onClick,
  disabled = false,
}: {
  color: Color;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`die ${color} ${active ? "selected" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={`Dado ${colorName[color]}`}
    >
      <span className="die-face">✥</span>
      <span>{colorName[color]}</span>
    </button>
  );
}
function SectionTitle({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{children}</h2>
      {aside && <span>{aside}</span>}
    </div>
  );
}
function Board({
  shot,
  shots = [],
  direction,
  power,
  hidden = false,
  onAim,
  training = false,
}: {
  shot: Shot | null;
  shots?: Shot[];
  direction: number;
  power: number;
  hidden?: boolean;
  onAim?: (d: number, p: number) => void;
  training?: boolean;
}) {
  const [moving, setMoving] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [flying, setFlying] = useState(false);
  const id = useRef("");
  useEffect(() => {
    if (!shot || shot.id === id.current) return;
    id.current = shot.id;
    let raf = 0;
    const start = performance.now(),
      reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFlying(!reduced);
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min((now - start) / 1100, 1),
        n = Math.min(
          shot.points.length - 1,
          Math.floor(t * (shot.points.length - 1)),
        );
      setMoving(shot.points[n]);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setFlying(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shot?.id]);
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onAim) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100,
      y = ((e.clientY - box.top) / box.height) * 100;
    onAim(
      Math.min(1, Math.max(0, 0.5 + (x - 50) / 105)),
      Math.min(1, Math.max(0, (94 - y - 30) / 49)),
    );
  };
  return (
    <div className={`board-wrap ${hidden ? "blind" : ""}`}>
      <div className="board-caption">
        <span>ARENA DE ARREMESSO</span>
        <span>{training ? "TREINO LIVRE" : "DADOS COMPARTILHADOS"}</span>
      </div>
      <svg
        className="board"
        viewBox="0 0 500 500"
        role="img"
        aria-label="Alvo de dados. Do anel externo ao centro: 1, 2, 3, 4, 5 e 10 pontos. Também é possível usar os controles de mira abaixo."
        onPointerDown={aim}
        onPointerMove={(e) => {
          if (e.buttons === 1) aim(e);
        }}
      >
        <defs>
          <pattern
            id="floor"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <image
              href="/assets/packs/0x72/frames/floor_1.png"
              width="40"
              height="40"
              opacity=".22"
            />
          </pattern>
          <filter id="shadow">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="8"
              floodColor="#000"
              floodOpacity=".35"
            />
          </filter>
        </defs>
        <rect x="0" y="0" width="500" height="500" fill="url(#floor)" />
        <ellipse
          cx="250"
          cy="225"
          rx="190"
          ry="163"
          fill="#10121b"
          filter="url(#shadow)"
        />
        <g className="target-rings" opacity={hidden ? 0.035 : 1}>
          <ellipse cx="250" cy="215" rx="177" ry="152" fill="#b59663" />
          <ellipse cx="250" cy="215" rx="171" ry="146" fill="#3b3b49" />
          <ellipse cx="250" cy="215" rx="148" ry="126" fill="#aa895a" />
          <ellipse cx="250" cy="215" rx="122" ry="104" fill="#343443" />
          <ellipse cx="250" cy="215" rx="87" ry="74" fill="#aa895a" />
          <ellipse cx="250" cy="215" rx="49" ry="42" fill="#3b3b49" />
          <ellipse cx="250" cy="215" rx="16" ry="14" fill="#e7cc85" />
          {[
            ["1", 88],
            ["2", 115],
            ["3", 145],
            ["4", 183],
            ["5", 219],
          ].map(([n, x]) => (
            <text
              key={n}
              x={x}
              y="220"
              textAnchor="middle"
              fill={n === "1" || n === "3" || n === "5" ? "#ded5c2" : "#242430"}
              fontSize="13"
              fontFamily="Georgia"
            >
              {n}
            </text>
          ))}
          <text
            x="250"
            y="220"
            textAnchor="middle"
            fill="#27242c"
            fontSize="11"
          >
            ✥
          </text>
          <circle
            cx="160"
            cy="180"
            r="14"
            fill="#141522"
            stroke="#696351"
            strokeWidth="2"
          />
          <circle
            cx="340"
            cy="275"
            r="14"
            fill="#141522"
            stroke="#696351"
            strokeWidth="2"
          />
          <path
            d="M250 47v-9M65 215h-9M435 215h9M250 380v10"
            stroke="#a48658"
            strokeWidth="2"
          />
        </g>
        <path
          d={`M250 468 L${250 + (direction - 0.5) * 190} ${400 - power * 65}`}
          stroke="#e3bf73"
          strokeWidth="2"
          strokeDasharray="4 7"
          opacity=".65"
        />
        <ellipse cx="250" cy="468" rx="37" ry="9" fill="#10121b" />
        <circle cx="250" cy="458" r="9" fill="#d3b279" />
        <path d="M245 458h10M250 453v10" stroke="#282331" />
        {shots
          .filter((s) => s.id !== shot?.id)
          .map((s) => (
            <rect
              key={s.id}
              x={s.x * 5 - 5}
              y={s.y * 5 - 5}
              width="10"
              height="10"
              rx="2"
              fill={
                {
                  red: "#d66b68",
                  green: "#6cba94",
                  blue: "#819fd7",
                  white: "#ded5c1",
                }[s.color]
              }
              opacity=".7"
            />
          ))}
        {shot && moving && (
          <g
            transform={`translate(${moving.x * 5},${moving.y * 5 - moving.z * 3})`}
          >
            <rect
              x="-9"
              y="-9"
              width="18"
              height="18"
              rx="3"
              fill={
                {
                  red: "#db7770",
                  green: "#7fc59e",
                  blue: "#8da9e5",
                  white: "#eee2c6",
                }[shot.color]
              }
              stroke="#191924"
              strokeWidth="2"
              transform={flying ? "rotate(25)" : ""}
            />
            <text textAnchor="middle" y="4" fill="#22202c" fontSize="12">
              {shot.icon ? "✥" : "•"}
            </text>
          </g>
        )}
        {hidden && (
          <text
            x="250"
            y="217"
            textAnchor="middle"
            fill="#b7ad9b"
            fontSize="16"
          >
            Confie na memória.
          </text>
        )}
        <text
          x="250"
          y="410"
          textAnchor="middle"
          fill="#8d887d"
          fontSize="10"
          letterSpacing="2"
        >
          QUIQUE ANTES DO ALVO
        </text>
      </svg>
      <div className="board-footer">
        <span>
          Centro <b>10</b> · Centro + ✥ <b>vitória imediata</b>
        </span>
        <span>○ buracos = erro</span>
      </div>
    </div>
  );
}
function Assets() {
  const [tab, setTab] = useState("personagens");
  const [gameAssets, setGameAssets] = useState<
    {
      id: string;
      url: string;
      license: string;
      author: string;
      role: string;
      archetype: string;
    }[]
  >([]);
  useEffect(() => {
    fetch("/assets/games/catalog.json")
      .then((r) => r.json())
      .then((catalog) => setGameAssets(catalog.assets))
      .catch(() => setGameAssets([]));
  }, []);
  return (
    <main className="asset-page">
      <div className="eyebrow">A BIBLIOTECA DA GUILDA</div>
      <h1>Um mundo, muitas histórias.</h1>
      <p className="lede">
        Personagens, criaturas e sons com origem identificada. A mesa usa uma
        família visual; o acervo guarda as alternativas.
      </p>
      <div className="tabs">
        {["personagens", "chefões", "sons", "modelos 3D", "créditos"].map(
          (x) => (
            <button aria-pressed={x === tab} onClick={() => setTab(x)} key={x}>
              {x}
            </button>
          ),
        )}
      </div>
      {tab === "personagens" && (
        <>
          <SectionTitle aside="0x72 · CC0">Os oito improváveis</SectionTitle>
          <div className="gallery">
            {heroes.map((h) => (
              <article key={h.id}>
                <Sprite src={h.sprite} size={88} />
                <h3>{h.name}</h3>
                <p>{h.title}</p>
              </article>
            ))}
          </div>
          <SectionTitle aside="Conjuntos alternativos">
            Do acervo de jogos
          </SectionTitle>
          <div className="gallery">
            {["dcss", "wesnoth"].flatMap((game) =>
              ["knight", "wizard", "ranger", "rogue"].map((role) => (
                <article key={game + role}>
                  <Sprite
                    src={`/assets/games/${game}/heroes/${role}.png`}
                    size={88}
                  />
                  <h3>{role}</h3>
                  <p>
                    {game === "dcss"
                      ? "Dungeon Crawl · CC0"
                      : "Wesnoth · GPL v2+"}
                  </p>
                </article>
              )),
            )}
          </div>
        </>
      )}
      {tab === "chefões" && (
        <>
          <SectionTitle aside="Pacote de demonstração original">
            Os donos do covil
          </SectionTitle>
          <div className="gallery">
            {bosses.map((b) => (
              <article key={b.id}>
                <Sprite src={b.sprite} size={110} />
                <h3>{b.name}</h3>
                <p>{b.description}</p>
              </article>
            ))}
          </div>
          <SectionTitle aside="Dungeon Crawl · CC0 selecionado">
            Outras criaturas
          </SectionTitle>
          <div className="gallery">
            {[
              "dragon",
              "demon",
              "necromancer",
              "minotaur",
              "ghost",
              "slime",
            ].map((x) => (
              <article key={x}>
                <Sprite src={`/assets/games/dcss/bosses/${x}.png`} size={96} />
                <h3>{x}</h3>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "sons" && (
        <>
          <SectionTitle aside="Kenney · rubberduck · Abstraction · CC0">
            O som da aventura
          </SectionTitle>
          <div className="audio-grid">
            {[
              ["throw", "Dados na mesa"],
              ["hit", "Impacto"],
              ["coin", "Moedas no baú"],
              ["magic", "Magia"],
              ["roar", "A criatura acordou"],
              ["exploration", "Sanctuary · exploração"],
              ["battle", "Rumble at the Gates · combate"],
            ].map(([id, label]) => (
              <article key={id}>
                <h3>{label}</h3>
                <audio
                  controls
                  preload="none"
                  src={`/assets/packs/audio/${id}.ogg`}
                />
              </article>
            ))}
          </div>
          <div className="catalog-section">
            <SectionTitle aside="Flare · Wesnoth · licenças individuais">
              Do acervo de jogos
            </SectionTitle>
            <div className="audio-grid">
              {gameAssets
                .filter((a) => a.url.endsWith(".ogg"))
                .map((a) => (
                  <article key={a.id}>
                    <h3>
                      {a.url.includes("wesnoth") ? "Wesnoth" : "Flare"} ·{" "}
                      {a.archetype ||
                        a.url.split("/").pop()?.replace(".ogg", "")}
                    </h3>
                    <p>
                      {a.author} · {a.license}
                    </p>
                    <audio controls preload="none" src={a.url} />
                  </article>
                ))}
            </div>
          </div>
        </>
      )}
      {tab === "modelos 3D" && (
        <>
          <SectionTitle aside="Kenney Mini Dungeon · CC0">
            Outra dimensão, mesma aventura
          </SectionTitle>
          <p>
            Modelos GLB com texturas estão disponíveis no acervo. A partida
            desta versão permanece em 2D.
          </p>
          <div className="model-list">
            {[
              "character-human",
              "character-orc",
              "chest",
              "table",
              "coin",
              "wall",
              "floor",
            ].map((x) => (
              <a
                download
                href={`/assets/packs/mini-dungeon-3d/models/${x}.glb`}
                key={x}
              >
                <span>◇</span> {x}
                <small>GLB ↓</small>
              </a>
            ))}
          </div>
          <p className="small-note">
            <a
              download
              href="/assets/packs/mini-dungeon-3d/models-with-textures.zip"
            >
              Baixar os 30 modelos GLB com as texturas ↗
            </a>
          </p>
          <div className="catalog-section">
            <SectionTitle aside="Flare · fontes para Blender · CC BY 3.0">
              Fontes 3D para adaptação
            </SectionTitle>
            <p>
              Clint Bellanger. Arquivos de trabalho, com atribuição preservada;
              a conversão e os materiais ainda precisam ser preparados para usar
              na partida.
            </p>
            <div className="model-list">
              {gameAssets
                .filter((a) => a.url.endsWith(".blend"))
                .map((a) => (
                  <a key={a.id} download href={a.url}>
                    <span>◇</span>
                    {a.archetype || a.id}
                    <small>BLEND ↓</small>
                  </a>
                ))}
            </div>
          </div>
        </>
      )}
      {tab === "créditos" && (
        <div className="credits-copy">
          <h2>Feito com trabalho de muita gente.</h2>
          <p>
            0x72 · personagens, criaturas e cenário. Kenney · sons de dados,
            interface e modelos 3D. rubberduck · efeitos de RPG. Abstraction /
            Tallbeard Studios · trilha sonora.
          </p>
          <p>
            Alternativas de Dungeon Crawl Stone Soup: seleção CC0 com exclusões.
            Battle for Wesnoth: sprites sob GPL v2+ da versão 1.12.6. Flare:
            licenças e atribuições individuais no catálogo.
          </p>
          <p>
            O código da Guilda dos Improváveis usa AGPL-3.0-or-later. Os assets
            mantêm suas próprias licenças; elas não são substituídas pela
            licença do código.
          </p>
          <p>
            <a href="https://github.com/matheus3301/dungeon-fight" target="_blank" rel="noreferrer">
              Código-fonte desta versão ↗
            </a>
          </p>
          <p>
            Personagens e encontros deste pacote são originais de demonstração.
            Esta versão é uma adaptação experimental inspirada em Dungeon
            Fighter, não uma edição digital oficial ou catálogo completo do jogo
            de tabuleiro.
          </p>
          <a
            href="/assets/packs/manifest.json"
            target="_blank"
            rel="noreferrer"
          >
            Catálogo dos packs e fontes ↗
          </a>
        </div>
      )}
    </main>
  );
}
function App() {
  const [room, setRoom] = useState<State | null>(null),
    [connected, setConnected] = useState(socket.connected),
    [tab, setTab] = useState("mesa"),
    [modal, setModal] = useState<"create" | "join" | null>(null),
    [name, setName] = useState(
      stored<Session | null>("guild:current", null)?.name ?? "",
    ),
    [code, setCode] = useState(
      new URLSearchParams(location.search).get("sala") ?? "",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState(false);
  const [direction, setDirection] = useState(0.5),
    [power, setPower] = useState(0.57),
    [loft, setLoft] = useState(0.4),
    [die, setDie] = useState<Color>("red"),
    [ability, setAbility] = useState("red"),
    [trainingShot, setTrainingShot] = useState<Shot | null>(null),
    [sound, setSound] = useState(false),
    [music, setMusic] = useState(false),
    [recipient, setRecipient] = useState(""),
    [message, setMessage] = useState(""),
    [copied, setCopied] = useState(false);
  const roomRef = useRef<State | null>(null),
    sessionRef = useRef<Session | null>(stored("guild:current", null)),
    pendingRef = useRef<Command | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    musicRef = useRef<HTMLAudioElement | null>(null),
    soundRef = useRef(sound),
    seenShot = useRef("");
  const receive = (next: State) => {
    const previous = roomRef.current;
    if (previous?.code === next.code && next.revision < previous.revision)
      return;
    const merged = {
      ...next,
      onlineIds: next.onlineIds ?? previous?.onlineIds,
    };
    roomRef.current = merged;
    setRoom(merged);
  };
  const persistSession = (s: Session) => {
    sessionRef.current = s;
    localStorage.setItem("guild:current", JSON.stringify(s));
    if (s.code) localStorage.setItem("guild:seat:" + s.code, JSON.stringify(s));
  };
  const emit = (event: string, payload: unknown) =>
    new Promise<any>((resolve, reject) =>
      socket
        .timeout(8000)
        .emit(event, payload, (err: Error | null, answer: any) =>
          err
            ? reject(
                new Error(
                  "Sem confirmação do servidor. Sua ação pode já ter sido salva.",
                ),
              )
            : resolve(answer),
        ),
    );
  const retry = async () => {
    const cmd = pendingRef.current;
    const pendingCode = roomRef.current?.code;
    if (!cmd || !pendingCode) return;
    setBusy(true);
    try {
      const result = await emit("room:command", cmd);
      if (result.ok || !result.retryable) {
        pendingRef.current = null;
        localStorage.removeItem("guild:pending:" + pendingCode);
        setPending(false);
      }
      if (!result.ok) throw new Error(result.error);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const enter = async (s: Session) => {
    setBusy(true);
    try {
      const result = await emit(s.code ? "room:join" : "room:create", s);
      if (!result.ok) throw new Error(result.error);
      persistSession({ ...s, code: result.room.code });
      receive(result.room);
      pendingRef.current = stored<Command | null>(
        "guild:pending:" + result.room.code,
        null,
      );
      setPending(Boolean(pendingRef.current));
      setModal(null);
      setError("");
      const url = new URL(location.href);
      url.searchParams.set("sala", result.room.code);
      history.replaceState(null, "", url);
      if (pendingRef.current) void retry();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      const q = new URLSearchParams(location.search).get("sala"),
        existing = q
          ? stored<Session | null>("guild:seat:" + q, null)
          : sessionRef.current;
      if (existing) {
        persistSession(existing);
        void enter(existing);
      } else if (q) {
        setCode(q);
        setModal("join");
      }
    };
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", receive);
    socket.on("session:replaced", () =>
      setError(
        "Esta vaga foi aberta em outro navegador. Volte ao navegador mais recente para jogar.",
      ),
    );
    if (socket.connected) onConnect();
    setPending(Boolean(pendingRef.current));
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", receive);
      socket.off("session:replaced");
    };
  }, []);
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    if (!modal && dialog.current?.open) dialog.current.close();
  }, [modal]);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);
  const play = (id: string) => {
    if (!soundRef.current) return;
    const a = new Audio(`/assets/packs/audio/${id}.ogg`);
    a.volume = 0.4;
    void a.play().catch(() => {});
  };
  useEffect(() => {
    if (!room?.lastShot || seenShot.current === room.lastShot.id) return;
    seenShot.current = room.lastShot.id;
    play("throw");
    const t = setTimeout(
      () => play(room.lastShot!.damage ? "hit" : "ui"),
      1050,
    );
    return () => clearTimeout(t);
  }, [room?.lastShot?.id]);
  useEffect(() => {
    if (!music) {
      musicRef.current?.pause();
      return;
    }
    const id =
      room?.phase === "combat" || room?.phase === "reaction"
        ? "battle"
        : "exploration";
    musicRef.current?.pause();
    const a = new Audio(`/assets/packs/audio/${id}.ogg`);
    a.loop = true;
    a.volume = 0.12;
    musicRef.current = a;
    void a.play().catch(() => {});
    return () => a.pause();
  }, [music, room?.phase]);
  const send = async (type: string, payload: Record<string, unknown> = {}) => {
    if (!room || busy) return;
    if (pendingRef.current) {
      setError("Confirme a ação anterior antes de enviar outra.");
      setPending(true);
      return;
    }
    const cmd: Command = {
      id: crypto.randomUUID(),
      revision: room.revision,
      type,
      payload,
    };
    pendingRef.current = cmd;
    localStorage.setItem("guild:pending:" + room.code, JSON.stringify(cmd));
    setBusy(true);
    try {
      const result = await emit("room:command", cmd);
      if (result.ok || !result.retryable) {
        pendingRef.current = null;
        localStorage.removeItem("guild:pending:" + room.code);
        setPending(false);
      }
      if (!result.ok) throw new Error(result.error);
      setError("");
      play(type === "purchase" ? "coin" : "ui");
    } catch (e) {
      if (pendingRef.current) setPending(true);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const bootstrap = (event: React.FormEvent) => {
    event.preventDefault();
    if (modal === "join") {
      const known = stored<Session | null>(
        "guild:seat:" + code.toUpperCase(),
        null,
      );
      const s = known ?? {
        name: name.trim(),
        token: newToken(),
        code: code.toUpperCase(),
      };
      persistSession(s);
      void enter(s);
    } else {
      const s = {
        name: name.trim(),
        token: newToken(),
        createId: crypto.randomUUID(),
      };
      persistSession(s);
      pendingRef.current = null;
      setPending(false);
      void enter(s);
    }
  };
  const current = room?.heroes[room.active],
    leader = room?.heroes[room.leader],
    myTurn = room?.phase === "combat" && current?.owner === room.you,
    canChoose = room?.phase === "path" && leader?.owner === room.you;
  useEffect(() => {
    if (!room) return;
    if (room.extraAttack || room.repeatDie) {
      setDie(room.lastShot?.color ?? "red");
      return;
    }
    if (
      (die === "white" && room.available.length > 0) ||
      (die !== "white" && !room.available.includes(die))
    )
      setDie(room.available[0] ?? "white");
    if (!recipient && room.heroes.length) setRecipient(room.heroes[0].id);
  }, [room?.revision]);
  const train = () => {
    const x = 50 + (direction - 0.5) * 105,
      y = 94 - (26 + power * 49 + loft * 8),
      d = Math.hypot((x - 50) / 35, (y - 43) / 30),
      hit =
        d <= 1 &&
        Math.hypot(x - 32, y - 36) >= 2.7 &&
        Math.hypot(x - 68, y - 55) >= 2.7;
    setTrainingShot({
      id: crypto.randomUUID(),
      heroId: "ferro",
      color: die,
      x,
      y,
      icon: false,
      hit,
      bullseye: d < 0.095,
      value: hit
        ? d < 0.095
          ? 10
          : d < 0.28
            ? 5
            : d < 0.5
              ? 4
              : d < 0.7
                ? 3
                : d < 0.85
                  ? 2
                  : 1
        : 0,
      bounces: loft >= 0.65 ? 2 : 1,
      points: trajectory(x, y, loft),
      reason: hit ? "Bom arremesso!" : "Fora do alvo. Ajuste a mira.",
      damage: 0,
    });
    play("throw");
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(
        location.origin + "/?sala=" + room!.code,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie o código da sala: " + room!.code);
    }
  };
  const disabled = busy || !connected || pending;
  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setTab("mesa");
          }}
        >
          <span className="brand-mark">✥</span>
          <span>
            GUILDA DOS
            <br />
            <strong>IMPROVÁVEIS</strong>
          </span>
        </a>
        <nav>
          {[
            ["mesa", "A mesa"],
            ["biblioteca", "Biblioteca"],
            ["regras", "Como jogar"],
          ].map(([id, label]) => (
            <button
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <span className={`connection ${connected ? "online" : ""}`}>
            {connected ? "Conectado" : "Reconectando"}
          </span>
          {room ? (
            <button className="invite" onClick={share}>
              {copied ? "Link copiado!" : `SALA ${room.code} ↗`}
            </button>
          ) : (
            <button className="subtle" onClick={() => setModal("join")}>
              Entrar por convite ↗
            </button>
          )}
        </div>
      </header>
      <div className="audio-controls">
        <button
          onClick={() => {
            setSound(!sound);
            soundRef.current = !sound;
            if (!sound) play("ui");
          }}
          aria-pressed={sound}
        >
          {sound ? "◖" : "◗"} Efeitos {sound ? "ligados" : "desligados"}
        </button>
        <button onClick={() => setMusic(!music)} aria-pressed={music}>
          ♫ Música {music ? "ligada" : "desligada"}
        </button>
        <span>Conteúdo original de demonstração · v0.1</span>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          {pending ? (
            <button onClick={() => void retry()} disabled={busy || !connected}>
              Confirmar ação anterior
            </button>
          ) : (
            <button onClick={() => setError("")} aria-label="Dispensar aviso">
              ×
            </button>
          )}
        </div>
      )}
      {tab === "biblioteca" ? (
        <Assets />
      ) : tab === "regras" ? (
        <main className="rules-page">
          <div className="eyebrow">ANTES DA PRIMEIRA ENCRENCA</div>
          <h1>
            Um grupo. Três dados.
            <br />
            Nenhum plano infalível.
          </h1>
          <div className="rules-columns">
            {[
              [
                "01",
                "Monte sua guilda",
                "Crie uma sala e compartilhe o convite. Escolha um herói e marque pronto. Sozinho, você controla dois heróis.",
              ],
              [
                "02",
                "Escolha o caminho",
                "O líder vê duas salas e escolhe uma. A sala muda os desafios e aproxima o grupo da loja.",
              ],
              [
                "03",
                "Mire, lance, sobreviva",
                "Escolha um dado disponível. Ajuste direção, força e elevação. Acertos ferem o monstro; erros provocam seu contra-ataque. O símbolo ✥ ativa o poder da cor.",
              ],
              [
                "04",
                "Guarde para o chefão",
                "Sem coloridos, use um dado branco ou pague vida para recuperar os três. Depois da terceira loja, enfrente o chefão: nessa luta não há recuperação pagando vida.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span className="rule-number">{n}</span>
                <h2>{t}</h2>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <p className="rules-note">
            Nesta primeira versão: 8 heróis, 6 chefes originais, 4 desafios de
            arremesso e uma aventura completa. Física, faces e equipamentos são
            uma adaptação digital de demonstração. As 26 restrições e o catálogo
            oficial do tabuleiro ainda não estão completos.
          </p>
          <button className="primary" onClick={() => setTab("mesa")}>
            Voltar à mesa →
          </button>
        </main>
      ) : (
        <main className="game-page">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {room
                  ? room.isBoss
                    ? "O ÚLTIMO ENCONTRO"
                    : `EXPEDIÇÃO · TRECHO ${Math.min(room.shopCount + 1, 3)} DE 3`
                  : "FANTASIA, DADOS & PÉSSIMAS IDEIAS"}
              </div>
              <h1>
                {!room
                  ? "Sua próxima boa história."
                  : room.phase === "lobby"
                    ? "A aventura começa em boa companhia."
                    : room.phase === "won"
                      ? "Improváveis. Invencíveis."
                      : room.phase === "lost"
                        ? "A próxima história será melhor."
                        : room.phase === "path"
                          ? "O próximo capítulo da masmorra."
                          : (room.room?.name ?? "No coração da masmorra.")}
              </h1>
              <p>
                {!room
                  ? "Reúna sua guilda. Acerte o alvo. Tente sobreviver à sua própria coragem."
                  : room.phase === "lobby"
                    ? "Escolham seus heróis e preparem os dados. O resto a gente improvisa."
                    : room.phase === "path"
                      ? "Dois caminhos. Uma decisão. A guilda segue a escolha do líder."
                      : (room.room?.description ??
                        room.endReason ??
                        "O último covil espera pelo grupo.")}
              </p>
            </div>
            {!room && (
              <button
                className="primary create-cta"
                onClick={() => setModal("create")}
              >
                ＋ Criar uma mesa
              </button>
            )}
            {room && room.phase !== "lobby" && (
              <div className="treasure">
                <span>BAÚ DO GRUPO</span>
                <div>
                  <b>◈ {room.gold}</b>
                  <i>✥ {room.whiteDice}</i>
                </div>
                <small>ouro · dados bônus</small>
              </div>
            )}
          </div>
          {room?.phase === "lobby" ? (
            <section className="lobby">
              <div className="lobby-main">
                <SectionTitle aside="8 heróis · uma escolha por pessoa">
                  Quem você vai ser?
                </SectionTitle>
                <div className="hero-picker">
                  {heroes.map((h) => {
                    const occupant = room.players.find(
                      (p) => p.heroId === h.id,
                    );
                    return (
                      <button
                        key={h.id}
                        className={occupant?.id === room.you ? "chosen" : ""}
                        disabled={
                          disabled ||
                          Boolean(occupant && occupant.id !== room.you)
                        }
                        onClick={() => void send("hero", { heroId: h.id })}
                      >
                        <Sprite src={h.sprite} size={72} />
                        <h3>{h.name}</h3>
                        <p>{h.title}</p>
                        <small>
                          {occupant
                            ? occupant.id === room.you
                              ? "SEU HERÓI"
                              : occupant.name
                            : "DISPONÍVEL"}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>
              <aside className="lobby-party">
                <SectionTitle aside={`${room.players.length}/6`}>
                  A guilda reunida
                </SectionTitle>
                {room.players.map((p) => (
                  <div className="lobby-player" key={p.id}>
                    <Sprite src={heroDef(p.heroId).sprite} size={44} />
                    <span>
                      <b>
                        {p.name}
                        {p.id === room.you ? " (você)" : ""}
                      </b>
                      <small>
                        {room.onlineIds?.includes(p.id)
                          ? "Na mesa"
                          : "Conexão interrompida"}
                      </small>
                    </span>
                    <i>{p.ready ? "✓" : "…"}</i>
                  </div>
                ))}
                <label>
                  Dificuldade
                  <select
                    value={room.difficulty}
                    disabled={!room.canHost || disabled}
                    onChange={(e) =>
                      void send("difficulty", { difficulty: e.target.value })
                    }
                  >
                    <option value="normal">Normal · para começar</option>
                    <option value="hard">Difícil · +3 de vida</option>
                    <option value="inferno">Inferno · +5 de vida</option>
                  </select>
                </label>
                <button
                  className="secondary full"
                  disabled={disabled}
                  onClick={() =>
                    void send("ready", {
                      ready: !room.players.find((p) => p.id === room.you)
                        ?.ready,
                    })
                  }
                >
                  {room.players.find((p) => p.id === room.you)?.ready
                    ? "✓ Estou pronto · desfazer"
                    : "Estou pronto"}
                </button>
                {room.canHost && (
                  <button
                    className="primary full"
                    disabled={disabled || !room.players.every((p) => p.ready)}
                    onClick={() => void send("start")}
                  >
                    Iniciar aventura →
                  </button>
                )}
                <button className="text-button full" onClick={share}>
                  {copied ? "Copiado!" : "Copiar convite para os amigos ↗"}
                </button>
                <p className="small-note">
                  Solo? Você ganha um segundo herói ao iniciar. Seu lugar é
                  salvo neste navegador.
                </p>
              </aside>
            </section>
          ) : (
            <div className="table-layout">
              <aside className="party-panel">
                <SectionTitle
                  aside={
                    room ? `${room.heroes.length} heróis` : "SUA FUTURA GUILDA"
                  }
                >
                  Os improváveis
                </SectionTitle>
                {(
                  room?.heroes ??
                  heroes.slice(0, 4).map((h) => ({
                    id: h.id,
                    owner: "",
                    hp: 9,
                    maxHp: 9,
                    scars: [],
                    fainted: false,
                    eliminated: false,
                    weapon: null,
                    armor: false,
                    armorUsed: false,
                    potions: 0,
                  }))
                ).map((h, i) => {
                  const d = heroDef(h.id);
                  return (
                    <article
                      className={`hero-card ${current?.id === h.id ? "turn" : ""} ${h.fainted ? "fainted" : ""}`}
                      key={h.id}
                    >
                      <div className="hero-top">
                        <Sprite src={d.sprite} size={56} />
                        <div>
                          <h3>
                            {d.name}
                            {room && h.owner === room.you && <sup>VOCÊ</sup>}
                          </h3>
                          <small>
                            {room?.players.find((p) => p.id === h.owner)
                              ?.name ?? d.title}
                          </small>
                        </div>
                        {room && i === room.leader && (
                          <span title="Líder da expedição">♛</span>
                        )}
                      </div>
                      <div className="life">
                        <div style={{ width: `${(h.hp / h.maxHp) * 100}%` }} />
                      </div>
                      <div className="hero-stats">
                        <span>
                          {h.eliminated
                            ? "Fora da expedição"
                            : h.fainted
                              ? "Desmaiado"
                              : `♥ ${h.hp} / ${h.maxHp}`}
                        </span>
                        <span>
                          {h.scars.length > 0
                            ? `${h.scars.length} cicatriz${h.scars.length > 1 ? "es" : ""}`
                            : "Sem cicatrizes"}
                        </span>
                      </div>
                      <div className="power-dots">
                        {(["red", "green", "blue"] as const).map((c) => (
                          <span
                            title={`${colorName[c]}: ${h.scars.includes(c) ? "Bloqueado por cicatriz" : powerInfo[d.powers[c]].description}`}
                            className={`${c} ${h.scars.includes(c) ? "scarred" : ""}`}
                            key={c}
                          >
                            {h.scars.includes(c) ? "×" : "✥"}
                          </span>
                        ))}
                        {h.weapon && <span title="Arma equipada">⚔</span>}
                        {h.armor && <span title="Armadura equipada">◇</span>}
                        {h.potions > 0 && (
                          <button
                            disabled={
                              disabled ||
                              h.owner !== room?.you ||
                              h.fainted ||
                              h.hp === h.maxHp
                            }
                            onClick={() =>
                              void send("potion", { heroId: h.id })
                            }
                          >
                            Poção ×{h.potions}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
                <div className="party-foot">
                  {room ? (
                    <>
                      <span className="eyebrow">ATÉ A PRÓXIMA LOJA</span>
                      <div className="expedition-track">
                        <i
                          style={{
                            width: `${Math.min(room.progress / 10, 1) * 100}%`,
                          }}
                        />
                      </div>
                      <small>
                        {room.progress}/10 passos · {room.shopCount}/3 lojas
                      </small>
                    </>
                  ) : (
                    <p>
                      Até seis amigos.
                      <br />
                      Uma história compartilhada.
                    </p>
                  )}
                </div>
              </aside>
              <section className="arena-panel">
                {room?.enemy && (
                  <div className={`enemy-card ${room.isBoss ? "boss" : ""}`}>
                    <Sprite
                      src={room.enemy.sprite}
                      size={room.isBoss ? 96 : 72}
                    />
                    <div>
                      <div className="eyebrow">
                        {room.isBoss
                          ? "CHEFÃO FINAL"
                          : `MONSTRO · NÍVEL ${room.enemy.level}`}
                      </div>
                      <h2>{room.enemy.name}</h2>
                      <p>{room.enemy.description}</p>
                      <div className="enemy-life">
                        <i
                          style={{
                            width: `${(Math.max(0, room.enemyHp) / room.enemyMaxHp) * 100}%`,
                          }}
                        />
                      </div>
                      <small>
                        ♥ {Math.max(0, room.enemyHp)} / {room.enemyMaxHp}{" "}
                        <span>Contra-ataque: {room.enemy.damage}</span>
                      </small>
                    </div>
                  </div>
                )}
                <Board
                  shot={room?.lastShot ?? trainingShot}
                  shots={room?.shots}
                  direction={direction}
                  power={power}
                  hidden={Boolean(myTurn && room?.room?.challenge === "blind")}
                  onAim={
                    !room || myTurn
                      ? (d, p) => {
                          setDirection(d);
                          setPower(p);
                        }
                      : undefined
                  }
                  training={!room}
                />
                {!room && (
                  <div className="practice-label">
                    TREINO LOCAL{" "}
                    <span>Experimente a mira antes de reunir o grupo.</span>
                  </div>
                )}
                {(!room || room.phase === "combat") && (
                  <div className="throw-controls">
                    <div className="turn-title">
                      <span className="eyebrow">
                        {room
                          ? myTurn
                            ? "É O SEU TURNO"
                            : `TURNO DE ${heroDef(current!.id).name.toUpperCase()}`
                          : "PREPARE SEU PRIMEIRO ARREMESSO"}
                      </span>
                      <span>
                        {room?.room
                          ? challengeInfo[room.room.challenge].name
                          : "Mire. Respire. Lance."}
                      </span>
                    </div>
                    <div className="dice-row">
                      {colors.map((c) => (
                        <Die
                          key={c}
                          color={c}
                          active={die === c}
                          disabled={
                            disabled ||
                            Boolean(
                              room &&
                                (!myTurn ||
                                  (c === "white"
                                    ? room.available.length > 0 ||
                                      room.whiteDice === 0
                                    : !room.available.includes(c))),
                            )
                          }
                          onClick={() => setDie(c)}
                        />
                      ))}
                    </div>
                    <div className="sliders">
                      {[
                        ["Direção", direction, setDirection],
                        ["Força", power, setPower],
                        ["Elevação", loft, setLoft],
                      ].map(([label, value, set]) => (
                        <label key={label as string}>
                          {label as string}
                          <b>{Math.round(Number(value) * 100)}%</b>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step=".01"
                            value={value as number}
                            disabled={Boolean(room && !myTurn) || disabled}
                            onChange={(e) =>
                              (set as (v: number) => void)(
                                Number(e.target.value),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    {die === "white" && room && (
                      <label className="white-ability">
                        Se vier ✥, usar
                        <select
                          value={ability}
                          onChange={(e) => setAbility(e.target.value)}
                        >
                          {(["red", "green", "blue"] as const).map((c) => (
                            <option
                              key={c}
                              value={c}
                              disabled={current?.scars.includes(c)}
                            >
                              {colorName[c]} ·{" "}
                              {powerInfo[heroDef(current!.id).powers[c]].name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="throw-actions">
                      <span>
                        {room?.room
                          ? challengeInfo[room.room.challenge].description
                          : "Você também pode clicar no alvo para ajustar a mira."}
                      </span>
                      <button
                        className="primary launch"
                        disabled={
                          disabled ||
                          Boolean(
                            room &&
                              (!myTurn ||
                                (die === "white"
                                  ? room.whiteDice === 0
                                  : !room.available.includes(die))),
                          )
                        }
                        onClick={() =>
                          room
                            ? void send("throw", {
                                color: die,
                                ability,
                                input: { direction, power, loft },
                              })
                            : train()
                        }
                      >
                        {busy
                          ? "Salvando…"
                          : room
                            ? "Arremessar dado ↗"
                            : "Testar arremesso ↗"}
                      </button>
                    </div>
                    {room &&
                      myTurn &&
                      room.available.length === 0 &&
                      !room.isBoss && (
                        <button
                          className="text-button"
                          disabled={disabled}
                          onClick={() => void send("recover")}
                        >
                          Recuperar coloridos · cada herói sofre{" "}
                          {room.enemy?.level} de dano
                        </button>
                      )}
                  </div>
                )}
                {room?.phase === "path" && (
                  <div className="decision-panel">
                    <div className="eyebrow">O PRÓXIMO PASSO</div>
                    <h2>
                      {canChoose
                        ? "Qual história vamos contar?"
                        : `${heroDef(leader!.id).name} está escolhendo o caminho.`}
                    </h2>
                    {canChoose ? (
                      <div className="path-options">
                        {room.candidates.map((r, i) => (
                          <button
                            key={i}
                            disabled={disabled}
                            onClick={() => void send("path", { index: i })}
                          >
                            <span>
                              CAMINHO {i + 1} · {r.steps} PASSOS
                            </span>
                            <h3>{r.name}</h3>
                            <p>{r.description}</p>
                            <small>{challengeInfo[r.challenge].name} →</small>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p>
                        O líder vê duas salas em segredo. Aproveite para
                        combinar a estratégia.
                      </p>
                    )}
                  </div>
                )}
                {room?.phase === "reaction" && (
                  <div className="decision-panel">
                    <div className="eyebrow">OUTRA CHANCE</div>
                    <h2>O destino aceita uma segunda tentativa.</h2>
                    <p>
                      {room.pending?.reason} O primeiro resultado ainda não foi
                      aplicado.
                    </p>
                    {current?.owner === room.you ? (
                      <div className="button-row">
                        <button
                          className="secondary"
                          disabled={disabled}
                          onClick={() => void send("keep")}
                        >
                          Manter resultado
                        </button>
                        <button
                          className="primary"
                          disabled={disabled}
                          onClick={() => void send("reroll")}
                        >
                          Relançar o mesmo dado ↗
                        </button>
                      </div>
                    ) : (
                      <p>
                        Aguardando a decisão de {heroDef(current!.id).name}.
                      </p>
                    )}
                  </div>
                )}
                {room?.phase === "rest" && (
                  <div className="decision-panel">
                    <div className="eyebrow">UMA PAUSA MERECIDA</div>
                    <h2>Mais uma história para a taverna.</h2>
                    {room.restPending.map((id) => {
                      const h = room.heroes.find((x) => x.id === id)!;
                      return (
                        <div key={id}>
                          <p>
                            {heroDef(id).name} precisa escolher uma cicatriz.
                          </p>
                          {h.owner === room.you &&
                            (["red", "green", "blue"] as const)
                              .filter((c) => !h.scars.includes(c))
                              .map((c) => (
                                <button
                                  className="subtle"
                                  disabled={disabled}
                                  key={c}
                                  onClick={() =>
                                    void send("scar", { heroId: id, color: c })
                                  }
                                >
                                  Bloquear {colorName[c]}
                                </button>
                              ))}
                        </div>
                      );
                    })}
                    <p>
                      O descanso recupera os dados coloridos e renova as
                      armaduras. A vida dos heróis conscientes só volta com
                      cura.
                    </p>
                    <button
                      className="primary"
                      disabled={
                        disabled ||
                        room.restPending.length > 0 ||
                        !(leader?.owner === room.you || room.canHost)
                      }
                      onClick={() => void send("continue")}
                    >
                      {room.progress >= 10
                        ? "Entrar na loja →"
                        : "Seguir pela masmorra →"}
                    </button>
                  </div>
                )}
                {room?.phase === "shop" && (
                  <div className="decision-panel shop-panel">
                    <div className="eyebrow">
                      LOJA {room.shopCount + 1} DE 3
                    </div>
                    <h2>Coragem também se compra.</h2>
                    <label>
                      Entregar equipamento a
                      <select
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                      >
                        {room.heroes
                          .filter((h) => !h.eliminated)
                          .map((h) => (
                            <option key={h.id} value={h.id}>
                              {heroDef(h.id).name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <div className="shop-grid">
                      {equipment
                        .filter((e) => room.shopStock.includes(e.id))
                        .map((e) => (
                          <button
                            disabled={
                              disabled ||
                              leader?.owner !== room.you ||
                              room.gold < e.cost
                            }
                            onClick={() =>
                              void send("purchase", {
                                kind: "item",
                                itemId: e.id,
                                heroId: recipient,
                              })
                            }
                            key={e.id}
                          >
                            <Sprite src={e.sprite} size={40} />
                            <b>{e.name}</b>
                            <p>{e.description}</p>
                            <strong>◈ {e.cost}</strong>
                          </button>
                        ))}
                    </div>
                    <div className="button-row">
                      <button
                        className="secondary"
                        disabled={
                          disabled ||
                          leader?.owner !== room.you ||
                          room.gold < 1
                        }
                        onClick={() => void send("purchase", { kind: "heal" })}
                      >
                        Curar o grupo · ◈ 1
                      </button>
                      <button
                        className="secondary"
                        disabled={
                          disabled ||
                          leader?.owner !== room.you ||
                          room.gold < 2 ||
                          room.whiteDice >= 9
                        }
                        onClick={() => void send("purchase", { kind: "die" })}
                      >
                        Dado bônus · ◈ 2
                      </button>
                    </div>
                    {room.shopCount === 2 && (
                      <p className="warning">
                        O chefão é o próximo encontro. Guarde dados brancos: não
                        será possível recuperar os coloridos pagando vida.
                      </p>
                    )}
                    <button
                      className="primary"
                      disabled={disabled || leader?.owner !== room.you}
                      onClick={() => void send("leaveShop")}
                    >
                      {room.shopCount === 2
                        ? "Enfrentar o chefão →"
                        : "Continuar aventura →"}
                    </button>
                  </div>
                )}
                {room && ["won", "lost"].includes(room.phase) && (
                  <div className="decision-panel final-panel">
                    <div className="eyebrow">
                      {room.phase === "won"
                        ? "UMA LENDA IMPROVÁVEL"
                        : "FIM DA EXPEDIÇÃO"}
                    </div>
                    <h2>
                      {room.phase === "won"
                        ? "A próxima rodada é por conta da casa."
                        : "Os dados querem revanche."}
                    </h2>
                    <p>{room.endReason}</p>
                    <p>
                      ◈ {room.gold} moedas · ✥ {room.whiteDice} dados bônus ·{" "}
                      {room.round} encontros vencidos
                    </p>
                    <button
                      className="primary"
                      onClick={() => setModal("create")}
                    >
                      Criar outra aventura →
                    </button>
                  </div>
                )}
              </section>
              <aside className="journal-panel">
                <SectionTitle aside="AO VIVO">Diário da guilda</SectionTitle>
                <div className="journal-list" aria-live="polite">
                  {room ? (
                    room.log
                      .slice(-14)
                      .reverse()
                      .map((l) => (
                        <article className={l.kind} key={l.id}>
                          <span>
                            {l.kind === "good"
                              ? "✧"
                              : l.kind === "bad"
                                ? "×"
                                : "·"}
                          </span>
                          <p>{l.text}</p>
                        </article>
                      ))
                  ) : (
                    <>
                      <article>
                        <span>✧</span>
                        <p>
                          Uma taverna, um convite e seis pessoas que deveriam
                          saber o que estão fazendo.
                        </p>
                      </article>
                      <article>
                        <span>·</span>
                        <p>
                          Experimente o alvo ou crie uma sala para jogar de
                          verdade.
                        </p>
                      </article>
                      <div className="journal-art">
                        <Sprite
                          src="/assets/packs/0x72/frames/chest_full_open_anim_f0.png"
                          size={88}
                        />
                        <span>
                          BOAS HISTÓRIAS
                          <br />
                          NÃO CABEM NUM BAÚ.
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {room && (
                  <form
                    className="chat"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (message.trim()) {
                        void send("chat", { text: message });
                        setMessage("");
                      }
                    }}
                  >
                    <input
                      aria-label="Mensagem para o grupo"
                      placeholder="Combine com o grupo…"
                      maxLength={280}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                      disabled={disabled || !message.trim()}
                      aria-label="Enviar mensagem"
                    >
                      ↗
                    </button>
                  </form>
                )}
                <div className="journal-note">
                  {room
                    ? "A partida é salva após cada ação confirmada. Você pode fechar a aba e voltar."
                    : "Sem anúncios. Sem instalar nada. Uma mesa aberta para contar histórias."}
                </div>
              </aside>
            </div>
          )}
        </main>
      )}
      <footer>
        <span>GUILDA DOS IMPROVÁVEIS</span>
        <p>Uma mesa cooperativa. Código aberto. Feita para jogar junto.</p>
        <button onClick={() => setTab("biblioteca")}>
          Arte, áudio e créditos ↗
        </button>
      </footer>
      <dialog ref={dialog} onCancel={() => setModal(null)}>
        <button
          className="dialog-close"
          onClick={() => setModal(null)}
          aria-label="Fechar"
        >
          ×
        </button>
        <div className="eyebrow">PUXE UMA CADEIRA</div>
        <h2>
          {modal === "join"
            ? "Sua guilda está esperando."
            : "Toda aventura precisa de alguém que convide."}
        </h2>
        <form onSubmit={bootstrap}>
          <label>
            Seu apelido
            <input
              autoFocus
              required
              minLength={1}
              maxLength={24}
              placeholder="Como vão te chamar na taverna?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {modal === "join" && (
            <label>
              Código da sala
              <input
                required
                minLength={6}
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC234"
              />
            </label>
          )}
          <p className="small-note">
            Seu lugar fica salvo neste navegador. O convite não leva sua
            credencial pessoal.
          </p>
          <button
            type="submit"
            className="primary full"
            disabled={busy || !connected}
          >
            {busy
              ? "Preparando a mesa…"
              : modal === "join"
                ? "Entrar na mesa →"
                : "Criar minha mesa →"}
          </button>
        </form>
      </dialog>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
