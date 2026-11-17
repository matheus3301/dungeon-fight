import { useEffect, useRef, useState, type CSSProperties } from "react";
import { heroes, challengeInfo } from "../shared/content";
import type { View } from "../shared/types";
import { BATTLE_DURATION, SHOT_DURATION } from "../shared/throw";
import { Sprite } from "./Sprite";
const frame = (name: string) => `/assets/packs/0x72/frames/${name}.png`;
const hero = (id: string) => heroes.find((h) => h.id === id)!;
const palettes: Record<string, [string, string, string, string]> = {
  village: ["#284c3b", "#355c43", "#85704c", "#ba8a50"],
  crossroads: ["#293f36", "#365244", "#79694d", "#acc16f"],
  fountain: ["#24484a", "#315b59", "#7e8270", "#70c8c1"],
  dark: ["#292439", "#362e49", "#655774", "#bda3e3"],
  mirror: ["#293f53", "#354e62", "#778893", "#a7d3ed"],
  stairs: ["#423735", "#544640", "#847260", "#d6a775"],
  treasury: ["#3a3528", "#4d4630", "#8c7b48", "#e7c864"],
  hall: ["#353a40", "#444a4e", "#7c8179", "#c4bb9c"],
  boss: ["#3d2633", "#4e2c3d", "#79515a", "#e48a79"],
  shop: ["#403629", "#524632", "#967749", "#e5c076"],
};
function MapHero({
  src,
  size,
  attacking,
}: {
  src: string;
  size: number;
  attacking: boolean;
}) {
  const [arriving, setArriving] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setArriving(false), 650);
    return () => clearTimeout(t);
  }, []);
  return (
    <Sprite
      src={src}
      size={size}
      action={arriving || attacking ? "run" : "idle"}
    />
  );
}
export function TileMap({ id }: { id: string }) {
  const [base, accent, path, light] = palettes[id] ?? palettes.hall;
  const village = id === "village",
    forest = village || id === "crossroads",
    water = id === "fountain";
  return (
    <svg
      className="world-map"
      viewBox="0 0 1152 384"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Cenário visto de cima: ${id === "village" ? "vila da guilda" : id === "crossroads" ? "bifurcação da masmorra" : id}`}
    >
      <defs>
        <pattern
          id={`ground-${id}`}
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <rect width="32" height="32" fill={base} />
          <path d="M2 3h8v3H2zM19 20h7v3h-7zM8 27h3v3H8z" fill={accent} />
          {!forest && (
            <image
              href={frame("floor_1")}
              width="32"
              height="32"
              opacity=".24"
            />
          )}
        </pattern>
      </defs>
      <rect width="1152" height="384" fill={`url(#ground-${id})`} />
      <rect x="0" y="272" width="192" height="64" fill={path} />
      <rect x="960" y="272" width="192" height="64" fill={path} />
      <g transform="translate(192 0)">
        {Array.from({ length: 24 }, (_, x) => (
          <g key={x}>
            {[0, 11].map((y) => (
              <image
                key={y}
                href={frame(forest ? "wall_top_mid" : "wall_mid")}
                x={x * 32}
                y={y * 32}
                width="32"
                height="32"
                opacity={forest ? ".35" : ".9"}
              />
            ))}
          </g>
        ))}
        <path
          d={
            id === "crossroads"
              ? "M0 272H320V256H416V288H768V352H384V320H288V336H0Z M352 256V80H416V256Z"
              : "M0 272H192V240H640V272H768V336H608V304H224V336H0Z"
          }
          fill={path}
        />
        <path
          d="M0 284h176v-32h448v32h144"
          fill="none"
          stroke={light}
          strokeWidth="4"
          opacity=".14"
        />
        {forest &&
          Array.from({ length: 13 }, (_, i) => {
            const x = i * 61,
              y = i % 2 ? 45 : 77;
            return (
              <g key={i} transform={`translate(${x},${y})`}>
                <rect x="21" y="35" width="10" height="22" fill="#68513d" />
                <path
                  d="M5 35V13H15V1H39V13H49V35H39V45H15V35Z"
                  fill={i % 2 ? "#477252" : "#345c43"}
                />
                <path d="M14 15h23v7H14Z" fill="#67805a" />
              </g>
            );
          })}
        {village ? (
          <g shapeRendering="crispEdges">
            <rect x="264" y="70" width="224" height="120" fill="#b4996c" />
            <rect x="272" y="100" width="208" height="88" fill="#806d50" />
            <path
              d="M232 98V82H248V66H264V50H488V66H504V82H520V98Z"
              fill="#855343"
            />
            <path d="M264 62h224v9H264zM248 82h256v6H248z" fill="#a86a51" />
            <rect x="350" y="124" width="48" height="66" fill="#272a2b" />
            <rect x="292" y="120" width="30" height="32" fill="#e0b55e" />
            <rect x="428" y="120" width="30" height="32" fill="#e0b55e" />
            <rect x="304" y="120" width="5" height="32" fill="#66513b" />
            <rect x="440" y="120" width="5" height="32" fill="#66513b" />
            <rect x="341" y="102" width="66" height="16" fill="#473e34" />
            <text
              x="374"
              y="113"
              textAnchor="middle"
              fontSize="9"
              fill="#e4ca92"
            >
              A TAVERNA
            </text>
          </g>
        ) : (
          <>
            {[80, 144, 592, 656].map((x, i) => (
              <image
                key={x}
                href={frame(id === "dark" ? "column_wall" : "column")}
                x={x}
                y={64 + (i % 2) * 32}
                width="48"
                height="72"
              />
            ))}
            {id === "stairs" &&
              [0, 1, 2, 3].map((i) => (
                <rect
                  key={i}
                  x={288 + i * 12}
                  y={70 + i * 25}
                  width={192 - i * 24}
                  height="20"
                  fill={path}
                  stroke={light}
                  strokeWidth="2"
                />
              ))}
            {id === "mirror" &&
              [0, 1, 2].map((i) => (
                <g key={i}>
                  <rect
                    x={300 + i * 70}
                    y="70"
                    width="42"
                    height="95"
                    fill="#93becb"
                    stroke="#bbd6db"
                    strokeWidth="6"
                  />
                  <path
                    d={`M${304 + i * 70} 150l32 -60`}
                    stroke="#d4ebea"
                    strokeWidth="3"
                  />
                </g>
              ))}
            {id === "dark" &&
              [210, 340, 470].map((x) => (
                <g key={x}>
                  <rect x={x} y="50" width="80" height="82" fill="#564352" />
                  {[0, 1, 2].map((i) => (
                    <g key={i}>
                      <rect
                        x={x + 4}
                        y={58 + i * 24}
                        width="72"
                        height="17"
                        fill="#2b2437"
                      />
                      {[0, 1, 2, 3, 4, 5].map((j) => (
                        <rect
                          key={j}
                          x={x + 7 + j * 11}
                          y={60 + i * 24}
                          width="7"
                          height="12"
                          fill={["#a77669", "#78998d", "#b9a379"][j % 3]}
                        />
                      ))}
                    </g>
                  ))}
                </g>
              ))}
            {water && (
              <g>
                <rect x="304" y="64" width="160" height="96" fill="#7e9690" />
                <rect x="312" y="72" width="144" height="80" fill="#396c7b" />
                <path
                  className="water-ripple"
                  d="M328 88h32m32 16h32m-88 32h48"
                  stroke="#8bc4c3"
                  strokeWidth="4"
                />
                <rect x="368" y="56" width="32" height="56" fill="#b1b5a2" />
              </g>
            )}
            {(id === "treasury" || id === "shop") &&
              [264, 360, 456].map((x) => (
                <image
                  key={x}
                  href={frame("chest_full_open_anim_f0")}
                  x={x}
                  y="88"
                  width="64"
                  height="64"
                />
              ))}
          </>
        )}
        {[48, 704].map((x) => (
          <g key={x}>
            <rect x={x} y="200" width="9" height="36" fill="#594537" />
            <path
              className="torch-flame"
              d={`M${x - 5} 204v-12h5v-12h5v8h7v16Z`}
              fill="#e8a956"
            />
            <rect x={x} y="194" width="5" height="11" fill="#f2db91" />
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect
            key={i}
            x={24 + i * 110}
            y={340 + (i % 2) * 8}
            width="8"
            height="4"
            fill={light}
            opacity=".45"
          />
        ))}
      </g>
    </svg>
  );
}

type Props = {
  room: View;
  disabled: boolean;
  onPath: (index: number) => void;
  onCinematic: (active: boolean) => void;
};
export function WorldStage({ room, disabled, onPath, onCinematic }: Props) {
  const [selection, setSelection] = useState(0),
    [intro, setIntro] = useState(false),
    [impact, setImpact] = useState(false),
    [beat, setBeat] = useState(""),
    [bubbleTick, setBubbleTick] = useState(0);
  const stageRef = useRef<HTMLElement>(null);
  const seenEncounter = useRef(""),
    seenShot = useRef(room.lastShot?.id ?? "");
  const encounter = room.enemy
    ? `${room.code}:${room.round}:${room.isBoss}:${room.enemy.id}`
    : "";
  useEffect(() => {
    if (!encounter || encounter === seenEncounter.current) return;
    const previous = seenEncounter.current;
    seenEncounter.current = encounter;
    if (!previous && room.lastShot) return;
    setIntro(true);
    onCinematic(true);
    const timer = setTimeout(() => {
      setIntro(false);
      onCinematic(false);
    }, 2600);
    return () => {
      clearTimeout(timer);
      onCinematic(false);
    };
  }, [encounter, onCinematic]);
  useEffect(() => {
    setSelection(0);
  }, [room.round, room.phase]);
  const scenePhase = room.phase === "reaction" ? "combat" : room.phase;
  useEffect(() => {
    stageRef.current?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }, [scenePhase]);
  useEffect(() => {
    const shot = room.lastShot;
    if (!shot || seenShot.current === shot.id) return;
    seenShot.current = shot.id;
    if (shot.at && Date.now() - shot.at > 6000) return;
    setBeat(shot.id);
    setImpact(false);
    const impactTimer = setTimeout(() => setImpact(true), SHOT_DURATION);
    const timer = setTimeout(() => setBeat(""), BATTLE_DURATION);
    return () => {
      clearTimeout(timer);
      clearTimeout(impactTimer);
    };
  }, [room.lastShot?.id]);
  const chat = room.log.filter((l) => l.speakerId).at(-1);
  useEffect(() => {
    setBubbleTick((t) => t + 1);
    const t = setTimeout(() => setBubbleTick((t) => t + 1), 8000);
    return () => clearTimeout(t);
  }, [chat?.id]);
  void bubbleTick;
  const lobby = room.phase === "lobby",
    path = room.phase === "path",
    leader = room.heroes[room.leader];
  const canChoose = path && leader?.owner === room.you;
  const map = lobby
    ? "village"
    : path
      ? "crossroads"
      : room.phase === "shop"
        ? "shop"
        : room.isBoss
          ? "boss"
          : (room.room?.id ?? "hall");
  const party = lobby
    ? room.players.map((p) => ({
        id: p.heroId,
        owner: p.id,
        hp: 9,
        fainted: false,
        eliminated: false,
      }))
    : room.heroes;
  const shot = room.lastShot,
    liveShot = Boolean(beat && shot),
    counter = liveShot && Boolean(shot?.counterTargets?.length);
  const displayHp = Math.max(
    0,
    room.enemyHp + (liveShot && !impact ? (shot?.damage ?? 0) : 0),
  );
  const title = lobby
    ? "Vila dos Improváveis"
    : path
      ? "A bifurcação"
      : room.isBoss
        ? "O salão do último desafio"
        : room.phase === "shop"
          ? "O mercador da passagem"
          : (room.room?.name ?? "A expedição");
  return (
    <section
      ref={stageRef}
      className={`world-stage ${lobby ? "village-stage" : ""} ${path ? "route-stage" : ""} ${liveShot ? "battle-beat" : ""}`}
      aria-label="Mapa da aventura"
    >
      <div className="world-heading">
        <span>◈ {title}</span>
        <small>
          {lobby
            ? "PONTO DE ENCONTRO"
            : path
              ? "ESCOLHA DA ROTA"
              : `TRECHO ${Math.min(room.shopCount + 1, 3)} · ENCONTRO ${room.round + 1} · ◈ ${room.gold} · ✥ ${room.whiteDice}`}
        </small>
      </div>
      <div
        className={`world-viewport ${counter ? "counter-attack" : ""}`}
        key={map}
      >
        <TileMap id={map} />
        <div className="world-actors">
          {party.map((h, i) => {
            const player = room.players.find((p) => p.id === h.owner),
              def = hero(h.id),
              talk =
                chat?.speakerId === h.owner &&
                party.findIndex((p) => p.owner === h.owner) === i &&
                Date.now() - chat.at < 8000;
            const hint = lobby
              ? h.owner === room.you
                ? "Cheguei! Vamos reunir a guilda?"
                : ""
              : path && i === room.leader
                ? canChoose
                  ? "Eu sou o líder. Por qual caminho vamos?"
                  : `${player?.name ?? def.name} escolhe nossa rota.`
                : room.phase === "combat" && i === room.active
                  ? "Minha vez. Desejem sorte!"
                  : "";
            return (
              <div
                className={`map-actor hero-actor ${h.owner === room.you ? "your-actor" : ""} ${h.fainted ? "fainted" : ""}`}
                style={
                  {
                    left: `${lobby ? 15 + (i % 3) * 23 : 16 + (i % 3) * 15}%`,
                    top: `${lobby ? 52 + Math.floor(i / 3) * 25 : 58 + Math.floor(i / 3) * 20}%`,
                    "--arrival": `${i * 80}ms`,
                  } as CSSProperties
                }
                key={h.id}
              >
                {(talk || hint) && (
                  <div
                    className={`speech-bubble ${talk ? "player-speech" : ""}`}
                    key={talk ? chat.id : hint}
                  >
                    {talk
                      ? chat.text.slice((player?.name.length ?? 0) + 2)
                      : hint}
                  </div>
                )}
                <div
                  className={`${liveShot && shot?.heroId === h.id ? "hero-attack" : ""} ${counter && shot?.counterTargets?.includes(h.id) ? "hero-hurt" : ""}`}
                >
                  <MapHero
                    src={def.sprite}
                    size={lobby ? 64 : 72}
                    attacking={liveShot && shot?.heroId === h.id}
                  />
                </div>
                {counter && shot?.counterTargets?.includes(h.id) && (
                  <strong className="damage-pop counter-damage">
                    −{room.enemy?.damage}
                  </strong>
                )}
                <span
                  className="actor-name"
                  title={`${def.name} · ${player?.name ?? ""}`}
                >
                  {def.name}
                  {h.owner === room.you ? " · VOCÊ" : ""}
                  {!lobby && i === room.leader ? " ♛" : ""}
                </span>
              </div>
            );
          })}
          {!lobby && !path && room.enemy && (
            <div
              className={`map-actor boss-actor ${liveShot && shot?.damage ? "enemy-hurt" : ""} ${counter ? "enemy-attack" : ""} ${room.enemyHp <= 0 ? "enemy-defeated" : ""}`}
              key={`enemy-${encounter}-${beat}`}
              style={{ left: "73%", top: "43%" }}
            >
              <div className="map-enemy-hud">
                <b>{room.enemy.name}</b>
                <span>
                  ♥ {displayHp} / {room.enemyMaxHp}
                </span>
                <div className="map-life">
                  <i
                    style={{
                      transform: `scaleX(${displayHp / room.enemyMaxHp})`,
                    }}
                  />
                </div>
              </div>
              <Sprite src={room.enemy.sprite} size={room.isBoss ? 128 : 96} />
              {liveShot && (
                <strong
                  className={`damage-pop ${shot?.damage ? "" : "miss-pop"}`}
                >
                  {shot?.damage ? `−${shot.damage}` : "ERROU!"}
                </strong>
              )}
            </div>
          )}
          {liveShot && (
            <div className={`attack-trail ${shot?.color}`} key={beat}>
              ✦
            </div>
          )}
        </div>
        {intro && room.enemy && (
          <div
            className={`encounter-intro ${room.isBoss ? "final-boss-intro" : ""}`}
            role="status"
          >
            <div className="encounter-stamp">
              {room.isBoss ? "O CHEFÃO FINAL" : "UM DESAFIO NO CAMINHO"}
            </div>
            <Sprite src={room.enemy.sprite} size={120} />
            <div>
              <h2>{room.enemy.name}</h2>
              <p>
                ♥ {room.enemyMaxHp} de vida · ⚔ {room.enemy.damage} de
                contra-ataque
              </p>
              <p>{room.enemy.description}</p>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setIntro(false);
                onCinematic(false);
              }}
            >
              Entrar no combate →
            </button>
          </div>
        )}
        {path && (
          <div className="route-compass" aria-hidden="true">
            ↑
            <span>
              DOIS CAMINHOS.
              <br />
              UMA HISTÓRIA.
            </span>
            ↓
          </div>
        )}
      </div>
      {path && (
        <div className="route-console">
          <div className="route-dialogue">
            <span className="eyebrow">
              {canChoose
                ? "VOCÊ É O LÍDER"
                : `${hero(leader!.id).name.toUpperCase()} É O LÍDER`}
            </span>
            <h2>
              {canChoose
                ? "Por onde seguimos?"
                : "A guilda aguarda uma decisão."}
            </h2>
            <p>
              {canChoose
                ? "↑ ↓ para explorar as rotas. Confirme quando a guilda decidir."
                : "Só o líder vê as duas salas. Combine a estratégia pelo chat."}
            </p>
          </div>
          {canChoose && (
            <div
              className="route-picker"
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  const focused = (
                    e.target as HTMLElement
                  ).closest<HTMLElement>(".route-option");
                  const n =
                    Number(focused?.dataset.routeIndex ?? selection) === 0
                      ? 1
                      : 0;
                  setSelection(n);
                  e.currentTarget
                    .querySelectorAll<HTMLButtonElement>(".route-option")
                    [n]?.focus();
                }
              }}
            >
              <div className="route-choices">
                {room.candidates.map((r, i) => (
                  <button
                    type="button"
                    data-route-index={i}
                    className={`route-option ${selection === i ? "selected" : ""}`}
                    aria-pressed={selection === i}
                    disabled={disabled}
                    onClick={() => setSelection(i)}
                    key={`${r.id}-${i}`}
                  >
                    <div className="route-thumbnail" aria-hidden="true">
                      <TileMap id={r.id} />
                    </div>
                    <span>
                      {i === 0 ? "↑" : "↓"} {r.steps} PASSOS
                    </span>
                    <b>{r.name}</b>
                    <small>{challengeInfo[r.challenge].name}</small>
                  </button>
                ))}
              </div>
              <p className="route-description">
                {room.candidates[selection]?.description}
              </p>
              <button
                className="primary"
                disabled={disabled}
                onClick={() => onPath(selection)}
              >
                Seguir por este caminho →
              </button>
            </div>
          )}
        </div>
      )}
      {!path && (
        <div className="world-caption">
          <span>
            {lobby
              ? "Os heróis estão chegando. Escolha o seu e prepare a expedição."
              : liveShot
                ? "O dado escolhe o destino. A guilda assiste."
                : room.phase === "rest"
                  ? "O caminho ficou livre. Recuperem o fôlego."
                  : room.phase === "shop"
                    ? "Uma parada para comprar coragem."
                    : "Mire no alvo. Seu ataque acontece aqui."}
          </span>
          {!lobby && <span>♛ {leader ? hero(leader.id).name : "Guilda"}</span>}
        </div>
      )}
    </section>
  );
}
